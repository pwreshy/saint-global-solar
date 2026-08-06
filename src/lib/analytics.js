import { supabase } from './supabase'

// Helper to generate a unique UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Retrieve or generate a persistent visitor identifier.
 */
export function getVisitorId() {
  let visitorId = localStorage.getItem('analytics_visitor_id')
  if (!visitorId) {
    visitorId = generateUUID()
    localStorage.setItem('analytics_visitor_id', visitorId)
  }
  return visitorId
}

/**
 * Retrieve or generate a session identifier.
 * sessionStorage automatically persists across refreshes in the same tab,
 * but clears when the tab or browser is closed.
 */
export function getSessionId() {
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = generateUUID()
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

/**
 * Automatically parses UTM parameters from the current URL query string
 * and saves them in sessionStorage so attribution is preserved across pages.
 */
export function captureUTMs() {
  try {
    const params = new URLSearchParams(window.location.search)
    const utms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    
    utms.forEach(key => {
      const val = params.get(key)
      if (val) {
        sessionStorage.setItem(`analytics_${key}`, val)
      }
    })
  } catch (err) {
    console.error('[Analytics] Error capturing UTMs:', err)
  }
}

/**
 * Retrieves cached UTM parameters from sessionStorage.
 */
export function getStoredUTMs() {
  return {
    utm_source: sessionStorage.getItem('analytics_utm_source') || null,
    utm_medium: sessionStorage.getItem('analytics_utm_medium') || null,
    utm_campaign: sessionStorage.getItem('analytics_utm_campaign') || null,
    utm_content: sessionStorage.getItem('analytics_utm_content') || null,
    utm_term: sessionStorage.getItem('analytics_utm_term') || null
  }
}

// Maps our custom analytics events to standard Facebook/Meta Pixel event names
const META_EVENT_MAP = {
  page_view: 'PageView',
  webinar_signup: 'Lead',
  initiate_checkout: 'InitiateCheckout',
  payment_attempt: 'AddPaymentInfo',
  purchase: 'Purchase'
}

/**
 * Tracks an event by saving it to the Supabase database and sending it to Meta Pixel.
 * This function runs asynchronously and handles errors gracefully without disrupting the UI.
 * 
 * @param {string} eventName - Name of the event (e.g., 'page_view', 'webinar_signup', 'initiate_checkout')
 * @param {Object} metadata - Optional event metadata (e.g., amount, product_title, email)
 */
export async function trackEvent(eventName, metadata = {}) {
  try {
    // 1. Capture UTM parameters if present in the URL
    captureUTMs()

    const visitorId = getVisitorId()
    const sessionId = getSessionId()
    const utms = getStoredUTMs()
    const path = window.location.pathname
    const referrer = document.referrer || null

    // Avoid logging admin actions in public traffic tracking
    if (path.startsWith('/admin')) {
      return
    }

    // Attempt to retrieve active auth user ID
    let userId = null
    try {
      const { data: { session } } = await supabase.auth.getSession()
      userId = session?.user?.id || null
    } catch (e) {
      // Auth service might not be initialized or active; ignore user ID
    }

    // 2. Insert tracking record into Supabase
    const eventData = {
      visitor_id: visitorId,
      session_id: sessionId,
      event_name: eventName,
      page_path: path || '/',
      referrer,
      ...utms,
      metadata: {
        ...metadata,
        timestamp_ms: Date.now(),
        ...(userId ? { user_id: userId } : {})
      }
    }

    // Send to Supabase in a non-blocking background promise
    supabase.from('traffic_events')
      .insert(eventData)
      .then(({ error }) => {
        if (error) {
          console.warn('[Analytics] Failed to save traffic event:', error.message)
        }
      })

    // 3. Dispatch event to Facebook/Meta Pixel
    if (window.fbq) {
      const metaEventName = META_EVENT_MAP[eventName] || eventName
      const payload = {}

      // Map common metadata parameters to standard Meta Pixel values
      if (metadata.value !== undefined) payload.value = metadata.value
      if (metadata.currency !== undefined) payload.currency = metadata.currency || 'NGN'
      if (metadata.content_name !== undefined) payload.content_name = metadata.content_name
      if (metadata.content_type !== undefined) payload.content_type = metadata.content_type

      // Attach UTM campaign parameters for precise campaign-level optimization in Meta Ads
      Object.keys(utms).forEach(key => {
        if (utms[key]) {
          payload[key] = utms[key]
        }
      })

      window.fbq('track', metaEventName, payload)
    }

    // 4. Dispatch event to Google Analytics (gtag)
    if (window.gtag) {
      if (eventName === 'page_view') {
        window.gtag('config', 'G-NWF1MZXS0L', {
          page_path: path,
          page_title: document.title
        })
      } else {
        const gaEventMap = {
          webinar_signup: 'generate_lead',
          initiate_checkout: 'begin_checkout',
          payment_attempt: 'add_payment_info',
          purchase: 'purchase'
        }
        const gaEventName = gaEventMap[eventName] || eventName
        const payload = {
          value: metadata.value !== undefined ? metadata.value : (metadata.amount !== undefined ? metadata.amount : undefined),
          currency: metadata.currency || 'NGN',
          content_name: metadata.content_name || metadata.product_title,
          content_type: metadata.content_type || metadata.product_type
        }
        
        if (gaEventName === 'purchase') {
          payload.transaction_id = metadata.ref || metadata.reference || ''
          payload.items = [{
            item_name: metadata.product_title || metadata.content_name || 'Product',
            price: metadata.value !== undefined ? metadata.value : (metadata.amount !== undefined ? metadata.amount : 0),
            quantity: 1
          }]
        }
        
        window.gtag('event', gaEventName, payload)
      }
    }
  } catch (err) {
    console.error('[Analytics] Error tracking event:', err)
  }
}

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getPages } from '../lib/pagesScanner'

// ─── CUSTOM SINGLE-SELECT COMPONENT ─────────────────────────────────────────
function CustomSingleSelect({ options, value, onChange, placeholder = 'Select product...' }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleOutsideClick = () => setIsOpen(false)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  return (
    <div 
      style={{ position: 'relative', width: '100%' }} 
      onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
    >
      <div style={{
        padding: '10px 12px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '13.5px',
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        minHeight: '40px'
      }}>
        <span style={{ color: selectedOption ? '#0f172a' : '#94a3b8' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b' }}>▼</span>
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '105%',
          left: 0,
          width: '100%',
          maxHeight: '180px',
          overflowY: 'auto',
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          zIndex: 10,
          padding: '4px 0'
        }} className="no-scrollbar">
          {options.length === 0 ? (
            <div style={{ padding: '8px 12px', color: '#64748b', fontSize: '13px' }}>No options available</div>
          ) : (
            options.map(opt => (
              <div
                key={opt.value}
                onClick={() => onChange(opt.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  background: value === opt.value ? '#eff6ff' : 'transparent',
                  color: value === opt.value ? '#2563eb' : '#0f172a',
                  fontWeight: value === opt.value ? '600' : '400',
                  transition: 'background 0.1s'
                }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── CUSTOM MULTI-SELECT COMPONENT ──────────────────────────────────────────
function CustomMultiSelect({ options, value = [], onChange, placeholder = 'Select pages...' }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOutsideClick = () => setIsOpen(false)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  const handleToggleOption = (val) => {
    const newVal = value.includes(val) 
      ? value.filter(v => v !== val) 
      : [...value, val]
    onChange(newVal)
  }

  return (
    <div 
      style={{ position: 'relative', width: '100%' }} 
      onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
    >
      <div style={{
        padding: '8px 12px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '13.5px',
        background: '#fff',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        minHeight: '40px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
          {value.length === 0 ? (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          ) : (
            value.map(val => (
              <span 
                key={val} 
                style={{
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleOption(val)
                }}
              >
                {val}
                <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px', cursor: 'pointer' }}>×</span>
              </span>
            ))
          )}
        </div>
        <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '105%',
          left: 0,
          width: '100%',
          maxHeight: '200px',
          overflowY: 'auto',
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          zIndex: 10,
          padding: '6px 0'
        }} className="no-scrollbar">
          {options.map(opt => {
            const isSelected = value.includes(opt.value)
            return (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleOption(opt.value)
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isSelected ? '#f0fdf4' : 'transparent',
                  color: isSelected ? '#15803d' : '#0f172a',
                  fontWeight: isSelected ? '600' : '400',
                  transition: 'background 0.1s'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{opt.value}</div>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminAnalytics() {
  const [timeframe, setTimeframe] = useState('7d') // 'today', 'yesterday', '7d', '30d', 'all'
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('funnel') // 'funnel', 'campaigns', 'leads', 'abandoned', 'manager'
  
  // Data States
  const [events, setEvents] = useState([])
  const [orders, setOrders] = useState([])
  const [leadsList, setLeadsList] = useState([])
  const [products, setProducts] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [scannedPages, setScannedPages] = useState([])
  
  // Migration error state
  const [migrationMissing, setMigrationMissing] = useState(false)

  // Selected Product for comparison
  const [selectedProductId, setSelectedProductId] = useState('all')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCampaignId, setSelectedCampaignId] = useState('all')

  // Campaign Form State (Changed to arrays for custom select dropdowns)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignProduct, setNewCampaignProduct] = useState('')
  const [newCampaignLanders, setNewCampaignLanders] = useState([])
  const [newCampaignWebinars, setNewCampaignWebinars] = useState([])
  const [newCampaignCheckouts, setNewCampaignCheckouts] = useState(['/checkout'])
  const [newCampaignUtm, setNewCampaignUtm] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit and Link Generator States
  const [editingCampaignId, setEditingCampaignId] = useState(null)
  const [linkGenCampaign, setLinkGenCampaign] = useState(null)
  const [linkGenLander, setLinkGenLander] = useState('')
  const [linkGenSource, setLinkGenSource] = useState('social')
  const [linkGenMedium, setLinkGenMedium] = useState('post')
  const [linkGenCopied, setLinkGenCopied] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
    // Load routes/pages scanned
    try {
      const pages = getPages()
      setScannedPages(pages.map(p => ({ label: p.label, value: p.path })))
    } catch (e) {
      console.warn('[AdminAnalytics] Scanned pages failed:', e)
    }
  }, [timeframe])

  async function loadAnalyticsData() {
    setLoading(true)
    setMigrationMissing(false)
    try {
      const now = new Date()
      const start = new Date(now)
      let end = null

      if (timeframe === 'today') {
        start.setHours(0, 0, 0, 0)
      } else if (timeframe === 'yesterday') {
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setDate(end.getDate() - 1)
        end.setHours(23, 59, 59, 999)
      } else if (timeframe === '7d') {
        start.setDate(start.getDate() - 7)
      } else if (timeframe === '30d') {
        start.setDate(start.getDate() - 30)
      } else {
        start.setTime(0)
      }

      // Fetch campaigns & products
      const { data: rawCampaigns, error: campaignError } = await supabase.from('funnel_campaigns').select('*').order('created_at', { ascending: false })
      
      // If table funnel_campaigns doesn't exist, flag migration missing error (PostgREST returns status 404 or code 'PGRST116')
      if (campaignError) {
        if (campaignError.code === 'PGRST116' || campaignError.message?.includes('does not exist')) {
          setMigrationMissing(true)
        }
      }

      const { data: rawProducts } = await supabase.from('products').select('id, title, price, type')

      const fetchedCampaigns = rawCampaigns || []
      const fetchedProducts = rawProducts || []
      setCampaigns(fetchedCampaigns)
      setProducts(fetchedProducts)

      if (fetchedProducts.length > 0 && selectedProductId === 'all') {
        setSelectedProductId(fetchedProducts[0].id)
      }

      // Fetch traffic events
      let qEvents = supabase
        .from('traffic_events')
        .select('*')
        .gte('created_at', start.toISOString())
      
      if (end) {
        qEvents = qEvents.lte('created_at', end.toISOString())
      }
      const { data: rawEvents } = await qEvents.order('created_at', { ascending: false })
      const filteredEvents = rawEvents || []
      setEvents(filteredEvents)

      // Fetch orders
      let qOrders = supabase
        .from('orders')
        .select('*, products(title)')
        .gte('created_at', start.toISOString())
      
      if (end) {
        qOrders = qOrders.lte('created_at', end.toISOString())
      }
      const { data: rawOrders } = await qOrders.order('created_at', { ascending: false })
      const filteredOrders = rawOrders || []
      setOrders(filteredOrders)

      // Fetch leads
      let qLeads = supabase
        .from('freelance_training_list')
        .select('*')
        .gte('created_at', start.toISOString())

      if (end) {
        qLeads = qLeads.lte('created_at', end.toISOString())
      }
      const { data: rawLeads } = await qLeads.order('created_at', { ascending: false })
      setLeadsList(rawLeads || [])

    } catch (e) {
      console.error('[AdminAnalytics] Load analytics error:', e)
    } finally {
      setLoading(false)
    }
  }

  // ─── CAMPAIGN MANAGEMENT ACTIONS ─────────────────────────────────────────────
  async function handleCreateCampaign(e) {
    e.preventDefault()
    setFormError('')
    if (!newCampaignName.trim()) return setFormError('Campaign name is required.')
    if (!newCampaignProduct) return setFormError('Please select a target product.')
    if (newCampaignLanders.length === 0) return setFormError('Please select at least one landing page path.')

    setSubmitting(true)
    try {
      const payload = {
        name: newCampaignName.trim(),
        product_id: newCampaignProduct,
        lander_paths: newCampaignLanders,
        webinar_paths: newCampaignWebinars,
        checkout_paths: newCampaignCheckouts,
        utm_campaign: newCampaignUtm.trim() || null
      }

      let error
      if (editingCampaignId) {
        const { error: err } = await supabase
          .from('funnel_campaigns')
          .update(payload)
          .eq('id', editingCampaignId)
        error = err
      } else {
        const { error: err } = await supabase
          .from('funnel_campaigns')
          .insert(payload)
        error = err
      }

      if (error) throw error

      setNewCampaignName('')
      setNewCampaignLanders([])
      setNewCampaignWebinars([])
      setNewCampaignCheckouts(['/checkout'])
      setNewCampaignUtm('')
      setEditingCampaignId(null)
      setShowCreateModal(false)
      await loadAnalyticsData()
    } catch (err) {
      console.error('Failed to save campaign:', err)
      setFormError(err.message || 'Failed to save campaign.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteCampaign(id) {
    if (!confirm('Are you sure you want to delete this campaign? It will stop tracking funnel performance for it.')) return
    try {
      const { error } = await supabase.from('funnel_campaigns').delete().eq('id', id)
      if (error) throw error
      await loadAnalyticsData()
    } catch (err) {
      console.error('Failed to delete campaign:', err)
      alert('Error deleting campaign: ' + err.message)
    }
  }

  // ─── CALCULATE FUNNEL AND KPI DATA (OVERALL PLATFORM) ──────────────────────────
  const landerSessions = new Set(
    events
      .filter(e => e.event_name === 'page_view' && (e.page_path === '/free-training' || e.page_path === '/freelance-web-design-lander' || e.page_path === '/'))
      .map(e => e.session_id)
  )

  const signupEmails = new Set()
  const signupSessions = new Set(
    events
      .filter(e => e.event_name === 'webinar_signup')
      .map(e => {
        if (e.metadata && e.metadata.email) {
          signupEmails.add(e.metadata.email.toLowerCase())
        }
        return e.session_id
      })
  )
  const totalSignups = Math.max(signupSessions.size, leadsList.length)

  const webinarSessions = new Set(
    events
      .filter(e => e.event_name === 'page_view' && e.page_path.startsWith('/webinar'))
      .map(e => e.session_id)
  )

  const checkoutSessions = new Set(
    events
      .filter(e => e.event_name === 'page_view' && e.page_path.startsWith('/checkout'))
      .map(e => e.session_id)
  )

  const attemptSessions = new Set(
    events
      .filter(e => e.event_name === 'payment_attempt')
      .map(e => e.session_id)
  )

  const paidOrders = orders.filter(o => o.status === 'paid')
  const totalSales = paidOrders.length
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0)

  // Conversion Rates (Protected against division by zero)
  const optInRate = landerSessions.size ? Math.round((totalSignups / landerSessions.size) * 100) : 0
  const webinarWatchRate = totalSignups ? Math.round((webinarSessions.size / totalSignups) * 100) : 0
  const checkoutRate = webinarSessions.size ? Math.round((checkoutSessions.size / webinarSessions.size) * 100) : 0
  const paymentAttemptRate = checkoutSessions.size ? Math.round((attemptSessions.size / checkoutSessions.size) * 100) : 0
  const purchaseRate = checkoutSessions.size ? Math.round((totalSales / checkoutSessions.size) * 100) : 0
  const funnelConversionRate = landerSessions.size ? ((totalSales / landerSessions.size) * 100).toFixed(1) : '0.0'

  // ─── ATTRIBUTION ENGINE (COMPUTE FUNNEL PER CAMPAIGN) ─────────────────────────
  const getAttributedCampaignStats = () => {
    const sessionCampaigns = {}
    const emailCampaigns = {}

    events.forEach(evt => {
      campaigns.forEach(camp => {
        const path = (evt.page_path || '').toLowerCase()
        const utmCampaign = (evt.utm_campaign || '').toLowerCase()
        const campUtm = (camp.utm_campaign || '').toLowerCase()

        const matchesLander = camp.lander_paths.some(p => path === p || path.startsWith(p + '?'))
        const matchesWebinar = camp.webinar_paths.some(p => path === p || path.startsWith(p + '?'))
        const matchesCheckout = camp.checkout_paths.some(p => path === p || path.startsWith(p + '?'))
        const matchesUtm = campUtm && utmCampaign === campUtm

        if (matchesLander || matchesWebinar || matchesCheckout || matchesUtm) {
          if (!sessionCampaigns[evt.session_id]) {
            sessionCampaigns[evt.session_id] = new Set()
          }
          sessionCampaigns[evt.session_id].add(camp.id)

          if (evt.event_name === 'webinar_signup' && evt.metadata?.email) {
            const email = evt.metadata.email.toLowerCase()
            if (!emailCampaigns[email]) {
              emailCampaigns[email] = new Set()
            }
            emailCampaigns[email].add(camp.id)
          }
        }
      })
    })

    leadsList.forEach(lead => {
      campaigns.forEach(camp => {
        const campUtm = (camp.utm_campaign || '').toLowerCase()
        const leadSource = (lead.source || '').toLowerCase()
        
        const sourceMatches = leadSource === camp.name.toLowerCase() || (campUtm && leadSource === campUtm)
        if (sourceMatches) {
          const email = lead.email.toLowerCase()
          if (!emailCampaigns[email]) {
            emailCampaigns[email] = new Set()
          }
          emailCampaigns[email].add(camp.id)
        }
      })
    })

    const campaignFunnels = campaigns.map(camp => {
      const stats = {
        ...camp,
        landerSessions: new Set(),
        signupSessions: new Set(),
        webinarSessions: new Set(),
        checkoutSessions: new Set(),
        completedSales: 0,
        revenue: 0,
        productTitle: products.find(p => p.id === camp.product_id)?.title || 'Unknown Product'
      }

      events.forEach(evt => {
        const path = evt.page_path.toLowerCase()
        const isSessionMapped = sessionCampaigns[evt.session_id]?.has(camp.id)
        const isUtmMapped = camp.utm_campaign && evt.utm_campaign?.toLowerCase() === camp.utm_campaign.toLowerCase()

        if (isSessionMapped || isUtmMapped) {
          if (camp.lander_paths.some(p => path === p || path.startsWith(p + '?'))) {
            stats.landerSessions.add(evt.session_id)
          }
          if (evt.event_name === 'webinar_signup') {
            stats.signupSessions.add(evt.session_id)
          }
          if (camp.webinar_paths.some(p => path === p || path.startsWith(p + '?'))) {
            stats.webinarSessions.add(evt.session_id)
          }
          if (camp.checkout_paths.some(p => path === p || path.startsWith(p + '?'))) {
            stats.checkoutSessions.add(evt.session_id)
          }
        }
      })

      const leadEmailsMatchingCamp = leadsList.filter(l => emailCampaigns[l.email.toLowerCase()]?.has(camp.id))
      const totalLeadsCount = Math.max(stats.signupSessions.size, leadEmailsMatchingCamp.length)

      orders.forEach(order => {
        if (order.product_id === camp.product_id && order.status === 'paid') {
          const email = order.customer_email?.toLowerCase()
          const matchesEmail = emailCampaigns[email]?.has(camp.id)
          const matchesUtm = camp.utm_campaign && order.affiliate_code?.toLowerCase() === camp.utm_campaign.toLowerCase()
          
          if (matchesEmail || matchesUtm) {
            stats.completedSales += 1
            stats.revenue += (order.amount || 0)
          }
        }
      })

      // Rates
      const optInRate = stats.landerSessions.size ? Math.round((totalLeadsCount / stats.landerSessions.size) * 100) : 0
      const webinarRate = totalLeadsCount ? Math.round((stats.webinarSessions.size / totalLeadsCount) * 100) : 0
      const checkoutRate = stats.webinarSessions.size ? Math.round((stats.checkoutSessions.size / stats.webinarSessions.size) * 100) : 0
      const purchaseRate = stats.checkoutSessions.size ? Math.round((stats.completedSales / stats.checkoutSessions.size) * 100) : 0
      const overallConversion = stats.landerSessions.size ? parseFloat(((stats.completedSales / stats.landerSessions.size) * 100).toFixed(2)) : 0.0

      return {
        ...stats,
        landerCount: stats.landerSessions.size,
        signupCount: totalLeadsCount,
        webinarCount: stats.webinarSessions.size,
        checkoutCount: stats.checkoutSessions.size,
        optInRate,
        webinarRate,
        checkoutRate,
        purchaseRate,
        overallConversion
      }
    })

    return { campaignFunnels, emailCampaigns }
  }

  const { campaignFunnels, emailCampaigns } = getAttributedCampaignStats()
  const filteredCampaignsByProduct = campaignFunnels.filter(c => selectedProductId === 'all' || c.product_id === selectedProductId)

  let winnerCampaignId = null
  let loserCampaignId = null
  if (filteredCampaignsByProduct.length >= 2) {
    const sorted = [...filteredCampaignsByProduct].sort((a, b) => b.overallConversion - a.overallConversion)
    winnerCampaignId = sorted[0].id
    loserCampaignId = sorted[sorted.length - 1].id
  }

  // ─── FILTER LEADS AND ABANDONED BY SELECTED CAMPAIGN ────────────────────────
  const getFilteredLeads = () => {
    return leadsList.filter(lead => {
      const queryMatch = !searchQuery ? true : (
        (lead.name && lead.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.phone && lead.phone.includes(searchQuery))
      )
      if (selectedCampaignId === 'all') return queryMatch
      return queryMatch && emailCampaigns[lead.email.toLowerCase()]?.has(selectedCampaignId)
    })
  }

  const getFilteredAbandoned = () => {
    const abOrders = orders.filter(o => o.status === 'pending' || o.status === 'cancelled')
    const enriched = abOrders.map(order => {
      const email = order.customer_email?.toLowerCase()
      const matchingCampId = campaigns.find(camp => {
        const matchesEmail = emailCampaigns[email]?.has(camp.id)
        const matchesUtm = camp.utm_campaign && order.affiliate_code?.toLowerCase() === camp.utm_campaign.toLowerCase()
        return matchesEmail || matchesUtm
      })?.id

      return {
        ...order,
        campaign_id: matchingCampId || null,
        campaign_name: campaigns.find(c => c.id === matchingCampId)?.name || 'Direct / Organic'
      }
    })

    return enriched.filter(order => {
      const queryMatch = !searchQuery ? true : (
        (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customer_phone && order.customer_phone.includes(searchQuery))
      )
      if (selectedCampaignId === 'all') return queryMatch
      return queryMatch && order.campaign_id === selectedCampaignId
    })
  }

  const displayLeads = getFilteredLeads()
  const displayAbandoned = getFilteredAbandoned()

  // ─── UTILITIES ──────────────────────────────────────────────────────────────
  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard')
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}>
      
      {/* Responsive & Custom Component Styling Overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .responsive-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-top: 10px;
        }
        .responsive-table {
          width: 100%;
          border-collapse: collapse;
        }
        .table-attribution {
          min-width: 1100px; /* Prevent campaign summary squeezed columns (Image 1 fix) */
        }
        .table-leads {
          min-width: 700px;
        }
        .table-abandoned {
          min-width: 850px;
        }
        .table-manager {
          min-width: 950px;
        }
        .kpi-grid-platform {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        @media (max-width: 1024px) {
          .kpi-grid-platform {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .kpi-grid-platform {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
        .funnel-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
        }
        @media (max-width: 640px) {
          .funnel-container {
            min-width: 640px;
          }
        }
        .funnel-step {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .funnel-step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }
        .funnel-step-bar-container {
          height: 12px;
          background: #f1f5f9;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }
        .funnel-step-bar {
          height: 100%;
          border-radius: 8px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .campaign-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }
        @media (max-width: 640px) {
          .campaign-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      {/* Migration Missing Alert Notice */}
      {migrationMissing && (
        <div style={{
          background: '#fff7ed',
          border: '1px solid #ffedd5',
          color: '#ea580c',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '13.5px',
          lineHeight: '1.5',
          boxShadow: '0 2px 4px rgba(249,115,22,0.05)'
        }}>
          <h4 style={{ margin: '0 0 6px 0', fontWeight: '700', fontSize: '15px' }}>⚠️ Supabase Campaigns Table Missing</h4>
          The campaigns table was not found. Please execute the database migration file <a href="file:///c:/Users/Admin/Downloads/AMPLIFIED%20SKILLS/SUPABASE_CAMPAIGNS.sql" style={{ color: '#ea580c', fontWeight: '600', textDecoration: 'underline' }}>SUPABASE_CAMPAIGNS.sql</a> inside your Supabase Dashboard SQL Editor to initialize tracking.
        </div>
      )}

      {/* Header & Filters */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 28, 
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>Marketing & Funnel Analytics</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13.5 }}>
            Analyze marketing campaigns, compare conversion angles, and identify winning products.
          </p>
        </div>
        
        {/* Timeframe Selector */}
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e2e8f0', 
          padding: 4, 
          borderRadius: 8, 
          display: 'flex', 
          gap: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          {[
            { id: 'today', name: 'Today' },
            { id: 'yesterday', name: 'Yesterday' },
            { id: '7d', name: '7 Days' },
            { id: '30d', name: '30 Days' },
            { id: 'all', name: 'All Time' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              style={{
                border: 'none',
                background: timeframe === t.id ? '#2563eb' : 'transparent',
                color: timeframe === t.id ? '#fff' : '#64748b',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <div className="premium-spinner" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
        </div>
      ) : (
        <>
          {/* KPI METRIC CARDS */}
          <div className="kpi-grid-platform">
            {[
              { label: 'Lander Views', val: landerSessions.size, sub: 'Unique Sessions' },
              { label: 'Webinar Leads', val: totalSignups, sub: `${optInRate}% Opt-in Rate`, color: '#10b981' },
              { label: 'Checkout Views', val: checkoutSessions.size, sub: `${checkoutSessions.size ? Math.round((totalSales / checkoutSessions.size) * 100) : 0}% Checkout Rate` },
              { label: 'Purchases', val: totalSales, sub: `${funnelConversionRate}% Funnel Conv.` },
              { label: 'Total Revenue', val: formatNaira(totalRevenue), sub: 'Gross Revenue', focus: true }
            ].map((k, i) => (
              <div 
                key={i} 
                style={{
                  background: k.focus ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' : '#fff',
                  color: k.focus ? '#fff' : '#0f172a',
                  padding: 16,
                  borderRadius: 12,
                  border: k.focus ? 'none' : '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontSize: 12, color: k.focus ? '#94a3b8' : '#64748b', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, margin: '8px 0 4px 0', wordBreak: 'break-all' }}>{k.val}</div>
                <div style={{ fontSize: 11.5, color: k.color ? k.color : (k.focus ? '#a5b4fc' : '#475569'), fontWeight: 600 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* TAB NAVIGATION */}
          <div className="no-scrollbar" style={{ 
            display: 'flex', 
            borderBottom: '1px solid #e2e8f0', 
            gap: 20, 
            marginBottom: 24,
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {[
              { id: 'funnel', name: 'Funnel & Conversion Flow' },
              { id: 'campaigns', name: 'UTM Ad Campaigns' },
              { id: 'leads', name: `Webinar Signups (${leadsList.length})` },
              { id: 'abandoned', name: `Checkout Abandonment (${displayAbandoned.length})` },
              { id: 'manager', name: `Campaign Manager (${campaigns.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '12px 4px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: activeTab === tab.id ? '#2563eb' : '#64748b',
                  borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  paddingBottom: 10
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* TAB 1: FUNNEL ANGLES & COMPARISON */}
          {activeTab === 'funnel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              
              {/* Overall platform visual funnel */}
              <div style={{ 
                background: '#fff', 
                border: '1px solid #e2e8f0', 
                borderRadius: 12, 
                padding: 24, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Visual Conversion Funnel</h3>
                
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflowX: 'auto', padding: '10px 0' }} className="no-scrollbar">
                  <div className="funnel-container">
                    <svg viewBox="0 0 800 460" className="funnel-svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
                      <defs>
                        <linearGradient id="grad-stage-0" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="grad-stage-1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                        <linearGradient id="grad-stage-2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#6d28d9" />
                        </linearGradient>
                        <linearGradient id="grad-stage-3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ec4899" /><stop offset="100%" stopColor="#be185d" />
                        </linearGradient>
                        <linearGradient id="grad-stage-4" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                        <linearGradient id="grad-stage-5" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#0e7490" />
                        </linearGradient>
                        <filter id="funnel-shadow" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.08" />
                        </filter>
                      </defs>

                      {[
                        { label: '1. LANDER VIEWS', val: landerSessions.size, percent: 100, grad: 'url(#grad-stage-0)' },
                        { label: '2. WEBINAR SIGNUPS', val: totalSignups, percent: optInRate, grad: 'url(#grad-stage-1)' },
                        { label: '3. WEBINAR VIEWS', val: webinarSessions.size, percent: webinarWatchRate, grad: 'url(#grad-stage-2)' },
                        { label: '4. CHECKOUT VIEWS', val: checkoutSessions.size, percent: checkoutRate, grad: 'url(#grad-stage-3)' },
                        { label: '5. PAYMENT ATTEMPTS', val: attemptSessions.size, percent: paymentAttemptRate, grad: 'url(#grad-stage-4)' },
                        { label: '6. COMPLETED PURCHASES', val: totalSales, percent: purchaseRate, grad: 'url(#grad-stage-5)' }
                      ].map((stage, i, arr) => {
                        const y_top = 20 + i * 72
                        const y_bottom = y_top + 48
                        
                        const w_top = 200 - (i / 5) * 100
                        const w_bottom = 200 - ((i + 1) / 5) * 100
                        
                        const clampedPercent = Math.min(100, Math.max(0, stage.percent))
                        const wf_top = w_top * (clampedPercent / 100)
                        const wf_bottom = w_bottom * (clampedPercent / 100)
                        
                        const bg_tl = 400 - w_top / 2
                        const bg_tr = 400 + w_top / 2
                        const bg_br = 400 + w_bottom / 2
                        const bg_bl = 400 - w_bottom / 2
                        
                        const fg_tl = 400 - wf_top / 2
                        const fg_tr = 400 + wf_top / 2
                        const fg_br = 400 + wf_bottom / 2
                        const fg_bl = 400 - wf_bottom / 2
                        
                        const mid_y = y_top + 24
                        
                        return (
                          <g key={i}>
                            {/* Background slice (empty funnel portion) */}
                            <path 
                              d={`M ${bg_tl} ${y_top} L ${bg_tr} ${y_top} L ${bg_br} ${y_bottom} L ${bg_bl} ${y_bottom} Z`} 
                              fill="#f8fafc" 
                              stroke="#e2e8f0" 
                              strokeWidth="1" 
                            />
                            
                            {/* Filled slice (active funnel portion) */}
                            {clampedPercent > 0 && (
                              <path 
                                d={`M ${fg_tl} ${y_top} L ${fg_tr} ${y_top} L ${fg_br} ${y_bottom} L ${fg_bl} ${y_bottom} Z`} 
                                fill={stage.grad} 
                                filter="url(#funnel-shadow)"
                              />
                            )}
                            
                            {/* Left pointer line & Label */}
                            <line 
                              x1="280" 
                              y1={mid_y} 
                              x2={bg_tl - 8} 
                              y2={mid_y} 
                              stroke="#cbd5e1" 
                              strokeWidth="1" 
                              strokeDasharray="3,3" 
                            />
                            <text 
                              x="270" 
                              y={mid_y + 4} 
                              textAnchor="end" 
                              fill="#0f172a" 
                              fontSize="13" 
                              fontWeight="700"
                              fontFamily="var(--font)"
                            >
                              {stage.label}
                            </text>
                            
                            {/* Right pointer line & stats */}
                            <line 
                              x1={bg_tr + 8} 
                              y1={mid_y} 
                              x2="520" 
                              y2={mid_y} 
                              stroke="#cbd5e1" 
                              strokeWidth="1" 
                              strokeDasharray="3,3" 
                            />
                            <text 
                              x="530" 
                              y={mid_y + 4} 
                              textAnchor="start" 
                              fill="#475569" 
                              fontSize="13" 
                              fontWeight="600"
                              fontFamily="var(--font)"
                            >
                              <tspan fill="#0f172a" fontWeight="700">{stage.val.toLocaleString()}</tspan> sessions ({stage.percent}%)
                            </text>
                            
                            {/* Drop-off Badge in between */}
                            {i < arr.length - 1 && (() => {
                              const currentVal = stage.val
                              const nextVal = arr[i + 1].val
                              let dropPercent = 100
                              if (currentVal > 0) {
                                const conv = (nextVal / currentVal) * 100
                                dropPercent = Math.max(0, 100 - conv)
                              }
                              const label = dropPercent <= 0 ? 'No Drop-off' : `${Math.round(dropPercent)}% Drop-off`
                              const bg = dropPercent <= 0 ? '#f0fdf4' : '#fef2f2'
                              const border = dropPercent <= 0 ? '#bbf7d0' : '#fee2e2'
                              const textColor = dropPercent <= 0 ? '#166534' : '#ef4444'
                              
                              return (
                                <g>
                                  <rect 
                                    x="350" 
                                    y={y_bottom + 4} 
                                    width="100" 
                                    height="16" 
                                    rx="8" 
                                    fill={bg} 
                                    stroke={border} 
                                    strokeWidth="1" 
                                  />
                                  <text 
                                    x="400" 
                                    y={y_bottom + 15} 
                                    textAnchor="middle" 
                                    fill={textColor} 
                                    fontSize="9.5" 
                                    fontWeight="700"
                                    fontFamily="var(--font)"
                                  >
                                    {label}
                                  </text>
                                </g>
                              )
                            })()}
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Product Campaign Comparison */}
              <div style={{ 
                background: '#fff', 
                border: '1px solid #e2e8f0', 
                padding: 24, 
                borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Campaign Angles A/B Testing</h3>
                    <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: 12.5 }}>Compare campaign paths performance side-by-side.</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 200 }}>
                      <CustomSingleSelect
                        options={products.map(p => ({ label: p.title, value: p.id }))}
                        value={selectedProductId}
                        onChange={(val) => setSelectedProductId(val)}
                        placeholder="Select product..."
                      />
                    </div>
                    <button
                      onClick={() => {
                        setNewCampaignProduct(selectedProductId !== 'all' ? selectedProductId : (products[0]?.id || ''))
                        setShowCreateModal(true)
                      }}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Add Campaign Angle
                    </button>
                  </div>
                </div>

                {filteredCampaignsByProduct.length === 0 ? (
                  <div style={{ padding: 30, textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dotted #cbd5e1' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>No campaign angles configured for this product.</span>
                  </div>
                ) : (
                  <div className="campaign-grid">
                    {filteredCampaignsByProduct.map(camp => {
                      const isWinner = camp.id === winnerCampaignId
                      const isLoser = camp.id === loserCampaignId
                      
                      return (
                        <div 
                          key={camp.id}
                          style={{
                            background: '#fff',
                            border: isWinner ? '2px solid #10b981' : (isLoser ? '2px solid #ef4444' : '1px solid #e2e8f0'),
                            borderRadius: 12,
                            padding: 20,
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                            position: 'relative'
                          }}
                        >
                          <div style={{ position: 'absolute', top: 16, right: 16 }}>
                            {isWinner && (
                              <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontSize: 10, fontWeight: 700, padding: '3px 6px', borderRadius: 20 }}>
                                🏆 WINNER
                              </span>
                            )}
                            {isLoser && (
                              <span style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', fontSize: 10, fontWeight: 700, padding: '3px 6px', borderRadius: 20 }}>
                                ⚠️ LOSER
                              </span>
                            )}
                          </div>

                          <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: '#0f172a', paddingRight: 80 }}>{camp.name}</h4>
                          <span style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 16 }}>Product: {camp.productTitle}</span>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16, background: '#f8fafc', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                            <div>
                              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Views</div>
                              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{camp.landerCount}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Sales</div>
                              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{camp.completedSales}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Revenue</div>
                              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: '#0f172a' }}>{formatNaira(camp.revenue)}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                              { label: 'Opt-in Rate', val: camp.signupCount, pct: camp.optInRate, color: '#3b82f6' },
                              { label: 'Webinar Views', val: camp.webinarCount, pct: camp.webinarRate, color: '#8b5cf6' },
                              { label: 'Checkout Views', val: camp.checkoutCount, pct: camp.checkoutRate, color: '#ec4899' },
                              { label: 'Conversion', val: camp.completedSales, pct: camp.overallConversion, color: '#10b981', isOverall: true }
                            ].map((step, idx) => (
                              <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4, fontWeight: step.isOverall ? 700 : 500 }}>
                                  <span>{step.label}</span>
                                  <span style={{ color: step.isOverall ? '#10b981' : '#475569' }}>{step.val} ({step.pct}%)</span>
                                </div>
                                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(100, step.pct)}%`, height: '100%', background: step.color, borderRadius: 4 }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: CAMPAIGN ATTRIBUTION TABLE */}
          {activeTab === 'campaigns' && (
            <div style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: 12, 
              padding: 24, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700 }}>Attributed Campaign Funnel Summary</h3>
              
              {/* Added table-attribution class to prevent column squeezes (Image 1 fix) */}
              <div className="responsive-table-wrapper">
                <table className="responsive-table table-attribution">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                      <th style={{ padding: '12px 8px' }}>Campaign Name</th>
                      <th style={{ padding: '12px 8px' }}>Product</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Lander Views</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Webinar Leads</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Opt-in Rate</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Webinar Watchers</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Checkout views</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Purchases</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Conversion %</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignFunnels.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                          No campaigns found. Create campaigns in the Campaign Manager tab.
                        </td>
                      </tr>
                    ) : (
                      campaignFunnels.map((c, idx) => (
                        <tr key={idx} style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          fontSize: 13.5, 
                          fontWeight: 500,
                          color: '#334155'
                        }}>
                          <td style={{ padding: '14px 8px', fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                          <td style={{ padding: '14px 8px', fontSize: 12.5, color: '#64748b' }}>{c.productTitle}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>{c.landerCount}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>{c.signupCount}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center', color: '#3b82f6', fontWeight: 600 }}>{c.optInRate}%</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>{c.webinarCount}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>{c.checkoutCount}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>{c.completedSales}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center', color: '#10b981', fontWeight: 700 }}>{c.overallConversion}%</td>
                          <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatNaira(c.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: WEBINAR SIGNUPS TABLE */}
          {activeTab === 'leads' && (
            <div style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: 12, 
              padding: 24, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Opt-in Webinar Signups</h3>
                  <div style={{ minWidth: 180 }}>
                    <CustomSingleSelect
                      options={[{ label: 'All Campaigns', value: 'all' }, ...campaigns.map(c => ({ label: c.name, value: c.id }))]}
                      value={selectedCampaignId}
                      onChange={(val) => setSelectedCampaignId(val)}
                      placeholder="Filter campaign..."
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 13,
                    width: 260
                  }}
                />
              </div>

              <div className="responsive-table-wrapper">
                <table className="responsive-table table-leads">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                      <th style={{ padding: '12px 8px' }}>Customer Name</th>
                      <th style={{ padding: '12px 8px' }}>Contact Email</th>
                      <th style={{ padding: '12px 8px' }}>Phone Number</th>
                      <th style={{ padding: '12px 8px' }}>Signup Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayLeads.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                          No matching signups found.
                        </td>
                      </tr>
                    ) : (
                      displayLeads.map((lead, idx) => (
                        <tr key={idx} style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          fontSize: 13.5, 
                          color: '#334155'
                        }}>
                          <td style={{ padding: '14px 8px', fontWeight: 600, color: '#0f172a' }}>{lead.name || 'Anonymous'}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{lead.email}</span>
                              <button 
                                onClick={() => copyToClipboard(lead.email)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
                                title="Copy Email"
                              >
                                📋
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            {lead.phone ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{lead.phone}</span>
                                <button 
                                  onClick={() => copyToClipboard(lead.phone)}
                                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
                                  title="Copy Phone"
                                >
                                  📋
                                </button>
                              </div>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '14px 8px', color: '#64748b' }}>
                            {new Date(lead.created_at).toLocaleDateString()} {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CHECKOUT ABANDONMENT TABLE */}
          {activeTab === 'abandoned' && (
            <div style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: 12, 
              padding: 24, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Checkout Abandonment (Drop-offs)</h3>
                    <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: 12.5 }}>
                      Customers who initialized checkout but did not complete the paid order.
                    </p>
                  </div>
                  <div style={{ minWidth: 180 }}>
                    <CustomSingleSelect
                      options={[{ label: 'All Campaigns', value: 'all' }, ...campaigns.map(c => ({ label: c.name, value: c.id }))]}
                      value={selectedCampaignId}
                      onChange={(val) => setSelectedCampaignId(val)}
                      placeholder="Filter campaign..."
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search drop-offs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 13,
                    width: 260
                  }}
                />
              </div>

              <div className="responsive-table-wrapper">
                <table className="responsive-table table-abandoned">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                      <th style={{ padding: '12px 8px' }}>Customer Details</th>
                      <th style={{ padding: '12px 8px' }}>Product & Value</th>
                      <th style={{ padding: '12px 8px' }}>Campaign Angle</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px 8px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayAbandoned.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                          No abandoned checkouts found.
                        </td>
                      </tr>
                    ) : (
                      displayAbandoned.map((drop, idx) => (
                        <tr key={idx} style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          fontSize: 13.5, 
                          color: '#334155'
                        }}>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{drop.customer_name || 'Anonymous'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 2 }}>
                              <span style={{ color: '#64748b' }}>{drop.customer_email}</span>
                              <button onClick={() => copyToClipboard(drop.customer_email)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: 10 }}>📋</button>
                            </div>
                            {drop.customer_phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 2 }}>
                                <span style={{ color: '#64748b' }}>{drop.customer_phone}</span>
                                <button onClick={() => copyToClipboard(drop.customer_phone)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', fontSize: 10 }}>📋</button>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{drop.products?.title || 'Unknown Product'}</div>
                            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>{formatNaira(drop.amount)}</div>
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            <span style={{ 
                              background: '#f1f5f9', 
                              border: '1px solid #cbd5e1', 
                              color: '#475569',
                              padding: '2px 6px', 
                              borderRadius: 4, 
                              fontSize: 11,
                              fontWeight: 600
                            }}>
                              {drop.campaign_name}
                            </span>
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            <span style={{ 
                              background: '#fffbeb', 
                              border: '1px solid #fef3c7', 
                              color: '#d97706',
                              padding: '4px 8px', 
                              borderRadius: 6, 
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {drop.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 8px', color: '#64748b' }}>
                            {new Date(drop.created_at).toLocaleDateString()} {new Date(drop.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CAMPAIGN MANAGER */}
          {activeTab === 'manager' && (
            <div style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: 12, 
              padding: 24, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Custom Campaigns Configurations</h3>
                  <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: 12.5 }}>
                    Define paths to group traffic metrics and A/B test angles.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCampaignId(null)
                    setNewCampaignName('')
                    setNewCampaignLanders([])
                    setNewCampaignWebinars([])
                    setNewCampaignCheckouts(['/checkout'])
                    setNewCampaignUtm('')
                    setNewCampaignProduct(products[0]?.id || '')
                    setShowCreateModal(true)
                  }}
                  style={{
                    background: '#2563eb',
                    color: '#fff',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Add Campaign
                </button>
              </div>

              <div className="responsive-table-wrapper">
                <table className="responsive-table table-manager">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                      <th style={{ padding: '12px 8px' }}>Campaign Name</th>
                      <th style={{ padding: '12px 8px' }}>Target Product</th>
                      <th style={{ padding: '12px 8px' }}>Landing Paths</th>
                      <th style={{ padding: '12px 8px' }}>Webinar Paths</th>
                      <th style={{ padding: '12px 8px' }}>Checkout Paths</th>
                      <th style={{ padding: '12px 8px' }}>UTM campaign</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                          No campaigns defined yet. Click "Add Campaign" to get started.
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((c) => (
                        <tr key={c.id} style={{ 
                          borderBottom: '1px solid #f1f5f9', 
                          fontSize: 13, 
                          color: '#334155'
                        }}>
                          <td style={{ padding: '14px 8px', fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                          <td style={{ padding: '14px 8px', color: '#475569' }}>
                            {products.find(p => p.id === c.product_id)?.title || 'Unknown Product'}
                          </td>
                          <td style={{ padding: '14px 8px', fontFamily: 'monospace', fontSize: 12 }}>
                            {c.lander_paths.join(', ')}
                          </td>
                          <td style={{ padding: '14px 8px', fontFamily: 'monospace', fontSize: 12 }}>
                            {c.webinar_paths.join(', ') || '-'}
                          </td>
                          <td style={{ padding: '14px 8px', fontFamily: 'monospace', fontSize: 12 }}>
                            {c.checkout_paths.join(', ') || '-'}
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            {c.utm_campaign ? (
                              <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11.5 }}>
                                {c.utm_campaign}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  setLinkGenCampaign(c)
                                  setLinkGenLander(c.lander_paths[0] || '')
                                  setLinkGenSource('social')
                                  setLinkGenMedium('post')
                                  setLinkGenCopied(false)
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#2563eb',
                                  fontWeight: 600,
                                  fontSize: 12,
                                  cursor: 'pointer'
                                }}
                              >
                                Get Link
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCampaignId(c.id)
                                  setNewCampaignName(c.name)
                                  setNewCampaignProduct(c.product_id)
                                  setNewCampaignLanders(c.lander_paths)
                                  setNewCampaignWebinars(c.webinar_paths)
                                  setNewCampaignCheckouts(c.checkout_paths)
                                  setNewCampaignUtm(c.utm_campaign || '')
                                  setShowCreateModal(true)
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#4f46e5',
                                  fontWeight: 600,
                                  fontSize: 12,
                                  cursor: 'pointer'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(c.id)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#ef4444',
                                  fontWeight: 600,
                                  fontSize: 12,
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CREATE CAMPAIGN POPUP MODAL (MODIFIED TO USE CUSTOM SELECT DROPDOWNS) */}
          {showCreateModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              fontFamily: 'Inter, system-ui, sans-serif',
              padding: 16
            }}>
              <div style={{
                background: '#fff',
                width: '100%',
                maxWidth: 500,
                borderRadius: 16,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#0f172a',
                  color: '#fff',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editingCampaignId ? 'Edit Campaign Angle' : 'Add Campaign Angle'}</h3>
                  <button 
                    onClick={() => {
                      setEditingCampaignId(null)
                      setShowCreateModal(false)
                    }}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateCampaign} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }} className="no-scrollbar">
                  {formError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 500 }}>
                      ⚠️ {formError}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Campaign Angle Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. Agency Marketing Angle"
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Target Product:</label>
                    <CustomSingleSelect
                      options={products.map(p => ({ label: p.title, value: p.id }))}
                      value={newCampaignProduct}
                      onChange={(val) => setNewCampaignProduct(val)}
                      placeholder="Select target product..."
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Select Landing Page Paths:</label>
                    <CustomMultiSelect
                      options={scannedPages}
                      value={newCampaignLanders}
                      onChange={(val) => setNewCampaignLanders(val)}
                      placeholder="Select landing pages..."
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Select Webinar Page Paths:</label>
                    <CustomMultiSelect
                      options={scannedPages}
                      value={newCampaignWebinars}
                      onChange={(val) => setNewCampaignWebinars(val)}
                      placeholder="Select webinar pages..."
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Select Checkout Page Paths:</label>
                    <CustomMultiSelect
                      options={scannedPages}
                      value={newCampaignCheckouts}
                      onChange={(val) => setNewCampaignCheckouts(val)}
                      placeholder="Select checkout pages..."
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>UTM campaign (Optional):</label>
                    <input
                      type="text"
                      placeholder="e.g. agency_campaign_2026"
                      value={newCampaignUtm}
                      onChange={(e) => setNewCampaignUtm(e.target.value)}
                      style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                    />
                    <small style={{ color: '#64748b', fontSize: 11 }}>Associate user sessions matching this UTM campaign code.</small>
                  </div>

                  <div style={{ display: 'flex', justify: 'flex-end', gap: 12, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {submitting ? 'Saving...' : (editingCampaignId ? 'Save Changes' : 'Create Campaign')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {linkGenCampaign && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              fontFamily: 'Inter, system-ui, sans-serif',
              padding: 16
            }}>
              <div style={{
                background: '#fff',
                width: '100%',
                maxWidth: 500,
                borderRadius: 16,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#0f172a',
                  color: '#fff',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Generate Tracking URL</h3>
                  <button 
                    onClick={() => setLinkGenCampaign(null)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <p style={{ margin: 0, color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                      Create a tracking URL with UTM parameters to track this specific traffic source or marketing channel. Visits through this URL will be mapped to the <strong>{linkGenCampaign.name}</strong> funnel.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Select Lander Path:</label>
                    <select
                      value={linkGenLander}
                      onChange={e => {
                        setLinkGenLander(e.target.value)
                        setLinkGenCopied(false)
                      }}
                      style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                    >
                      {(linkGenCampaign.lander_paths || []).map(path => (
                        <option key={path} value={path}>{path}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Traffic Source (utm_source):</label>
                    <input
                      type="text"
                      placeholder="e.g. facebook, twitter, google, newsletter"
                      value={linkGenSource}
                      onChange={e => {
                        setLinkGenSource(e.target.value.toLowerCase().replace(/\s+/g, '_'))
                        setLinkGenCopied(false)
                      }}
                      style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Traffic Medium (utm_medium):</label>
                    <input
                      type="text"
                      placeholder="e.g. organic, cpc, post, bio"
                      value={linkGenMedium}
                      onChange={e => {
                        setLinkGenMedium(e.target.value.toLowerCase().replace(/\s+/g, '_'))
                        setLinkGenCopied(false)
                      }}
                      style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13.5 }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Generated URL:</label>
                    <div style={{ 
                      fontSize: 12.5, 
                      fontFamily: 'monospace', 
                      wordBreak: 'break-all', 
                      color: '#0f172a',
                      background: '#fff',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      marginTop: 4,
                      userSelect: 'all'
                    }}>
                      {`${window.location.origin}${linkGenLander}?utm_campaign=${linkGenCampaign.utm_campaign || linkGenCampaign.name.toLowerCase().replace(/\s+/g, '_')}${linkGenSource ? `&utm_source=${linkGenSource}` : ''}${linkGenMedium ? `&utm_medium=${linkGenMedium}` : ''}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justify: 'flex-end', gap: 12, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setLinkGenCampaign(null)}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}${linkGenLander}?utm_campaign=${linkGenCampaign.utm_campaign || linkGenCampaign.name.toLowerCase().replace(/\s+/g, '_')}${linkGenSource ? `&utm_source=${linkGenSource}` : ''}${linkGenMedium ? `&utm_medium=${linkGenMedium}` : ''}`
                        navigator.clipboard.writeText(url)
                        setLinkGenCopied(true)
                      }}
                      style={{
                        background: linkGenCopied ? '#10b981' : '#2563eb',
                        color: '#fff',
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      {linkGenCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

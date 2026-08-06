/**
 * MIFAS Email Service
 * Calls the Supabase Edge Function `send-email` to trigger transactional emails.
 * 
 * Usage:
 *   import { sendEmail } from '../lib/emailService'
 *   await sendEmail.orderConfirmed({ name, email, ... })
 */

import { supabase } from './supabase'

// ─── INTERNAL HELPER ──────────────────────────────────────────────────────────
async function trigger(type: string, to: string | string[], data: Record<string, unknown> = {}) {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { type, to, data },
    })
    if (error) {
      console.warn(`[emailService] Failed to send '${type}':`, error.message)
    } else {
      console.log(`[emailService] Sent '${type}' to`, to)
    }
  } catch (err) {
    // Never throw — email failures should not break the checkout flow
    console.warn(`[emailService] Exception sending '${type}':`, err)
  }
}

// ─── EMAIL SENDERS ────────────────────────────────────────────────────────────

/**
 * Sent when Paystack payment is successfully completed.
 */
export async function sendOrderConfirmed(data: {
  name: string
  email: string
  phone?: string
  ref: string
  product_id?: string
  product_title?: string
  product_type?: string
  product_image?: string
  amount: number
  payment_method?: string
  shipping_street?: string
  shipping_city?: string
  shipping_state?: string
  shipping_country?: string
}) {
  await Promise.all([
    // Customer confirmation
    trigger('order_confirmed', data.email, data),
    // Admin notification
    trigger('admin_new_order', 'admin', { ...data, payment_method: data.payment_method || 'paystack' }),
  ])
}

/**
 * Sent when a bank transfer order is placed (before receipt upload/review).
 */
export async function sendBankTransferPending(data: {
  name: string
  email: string
  phone?: string
  ref: string
  product_title?: string
  product_type?: string
  product_image?: string
  amount: number
  bank_name?: string
  account_number?: string
  account_name?: string
  shipping_street?: string
  shipping_city?: string
  shipping_state?: string
}) {
  await Promise.all([
    trigger('bank_transfer', data.email, { ...data, payment_method: 'bank_transfer' }),
    trigger('admin_new_order', 'admin', { ...data, payment_method: 'bank_transfer' }),
  ])
}

/**
 * Sent when a Cash on Delivery order is placed.
 */
export async function sendCodOrderPlaced(data: {
  name: string
  email: string
  phone?: string
  ref: string
  product_title?: string
  product_type?: string
  product_image?: string
  amount: number
  shipping_street?: string
  shipping_city?: string
  shipping_state?: string
}) {
  await Promise.all([
    trigger('cod_order_placed', data.email, { ...data, payment_method: 'cod' }),
    trigger('admin_new_order', 'admin', { ...data, payment_method: 'cod' }),
  ])
}

/**
 * Sent when admin approves/verifies a bank transfer.
 */
export async function sendPaymentVerified(data: {
  name: string
  email: string
  ref: string
  product_title?: string
  product_type?: string
  product_image?: string
  amount: number
  payment_method?: string
}) {
  await trigger('payment_verified', data.email, { ...data, payment_method: data.payment_method || 'bank_transfer' })
}

/**
 * Sent when admin marks an order as shipped.
 */
export async function sendOrderShipped(data: {
  name: string
  email: string
  ref: string
  product_title?: string
  product_type?: string
  product_image?: string
  amount: number
  tracking_number?: string
  tracking_url?: string
  shipping_street?: string
  shipping_city?: string
  shipping_state?: string
  estimated_delivery?: string
}) {
  await trigger('order_shipped', data.email, data)
}

/**
 * Sent when admin marks an order as delivered.
 */
export async function sendOrderDelivered(data: {
  name: string
  email: string
  ref: string
  product_title?: string
  product_type?: string
  product_image?: string
  amount: number
}) {
  await trigger('order_delivered', data.email, data)
}

/**
 * Sent when a new user registers (account created).
 */
export async function sendWelcomeEmail(data: {
  name: string
  email: string
}) {
  await trigger('welcome', data.email, data)
}

/**
 * Sent when a website contact form is submitted.
 */
export async function sendContactFormSubmitted(data: {
  name: string
  email: string
  subject: string
  message: string
}) {
  await Promise.all([
    // Send auto reply to customer
    trigger('contact_auto_reply', data.email, data),
    // Send inquiry details to admin email (info@saintglobalsolar.com)
    trigger('contact_message', 'admin', data),
  ])
}

// ─── CONVENIENCE EXPORT ───────────────────────────────────────────────────────
const emailService = {
  orderConfirmed:       sendOrderConfirmed,
  bankTransferPending:  sendBankTransferPending,
  paymentVerified:      sendPaymentVerified,
  orderShipped:         sendOrderShipped,
  orderDelivered:       sendOrderDelivered,
  welcome:              sendWelcomeEmail,
  contactFormSubmitted: sendContactFormSubmitted,
}

export default emailService

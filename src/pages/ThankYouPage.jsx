import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ThankYouPage() {
  const { user } = useAuth()
  const customer = JSON.parse(localStorage.getItem('paid_customer') || '{}')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const firstName = (customer?.name || 'Valued Customer').split(' ')[0]

  const amount = customer?.amount || 0
  const deliveryFee = customer?.delivery_fee || 0
  const total = amount + deliveryFee

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '60px 20px', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header confirmation block */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(36, 106, 66, 0.1)',
            color: 'var(--g600)',
            marginBottom: '24px'
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--g600)', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px' }}>
            {customer?.ref ? `Order #${String(customer.ref).slice(-8).toUpperCase()}` : 'Order Confirmed'}
          </p>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 12px' }}>
            Thank you, {firstName}!
          </h1>
          <p style={{ fontSize: '16px', color: '#475569', maxWidth: '520px', margin: '0 auto', lineHeight: '1.6' }}>
            {customer?.payment_method === 'bank_transfer' ? (
              <>
                Your order has been received and is <strong>pending verification</strong> of your bank transfer receipt. We will process your order as soon as your payment is verified.
              </>
            ) : (
              <>
                Your order has been received and is now being processed. A confirmation email has been sent to <strong style={{ color: '#0f172a' }}>{customer?.email}</strong>.
              </>
            )}
          </p>
        </div>

        {/* Core Layout Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '32px',
          alignItems: 'start'
        }} className="ty-grid-responsive">
          
          {/* Left Column: Details & Dashboard Tracking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Dashboard Tracking CTA Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="9" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="15" x2="21" y2="15" />
                </svg>
                Track Your Order In Real-Time
              </h3>
              <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px' }}>
                Create or access your customer dashboard profile to view real-time delivery status, access premium downloads, download printable PDF receipts, and contact support instantly.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/dashboard" style={{ textDecoration: 'none', flex: 1, minWidth: '220px' }}>
                  <button className="btn-primary" style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, var(--g600), var(--g700))',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '14.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 10px rgba(36, 106, 66, 0.2)',
                    transition: 'all 0.2s'
                  }}>
                    Go to Customer Dashboard
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </Link>
                <Link to="/products" style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '14px 24px',
                    background: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '14.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--g600)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                  >
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </div>

            {/* Customer & Shipping Information Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                Customer Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="ty-info-responsive">
                
                {/* Contact Information */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                    Contact Information
                  </h4>
                  <p style={{ fontSize: '14.5px', color: '#1e293b', fontWeight: 500, margin: '0 0 4px' }}>
                    {customer?.name}
                  </p>
                  <p style={{ fontSize: '13.5px', color: '#475569', margin: '0 0 2px' }}>
                    {customer?.email}
                  </p>
                  <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
                    {customer?.phone}
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                    Payment Method
                  </h4>
                  <p style={{ fontSize: '14.5px', color: '#1e293b', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    {customer?.payment_method === 'bank_transfer' ? 'Direct Bank Transfer' : 'Paystack (Card/Transfer)'}
                  </p>
                  <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                    Transaction Status:{' '}
                    {customer?.payment_method === 'bank_transfer' ? (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>PENDING REVIEW</span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>PAID</span>
                    )}
                  </p>
                </div>

                {/* Shipping Address */}
                {customer?.shipping_street && (
                  <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '8px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                      Shipping Address
                    </h4>
                    <p style={{ fontSize: '14.5px', color: '#1e293b', fontWeight: 500, margin: '0 0 4px' }}>
                      {customer?.shipping_name || customer?.name}
                    </p>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                      {customer?.shipping_street}<br />
                      {customer?.shipping_city}, {customer?.shipping_state}<br />
                      {customer?.shipping_country || 'Nigeria'} {customer?.shipping_postal_code ? `(${customer.shipping_postal_code})` : ''}
                    </p>
                    {customer?.shipping_notes && (
                      <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', marginTop: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--g500)' }}>
                        <strong>Instructions:</strong> {customer.shipping_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0, borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              Order Summary
            </h3>
            
            {/* Products Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              {customer?.cover_image ? (
                <img
                  src={customer.cover_image}
                  alt={customer.product_title || 'Product'}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    objectFit: 'cover',
                    flexShrink: 0,
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'var(--g50)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--g600)',
                  flexShrink: 0
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {customer?.product_title || 'Solar Product'}
                </h4>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, textTransform: 'capitalize' }}>
                  Type: {customer?.product_type || 'Product'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                  ₦{amount.toLocaleString()}
                </p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Qty: 1
                </p>
              </div>
            </div>

            {/* Price Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₦{amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}>
                <span>Shipping Fee</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {deliveryFee > 0 ? `₦${deliveryFee.toLocaleString()}` : 'Free'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                color: '#0f172a',
                borderTop: '2px dashed #e2e8f0',
                paddingTop: '16px',
                marginTop: '4px'
              }}>
                <span style={{ fontWeight: 800 }}>Total</span>
                <span style={{ fontWeight: 800, color: 'var(--g600)' }}>₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Styling overrides for responsive grid layout */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 868px) {
            .ty-grid-responsive {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
          }
          @media (max-width: 580px) {
            .ty-info-responsive {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
            .ty-info-responsive > div {
              grid-column: span 1 !important;
            }
          }
        `}} />
      </div>
    </div>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'

export default function RefundPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0f0d0a 0%, #1c1813 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Trade Policies
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Refund & Returns Policy
          </h1>
          <p style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
            Our standard protocol for item returns, exchanges, and refund claims.
          </p>
        </div>
      </section>

      {/* Content Details */}
      <section style={{ padding: '80px 24px', maxWidth: '850px', margin: '0 auto' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
        }} className="policy-card">
          <p style={{ fontSize: '16px', lineHeight: '1.75', color: '#475569', marginTop: 0, marginBottom: '32px' }}>
            At <strong>SAINT GLOBAL SOLAR</strong>, we take pride in designing and handcrafting premium footwear and accessories. We operate a clear commercial policy to assist our clients with size replacements and returns.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>1. 7-Day Exchange Policy</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', marginBottom: '12px' }}>
                We accept exchanges for sizing replacements within 7 days of delivery. The items must be unworn, undamaged, free of scuffs, and returned in their original luxury packaging.
              </p>
              <div style={{
                background: '#faf8f5',
                borderLeft: '4px solid var(--gold)',
                padding: '16px',
                borderRadius: '0 8px 8px 0',
                color: '#5c4e3c',
                fontSize: '14px',
                fontWeight: 600
              }}>
                Please ensure you try on shoes on a carpeted surface to avoid sole marks before verifying the fit.
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>2. Cancellations & Returns</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                Orders can be canceled and fully refunded before shipment dispatch by contacting our support line. Custom orders or personalized accessories cannot be refunded or exchanged unless they arrive damaged or defective.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>3. Quality Claims</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                If your order arrives with manufacturing defects or shipping damage, please notify us within 24 hours of delivery. Include pictures of the packaging and product, and we will issue an immediate replacement.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '60px 24px', background: '#f8fafc', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#0f0d0a', fontWeight: 800, margin: 0 }}>Need to file an exchange request?</h2>
          <p style={{ fontSize: '14.5px', color: '#64748b', margin: 0 }}>
            Please submit your order number and request details to our customer experience team.
          </p>
          <a href="mailto:admin@saintglobalsolar.com" style={{
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '11px 24px',
            borderRadius: '6px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '13.5px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
            Email Customer Support
          </a>
        </div>
      </section>

      <style>{`
        @media (max-width: 600px) {
          .policy-card {
            padding: 24px !important;
          }
        }
      `}</style>

    </div>
  )
}

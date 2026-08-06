import React from 'react'
import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0f0d0a 0%, #1c1813 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Legal Framework
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Terms & Conditions
          </h1>
          <p style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
            These terms govern your access to our online storefront and purchases of luxury solar panels, lithium batteries, and general contracting from SAINT GLOBAL SOLAR.
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
            Welcome to <strong>SAINT GLOBAL SOLAR</strong> ("the Company," "we," "us," or "our"). These Terms & Conditions govern your purchases of physical retail goods (solar equipment, backup batteries, and wiring materials), payment gateway routing, and shipment delivery.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>1. Product Specifications & Custom Orders</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                All products delivered by SAINT GLOBAL SOLAR meet premium craftsmanship standards, utilizing genuine materials as defined on our official product descriptions. Buyers are responsible for selecting the correct sizes and options prior to checkout.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>2. Pricing, Payments & Tax Compliance</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                All listed prices are displayed in Nigerian Naira (NGN) or support currencies depending on your selection. Online orders must be fully paid via Secure Paystack or direct bank transfer before shipment.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>3. Shipping & Delivery Logistics</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                We coordinate nationwide express deliveries. While we handle packaging and carrier handoff, buyers are responsible for providing correct address details. Deliveries inside Lagos typically take 1-3 business days.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>4. Returns, Exchanges & Liability Limits</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                We accept equipment return/exchange requests within 7 days of delivery, provided the footwear or accessory is unworn, undamaged, and returned in its original packaging. SAINT GLOBAL SOLAR is not liable for delayed carrier transit times or buyer damages.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '60px 24px', background: '#f8fafc', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#0f0d0a', fontWeight: 800, margin: 0 }}>Have any legal inquiries?</h2>
          <p style={{ fontSize: '14.5px', color: '#64748b', margin: 0 }}>
            If you need assistance regarding corporate gifting, custom wholesale contracts, or policy compliance, please contact our support team.
          </p>
          <Link to="/contact" style={{
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
            Contact Support
          </Link>
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

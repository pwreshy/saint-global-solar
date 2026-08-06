import React from 'react'
import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0f0d0a 0%, #1c1813 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Data Protection
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
            How we collect, secure, and handle buyer account credentials, shipping details, and transaction data at SAINT GLOBAL SOLAR.
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
            At <strong>SAINT GLOBAL SOLAR</strong>, we value the trust of our clients and website users. This Privacy Policy details our commitment to securing information collected through our solar sales panels, quotes, and project forms.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>1. Information We Collect</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', marginBottom: '12px' }}>
                When ordering commodities or requesting size consultations, we collect standard identifiers required to deliver shipments and process payments:
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: '#475569', fontSize: '14.5px' }}>
                <li><strong>Contact details:</strong> Full name, telephone number, email address.</li>
                <li><strong>Logistics details:</strong> Physical shipping street address, city, country, and delivery notes.</li>
                <li><strong>Documents upload:</strong> Bank payment screenshots or receipt files provided during direct bank transfers.</li>
              </ul>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>2. How We Use Collected Data</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                Collected data is used strictly for processing order deliveries, generating invoices, coordinating with logistics partners, and notifying buyers of shipment tracking milestones. We do not sell or lease your records to third-party marketing companies.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>3. Secure Payments Gateways</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                Local credit card and instant bank payments are processed securely by <strong>Paystack Gateway</strong>. SAINT GLOBAL SOLAR does not store or process card numbers, bank PINs, or routing codes on our servers. Direct bank transfer receipts uploaded during manual checkout are stored in secure, private folders on Supabase Storage.
              </p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 12px' }}>4. Cookies & Web Analytics</h2>
              <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569', margin: 0 }}>
                We use secure browser cookies to manage checkout cart persistence across reloads and analyze site usage trends. This helps us ensure that your order details survive browser crashes and checkout is seamless.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '60px 24px', background: '#f8fafc', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#0f0d0a', fontWeight: 800, margin: 0 }}>Need your records removed?</h2>
          <p style={{ fontSize: '14.5px', color: '#64748b', margin: 0 }}>
            If you wish to terminate your account or have your delivery history archived, reach out to our administration helpdesk.
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

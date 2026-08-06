import React from 'react'
import { Link } from 'react-router-dom'

export default function QualityPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ 
        position: 'relative',
        background: 'linear-gradient(rgba(11, 15, 25, 0.85), rgba(26, 32, 44, 0.85)), url("/nigeria_solar_hero.jpg") no-repeat center center / cover', 
        color: '#ffffff', 
        padding: '100px 24px', 
        textAlign: 'center' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            International Standards
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Quality Assurance & Engineering Excellence
          </h1>
          <p style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
            At SAINT GLOBAL SOLAR, durability is our goal. We maintain rigorous testing standards from solar cell sourcing to inverter load-testing to ensure our systems work flawlessly for years.
          </p>
        </div>
      </section>

      {/* Quality Pillars Grid */}
      <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '28px', color: '#0b0f19', fontWeight: 800 }}>Our Testing Pillars</h2>
          <p style={{ color: '#64748b', fontSize: '15px' }}>Four stages of strict checks before packaging and delivery.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }} className="quality-grid">
          {[
            {
              num: '01',
              title: 'Cell Sourcing',
              desc: 'We source only premium Grade-A monocrystalline cells and long-life Lithium-iron phosphate cells, auditing conversion rates.'
            },
            {
              num: '02',
              title: 'Wiring Integrity',
              desc: 'System boards and inverter circuits are set up by certified engineers. Wiring path insulation and soldering is checked manually.'
            },
            {
              num: '03',
              title: 'Load Test Audit',
              desc: 'Ensuring correct voltage output is critical. We perform strict high-load voltage, discharge rate, and cycle tests on batteries.'
            },
            {
              num: '04',
              title: 'Secure Packaging',
              desc: 'Every item is safely packed in customized wooden crates and shock-absorbing layers before shipment to protect solar cells.'
            }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--gold)', opacity: 0.2 }}>{item.num}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0b0f19', margin: 0 }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications & Compliances banner */}
      <section style={{ padding: '60px 24px', background: '#fffcf8', borderTop: '1px solid var(--gold)', borderBottom: '1px solid var(--gold)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }} className="cert-flex">
          <div>
            <h2 style={{ fontSize: '28px', color: '#0b0f19', fontWeight: 800, marginBottom: '16px' }}>Premium Sourcing & Safety</h2>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.7', marginBottom: '12px' }}>
              SAINT GLOBAL SOLAR products meet strict international solar energy standards and electrical safety compliance.
            </p>
            <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
              All battery units carry premium BMS (Battery Management System) checks, discharge safety logs, and conversion efficiency reports.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              'Grade-A Lithium Cells',
              'Monocrystalline Panels',
              'CE Certified Inverters',
              'Expert On-site Wiring'
            ].map((text, idx) => (
              <div key={idx} style={{
                background: '#ffffff',
                border: '1.5px solid var(--gold)',
                borderRadius: '6px',
                padding: '16px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '13.5px',
                color: 'var(--gold)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
              }}>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '28px', color: '#0b0f19', fontWeight: 800, margin: 0 }}>Durable Power Starts Here</h2>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
            Explore our solar panels, lithium backup storage packs, inverter controllers, and expert engineering design services.
          </p>
          <Link to="/products" style={{
            background: 'var(--gold)',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '4px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--gold-d)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--gold)'}>
            Explore Solar Catalog
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 992px) {
          .quality-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .cert-flex {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 576px) {
          .quality-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  const stats = [
    { value: '100%', label: 'Certified Durability' },
    { value: 'Nationwide', label: 'Equipment Delivery' },
    { value: '1200+', label: 'Happy Clients' },
    { value: 'Kano', label: 'Primary Showroom' }
  ]

  const pillars = [
    { 
      title: 'Premium Materials', 
      desc: 'We source only top-grade, high-conversion monocrystalline solar cells and A-grade lithium-iron phosphate cells for maximum lifespan.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      )
    },
    { 
      title: 'Expert Engineering', 
      desc: 'Each installation is meticulously designed and wired by certified electrical engineers, ensuring optimal load balance and high safety standards.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    { 
      title: 'Double-Pass Testing', 
      desc: 'We perform strict double-pass quality control checks on all battery units, inverters, and panels to confirm optimal performance prior to dispatch.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    },
    { 
      title: 'Secure Packaging', 
      desc: 'Every order is safely packed in customized wooden crates and shock-absorbing layers to protect delicate panels and heavy batteries in transit.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      )
    }
  ]

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
            Who We Are
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Durability, Engineering & Modern Solar Power
          </h1>
          <p style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
            SAINT GLOBAL SOLAR is a premier solar equipment dealer and general contractor dedicated to offering homes and industries robust, long-lasting energy systems.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '40px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'center' }} className="stats-row">
          {stats.map((st, idx) => (
            <div key={idx} style={{ padding: '16px' }}>
              <div style={{ fontSize: '32px', fontWeight: 850, color: 'var(--gold)' }}>{st.value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{st.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content (Story) */}
      <section style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', alignItems: 'center' }} className="about-split-row">
          <div>
            <h2 style={{ fontSize: '28px', color: '#0b0f19', fontWeight: 800, marginBottom: '20px' }}>The Story of SAINT GLOBAL SOLAR</h2>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569' }}>
              Welcome to SAINT GLOBAL SOLAR. Durability is our goal. We believe that stable, clean energy is a fundamental pillar for modern life, business growth, and industrial success.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569' }}>
              Led by CEO <strong>Ikenga Okoye</strong>, our team manages everything from panel and lithium battery distribution to complex on-site wiring and general contracting. Located at Shop No. 3A, Yahaya Ibrahim Plaza No. 40 France Road, Kano, our solar showroom serves as a center of technical engineering excellence and high-grade solar equipment.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.7', color: '#475569' }}>
              Whether you want to install a high-capacity solar water pump, implement a 25KWH Lithium-ion backup system, or run a general electrical installation, SAINT GLOBAL SOLAR provides durable components and expert certified setups. Join us in building a sustainable and self-reliant future.
            </p>
          </div>
          <div>
            <div style={{
              background: '#fffaf8',
              border: '1.5px solid var(--gold)',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 8px 16px rgba(249,115,22,0.03)'
            }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--gold)', opacity: 0.2, lineHeight: 0.1, display: 'block', marginBottom: '10px' }}>“</span>
              <p style={{ fontSize: '15px', color: '#ea580c', fontStyle: 'italic', lineHeight: '1.6', margin: '0 0 16px' }}>
                Every home and enterprise deserves stable, clean power. Our mission is to design solar arrays and storage setups that combine durability, efficiency, and unmatched technical support.
              </p>
              <div>
                <strong style={{ display: 'block', fontSize: '14.5px', color: '#0b0f19' }}>Ikenga Okoye</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--gold)' }}>CEO, Saint Global Solar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Pillars Grid */}
      <section style={{ padding: '80px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '28px', color: '#0b0f19', fontWeight: 800, margin: '0 0 8px' }}>Our Core Pillars</h2>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>How we maintain quality standards across every installation and product sold.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }} className="pillars-grid">
            {pillars.map((pil, idx) => (
              <div key={idx} style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                fill: 'var(--gold)',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ color: 'var(--gold)' }}>
                  {pil.icon}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0b0f19', margin: 0 }}>{pil.title}</h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{pil.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showroom Showcase Banner */}
      <section style={{ padding: '40px 24px', background: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <img 
            src="/solar_about_banner.jpg" 
            alt="SAINT GLOBAL SOLAR corporate showroom details and solar systems banner" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              borderRadius: '12px', 
              boxShadow: '0 10px 25px rgba(11, 15, 25, 0.05)',
              display: 'block'
            }} 
          />
        </div>
      </section>

      {/* CAC Certificate Section */}
      <section style={{ padding: '80px 24px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }} className="about-split-row">
          
          {/* Certificate Image Column */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ 
              maxWidth: '380px', 
              borderRadius: '12px', 
              overflow: 'hidden', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)', 
              border: '4px solid #ffffff',
              background: '#ffffff'
            }}>
              <a href="/cac_certificate.jpg" target="_blank" rel="noopener noreferrer">
                <img 
                  src="/cac_certificate.jpg" 
                  alt="SAINT GLOBAL SOLAR CAC Business Name Registration Certificate" 
                  style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }} 
                />
              </a>
            </div>
          </div>

          {/* Certificate Description Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              CAC REGISTERED ENTITY
            </span>
            <h2 style={{ fontSize: '28px', color: '#0b0f19', fontWeight: 800, margin: 0 }}>
              Officially Registered & Compliant
            </h2>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
              SAINT GLOBAL SOLAR is officially registered under the Companies and Allied Matters Act 2020 by the Corporate Affairs Commission (CAC) of the Federal Republic of Nigeria, with Business Name Registration No. <strong>8162409</strong>.
            </p>
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
              Our official business mandate includes the sales, supply, and installation of solar systems, batteries, and electrical appliances, as well as general merchandise. We maintain full regulatory compliance, assuring our corporate and individual clients of absolute legitimacy and long-term legal warranty.
            </p>
            <a 
              href="/cac_certificate.jpg" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--gold)',
                fontWeight: 700,
                fontSize: '14.5px',
                textDecoration: 'underline'
              }}
            >
              View Full Registration Certificate
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </div>

        </div>
      </section>

      {/* Call to action */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '28px', color: '#0b0f19', fontWeight: 800, margin: 0 }}>Power Your Property Today</h2>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
            Explore our durable panels, lithium batteries, solar rechargeable fans, and control inverters. Chat with our Kano showroom staff or call directly.
          </p>
          <Link to="/products" style={{
            background: 'var(--gold)',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '6px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--gold-d)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--gold)'}>
            Explore Equipment Catalog
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 992px) {
          .pillars-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .about-split-row {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 768px) {
          .stats-row {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 576px) {
          .pillars-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}

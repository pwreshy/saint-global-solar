import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const WA_NUMBER = '2349110019990' // Kano hotline

export default function ContactWidgets() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [pulse, setPulse] = useState(true)

  // Slide in after 2 seconds
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000)
    const p = setTimeout(() => setPulse(false), 8000)
    return () => { clearTimeout(t); clearTimeout(p) }
  }, [])

  // Hide on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null
  }

  return (
    <>
      {/* Floating Toggle Button */}
      {visible && (
        <button
          id="unified-contact-widget-btn"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: '#ffffff',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(234, 88, 12, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            animation: pulse ? 'contactBtnPulse 2s infinite' : 'none'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          title="Contact Customer Support"
        >
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          )}
        </button>
      )}

      {/* Expanded Support Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '82px',
          right: '24px',
          width: '320px',
          maxWidth: 'calc(100vw - 48px)',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15), 0 2px 10px rgba(0, 0, 0, 0.05)',
          border: '1px solid #ffedd5',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 99999,
          fontFamily: 'var(--font)',
          animation: 'contactPanelFade 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '16px 20px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <img 
              src="/logo.png" 
              alt="SAINT GLOBAL SOLAR Logo" 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#ffffff',
                objectFit: 'contain',
                padding: '3px',
                flexShrink: 0
              }} 
            />
            <div>
              <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800 }}>SAINT GLOBAL SOLAR</h4>
              <p style={{ margin: 0, fontSize: '11px', color: '#ffedd5', opacity: 0.85 }}>Support & System Design</p>
            </div>
          </div>

          {/* Body Content */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
              Have questions or need pricing? Chat with us or call our Kano office showroom directly:
            </p>

            {/* WhatsApp Link */}
            <a
              href={`https://wa.me/${WA_NUMBER}?text=Hi%20SAINT%20GLOBAL%20SOLAR,%20I'd%20like%20to%20request%20a%20solar%20quote...`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: '#25D366',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '11px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13.5px',
                boxShadow: '0 4px 10px rgba(37, 211, 102, 0.25)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1fad56'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#25D366'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.978L2 22l5.197-1.361a9.94 9.94 0 0 0 4.814 1.238h.005c5.503 0 9.987-4.479 9.988-9.985a9.97 9.97 0 0 0-2.925-7.062 9.96 9.96 0 0 0-7.067-2.83zm5.73 14.103c-.236.662-1.362 1.217-1.888 1.286-.475.06-1.085.126-3.2-.75a10.963 10.963 0 0 1-4.72-4.14c-.604-.806-1.04-1.79-1.04-2.82 0-1.098.57-1.694.773-1.913.204-.219.538-.288.757-.288.22 0 .438.005.626.012.197.007.457-.075.713.543.264.636.903 2.195.98 2.35.078.156.13.338.026.547-.104.21-.157.339-.313.522-.157.18-.328.403-.47.54-.156.15-.32.313-.138.625.181.312.806 1.326 1.727 2.148.19.17.359.34.542.474.183.136.326.173.542.02.215-.152.926-.926 1.173-1.246.248-.32.496-.264.82-.143.326.12 2.068 1.026 2.427 1.206.36.18.6.269.69.421.09.15.09.87-.146 1.533z" />
              </svg>
              Chat on WhatsApp
            </a>

            {/* Direct Calls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="tel:09110019990"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid #ffedd5',
                  color: '#1e293b',
                  textDecoration: 'none',
                  padding: '9px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  background: '#fffbf7'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#ea580c'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#ffedd5'}
              >
                Call Primary: 09110019990
              </a>
              <a
                href="tel:08142943188"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: '1px solid #ffedd5',
                  color: '#1e293b',
                  textDecoration: 'none',
                  padding: '9px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  background: '#fffbf7'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#ea580c'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#ffedd5'}
              >
                Call Secondary: 08142943188
              </a>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

            {/* Showroom Address */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" style={{ marginTop: '2px', flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <strong style={{ fontSize: '11px', color: '#1e293b', display: 'block' }}>Kano Showroom:</strong>
                <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                  Shop No. 3A, Yahaya Ibrahim Plaza No. 40 France Road, Kano
                </p>
              </div>
            </div>

            {/* CAC Registration trust link */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#334155', fontWeight: 600 }}>CAC BN: 8162409</span>
                <a
                  href="/cac_certificate.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '10px',
                    color: '#f97316',
                    fontWeight: 700,
                    textDecoration: 'underline'
                  }}
                >
                  View CAC Certificate
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes contactBtnPulse {
          0% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(234, 88, 12, 0); }
          100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0); }
        }
        @keyframes contactPanelFade {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </>
  )
}

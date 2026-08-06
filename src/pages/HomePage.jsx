import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCurrency } from '../context/CurrencyContext'

function getShortDesc(product) {
  if (!product) return ''
  const desc = product.description || ''
  if (!desc) return ''
  if (desc.includes('<')) {
    const plainText = desc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
  }
  return desc.length > 100 ? desc.substring(0, 100) + '...' : desc
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, title, slug, cover_image, price, old_price, description, variations, type')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(8)
        if (data) setFeaturedProducts(data)
      } catch (err) {
        console.error('[HomePage] Failed to load products:', err)
      } finally {
        setProductsLoading(false)
      }
    }
    loadFeaturedProducts()
  }, [])

  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* ─── HERO SECTION ─── */}
      <section style={{ padding: 0, width: '100%', maxWidth: '100%', background: '#ffffff', position: 'relative', overflow: 'hidden' }}>
        
        {/* Decorative elements */}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', alignItems: 'center', width: '100%' }} className="hero-grid">
          
          {/* Left Column: Headings & Subtexts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '120px 24px 120px max(8%, 32px)', position: 'relative', zIndex: 2 }} className="hero-left-col">
            <h1 style={{ 
              fontSize: '52px', 
              fontWeight: 800, 
              color: '#0b0f19', 
              lineHeight: '1.25', 
              margin: 0,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-1px'
            }} className="hero-title">
              Durability Is<br />
              Our Goal<br />
              <span style={{ 
                fontWeight: '800', 
                color: 'var(--gold)', 
                fontSize: '44px', 
                display: 'block', 
                marginTop: '8px' 
              }}>Premium Solar Energy Solutions</span>
            </h1>
            
            <p style={{ fontSize: '17.5px', color: '#475569', lineHeight: '1.8', margin: 0, maxWidth: '560px' }}>
              SAINT GLOBAL SOLAR is Nigeria's trusted dealer and installer of high-efficiency solar panels, long-cycle lithium-ion batteries, control inverters, LED bulbs, rechargeable fans, and water pumps.
            </p>

            <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }} className="hero-actions">
              <Link to="/products" style={{
                background: 'var(--gold)',
                color: '#fff',
                padding: '16px 32px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
                border: '1px solid var(--gold)'
              }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--gold-d)'}
                 onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--gold)'}>
                Explore Equipment <span>→</span>
              </Link>
              <Link to="/contact" style={{
                background: 'transparent',
                color: '#0b0f19',
                border: '1px solid #0b0f19',
                padding: '16px 32px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }} onMouseEnter={e => { e.currentTarget.style.background = '#faf8f5' }}
                 onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                Request Installation <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Borderless and Seamless Hero Image */}
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: '#ffffff' }} className="hero-image-col">
            <img 
              src="/solar_hero.jpg" 
              alt="SAINT GLOBAL SOLAR premium solar panels and lithium-ion batteries" 
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
            />
          </div>

        </div>

        {/* Local responsiveness stylesheet */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 1024px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
            }
            .hero-left-col {
              padding: 70px 24px 50px !important;
              text-align: center !important;
              align-items: center !important;
            }
            .hero-left-col p {
              margin: 0 auto !important;
            }
            .hero-image-col {
              justify-content: center !important;
              padding: 0 !important;
            }
            .hero-image-col img {
              max-width: 100% !important;
              width: 100% !important;
              height: 380px !important;
              object-fit: cover !important;
            }
            .hero-title {
              font-size: 38px !important;
            }
            .hero-title span {
              font-size: 34px !important;
            }
            .hero-leaf-tl, .hero-leaf-bl {
              display: none !important;
            }
          }
          @media (max-width: 768px) {
            .hero-image-col {
              padding: 0 !important;
            }
            .hero-image-col img {
              max-width: 100% !important;
              width: 100% !important;
              height: 300px !important;
              object-fit: cover !important;
            }
          }
        `}} />
      </section>

      {/* ─── FEATURES HIGHLIGHTS STRIP ─── */}
      <section style={{ background: '#fffcf9', color: '#1e293b', padding: '60px 24px', width: '100%', maxWidth: '100%', borderBottom: '1px solid #fed7aa' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }} className="features-grid-new">
          {[
            {
              title: 'NATIONWIDE DELIVERY',
              desc: 'Express delivery to your site or showroom across Nigeria.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              )
            },
            {
              title: 'ENGINEERED DURABILITY',
              desc: 'Meticulously designed solar panels and batteries.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="8" r="7"/>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                  <polyline points="9 8 11 10 15 6"/>
                </svg>
              )
            },
            {
              title: 'PREMIUM SOLAR CELLS',
              desc: 'High conversion rate cells with tough tempered glass.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                  <polyline points="2 17 12 22 22 17"/>
                  <polyline points="2 12 12 17 22 12"/>
                </svg>
              )
            },
            {
              title: 'EXPERT INSTALLATION',
              desc: 'Professional configuration & sizing support.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              )
            },
            {
              title: '7-YEAR WARRANTY',
              desc: 'Guaranteed durability and maximum battery life.',
              icon: (
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              )
            }
          ].map((item, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start', 
              gap: '12px', 
              padding: '24px',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #ffedd5',
              boxShadow: '0 4px 12px rgba(249,115,22,0.02)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }} className="features-item-card">
              <div style={{ background: '#fff7ed', padding: '12px', borderRadius: '10px', color: 'var(--gold)' }}>
                {item.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <strong style={{ fontSize: '12.5px', fontWeight: 800, letterSpacing: '0.5px', color: '#1e293b' }}>{item.title}</strong>
                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ABOUT US SECTION ─── */}
      <section style={{ padding: '100px 24px', background: '#ffffff', width: '100%', maxWidth: '100%', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '64px', alignItems: 'center' }} className="about-wrapper-new">
          
          {/* Left Collage Column with Real Solar Images */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', position: 'relative' }} className="about-collage-grid">
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', height: '300px' }}>
              <img src="/solar_install_1.jpg" alt="SAINT GLOBAL SOLAR installation panels" style={{ width: '100%', height: '112%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            </div>
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', marginTop: '40px' }}>
              <img src="/solar_install_2.jpg" alt="SAINT GLOBAL SOLAR hybrid inverter backup battery" style={{ width: '100%', height: '340px', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>

          {/* Right Text Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }} className="about-text-col">
            
            <span style={{ 
              fontSize: '13px', 
              fontWeight: '800', 
              color: 'var(--gold)', 
              textTransform: 'uppercase', 
              letterSpacing: '2px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              ABOUT OUR COMPANY
            </span>
            
            <h2 style={{ fontSize: '36px', color: '#1e293b', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              Durable Solar Solutions Engineered For Life.
            </h2>
            
            <p style={{ fontSize: '15px', color: '#475569', lineHeight: '1.75', margin: 0 }}>
              We supply and install premium solar equipment including solar panels, lithium-ion batteries, control inverters, LED bulbs, solar rechargeable fans, and solar water pumps. Founded on the principle of long-term efficiency and structural durability, SAINT GLOBAL SOLAR also operates as a professional general contractor for complex electrical, energy, and structural setups.
            </p>

            {/* Guarantees List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {[
                { title: 'Grade-A Cells & BMS', desc: 'Top-grade monocrystalline solar cells & smart battery management system protection.' },
                { title: 'Certified Solar Engineers', desc: 'Expert wiring, load balancing, and mounting designed for maximum safety.' },
                { title: '7-Year Hardware Warranty', desc: 'Full manufacturer warranty backed by direct direct local replacement support.' }
              ].map((g, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--gold)', marginTop: '2px', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#1e293b', margin: '0 0 2px' }}>{g.title}</h4>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/about" style={{
              background: 'var(--gold)',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '14.5px',
              textDecoration: 'none',
              marginTop: '8px',
              transition: 'background-color 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--gold-d)'}
               onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--gold)'}>
              Our Clean Energy Story
            </Link>
          </div>

        </div>

        {/* Local styling overrides for features strip and about us sections responsiveness */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 1100px) {
            .features-grid-new {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 20px !important;
            }
            .features-item-new {
              border-right: none !important;
              padding-right: 0 !important;
            }
          }
          @media (max-width: 900px) {
            .about-wrapper-new {
              display: flex !important;
              flex-direction: column !important;
              gap: 32px !important;
            }
            .about-left-circle-col {
              order: 1 !important;
            }
            .about-text-col {
              order: 2 !important;
            }
            .about-right-circle-col {
              order: 3 !important;
            }
            .about-circle-container {
              width: 180px !important;
              height: 180px !important;
            }
          }
          @media (max-width: 640px) {
            .features-grid-new {
              grid-template-columns: 1fr !important;
            }
            .about-circle-container {
              width: 150px !important;
              height: 150px !important;
            }
          }
        `}} />
      </section>

      {/* ─── PREMIUM PRODUCTS CATALOG ─── */}
      <section style={{ padding: '80px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }} className="section-header-flex">
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              OUR SOLAR EQUIPMENT
            </span>
            <h2 style={{ fontSize: '34px', color: '#1e293b', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }} className="products-section-title">
              Durable Solar Panels & Lithium Storage
            </h2>
          </div>
          <Link to="/products" style={{
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
            View All Products <span>→</span>
          </Link>
        </div>

        {productsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }} className="products-grid">
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '140px', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ height: '16px', background: '#f1f5f9', width: '70%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: '12px', background: '#f1f5f9', width: '50%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
            <p style={{ margin: 0 }}>Products coming soon. Check back shortly!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }} className="products-grid">
            {featuredProducts.map(prod => {
              let displayPrice = prod.price
              let displayOldPrice = prod.old_price
              const hasVariants = prod.variations?.variants && prod.variations.variants.length > 0
              if (hasVariants) {
                const prices = prod.variations.variants.map(v => v.price).filter(Boolean)
                if (prices.length > 0) {
                  displayPrice = Math.min(...prices)
                  const cheapestVariant = prod.variations.variants.find(v => v.price === displayPrice)
                  displayOldPrice = cheapestVariant?.compare_price || null
                }
              }
              const discount = displayOldPrice && displayPrice
                ? Math.round((1 - displayPrice / displayOldPrice) * 100)
                : null

              return (
                <div key={prod.id} style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease'
                }} className="product-card-hover">

                  {/* Discount badge */}
                  {discount && (
                    <span style={{
                      position: 'absolute', top: '10px', left: '10px',
                      background: '#16a34a', color: '#fff',
                      fontSize: '10px', fontWeight: 800,
                      padding: '2px 8px', borderRadius: '4px', zIndex: 5
                    }}>{discount}% OFF</span>
                  )}

                  {/* Card Image */}
                  <Link to={`/product/${prod.slug || prod.id}`} style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: '#f8fafc' }}>
                    {prod.cover_image && prod.cover_image !== '/logo.png' && prod.cover_image !== '/logo_black.png' && (
                      <img
                        src={prod.cover_image}
                        alt={`${prod.title.replace(/\s+slug$/i, '')} - Premium luxury product from SAINT GLOBAL SOLAR`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        onError={e => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </Link>

                  {/* Card Content */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
                    <div>
                      <Link to={`/product/${prod.slug || prod.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 6px', lineHeight: '1.3' }}>
                          {prod.title.replace(/\s+slug$/i, '')}
                        </h3>
                      </Link>
                      <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                        {getShortDesc(prod)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f0d0a' }}>
                          {hasVariants ? 'From ' : ''}{formatPrice(displayPrice)}
                        </span>
                        {displayOldPrice && (
                          <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            {formatPrice(displayOldPrice)}
                          </span>
                        )}
                      </div>
                      <Link to={`/product/${prod.slug || prod.id}`} style={{
                        background: 'var(--brand-primary)',
                        color: '#ffffff',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'block',
                        transition: 'background-color 0.15s ease'
                      }} className="card-btn-hover">
                        Buy Now →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ─── STATS & CALL TO ACTION SECTION (Bright Clean Background) ─── */}
      <section style={{ background: 'var(--gold)', color: '#ffffff', padding: '80px 24px', width: '100%', maxWidth: '100%', borderTop: 'none', borderBottom: 'none' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '48px', alignItems: 'center' }} className="cta-wrapper">
          
          {/* Left Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="stats-grid-new">
            {[
              { 
                val: '100%', 
                label: 'Certified Durability', 
                desc: 'Every panel & battery cycles tested',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )
              },
              { 
                val: '1,200+', 
                label: 'Systems Commissioned', 
                desc: 'Reliable power setups across Nigeria',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )
              },
              { 
                val: '10 MW+', 
                label: 'Generated Capacity', 
                desc: 'Clean solar energy harvested daily',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                    <polyline points="2 17 12 22 22 17"/>
                  </svg>
                )
              },
              { 
                val: '24/7 SUPPORT', 
                label: 'Kano Care Hotlines', 
                desc: 'Always active support & scheduling',
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                )
              }
            ].map((stat, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: '16px',
                padding: '24px',
                background: '#ffffff',
                border: '1px solid #ffedd5',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(249,115,22,0.015)'
              }} className="stats-item-card">
                <div style={{ color: 'var(--gold)', display: 'flex', flexShrink: 0, background: '#fff7ed', padding: '10px', borderRadius: '8px' }}>
                  {stat.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px', lineHeight: '1.2' }}>{stat.val}</div>
                  <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>{stat.label}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{stat.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right CTA Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '36px',
            color: '#1e293b',
            boxShadow: '0 12px 32px rgba(249,115,22,0.06)',
            border: '1px solid #ffedd5',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }} className="cta-card-new">
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
                <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.335 4.978L2 22l5.197-1.361a9.94 9.94 0 0 0 4.814 1.238h.005c5.503 0 9.987-4.479 9.988-9.985a9.97 9.97 0 0 0-2.925-7.062 9.96 9.96 0 0 0-7.067-2.83zm5.73 14.103c-.236.662-1.362 1.217-1.888 1.286-.475.06-1.085.126-3.2-.75a10.963 10.963 0 0 1-4.72-4.14c-.604-.806-1.04-1.79-1.04-2.82 0-1.098.57-1.694.773-1.913.204-.219.538-.288.757-.288.22 0 .438.005.626.012.197.007.457-.075.713.543.264.636.903 2.195.98 2.35.078.156.13.338.026.547-.104.21-.157.339-.313.522-.157.18-.328.403-.47.54-.156.15-.32.313-.138.625.181.312.806 1.326 1.727 2.148.19.17.359.34.542.474.183.136.326.173.542.02.215-.152.926-.926 1.173-1.246.248-.32.496-.264.82-.143.326.12 2.068 1.026 2.427 1.206.36.18.6.269.69.421.09.15.09.87-.146 1.533z" />
              </svg>
              <strong style={{ fontSize: '20px', color: '#0f172a', fontWeight: 800 }}>Let's Work Together</strong>
            </div>
            
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
              Request a solar design blueprint or get price quotes. Chat with our certified showroom managers in Kano for expert advice.
            </p>

            <a href="https://wa.me/2349110019990?text=Hi%20SAINT%20GLOBAL%20SOLAR,%20I'd%20like%20to%20request%20a%20solar%20quote%20consultation..." target="_blank" rel="noopener noreferrer" style={{
              background: '#25D366',
              color: '#ffffff',
              padding: '14px 24px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '14.5px',
              textDecoration: 'none',
              textAlign: 'center',
              transition: 'background-color 0.2s',
              display: 'block'
            }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1fad56'}
               onMouseLeave={e => e.currentTarget.style.backgroundColor = '#25D366'}>
              Chat on WhatsApp <span>→</span>
            </a>
          </div>

        </div>
      </section>

      {/* ─── HOVER STYLES & INTERACTION ─── */}
      <style>{`
        .product-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(249,115,22,0.06) !important;
          border-color: var(--brand-primary) !important;
        }
        .product-card-hover:hover .card-btn-hover {
          background-color: var(--brand-hover) !important;
        }
        .features-item-card:hover, .stats-item-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(249,115,22,0.08) !important;
          border-color: var(--gold) !important;
        }
        .card-link-hover:hover {
          text-decoration: underline !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @media (max-width: 1200px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px !important;
          }
          .features-grid-new {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 16px !important;
          }
          .stats-grid-new {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
        }
        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            text-align: center;
          }
          .hero-title {
            font-size: 38px !important;
            line-height: 1.2 !important;
          }
          .hero-title span {
            font-size: 32px !important;
          }
          .products-section-title {
            font-size: 28px !important;
          }
          .hero-left-col {
            padding: 80px 24px 60px !important;
            align-items: center !important;
          }
          .hero-left-col p {
            margin: 0 auto !important;
          }
          .hero-actions {
            justify-content: center;
            flex-direction: column;
          }
          .hero-actions a {
            width: 100%;
            justify-content: center;
          }
          .hero-image-col {
            justify-content: center !important;
            padding: 0 24px 60px !important;
          }
          .hero-image-col img {
            max-width: 90% !important;
            margin: 0 auto !important;
          }
          .cta-wrapper {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .about-wrapper-new {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .about-collage-grid {
            margin-top: 20px;
          }
        }
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .features-grid-new {
            grid-template-columns: 1fr 1fr !important;
          }
          .stats-grid-new {
            grid-template-columns: 1fr 1fr !important;
          }
          .hero-title {
            font-size: 30px !important;
          }
          .hero-title span {
            font-size: 26px !important;
          }
          .products-section-title {
            font-size: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .features-grid-new {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .features-grid-new > *:last-child {
            grid-column: span 2;
          }
          .stats-grid-new {
            grid-template-columns: 1fr !important;
          }
          .cta-card-new {
            padding: 24px !important;
          }
          .hero-title {
            font-size: 26px !important;
          }
          .hero-title span {
            font-size: 22px !important;
          }
          .products-section-title {
            font-size: 21px !important;
          }
        }
      `}</style>

    </div>
  )
}
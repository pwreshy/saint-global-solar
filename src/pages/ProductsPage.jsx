import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CONFIG } from '../lib/config'
import { useCurrency } from '../context/CurrencyContext'

export function getShortDesc(product) {
  if (!product) return ''
  if (product.short_description) return product.short_description
  const desc = product.description || ''
  if (!desc) return ''
  if (desc.includes('<')) {
    const pMatch = desc.match(/<p[^>]*>(.*?)<\/p>/i)
    if (pMatch && pMatch[1]) {
      const stripped = pMatch[1].replace(/<[^>]*>/g, '').trim()
      if (stripped) return stripped
    }
    const plainText = desc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return plainText.length > 160 ? plainText.substring(0, 160) + '...' : plainText
  }
  const paragraphs = desc.split(/\n\s*\n/)
  if (paragraphs.length > 0 && paragraphs[0].trim()) {
    return paragraphs[0].trim()
  }
  return desc
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const [searchParams] = useSearchParams()
  const { categorySlug, subcategorySlug } = useParams()
  const [products, setProducts] = useState([])
  const [dbCategories, setDbCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlistedIds, setWishlistedIds] = useState([])
  const [reviewsMap, setReviewsMap] = useState({})
  
  // Comprehensive Filters States
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [stockOnly, setStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024

  useEffect(() => {
    async function loadProductsAndReviews() {
      try {
        const [resProducts, resReviews, resCategories] = await Promise.all([
          supabase.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false }),
          supabase.from('reviews').select('course_id, rating'),
          supabase.from('categories').select('*').order('name')
        ])

        if (resProducts.data) {
          setProducts(resProducts.data)
        }

        if (resCategories.data) {
          setDbCategories(resCategories.data)
        }

        if (resReviews.data) {
          const map = {}
          resReviews.data.forEach(r => {
            if (!map[r.course_id]) {
              map[r.course_id] = { totalRating: 0, count: 0 }
            }
            map[r.course_id].totalRating += r.rating
            map[r.course_id].count += 1
          })
          const finalMap = {}
          Object.keys(map).forEach(cid => {
            finalMap[cid] = {
              rating: map[cid].totalRating / map[cid].count,
              count: map[cid].count
            }
          })
          setReviewsMap(finalMap)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProductsAndReviews()
  }, [])

  useEffect(() => {
    async function loadWishlist() {
      if (!user) return
      try {
        const { data } = await supabase
          .from('wishlist')
          .select('product_id')
          .eq('user_id', user.id)
        if (data) setWishlistedIds(data.map(w => w.product_id))
      } catch (err) {
        console.error(err)
      }
    }
    loadWishlist()
  }, [user])

  useEffect(() => {
    if (subcategorySlug) {
      setCategoryFilter(subcategorySlug.toLowerCase())
    } else if (categorySlug) {
      setCategoryFilter(categorySlug.toLowerCase())
    } else {
      const cat = searchParams.get('category')
      if (cat) {
        setCategoryFilter(cat.toLowerCase())
      } else {
        setCategoryFilter('all')
      }
    }
    const search = searchParams.get('search')
    if (search) {
      setSearchQuery(search)
    } else {
      setSearchQuery('')
    }
  }, [categorySlug, subcategorySlug, searchParams])

  const toggleWishlist = async (e, productId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    const is = wishlistedIds.includes(productId)
    try {
      if (is) {
        await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId)
        setWishlistedIds(ids => ids.filter(id => id !== productId))
      } else {
        await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId })
        setWishlistedIds(ids => [...ids, productId])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Get dynamic categories lists from products
  const availableCategories = useMemo(() => {
    const cats = products.map(p => p.meta_title?.trim()).filter(Boolean)
    const unique = ['all', ...new Set(cats)]
    return unique
  }, [products])

  const filtered = useMemo(() => {
    let result = [...products]

    // 1. Digital products filter
    if (!CONFIG.ENABLE_DIGITAL_PRODUCTS) {
      result = result.filter(p => p.type === 'physical')
    }

    // 2. Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        (p.title || '').toLowerCase().includes(q) || 
        (p.description || '').toLowerCase().includes(q)
      )
    }

    // 3. Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => {
        // Resolve slug to category object
        const activeCat = dbCategories.find(c => c.slug.toLowerCase() === categoryFilter.toLowerCase())
        if (!activeCat) {
          // Fallback to legacy string matching
          const cat = (p.meta_title || '').toLowerCase()
          return cat === categoryFilter || cat.includes(categoryFilter)
        }
        
        // Find child subcategories
        const childIds = dbCategories.filter(c => c.parent_id === activeCat.id).map(c => c.id)
        const allowedIds = [activeCat.id, ...childIds]
        
        return allowedIds.includes(p.category_id)
      })
    }

    // 4. Price range filter
    if (priceRange.min !== '') {
      const min = parseFloat(priceRange.min)
      if (!isNaN(min)) {
        result = result.filter(p => {
          let price = p.price
          if (p.variations?.variants && p.variations.variants.length > 0) {
            const variantPrices = p.variations.variants.map(v => v.price).filter(Boolean)
            if (variantPrices.length > 0) price = Math.min(...variantPrices)
          }
          return price >= min
        })
      }
    }
    if (priceRange.max !== '') {
      const max = parseFloat(priceRange.max)
      if (!isNaN(max)) {
        result = result.filter(p => {
          let price = p.price
          if (p.variations?.variants && p.variations.variants.length > 0) {
            const variantPrices = p.variations.variants.map(v => v.price).filter(Boolean)
            if (variantPrices.length > 0) price = Math.min(...variantPrices)
          }
          return price <= max
        })
      }
    }

    // 5. Stock availability filter
    if (stockOnly) {
      result = result.filter(p => p.type !== 'physical' || p.stock_quantity === null || p.stock_quantity > 0)
    }

    // 6. Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => {
        let priceA = a.price
        let priceB = b.price
        if (a.variations?.variants && a.variations.variants.length > 0) {
          const prices = a.variations.variants.map(v => v.price).filter(Boolean)
          if (prices.length > 0) priceA = Math.min(...prices)
        }
        if (b.variations?.variants && b.variations.variants.length > 0) {
          const prices = b.variations.variants.map(v => v.price).filter(Boolean)
          if (prices.length > 0) priceB = Math.min(...prices)
        }
        return priceA - priceB
      })
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => {
        let priceA = a.price
        let priceB = b.price
        if (a.variations?.variants && a.variations.variants.length > 0) {
          const prices = a.variations.variants.map(v => v.price).filter(Boolean)
          if (prices.length > 0) priceA = Math.min(...prices)
        }
        if (b.variations?.variants && b.variations.variants.length > 0) {
          const prices = b.variations.variants.map(v => v.price).filter(Boolean)
          if (prices.length > 0) priceB = Math.min(...prices)
        }
        return priceB - priceA
      })
    }

    return result
  }, [products, searchQuery, categoryFilter, priceRange, stockOnly, sortBy])

  const StarRating = ({ rating = 4.8 }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i < Math.floor(rating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginLeft: 2 }}>{rating.toFixed(1)}</span>
    </span>
  )

  const FilterContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search Filter */}
      <div>
        <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: 0 }}>
          Search Catalog
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: '8px',
          padding: '0 10px',
          gap: '8px'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Type keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '8px 0',
              fontSize: '13px',
              outline: 'none',
              width: '100%',
              fontFamily: 'var(--font)'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: '#cbd5e1', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>×</button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: 0 }}>
          Collections
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* 1. All Collections Button */}
          {(() => {
            const isAllActive = categoryFilter === 'all';
            const allCount = products.filter(p => !CONFIG.ENABLE_DIGITAL_PRODUCTS ? p.type === 'physical' : true).length;
            return (
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  navigate('/products');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: isAllActive ? 'rgba(18,60,36,0.06)' : 'transparent',
                  color: isAllActive ? 'var(--brand-primary)' : '#475569',
                  fontSize: '13px',
                  fontWeight: isAllActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => { if (!isAllActive) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!isAllActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span>All Collections</span>
                <span style={{ fontSize: '11px', background: isAllActive ? 'var(--brand-primary)' : '#e2e8f0', color: isAllActive ? '#ffffff' : '#64748b', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                  {allCount}
                </span>
              </button>
            );
          })()}

          {/* 2. Hierarchical database categories (if populated) */}
          {dbCategories.length > 0 ? (
            dbCategories.filter(c => !c.parent_id).map(parent => {
              const subs = dbCategories.filter(sub => sub.parent_id === parent.id);
              const parentActive = categoryFilter === parent.slug.toLowerCase();
              
              // Count parent + all child subcategory products
              const parentChildIds = [parent.id, ...subs.map(s => s.id)];
              const parentCount = products.filter(p => parentChildIds.includes(p.category_id) && (!CONFIG.ENABLE_DIGITAL_PRODUCTS ? p.type === 'physical' : true)).length;

              return (
                <div key={parent.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {/* Parent Button */}
                  <button
                    onClick={() => {
                      setCategoryFilter(parent.slug.toLowerCase());
                      navigate(`/category/${parent.slug}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: parentActive ? 'rgba(18,60,36,0.06)' : 'transparent',
                      color: parentActive ? 'var(--brand-primary)' : '#475569',
                      fontSize: '13px',
                      fontWeight: parentActive ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { if (!parentActive) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (!parentActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>{parent.name}</span>
                    <span style={{ fontSize: '11px', background: parentActive ? 'var(--brand-primary)' : '#e2e8f0', color: parentActive ? '#ffffff' : '#64748b', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                      {parentCount}
                    </span>
                  </button>

                  {/* Subcategories list */}
                  {subs.map(sub => {
                    const subActive = categoryFilter === sub.slug.toLowerCase();
                    const subCount = products.filter(p => p.category_id === sub.id && (!CONFIG.ENABLE_DIGITAL_PRODUCTS ? p.type === 'physical' : true)).length;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setCategoryFilter(sub.slug.toLowerCase());
                          navigate(`/category/${parent.slug}/${sub.slug}`);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 12px 6px 24px',
                          border: 'none',
                          borderRadius: '6px',
                          background: subActive ? 'rgba(18,60,36,0.06)' : 'transparent',
                          color: subActive ? 'var(--brand-primary)' : '#64748b',
                          fontSize: '12.5px',
                          fontWeight: subActive ? 700 : 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { if (!subActive) e.currentTarget.style.background = '#f8fafc' }}
                        onMouseLeave={e => { if (!subActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span>— {sub.name}</span>
                        <span style={{ fontSize: '10px', background: subActive ? 'var(--brand-primary)' : '#f1f5f9', color: subActive ? '#ffffff' : '#64748b', padding: '1px 5px', borderRadius: '8px', fontWeight: 600 }}>
                          {subCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          ) : (
            /* 3. Fallback to legacy string metadata categories */
            availableCategories.filter(cat => cat !== 'all').map(cat => {
              const isActive = categoryFilter === cat.toLowerCase();
              const count = products.filter(p => (p.meta_title || '').toLowerCase() === cat.toLowerCase() && (!CONFIG.ENABLE_DIGITAL_PRODUCTS ? p.type === 'physical' : true)).length;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat.toLowerCase());
                    navigate(`/products?category=${cat.toLowerCase()}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: isActive ? 'rgba(18,60,36,0.06)' : 'transparent',
                    color: isActive ? 'var(--brand-primary)' : '#475569',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                  <span style={{ fontSize: '11px', background: isActive ? 'var(--brand-primary)' : '#e2e8f0', color: isActive ? '#ffffff' : '#64748b', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>
                    {count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', marginTop: 0 }}>
          Price Range
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0 8px',
            flex: 1
          }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '4px' }}>₦</span>
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={e => setPriceRange({ ...priceRange, min: e.target.value })}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '6px 0',
                fontSize: '13px',
                outline: 'none',
                width: '100%',
                fontFamily: 'var(--font)'
              }}
            />
          </div>
          <span style={{ color: '#94a3b8' }}>–</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: '8px',
            padding: '0 8px',
            flex: 1
          }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '4px' }}>₦</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={e => setPriceRange({ ...priceRange, max: e.target.value })}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '6px 0',
                fontSize: '13px',
                outline: 'none',
                width: '100%',
                fontFamily: 'var(--font)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Stock Availability Filter */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={stockOnly}
            onChange={e => setStockOnly(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155' }}>
            In Stock Only
          </span>
        </label>
      </div>

      {/* Reset Filter Button */}
      <button
        onClick={() => {
          setSearchQuery('');
          setCategoryFilter('all');
          setPriceRange({ min: '', max: '' });
          setStockOnly(false);
          setSortBy('newest');
          navigate('/products');
        }}
        style={{
          background: '#0f0d0a',
          color: '#ffffff',
          border: 'none',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
          textAlign: 'center',
          marginTop: '8px',
          fontFamily: 'var(--font)'
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#1c1813'}
        onMouseLeave={e => e.currentTarget.style.background = '#0f0d0a'}
      >
        Clear All Filters
      </button>

    </div>
  )

  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* ─── HERO HEADER (Redesigned matching Gallery Page style) ─── */}
      <section style={{ 
        position: 'relative',
        background: 'linear-gradient(rgba(11, 15, 25, 0.85), rgba(26, 32, 44, 0.85)), url("/nigeria_solar_hero.jpg") no-repeat center center / cover', 
        color: '#ffffff', 
        padding: '100px 24px', 
        textAlign: 'center' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Premium Solar Catalog
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Durable Solar Equipment & Accessories
          </h1>
          <p style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
            High-efficiency solar panels, lithium-ion storage batteries, control inverters, and accessories delivered across Nigeria.
          </p>
        </div>
      </section>

      {/* ─── FILTER BAR FOR SORT & MOBILE FILTER TRIGGER ─── */}
      <section style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', top: 0, zIndex: 90 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', gap: '12px' }}>
          {isMobile || isTablet ? (
            <button
              onClick={() => setShowMobileFilters(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              Filters
            </button>
          ) : (
            <span style={{ fontSize: '13.5px', color: '#64748b' }}>
              Showing <strong style={{ color: '#0f0d0a' }}>{filtered.length}</strong> product{filtered.length !== 1 ? 's' : ''}
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>Sort By:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '6px 24px 6px 12px',
                border: '1.5px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                background: '#ffffff',
                cursor: 'pointer',
                outline: 'none',
                WebkitAppearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px'
              }}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </section>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px', display: 'flex', gap: '32px' }}>
        
        {/* DESKTOP SIDEBAR FILTERS */}
        {!isMobile && !isTablet && (
          <aside style={{
            width: '240px',
            flexShrink: 0,
            position: 'sticky',
            top: '88px',
            height: 'calc(100vh - 120px)',
            overflowY: 'auto',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            paddingRight: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px'
          }} className="sidebar-scroll">
            <FilterContent />
          </aside>
        )}

        {/* PRODUCTS MAIN CONTENT AREA */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: '20px' }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#f1f5f9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: '18px', background: '#f1f5f9', width: '70%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: '12px', background: '#f1f5f9', width: '50%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: '#64748b' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <h3 style={{ fontSize: '18px', color: '#0f0d0a', fontWeight: 800, margin: '0 0 6px' }}>No products found</h3>
              <p style={{ margin: 0, fontSize: '13.5px' }}>Try clearing your filters or check back later!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)', gap: '20px' }} className="products-grid">
              {filtered.map(product => {
                const isWishlisted = wishlistedIds.includes(product.id)
                const ratingInfo = reviewsMap[product.id] || null
                
                // Handle starting price display for variable products
                let displayPrice = product.price
                let displayOldPrice = product.old_price
                const hasVariants = product.variations?.variants && product.variations.variants.length > 0
                if (hasVariants) {
                  const prices = product.variations.variants.map(v => v.price).filter(Boolean)
                  if (prices.length > 0) {
                    displayPrice = Math.min(...prices)
                    const cheapestVariant = product.variations.variants.find(v => v.price === displayPrice)
                    displayOldPrice = cheapestVariant?.compare_price || null
                  }
                }

                return (
                  <div key={product.id} className="product-card-hover" style={{ 
                    position: 'relative',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {/* Wishlist Button */}
                    <button 
                      onClick={(e) => toggleWishlist(e, product.id)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 10,
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: isWishlisted ? '#ef4444' : '#94a3b8',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>

                    {/* Card Image */}
                    <Link to={`/product/${product.slug || product.id}`} style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: '#f8fafc' }}>
                      {product.cover_image && product.cover_image !== '/logo.png' && product.cover_image !== '/logo_black.png' && (
                        <img 
                          src={product.cover_image} 
                          alt={`${product.title.replace(/\s+slug$/i, '')} - Premium product from SAINT GLOBAL SOLAR`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                    </Link>

                    {/* Card Content details */}
                    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
                      <div>
                        <Link to={`/product/${product.slug || product.id}`} style={{ textDecoration: 'none' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 6px', lineHeight: '1.3' }}>
                            {product.title.replace(/\s+slug$/i, '')}
                          </h3>
                        </Link>
                        
                        {/* Review rating — only if real reviews exist */}
                        {ratingInfo && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                            <StarRating rating={ratingInfo.rating} />
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>({ratingInfo.count})</span>
                          </div>
                        )}

                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                          {product.short_description
                            ? product.short_description.substring(0, 100)
                            : getShortDesc(product).substring(0, 100)}
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

                        <Link to={`/product/${product.slug || product.id}`} style={{
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
                          Buy Now <span>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* MOBILE FILTERS SIDE DRAWER */}
      {(isMobile || isTablet) && showMobileFilters && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'flex-end'
        }} onClick={() => setShowMobileFilters(false)}>
          <div style={{
            width: '100%',
            maxWidth: '320px',
            height: '100%',
            background: '#ffffff',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            gap: '24px',
            overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f0d0a', margin: 0 }}>Filter Products</h3>
              <button 
                onClick={() => setShowMobileFilters(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', color: '#64748b' }}
              >
                ×
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}

      {/* ─── BOTTOM CTA SECTION ─── */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }} className="bottom-banner-flex">
          <div>
            <h3 style={{ fontSize: '18px', color: '#0f0d0a', fontWeight: 800, margin: '0 0 6px' }}>Already a customer?</h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>Track your orders and manage shipping options in your account area.</p>
          </div>
          <Link to="/dashboard" style={{
            background: 'transparent',
            color: 'var(--brand-primary)',
            border: '1.5px solid var(--brand-primary)',
            padding: '11px 22px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '13px',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(18,60,36,0.04)'}
             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Go to My Account <span>→</span>
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .product-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(18,60,36,0.06), 0 4px 8px rgba(18,60,36,0.02) !important;
          border-color: var(--brand-primary) !important;
        }
        .product-card-hover:hover .card-btn-hover {
          background-color: var(--brand-hover) !important;
        }
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        @media (max-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          section[style*="padding: 80px"] {
            padding: 48px 24px !important;
          }
          h1 {
            font-size: 30px !important;
          }
        }
        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .bottom-banner-flex {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

    </div>
  )
}

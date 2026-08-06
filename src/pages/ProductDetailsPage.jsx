import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CONFIG } from '../lib/config'
import { useCurrency } from '../context/CurrencyContext'

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wishlistAdded, setWishlistAdded] = useState(false)
  const [reviewsAvg, setReviewsAvg] = useState(0)
  const [reviewsCount, setReviewsCount] = useState(0)
  const [reviews, setReviews] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [activeImage, setActiveImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [addedToCartToast, setAddedToCartToast] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    async function load() {
      if (!productId) return

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
      let query = supabase.from('products').select('*, categories(name)')
      if (isUUID) {
        query = query.eq('id', productId)
      } else {
        query = query.eq('slug', productId)
      }
      const { data: prod, error } = await query.maybeSingle()

      if (error || !prod) {
        navigate('/products')
        return
      }

      setProduct(prod)
      const validCover = (prod.cover_image && prod.cover_image !== '/logo.png' && prod.cover_image !== '/logo_black.png') ? prod.cover_image : null
      const firstUploaded = prod.images && Array.isArray(prod.images) ? prod.images.find(img => img && img !== '/logo.png' && img !== '/logo_black.png') : null
      setActiveImage(validCover || firstUploaded || null)

      // SEO Dynamic title and description injection
      document.title = `${prod.title.replace(/\s+slug$/i, '')} — Buy Online | SAINT GLOBAL SOLAR Store`
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) {
        metaDesc.setAttribute('content', prod.description || `Buy ${prod.title} at SAINT GLOBAL SOLAR. Premium handcrafted footwear.`)
      }
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) ogTitle.setAttribute('content', `${prod.title.replace(/\s+slug$/i, '')} — Buy Online | SAINT GLOBAL SOLAR Store`)
      const ogDesc = document.querySelector('meta[property="og:description"]')
      if (ogDesc) ogDesc.setAttribute('content', prod.description || `Buy ${prod.title} at SAINT GLOBAL SOLAR.`)

      // Pre-select first options of variations if available
      if (prod.variations?.attributes && prod.variations.attributes.length > 0) {
        const initial = {}
        prod.variations.attributes.forEach(attr => {
          if (attr.options && attr.options.length > 0) {
            initial[attr.name] = attr.options[0]
          }
        })
        setSelectedAttributes(initial)
      }

      // Fetch reviews, wishlist and related products concurrently
      const promises = [
        supabase
          .from('reviews')
          .select('id, rating, review_text, created_at, profiles(full_name, avatar_url)')
          .eq('course_id', prod.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false }),
        user ? supabase.from('wishlist').select('id').eq('user_id', user.id).eq('product_id', prod.id).maybeSingle() : Promise.resolve({ data: null }),
        supabase
          .from('products')
          .select('*')
          .eq('is_published', true)
          .neq('id', prod.id)
          .limit(5)
      ]

      const [revsRes, wlRes, relatedRes] = await Promise.all(promises)
      
      const revs = revsRes.data || []
      setReviews(revs)
      if (revs.length > 0) {
        const sum = revs.reduce((acc, r) => acc + r.rating, 0)
        setReviewsAvg(sum / revs.length)
        setReviewsCount(revs.length)
      } else {
        setReviewsAvg(0)
        setReviewsCount(0)
      }

      setWishlistAdded(!!wlRes.data)
      if (relatedRes.data) {
        setRelatedProducts(relatedRes.data)
      }
      setLoading(false)
    }

    load()
  }, [productId, user, navigate])

  // Synchronize variant selection
  useEffect(() => {
    if (!product?.variations?.variants) return
    const variants = product.variations.variants
    
    // Find variant matching selected attributes
    const match = variants.find(variant => {
      return Object.entries(selectedAttributes).every(([attrName, value]) => {
        return variant.attributes && variant.attributes[attrName] === value
      })
    })

    if (match) {
      setSelectedVariant(match)
      if (match.image) {
        setActiveImage(match.image)
      }
    } else {
      setSelectedVariant(null)
    }
  }, [selectedAttributes, product])

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      if (wishlistAdded) {
        await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', product.id)
        setWishlistAdded(false)
      } else {
        await supabase.from('wishlist').insert({ user_id: user.id, product_id: product.id })
        setWishlistAdded(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    try {
      const cartKey = 'ecom_cart'
      let cart = JSON.parse(localStorage.getItem(cartKey)) || []
      
      const finalPrice = selectedVariant ? selectedVariant.price : product.price
      const finalOldPrice = selectedVariant ? selectedVariant.compare_price : product.old_price
      const finalImage = selectedVariant?.image || product.cover_image
      
      const titleExtension = selectedVariant
        ? ` (${Object.values(selectedVariant.attributes).join(', ')})`
        : ''

      // Remove item if same ID and variant ID exists to prevent duplicating
      cart = cart.filter(item => !(item.id === product.id && item.variant_id === (selectedVariant?.id || null)))

      cart.push({
        id: product.id,
        variant_id: selectedVariant?.id || null,
        title: `${product.title.replace(/\s+slug$/i, '')}${titleExtension}`,
        price: finalPrice,
        old_price: finalOldPrice,
        cover_image: finalImage,
        type: product.type,
        slug: product.slug,
        quantity: quantity,
        delivery_fee: product.delivery_fee || 0,
        free_delivery: product.free_delivery || false
      })

      localStorage.setItem(cartKey, JSON.stringify(cart))
      window.dispatchEvent(new Event('cart_updated'))
      window.dispatchEvent(new Event('open_cart_drawer'))
      
      setAddedToCartToast(true)
      setTimeout(() => setAddedToCartToast(false), 3000)
    } catch (err) {
      console.error('[ProductDetailsPage] Error adding to cart:', err)
    }
  }

  const handleBuyNow = () => {
    handleAddToCart()
    const variantQuery = selectedVariant ? `&variant=${selectedVariant.id}` : ''
    navigate(`/checkout?product=${product.id}${variantQuery}`)
  }

  const renderStars = (rating) => {
    const starsAvg = rating || 4.8
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[...Array(5)].map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.floor(starsAvg) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', fontFamily: "var(--font)", zIndex: 9999 }}>
        <img src="/logo_black.png" alt="SAINT GLOBAL SOLAR" style={{ height: 100, width: 'auto', marginBottom: 24 }} />
        <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', marginTop: 16, fontSize: '14px' }}>Loading product details...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!product) return null

  // Images list (Cover image + optional uploader images list)
  // Deduplicate: avoid showing cover_image twice if it also appears in product.images
  const rawImages = [
    product.cover_image,
    ...(Array.isArray(product.images) ? product.images : [])
  ].filter(img => img && img !== '/logo.png' && img !== '/logo_black.png')
  const imagesList = rawImages.filter((img, idx) => rawImages.indexOf(img) === idx)

  const finalPrice = selectedVariant ? selectedVariant.price : product.price
  const finalComparePrice = selectedVariant ? selectedVariant.compare_price : product.old_price
  const hasAttributes = product?.variations?.attributes && product.variations.attributes.length > 0
  const isUnavailable = hasAttributes && !selectedVariant
  const isOutOfStock = selectedVariant
    ? (selectedVariant.stock !== null && selectedVariant.stock !== undefined && selectedVariant.stock !== '' && Number(selectedVariant.stock) <= 0)
    : (product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity !== '' && Number(product.stock_quantity) <= 0)

  const discountPercent = finalComparePrice && finalPrice
    ? Math.round((1 - finalPrice / finalComparePrice) * 100)
    : null

  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b', padding: '40px 24px' }}>
      
      {/* ─── BREADCRUMBS ─── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 24px', fontSize: '13px', display: 'flex', gap: '8px', color: '#64748b', fontWeight: 500 }} className="breadcrumbs">
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: '#64748b', textDecoration: 'none' }}>Products</Link>
        <span>/</span>
        <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{product.title.replace(/\s+slug$/i, '')}</span>
      </div>

      {/* ─── TWO COLUMN E-COMMERCE GRID ─── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }} className="product-details-grid">
        
        {/* Left Column: Media Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* WooCommerce Square aspect-ratio container */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            {activeImage && (
              <img 
                src={activeImage} 
                alt={`${product.title.replace(/\s+slug$/i, '')} - Premium product`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
            )}
          </div>

          {/* Thumbnails Row */}
          {imagesList.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {imagesList.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: activeImage === img ? '2px solid var(--brand-primary)' : '1px solid #cbd5e1',
                    background: '#f8fafc',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img src={img} alt={`${product.title.replace(/\s+slug$/i, '')} product image thumbnail`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Order Details Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 8px', fontFamily: 'var(--font-heading)', lineHeight: '1.2' }}>
              {product.title.replace(/\s+slug$/i, '')}
            </h1>
            
            {/* Reviews Summary - Hidden if reviews count is 0 */}
            {reviewsCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                {renderStars(reviewsAvg)}
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{reviewsAvg.toFixed(1)} ({reviewsCount} customer reviews)</span>
              </div>
            )}
          </div>

          {/* Pricing Panel */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: '#0d2e1a' }}>
              {isUnavailable ? 'Unavailable' : formatPrice(finalPrice)}
            </span>
            {finalComparePrice && (
              <span style={{ fontSize: '17px', color: '#94a3b8', textDecoration: 'line-through' }}>
                {formatPrice(finalComparePrice)}
              </span>
            )}
            {discountPercent && (
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a', background: 'rgba(22,163,74,0.1)', padding: '4px 10px', borderRadius: '4px', marginLeft: '6px' }}>
                {discountPercent}% OFF
              </span>
            )}
          </div>

          <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
            {product.short_description
              ? product.short_description
              : product.description
                ? product.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 180) + '...'
                : ''}
          </p>

          {/* ─── ATTRIBUTES SELECTORS (WooCommerce-Style) ─── */}
          {product.variations?.attributes && product.variations.attributes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              {product.variations.attributes.map(attr => (
                <div key={attr.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
                    Select {attr.name}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {attr.options?.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSelectedAttributes({ ...selectedAttributes, [attr.name]: opt })}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: selectedAttributes[attr.name] === opt ? '2px solid var(--brand-primary)' : '1px solid #cbd5e1',
                          background: selectedAttributes[attr.name] === opt ? 'rgba(18,60,36,0.04)' : '#ffffff',
                          color: selectedAttributes[attr.name] === opt ? 'var(--brand-primary)' : '#1f2937',
                          transition: 'all 0.1s ease',
                          boxShadow: selectedAttributes[attr.name] === opt ? '0 2px 4px rgba(18,60,36,0.06)' : 'none'
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── QUANTITY AND BUY CONTROLS ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', height: '40px', overflow: 'hidden' }}>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '36px', height: '100%', border: 'none', background: '#f8fafc', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: '#64748b' }}>-</button>
                  <span style={{ width: '44px', textAlign: 'center', fontSize: '14px', fontWeight: 700 }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} style={{ width: '36px', height: '100%', border: 'none', background: '#f8fafc', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: '#64748b' }}>+</button>
                </div>
              </div>

              {/* Add to Wishlist Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Wishlist</span>
                <button
                  onClick={toggleWishlist}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: wishlistAdded ? '#ef4444' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = wishlistAdded ? '#ef4444' : 'var(--brand-primary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlistAdded ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {wishlistAdded ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isUnavailable}
                style={{
                  background: 'transparent',
                  color: (isOutOfStock || isUnavailable) ? '#cbd5e1' : 'var(--brand-primary)',
                  border: (isOutOfStock || isUnavailable) ? '2px solid #e2e8f0' : '2px solid var(--brand-primary)',
                  height: '46px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: (isOutOfStock || isUnavailable) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { if(!isOutOfStock && !isUnavailable) e.currentTarget.style.background = 'rgba(18,60,36,0.04)' }}
                onMouseLeave={e => { if(!isOutOfStock && !isUnavailable) e.currentTarget.style.background = 'transparent' }}
              >
                {isUnavailable ? 'Unavailable' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock || isUnavailable}
                style={{
                  background: (isOutOfStock || isUnavailable) ? '#f1f5f9' : 'var(--brand-primary)',
                  color: (isOutOfStock || isUnavailable) ? '#94a3b8' : '#ffffff',
                  border: 'none',
                  height: '46px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: (isOutOfStock || isUnavailable) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { if(!isOutOfStock && !isUnavailable) e.currentTarget.style.background = 'var(--brand-hover)' }}
                onMouseLeave={e => { if(!isOutOfStock && !isUnavailable) e.currentTarget.style.background = 'var(--brand-primary)' }}
              >
                {isUnavailable ? 'Unavailable' : isOutOfStock ? 'Out of Stock' : 'Buy Now →'}
              </button>
            </div>
          </div>

          {/* Product Meta Data list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <span><strong>Weight (kg):</strong> {selectedVariant?.weight || product.weight || 'N/A'}</span>
            <span><strong>Category:</strong> {product.categories?.name || product.meta_title || 'Uncategorized'}</span>
            <span><strong>SKU:</strong> SGS-{product.id.substring(0, 8).toUpperCase()}</span>
          </div>

        </div>

      </div>

      {/* Added to Cart Success Notification */}
      {addedToCartToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#0d2e1a',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 700,
          animation: 'slideUp 0.3s ease'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          Product successfully added to your cart!
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* ─── BELOW THE FOLD Stacked Sections (Replacing Tabs) ─── */}
      
      {/* ─── DESCRIPTION SECTION ─── */}
      {product.description && product.description !== 'No description provided.' && (
        <section style={{ maxWidth: '1200px', margin: '48px auto 0', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
            Product Description
          </h2>
          <div 
            style={{ lineHeight: '1.7', fontSize: '14.5px', color: '#475569' }} 
            dangerouslySetInnerHTML={{ __html: product.description }} 
          />
        </section>
      )}

      {/* ─── SPECIFICATIONS SECTION ─── */}
      <section style={{ maxWidth: '1200px', margin: '48px auto 0', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
          Specifications & Additional Information
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: '600px', fontSize: '14px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px 0', fontWeight: 700, color: '#0d2e1a', width: '160px' }}>Weight</td>
              <td style={{ padding: '12px 0', color: '#475569' }}>{selectedVariant?.weight || product.weight || 'N/A'} kg</td>
            </tr>
            {(product.packaging) && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 0', fontWeight: 700, color: '#0d2e1a' }}>Packaging</td>
                <td style={{ padding: '12px 0', color: '#475569' }}>{product.packaging}</td>
              </tr>
            )}
            {(product.origin) && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 0', fontWeight: 700, color: '#0d2e1a' }}>Origin</td>
                <td style={{ padding: '12px 0', color: '#475569' }}>{product.origin}</td>
              </tr>
            )}
            {(product.meta_title) && (
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 0', fontWeight: 700, color: '#0d2e1a' }}>Category</td>
                <td style={{ padding: '12px 0', color: '#475569' }}>{product.meta_title}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ─── REVIEWS SECTION (Hidden if reviews count is 0) ─── */}
      {reviews.length > 0 && (
        <section style={{ maxWidth: '1200px', margin: '48px auto 0', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0d2e1a', marginBottom: '24px', fontFamily: 'var(--font-heading)' }}>
            Customer Reviews ({reviewsCount})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map((rev) => (
              <div key={rev.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(36, 106, 66, 0.08)',
                      color: 'var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      {(rev.profiles?.full_name || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {rev.profiles?.full_name || 'Verified Buyer'}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(rev.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    </div>
                  </div>
                  {renderStars(rev.rating)}
                </div>
                <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: '1.6' }}>
                  {rev.review_text || 'No comment text submitted.'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── RELATED PRODUCTS SECTION ─── */}
      {relatedProducts.length > 0 && (
        <section style={{ maxWidth: '1200px', margin: '64px auto 0', borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0d2e1a', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Related Products
            </h2>
            <Link to="/products" style={{ color: 'var(--brand-primary)', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All Products
              <span style={{ fontSize: '11px' }}>→</span>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }} className="related-products-grid">
            {relatedProducts.map(prod => {
              // Resolve related product price & discount
              let displayPrice = prod.price
              let displayOldPrice = prod.old_price
              const hasVariants = prod.variations?.variants && prod.variations.variants.length > 0
              if (hasVariants) {
                const prices = prod.variations.variants.map(v => v.price).filter(p => p !== undefined && p !== null)
                if (prices.length > 0) {
                  displayPrice = Math.min(...prices)
                  const cheapestVariant = prod.variations.variants.find(v => v.price === displayPrice)
                  displayOldPrice = cheapestVariant?.compare_price || null
                }
              }

              const discount = displayOldPrice && displayPrice
                ? Math.round((1 - displayPrice / displayOldPrice) * 100)
                : null

              const shortDesc = prod.short_description
                || (prod.description ? prod.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 80) + '...' : '')

              return (
                <div 
                  key={prod.id} 
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                  className="product-card-hover"
                >
                  {/* Discount Badge */}
                  {discount && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: '#16a34a',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      zIndex: 5
                    }}>
                      {discount}% OFF
                    </span>
                  )}

                  {/* Product Image — fixed height, object-fit: cover */}
                  <Link to={`/product/${prod.slug || prod.id}`} style={{ display: 'block', height: '160px', overflow: 'hidden', background: '#f8fafc' }}>
                    {prod.cover_image && prod.cover_image !== '/logo.png' && prod.cover_image !== '/logo_black.png' && (
                      <img 
                        src={prod.cover_image} 
                        alt={`${prod.title.replace(/\s+slug$/i, '')} related product`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        onError={e => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </Link>

                  {/* Card details */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
                    <div>
                      <Link to={`/product/${prod.slug || prod.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 6px', lineHeight: '1.3' }}>
                          {prod.title.replace(/\s+slug$/i, '')}
                        </h3>
                      </Link>
                      <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                        {shortDesc}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#0d2e1a' }}>
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
        </section>
      )}

      {/* Media query overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 1024px) {
          .product-details-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .related-products-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .related-products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        .product-card-hover:hover {
          transform: translateY(-4px);
          border-color: var(--brand-primary) !important;
          box-shadow: 0 12px 24px rgba(18,60,36,0.06), 0 4px 8px rgba(18,60,36,0.02) !important;
        }
        .product-card-hover:hover .card-btn-hover {
          background-color: var(--brand-hover) !important;
        }
      `}} />

    </div>
  )
}

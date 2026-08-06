import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserMenu from './UserMenu'
import { supabase } from '../lib/supabase'
import { CONFIG } from '../lib/config'
import { useCurrency } from '../context/CurrencyContext'

export default function Header() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const dropdownRef = useRef(null)

  const [cartItems, setCartItems] = useState([])
  const [showCartDrawer, setShowCartDrawer] = useState(false)
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false)
  const currencyMenuRef = useRef(null)
  const { currency, isEnabled: isCurrencyEnabled, setCurrency, formatPrice } = useCurrency()

  // Initialize and synchronize cart items from localStorage
  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem('ecom_cart')) || []
      setCartItems(items)
    } catch (e) {}

    const syncCart = () => {
      try {
        const items = JSON.parse(localStorage.getItem('ecom_cart')) || []
        setCartItems(items)
      } catch (e) {}
    }

    const openDrawer = () => {
      syncCart()
      setShowCartDrawer(true)
    }

    window.addEventListener('cart_updated', syncCart)
    window.addEventListener('storage', syncCart)
    window.addEventListener('open_cart_drawer', openDrawer)
    return () => {
      window.removeEventListener('cart_updated', syncCart)
      window.removeEventListener('storage', syncCart)
      window.removeEventListener('open_cart_drawer', openDrawer)
    }
  }, [])

  // Handle click outside to close currency dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRemoveFromCart = (itemId, variantId = undefined) => {
    const updated = cartItems.filter(item => !(item.id === itemId && item.variant_id === (variantId ?? item.variant_id)))
    localStorage.setItem('ecom_cart', JSON.stringify(updated))
    setCartItems(updated)
    window.dispatchEvent(new Event('cart_updated'))
  }

  const handleUpdateQty = (itemId, variantId, delta) => {
    const updated = cartItems.map(item => {
      if (item.id === itemId && item.variant_id === variantId) {
        const newQty = Math.max(1, (item.quantity || 1) + delta)
        return { ...item, quantity: newQty }
      }
      return item
    })
    localStorage.setItem('ecom_cart', JSON.stringify(updated))
    setCartItems(updated)
    window.dispatchEvent(new Event('cart_updated'))
  }

  const cartSubtotal = cartItems.reduce((acc, item) => acc + ((parseInt(item.price) || 0) * (item.quantity || 1)), 0)

  // Sum delivery fees — use live product data as source of truth so old cart items also show correct shipping
  const cartShipping = cartItems.reduce((acc, item) => {
    // Look up live product data first, fall back to what's on the cart item
    const liveProduct = products.find(p => p.id === item.id)
    const isFreeDelivery = liveProduct ? (liveProduct.free_delivery || false) : (item.free_delivery || false)
    if (isFreeDelivery) return acc
    const fee = liveProduct
      ? (parseFloat(liveProduct.delivery_fee) || 0)
      : (parseFloat(item.delivery_fee) || 0)
    const chargePerItem = liveProduct ? (liveProduct.shipping_charge_per_item || false) : false
    const qty = chargePerItem ? (item.quantity || 1) : 1
    return acc + fee * qty
  }, 0)

  const handleProceedToCheckout = () => {
    setShowCartDrawer(false)
    if (cartItems.length > 0) {
      navigate(`/checkout?product=${cartItems[0].id}`)
    } else {
      navigate('/checkout')
    }
  }

  // Fetch all published products on mount for autocomplete search
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, slug, price, cover_image, type, delivery_fee, free_delivery, shipping_charge_per_item')
          .eq('is_published', true)
        if (!error && data) {
          setProducts(data)
        }
      } catch (err) {
        console.error('Error prefetching products:', err)
      }
    }
    fetchProducts()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close cart drawer on page navigation
  useEffect(() => {
    setShowCartDrawer(false)
  }, [location])

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([])
      return
    }
    const query = searchQuery.toLowerCase()
    const matches = products.filter(p => {
      const matchesQuery = p.title.toLowerCase().includes(query) || 
                           (p.type && p.type.toLowerCase().includes(query))
      const isDigital = ['course', 'ebook', 'blueprint', 'bundle'].includes(p.type)
      if (!CONFIG.ENABLE_DIGITAL_PRODUCTS && isDigital) return false
      return matchesQuery
    })
    setFilteredProducts(matches)
  }, [searchQuery, products])

  // Pages where the global public header should NOT be displayed
  const hideHeaderOn = [
    '/ebook',
    '/course',
    '/checkout',
    '/setup-account',
    '/dashboard',
    '/account', // Fix: Hide on account to prevent double header
    '/login',
    '/forgot-password',
    '/reset-password'
  ]

  const shouldHide = hideHeaderOn.some(path => location.pathname === path) || location.pathname.startsWith('/course/')

  if (shouldHide) return null

  return (
    <>
      <header className="global-header">
        <Link to={location.pathname.startsWith('/admin') ? '/admin' : '/'} className="brand-link header-logo-container" style={{ textDecoration: 'none' }}>
          <div style={{ transition: 'transform 0.3s ease-in-out', display: 'flex', alignItems: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <img className="header-logo-img" src="/logo_black.png" alt={localStorage.getItem('brandName') || 'SAINT GLOBAL SOLAR'} />
          </div>
        </Link>
        <div className="header-logo-spacer" />

        <div className="header-search-wrapper" ref={dropdownRef} style={{ position: 'relative', flex: 1, maxWidth: '440px' }}>
          <div className="header-search-container" style={{ margin: 0, width: '100%', maxWidth: 'none' }}>
            <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder={CONFIG.ENABLE_DIGITAL_PRODUCTS ? "Search for courses or resources..." : "Search for premium products..."} 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
                  setShowDropdown(false)
                }
              }}
              className="header-search-input"
            />
          </div>

          {/* Autocomplete Dropdown Panel */}
          {showDropdown && searchQuery.trim() && (
            <div className="search-dropdown-panel">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="search-dropdown-item"
                    onClick={() => {
                      if (product.type === 'ebook') {
                        navigate('/ebook')
                      } else {
                        navigate(`/product/${product.slug || product.id}`)
                      }
                      setSearchQuery('')
                      setShowDropdown(false)
                    }}
                  >
                    <img 
                      src={product.cover_image} 
                      alt={product.title} 
                      className="search-item-thumb" 
                      onError={e => { e.currentTarget.src = '/logo_black.png' }}
                    />
                    <div className="search-item-info">
                      <div className="search-item-title">{product.title}</div>
                      <div className="search-item-meta">
                        <span className="search-item-badge">
                          {product.type === 'course' ? 'Course' : product.type === 'ebook' ? 'E-Book' : 'Physical'}
                        </span>
                        <span className="search-item-price">
                          {product.price ? formatPrice(product.price) : 'Free'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-dropdown-empty">
                  No products found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="desktop-nav">
          {[
            { label: 'Home', path: '/' },
            { label: 'About Us', path: '/about' },
            { label: 'Products', path: '/products' },
            { label: 'Quality', path: '/quality' },
            { label: 'Contact', path: '/contact' }
          ].map(item => (
            <Link
              key={item.label}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link 
            to="/contact?quote=true" 
            className="header-quote-btn"
            style={{
              background: 'var(--brand-primary)',
              color: '#fff',
              padding: '9px 18px',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
              whiteSpace: 'nowrap',
              marginRight: '8px'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}
          >
            Get a Quote <span style={{ fontSize: '14px', fontWeight: 'bold' }}>→</span>
          </Link>

          {/* Custom Currency Selector Dropdown */}
          {isCurrencyEnabled && (
            <div ref={currencyMenuRef} style={{ position: 'relative', marginRight: '6px', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '20px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--brand-primary, #0f0d0a)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--brand-primary, #0f0d0a)'
                  e.currentTarget.style.background = '#fcfdfd'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.background = '#ffffff'
                }}
              >
                <span>{currency}</span>
                <span style={{ fontSize: '8px', color: '#64748b', transform: showCurrencyDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
              </button>
 
              {showCurrencyDropdown && (
                <div
                  className="currency-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    padding: '4px',
                    zIndex: 9999,
                    minWidth: '95px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    animation: 'fadeInUp 0.15s ease-out'
                  }}
                >
                  {[
                    { code: 'NGN', symbol: '₦' },
                    { code: 'USD', symbol: '$' },
                    { code: 'EUR', symbol: '€' },
                    { code: 'GBP', symbol: '£' }
                  ].map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => {
                        setCurrency(opt.code)
                        setShowCurrencyDropdown(false)
                      }}
                      style={{
                        background: currency === opt.code ? 'rgba(15, 13, 10, 0.06)' : 'none',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: currency === opt.code ? 800 : 600,
                        color: currency === opt.code ? 'var(--brand-primary, #0f0d0a)' : '#334155',
                        textAlign: 'left',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.1s ease',
                        outline: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => {
                        if (currency !== opt.code) {
                          e.currentTarget.style.background = '#f1f5f9'
                        }
                      }}
                      onMouseLeave={e => {
                        if (currency !== opt.code) {
                          e.currentTarget.style.background = 'none'
                        }
                      }}
                    >
                      <span>{opt.code}</span>
                      <span style={{ opacity: 0.6, fontSize: '10px' }}>{opt.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cart Toggle Button */}
          <button 
            onClick={() => setShowCartDrawer(true)} 
            className="cart-toggle-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#1e293b',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              transition: 'color 0.2s',
              marginRight: '8px'
            }}
            title="View Cart"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartItems.length > 0 && (
              <span className="cart-badge" style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                minWidth: '17px',
                height: '17px',
                fontSize: '10px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(239,68,68,0.3)'
              }}>
                {cartItems.length}
              </span>
            )}
          </button>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link to="/login" className="btn-login">
              Sign In
            </Link>
          )}
          
          <button className="mobile-menu-btn" onClick={() => {
            const nav = document.getElementById('mobile-nav')
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex'
          }}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu — Solid White with Alternating Items */}
        <div id="mobile-nav" style={{ display: 'none', flexDirection: 'column', background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '8px 0 16px', position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}>
        {/* Nav Links */}
         {[
          { label: 'Home', path: '/', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { label: 'About Us', path: '/about', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> },
          { label: 'Products', path: '/products', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
          { label: 'Quality', path: '/quality', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
          { label: 'Contact', path: '/contact', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
        ].map((item, idx) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.label}
              to={item.path}
              style={{
                color: isActive ? 'var(--brand-primary)' : '#374151',
                textDecoration: 'none',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13.5px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                background: isActive ? 'rgba(18,60,36,0.06)' : '#ffffff',
                borderLeft: isActive ? '3px solid var(--brand-primary)' : '3px solid transparent',
                borderBottom: '1px solid rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease',
                letterSpacing: '0.01em'
              }}
              onClick={() => document.getElementById('mobile-nav').style.display = 'none'}
            >
              <span style={{ color: isActive ? 'var(--brand-primary)' : '#9ca3af', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
      </header>

      {/* Sleek Slide-Out Cart Drawer */}
      <div className={`cart-drawer-overlay ${showCartDrawer ? 'active' : ''}`} onClick={() => setShowCartDrawer(false)}>
        <div className={`cart-drawer ${showCartDrawer ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="cart-drawer-header">
            <div>
              <h3>Your Cart</h3>
              <p className="cart-drawer-subtitle">
                {cartItems.length === 0 
                  ? 'Your selected items' 
                  : `You have ${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`
                }
              </p>
            </div>
            <button onClick={() => setShowCartDrawer(false)} className="cart-close-btn" title="Close cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div className="cart-drawer-body">
            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ marginBottom: 16 }}>
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>Your cart is empty</p>
                <button 
                  onClick={() => {
                    setShowCartDrawer(false);
                    navigate('/products');
                  }} 
                  className="cart-shop-btn"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="cart-items-list">
                {cartItems.map(item => (
                  <div key={`${item.id}-${item.variant_id}`} className="cart-item-card">
                    <img 
                      src={item.cover_image} 
                      alt={item.title} 
                      className="cart-item-thumb"
                      onError={e => { e.currentTarget.src = '/logo_black.png' }}
                    />
                    <div className="cart-item-details">
                      <h4 className="cart-item-title">{item.title.replace(/\s+slug$/i, '')}</h4>
                      <div className="cart-item-price-row">
                        <span className="cart-item-price">
                          {item.price ? formatPrice(Number(item.price) * (item.quantity || 1)) : 'Free'}
                        </span>
                        {item.old_price && (
                          <span className="cart-item-old-price">
                            {formatPrice(item.old_price)}
                          </span>
                        )}
                      </div>
                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.variant_id, -1)}
                          style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', flexShrink: 0 }}
                        >−</button>
                        <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{item.quantity || 1}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, item.variant_id, 1)}
                          style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', flexShrink: 0 }}
                        >+</button>
                        <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>@ {formatPrice(item.price)} each</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveFromCart(item.id, item.variant_id)} 
                      className="cart-item-remove-btn"
                      title="Remove item"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="cart-drawer-footer">
              <div className="cart-total-row" style={{ marginBottom: 4 }}>
                <span>Subtotal</span>
                <span className="cart-total-price">{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="cart-total-row" style={{ marginBottom: 8, fontSize: 13, color: '#475569' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  Shipping
                </span>
                <span style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {cartShipping === 0
                    ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Free</>
                    : formatPrice(cartShipping)}
                </span>
              </div>
              {cartShipping > 0 && (
                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 8, marginBottom: 8 }}>
                  <div className="cart-total-row" style={{ fontSize: 14, fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--brand-primary)' }}>{formatPrice(cartSubtotal + cartShipping)}</span>
                  </div>
                </div>
              )}
              <button onClick={handleProceedToCheckout} className="cart-checkout-btn">
                Complete Payment
              </button>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cart-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(5, 11, 20, 0.6);
          backdrop-filter: blur(4px);
          z-index: 10000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .cart-drawer-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        .cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
          z-index: 10001;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        .cart-drawer.active {
          transform: translateX(0);
        }
        .cart-drawer-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cart-drawer-subtitle {
          margin: 4px 0 0 0;
          font-size: 12.5px;
          color: #64748b;
          font-weight: 500;
        }
        .cart-drawer-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 850;
          color: #0f172a;
          font-family: var(--font-heading), sans-serif;
          letter-spacing: -0.5px;
        }
        .cart-close-btn {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .cart-close-btn:hover {
          color: #0f172a;
          background: #e2e8f0;
          transform: rotate(90deg);
        }
        .cart-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .cart-empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          text-align: center;
        }
        .cart-empty-state p {
          font-size: 15px;
          font-weight: 500;
          margin: 0 0 20px;
        }
        .cart-shop-btn {
          background: var(--brand-primary);
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .cart-shop-btn:hover {
          background: var(--brand-hover);
        }
        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cart-item-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          position: relative;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.01);
          transition: all 0.2s ease;
        }
        .cart-item-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
        }
        .cart-item-thumb {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
          background: #f8fafc;
          flex-shrink: 0;
        }
        .cart-item-details {
          flex: 1;
          min-width: 0;
        }
        .cart-item-title {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cart-item-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .cart-item-price {
          font-size: 14px;
          font-weight: 800;
          color: var(--brand-primary);
        }
        .cart-item-old-price {
          font-size: 12px;
          color: #94a3b8;
          text-decoration: line-through;
        }
        .cart-item-remove-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          top: 12px;
          right: 12px;
        }
        .cart-item-remove-btn:hover {
          color: #ef4444;
          background: #fef2f2;
          border-color: #fee2e2;
          transform: scale(1.05);
        }
        .cart-drawer-footer {
          padding: 24px;
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
          box-shadow: 0 -4px 10px rgba(0,0,0,0.01);
        }
        .cart-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .cart-total-row span:first-child {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
        }
        .cart-total-price {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .cart-checkout-btn {
          width: 100%;
          background: var(--brand-primary);
          color: #ffffff;
          border: none;
          padding: 15px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(13,46,26,0.22);
          font-family: var(--font), sans-serif;
        }
        .cart-checkout-btn:hover {
          background: var(--brand-hover);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(13,46,26,0.3);
        }
        
        /* ─── HANGING Brand Logo Styling ─── */
        .header-logo-container {
          position: absolute !important;
          top: 6px !important;
          left: 32px !important;
          zIndex: 1050 !important;
          display: flex !important;
          align-items: center !important;
          height: auto !important;
          pointer-events: auto !important;
        }
        .header-logo-img {
          height: 84px !important;
          width: auto !important;
          max-width: 280px !important;
          object-fit: contain !important;
          display: block !important;
          filter: drop-shadow(0 4px 8px rgba(11, 15, 25, 0.12)) !important;
        }
        .header-logo-spacer {
          width: 220px !important;
          flex-shrink: 0 !important;
        }
        
        @media (max-width: 991px) {
          .header-logo-container {
            left: 20px !important;
          }
          .header-logo-img {
            height: 72px !important;
            max-width: 220px !important;
          }
          .header-logo-spacer {
            width: 160px !important;
          }
        }
        @media (max-width: 768px) {
          .header-logo-container {
            top: 6px !important;
            left: 16px !important;
          }
          .header-logo-img {
            height: 76px !important;
            max-width: 210px !important;
          }
          .header-logo-spacer {
            width: 160px !important;
          }
        }
        @media (max-width: 640px) {
          .header-logo-container {
            top: 6px !important;
            left: 10px !important;
          }
          .header-logo-img {
            height: 70px !important;
            max-width: 190px !important;
          }
          .header-logo-spacer {
            width: 130px !important;
          }
        }
      `}} />
    </>
  )
}

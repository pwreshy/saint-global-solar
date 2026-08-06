import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LandingPageRenderer() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Customer Form Fields (Loaded from localStorage if existing to prevent wiping on refresh)
  const [name, setName] = useState(() => localStorage.getItem('sgs_lnd_name') || '')
  const [phone, setPhone] = useState(() => localStorage.getItem('sgs_lnd_phone') || '')
  const [email, setEmail] = useState(() => localStorage.getItem('sgs_lnd_email') || '')
  const [address, setAddress] = useState(() => localStorage.getItem('sgs_lnd_address') || '')
  const [state, setState] = useState(() => localStorage.getItem('sgs_lnd_state') || '')
  const [notes, setNotes] = useState(() => localStorage.getItem('sgs_lnd_notes') || '')
  const [paymentMethod, setPaymentMethod] = useState(() => localStorage.getItem('sgs_lnd_paymentMethod') || 'cash_on_delivery')
  const [priceAgreed, setPriceAgreed] = useState(() => localStorage.getItem('sgs_lnd_priceAgreed') === 'true')

  // Selected Items State
  // Format: { [id_number]: { product, sizes: ['42', '43'] } }
  const [selectedItems, setSelectedItems] = useState({})
  // Quantities for each selected product-variant combination
  // Format: { "SGS-101-42": 1 }
  const [itemQuantities, setItemQuantities] = useState({})

  // Custom Dropdown Open State (for payment method)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const paymentRef = useRef(null)

  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

  // Persist form inputs in localStorage
  useEffect(() => {
    localStorage.setItem('sgs_lnd_name', name)
    localStorage.setItem('sgs_lnd_phone', phone)
    localStorage.setItem('sgs_lnd_email', email)
    localStorage.setItem('sgs_lnd_address', address)
    localStorage.setItem('sgs_lnd_state', state)
    localStorage.setItem('sgs_lnd_notes', notes)
    localStorage.setItem('sgs_lnd_paymentMethod', paymentMethod)
    localStorage.setItem('sgs_lnd_priceAgreed', String(priceAgreed))
  }, [name, phone, email, address, state, notes, paymentMethod, priceAgreed])

  useEffect(() => {
    function handleClickOutside(event) {
      if (paymentRef.current && !paymentRef.current.contains(event.target)) setPaymentOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    async function fetchLandingPage() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('slug', slug)
          .single()

        if (error) throw error
        if (data) {
          setPageData(data)
        }
      } catch (err) {
        console.error('Landing page not found:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLandingPage()
  }, [slug])

  // Handle toggling size selection on product cards
  const handleSizeToggle = (product, sz) => {
    setSelectedItems(prev => {
      const copy = { ...prev }
      const existing = copy[product.id_number]
      
      if (existing) {
        let updatedSizes = [...existing.sizes]
        if (updatedSizes.includes(sz)) {
          updatedSizes = updatedSizes.filter(s => s !== sz)
        } else {
          updatedSizes.push(sz)
        }
        
        if (updatedSizes.length === 0) {
          delete copy[product.id_number]
        } else {
          copy[product.id_number] = {
            ...existing,
            sizes: updatedSizes.sort()
          }
        }
      } else {
        copy[product.id_number] = {
          product,
          sizes: [sz]
        }
      }
      return copy
    })

    // Initialize quantity for this combination if it doesn't exist
    const key = `${product.id_number}-${sz}`
    setItemQuantities(prev => {
      if (!prev[key]) {
        return { ...prev, [key]: 1 }
      }
      return prev
    })
  }

  const handleQtyChange = (key, delta) => {
    setItemQuantities(prev => {
      const current = prev[key] || 1
      const next = Math.max(1, current + delta)
      return { ...prev, [key]: next }
    })
  }

  // Compile list of selected items
  const selectedList = []
  Object.keys(selectedItems).forEach(idNum => {
    const { product, sizes } = selectedItems[idNum]
    sizes.forEach(sz => {
      const key = `${idNum}-${sz}`
      const qty = itemQuantities[key] || 1
      selectedList.push({
        key,
        id_number: idNum,
        product,
        size: sz,
        quantity: qty,
        price: parseInt(product.price) || 0
      })
    })
  })

  const grandTotal = selectedList.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedList.length === 0) {
      alert('Please select at least one product design/option from the catalog before ordering.')
      return
    }

    if (!priceAgreed) {
      alert('Please confirm that you agree to the price and availability by clicking the confirmation checkbox.')
      return
    }

    setSubmitting(true)

    const orderRef = `SGS_LND_${Math.floor(100000 + Math.random() * 900000)}`
    
    // Format list of items for payload
    const itemsDescription = selectedList.map(item => 
      `${item.id_number} (Option: ${item.size} x ${item.quantity} unit${item.quantity > 1 ? 's' : ''})`
    ).join(', ')

    const emailPayload = {
      name: name.trim(),
      email: email.trim() || 'customer@saintglobalsolar.com',
      phone: phone.trim(),
      product_title: `Landing Page Order: ${itemsDescription} [Payment: ${paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}]`,
      amount: grandTotal,
      payment_method: paymentMethod,
      ref: orderRef,
      shipping_street: address.trim(),
      shipping_city: state.trim(),
      shipping_state: state.trim()
    }

    try {
      // 1. Trigger email notification to sales@saintglobalsolar.com via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'admin_new_order',
          to: 'sales@saintglobalsolar.com',
          data: emailPayload
        }
      })

      if (emailError) throw emailError

      // 2. Also register order in public.orders if possible to keep admin dashboard in sync
      try {
        await supabase.from('orders').insert({
          reference: orderRef,
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim(),
          amount: grandTotal,
          total_paid: grandTotal,
          currency: 'NGN',
          status: 'pending',
          payment_method: paymentMethod,
          shipping_street: address.trim(),
          shipping_city: state.trim(),
          shipping_state: state.trim(),
          shipping_zip: `LND Multi-Items`
        })
      } catch (dbErr) {
        console.warn('Silent fallback: Could not insert landing order in orders table.', dbErr)
      }

      // Clear stored values on success
      localStorage.removeItem('sgs_lnd_name')
      localStorage.removeItem('sgs_lnd_phone')
      localStorage.removeItem('sgs_lnd_email')
      localStorage.removeItem('sgs_lnd_address')
      localStorage.removeItem('sgs_lnd_state')
      localStorage.removeItem('sgs_lnd_notes')
      localStorage.removeItem('sgs_lnd_paymentMethod')
      localStorage.removeItem('sgs_lnd_priceAgreed')

      setSuccess(true)

      // 3. Format WhatsApp checkout text & redirect
      let itemsWaText = ''
      selectedList.forEach(item => {
        itemsWaText += `- *Design/Option:* ${item.id_number}\n- *Option/Size:* ${item.size}\n- *Quantity:* ${item.quantity} unit${item.quantity > 1 ? 's' : ''}\n- *Subtotal:* ₦${Number(item.price * item.quantity).toLocaleString()}\n\n`
      })

      const waText = `Hi SAINT GLOBAL SOLAR,\n\nI just placed an order on your Landing Page (*${pageData.title}*):\n\n*Order Details:*\n${itemsWaText}*Total Amount:* ₦${grandTotal.toLocaleString()}\n*Payment Method:* ${paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}\n\n*Customer Shipping Info:*\n- *Name:* ${name}\n- *Email:* ${email}\n- *Phone:* ${phone}\n- *Delivery Address:* ${address}, ${state} State\n${notes ? `- *Notes:* ${notes}\n` : ''}\n- *Ref:* #${orderRef}`
      
      const encodedWaText = encodeURIComponent(waText)
      setTimeout(() => {
        window.location.href = `https://wa.me/2347059297121?text=${encodedWaText}`
      }, 1500)

    } catch (err) {
      console.error(err)
      alert('Failed to place order: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#faf8f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 14, fontFamily: 'sans-serif' }}>Loading luxury catalog...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!pageData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h2 style={{ fontSize: 28, color: '#0f0d0a', fontWeight: 700, marginBottom: 8 }}>Page Not Found</h2>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 20 }}>This landing page catalog does not exist or has been removed.</p>
          <button onClick={() => navigate('/products')} style={{ background: '#0f0d0a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>Browse Shop</button>
        </div>
      </div>
    )
  }

  const productsList = pageData.products || []
  const headlineText = pageData.headline || 'Handcrafted Luxury For The Modern Gentleman'
  const subheadlineText = pageData.subheadline || 'Experience unmatched comfort and style with our premium bespoke collection.'
  const highlightsList = Array.isArray(pageData.highlights) ? pageData.highlights : []

  // Disclaimer configurations from DB
  const showDisclaimerCard = pageData.show_disclaimer !== false
  const disclaimerTextContent = pageData.disclaimer_text || 'Please only submit an order if you have the cash fully ready and will be available to receive the delivery in 2 to 5 days. Every delivery attempt costs our business money for logistics and verification. Time-wasters, window shoppers, and unserious orders are strictly prohibited.'
  const urgencyWarningText = pageData.urgency_text || 'High Demand - Limited Quantities Left'

  const payments = [
    { value: 'cash_on_delivery', label: 'Cash on Delivery (Pay on arrival)' },
    { value: 'bank_transfer', label: 'Direct Bank Transfer' }
  ]

  // Styles (Enforcing at least 16px fontSize to prevent auto-zooming on iOS Safari)
  const formFieldLabelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  const formInputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #d1d5db',
    fontSize: '16px', // Prevent auto-zoom on iOS
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease-in-out',
    background: '#ffffff',
    color: '#1f2937'
  }

  return (
    <div style={{ background: '#faf8f5', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* BRAND BANNER LOGO */}
      <div style={{ background: '#0f0d0a', padding: '24px 20px', textAlign: 'center', borderBottom: '3px solid var(--gold)' }}>
        <img src="/logo_white.png" alt="SAINT GLOBAL SOLAR" style={{ height: 50, width: 'auto', display: 'block', margin: '0 auto' }} />
      </div>

      <main style={{ maxWidth: 840, margin: '0 auto', padding: isMobile ? '24px 12px 80px' : '40px 16px 80px' }}>
        
        {/* HERO COPY SECTIONS */}
        <div style={{ textAlign: 'center', marginBottom: 32, padding: '0 8px' }}>
          <h1 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: 900, color: '#0f0d0a', margin: '0 0 12px', lineHeight: 1.2 }}>
            {headlineText}
          </h1>
          <p style={{ color: '#4b5563', fontSize: isMobile ? '15px' : '17px', lineHeight: 1.6, maxWidth: 640, margin: '0 auto 24px' }}>
            {subheadlineText}
          </p>

          {/* Highlights Bullets */}
          {highlightsList.length > 0 && (
            <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '10px', textAlign: 'left', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', maxWidth: '560px', width: '100%', boxSizing: 'border-box', marginBottom: 28 }}>
              {highlightsList.map((hl, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '14px', color: '#374151' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>✓</span>
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          )}

          {/* SERIOUS BUYERS WARNING BANNER & URGENCY (DYNAMIC) */}
          {showDisclaimerCard && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: '14px', padding: '20px 24px', textAlign: 'left', maxWidth: '640px', margin: '0 auto', boxSizing: 'border-box' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '800', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Attention: Only Serious Buyers Allowed
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
                {disclaimerTextContent}
              </p>
              {urgencyWarningText && (
                <div style={{ borderTop: '1px dashed #fca5a5', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Urgency: {urgencyWarningText}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* INSTRUCTIONS BANNER */}
        <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', marginBottom: 32, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: 1.5, fontWeight: 500 }}>
            Options/sizes available for these products are listed below. Please select your preferred variant box directly on the product card. You can also select multiple boxes if you would like to order more than one.
          </p>
        </div>

        {/* IMAGE GRID - 2 COLUMNS ON MOBILE, 3 COLUMNS ON DESKTOP */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
          gap: isMobile ? '12px' : '24px', 
          marginBottom: 48 
        }}>
          {productsList.map((prod, idx) => {
            const colorsList = prod.colors ? prod.colors.split(',').map(c => c.trim()) : []
            const sizesRange = ['40', '41', '42', '43', '44', '45', '46']
            // Available sizes loaded from settings (default to all if not specified)
            const availableSizes = prod.available_sizes || sizesRange
            
            return (
              <div 
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(15,23,42,0.01)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Product Image */}
                <div style={{ width: '100%', aspectRatio: '1/1', background: '#f9fafb', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {prod.image_url ? (
                    <img 
                      src={prod.image_url} 
                      alt={prod.id_number} 
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ color: '#9ca3af', fontSize: 12, fontStyle: 'italic' }}>SAINT GLOBAL SOLAR Design</div>
                  )}
                </div>

                <div style={{ padding: isMobile ? 10 : 16, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Product ID */}
                    <div style={{ fontWeight: 800, fontSize: isMobile ? '13px' : '14.5px', color: '#0f0d0a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Design: {prod.id_number}
                    </div>

                    {/* Colors circles indicators */}
                    {colorsList.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-start', marginBottom: 12, flexWrap: 'wrap' }}>
                        {colorsList.map((col, cIdx) => (
                          <span 
                            key={cIdx} 
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: col,
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                            title={col}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Price */}
                    <div style={{ color: '#0f0d0a', fontWeight: 900, fontSize: isMobile ? '16px' : '18px', marginBottom: 12 }}>
                      ₦{Number(prod.price || 0).toLocaleString()}
                    </div>

                    {/* AVAILABLE SIZES GRID - SELECTABLE */}
                    <div>
                      <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                        Select Size:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                        {sizesRange.map(sz => {
                          const isAvailable = availableSizes.includes(sz)
                          const isSelected = (selectedItems[prod.id_number]?.sizes || []).includes(sz)

                          if (!isAvailable) {
                            return (
                              <div 
                                key={sz}
                                style={{
                                  height: '26px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '4px',
                                  fontSize: '11.5px',
                                  fontWeight: 'bold',
                                  border: '1px dashed #e5e7eb',
                                  color: '#cbd5e1',
                                  background: '#f9fafb',
                                  textDecoration: 'line-through',
                                  cursor: 'not-allowed'
                                }}
                                title="Out of stock"
                              >
                                {sz}
                              </div>
                            )
                          }

                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleSizeToggle(prod, sz)}
                              style={{
                                height: '26px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                fontSize: '16px', // Prevent auto-zoom on iOS
                                fontWeight: 'bold',
                                border: isSelected ? '1.5px solid #000' : '1px solid #cbd5e1',
                                background: isSelected ? '#000' : '#fff',
                                color: isSelected ? '#fff' : '#374151',
                                cursor: 'pointer',
                                transition: 'all 0.1s ease',
                                outline: 'none'
                              }}
                            >
                              {sz}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ORDER FORM SECTION */}
        <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          
          <div style={{ background: '#0f0d0a', padding: '24px 20px', textAlign: 'center', borderBottom: '3px solid var(--gold)' }}>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Order Form
            </h3>
            <p style={{ margin: '4px 0 0', color: 'var(--gold)', fontSize: 13 }}>Fill in details below to submit your order immediately.</p>
          </div>

          {success ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span style={{ fontSize: 32 }}>✓</span>
              </div>
              <h4 style={{ fontSize: 22, fontWeight: 800, color: '#166534', margin: '0 0 8px' }}>Order Submitted!</h4>
              <p style={{ color: '#475569', fontSize: 15, margin: '0 0 20px', lineHeight: 1.6 }}>
                Your order has been received successfully.<br />
                We are redirecting you to WhatsApp now to finalize dispatch details...
              </p>
              <a 
                href={`https://wa.me/2347059297121`}
                style={{ display: 'inline-block', background: '#25d366', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600 }}
              >
                Proceed to WhatsApp Chat
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: isMobile ? '24px 16px' : '32px 32px' }}>
              
              {/* FLEXIBLE ITEM CART LIST */}
              {selectedList.length > 0 ? (
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected Items list:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {selectedList.map(item => (
                      <div 
                        key={item.key} 
                        style={{ 
                          background: '#faf8f5', 
                          border: '1.5px solid var(--gold)', 
                          borderRadius: 12, 
                          padding: '12px 16px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px'
                        }}
                      >
                        {/* Selected Item Image */}
                        <div style={{ width: 50, height: 50, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.product.image_url ? (
                            <img src={item.product.image_url} alt="selected" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>No Image</div>
                          )}
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: '#0f0d0a', fontSize: '14.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Design {item.id_number}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: 2 }}>
                            Size: {item.size}
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <button 
                            type="button" 
                            onClick={() => handleQtyChange(item.key, -1)}
                            style={{ width: 24, height: 24, borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => handleQtyChange(item.key, 1)}
                            style={{ width: 24, height: 24, borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '80px' }}>
                          <div style={{ fontWeight: 900, color: '#0f0d0a', fontSize: '15px' }}>
                            ₦{Number(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* GRAND TOTAL SUMMARY BLOCK */}
                    <div style={{ 
                      borderTop: '1px dashed var(--gold)', 
                      paddingTop: '16px', 
                      marginTop: '8px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f0d0a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Grand Total:
                      </span>
                      <span style={{ fontSize: '20px', fontWeight: '950', color: '#0f0d0a' }}>
                        ₦{Number(grandTotal).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 16px', background: '#f9fafb', border: '1px dashed #cbd5e1', borderRadius: '10px', textAlign: 'center', marginBottom: 28, color: '#6b7280', fontSize: '14px' }}>
                  No product selected. Select a product option/variant box on the catalog cards above to begin your order.
                </div>
              )}

              {/* Form Input fields */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 20 }}>
                <div>
                  <label style={formFieldLabelStyle}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="First and last name"
                    style={formInputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={formFieldLabelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. customer@example.com"
                    style={formInputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 20 }}>
                <div>
                  <label style={formFieldLabelStyle}>WhatsApp / Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Active delivery number"
                    style={formInputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={formFieldLabelStyle}>State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="e.g. Lagos"
                    style={formInputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={formFieldLabelStyle}>Detailed Shipping Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="House/Office No, Street, Landmark details"
                  style={formInputStyle}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 28 }}>
                {/* Custom Dropdown: Payment Method */}
                <div ref={paymentRef} style={{ position: 'relative' }}>
                  <label style={formFieldLabelStyle}>Payment Method</label>
                  <button 
                    type="button" 
                    onClick={() => { setPaymentOpen(!paymentOpen); }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1.5px solid #d1d5db',
                      fontSize: '16px', // Prevent auto-zoom
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#ffffff',
                      color: '#1f2937',
                      cursor: 'pointer',
                      outline: 'none',
                      textAlign: 'left',
                      boxSizing: 'border-box',
                      borderColor: paymentOpen ? 'var(--gold)' : '#d1d5db',
                      boxShadow: paymentOpen ? '0 0 0 3px rgba(223,178,108,0.15)' : 'none'
                    }}
                  >
                    <span>{payments.find(p => p.value === paymentMethod)?.label}</span>
                    <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: paymentOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>
                  {paymentOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      width: '100%',
                      background: '#ffffff',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                      marginTop: '6px',
                      zIndex: 1000,
                      maxHeight: '220px',
                      overflowY: 'auto',
                      boxSizing: 'border-box'
                    }}>
                      {payments.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => { setPaymentMethod(p.value); setPaymentOpen(false); }}
                          style={{
                            padding: '10px 16px',
                            fontSize: '16px', // Prevent auto-zoom
                            cursor: 'pointer',
                            color: '#374151',
                            border: 'none',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'all 0.1s ease',
                            background: paymentMethod === p.value ? '#faf8f5' : 'transparent',
                            fontWeight: paymentMethod === p.value ? 700 : 500
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={formFieldLabelStyle}>Order Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Specific delivery remarks"
                    style={formInputStyle}
                  />
                </div>
              </div>

              {/* AGREEMENT CONFIRMATION CHECKBOX */}
              <div style={{ 
                background: '#faf8f5', 
                border: '1px solid #e5e7eb', 
                borderRadius: '10px', 
                padding: '14px 16px', 
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer'
              }}
              onClick={() => setPriceAgreed(!priceAgreed)}
              >
                <input 
                  type="checkbox" 
                  checked={priceAgreed}
                  onChange={(e) => setPriceAgreed(e.target.checked)}
                  style={{ cursor: 'pointer', marginTop: '2px', flexShrink: 0 }}
                  onClick={e => e.stopPropagation()}
                />
                <span style={{ fontSize: '14px', color: '#374151', lineHeight: '1.4', fontWeight: 500, userSelect: 'none' }}>
                  Kindly click this box to confirm that you agree with the price and you will be available in the next 2 - 5 days to receive your item(s).
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting || selectedList.length === 0}
                style={{
                  width: '100%',
                  background: '#0f0d0a',
                  color: '#ffffff',
                  padding: '16px 24px',
                  border: '1px solid var(--gold)',
                  borderRadius: 10,
                  fontSize: '16px', // Prevent auto-zoom
                  fontWeight: 800,
                  cursor: selectedList.length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 15px rgba(15,23,42,0.15)',
                  opacity: (submitting || selectedList.length === 0) ? 0.6 : 1,
                  letterSpacing: '1px'
                }}
                onMouseEnter={e => {
                  if (selectedList.length > 0) {
                    e.currentTarget.style.background = '#1c1813'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={e => {
                  if (selectedList.length > 0) {
                    e.currentTarget.style.background = '#0f0d0a'
                    e.currentTarget.style.transform = 'none'
                  }
                }}
              >
                {submitting ? 'PROCESSING YOUR ORDER...' : 'SUBMIT ORDER NOW'}
              </button>
            </form>
          )}

        </div>

      </main>

      {/* BRAND FOOTER (CUSTOM ADAPTED) */}
      <footer style={{ background: '#0f0d0a', borderTop: '2px solid var(--gold)', padding: '32px 20px', color: '#9ca3af', textAlign: 'center', fontSize: '12px', lineHeight: '1.6', fontFamily: 'inherit' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ margin: '0 0 12px', color: 'var(--gold)', fontWeight: 600 }}>
            © 2026 SAINT GLOBAL SOLAR | All Rights Reserved
          </p>
          <p style={{ margin: '0 0 16px', color: '#6b7280' }}>
            This site is not affiliated with Facebook, Google, or Meta in any way. 
            Results and product options mentioned on this page represent high-quality craftsmanship; individual experiences will vary. 
            Verification and order booking are 100% free with no hidden charges.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid #1f2937', paddingTop: '16px' }}>
            <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
            <span style={{ color: '#374151' }}>|</span>
            <a href="/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
            <span style={{ color: '#374151' }}>|</span>
            <a href="/contact" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

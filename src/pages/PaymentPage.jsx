import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CONFIG } from '../lib/config'
import { supabase, createPendingOrder, completeOrder, updateProfileShipping } from '../lib/supabase'
import { trackEvent } from '../lib/analytics'
import { useCurrency } from '../context/CurrencyContext'
import OrderBump from '../components/OrderBump'
import { useAffiliate } from '../hooks/useAffiliate'
import { sendOrderConfirmed, sendBankTransferPending, sendCodOrderPlaced } from '../lib/emailService'

// ─────────────────────────────────────────────────────────────────────────────
// SHOPIFY-STYLE FIELD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Field({ id, label, hint, type = 'text', placeholder, val, err, disabled, onChange, right }) {
  const [showPwd, setShowPwd] = useState(false)
  const isPwd = type === 'password'
  const [focused, setFocused] = useState(false)

  return (
    <div className={`sp-field-group ${err ? 'has-error' : ''} ${focused ? 'focused' : ''} ${val ? 'has-value' : ''}`}>
      <div className="sp-input-container">
        <input
          id={id}
          type={isPwd && showPwd ? 'text' : type}
          placeholder={placeholder}
          className="sp-input"
          value={val}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : isPwd ? 'new-password' : 'name'}
        />
        <label className="sp-label" htmlFor={id}>
          {label}
          {hint && <span className="sp-label-hint">{hint}</span>}
        </label>
        
        {isPwd && (
          <button
            type="button"
            className="sp-pwd-toggle"
            tabIndex={-1}
            onClick={() => setShowPwd(p => !p)}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
        {right && !isPwd && <div className="sp-field-right-elem">{right}</div>}
      </div>
      {err && <p className="sp-field-error-msg">{err}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SHOPIFY-STYLE PAYMENT PAGE
// ─────────────────────────────────────────────────────────────────────────────

const ALL_COUNTRIES = [
  "Nigeria", "United States", "United Kingdom", "Canada", "Ghana", "Kenya", "South Africa", "United Arab Emirates",
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Holy See", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "Uruguay", "Uzbekistan",
  "Vanuatu", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

export default function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productIdParam = searchParams.get('product')
  const { user } = useAuth()
  const { formatPrice, currency } = useCurrency()

  // Product data
  const [product, setProduct] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const initiatedCheckoutRef = useRef(false)

  // Payment method toggle & receipt states
  const [paymentMethod, setPaymentMethod] = useState('paystack')
  const [enableCod, setEnableCod] = useState(false)
  const [paystackPublicKey, setPaystackPublicKey] = useState(CONFIG.PAYSTACK_PUBLIC_KEY)
  const [bankAccounts, setBankAccounts] = useState([])
  const [receiptUrl, setReceiptUrl] = useState('')
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptName, setReceiptName] = useState('')

  // Form fields — persisted to localStorage so they survive page refreshes
  const [form, setForm] = useState(() => ({
    name:  localStorage.getItem('checkout_name')  || '',
    email: localStorage.getItem('checkout_email') || '',
    phone: localStorage.getItem('checkout_phone') || '',
    shipping_street: localStorage.getItem('checkout_shipping_street') || '',
    shipping_city: localStorage.getItem('checkout_shipping_city') || '',
    shipping_state: localStorage.getItem('checkout_shipping_state') || '',
    shipping_country: localStorage.getItem('checkout_shipping_country') || 'Nigeria',
    shipping_postal_code: localStorage.getItem('checkout_shipping_postal_code') || '',
    shipping_notes: localStorage.getItem('checkout_shipping_notes') || '',
  }))
  const [errors, setErrors] = useState({})

  // Authentication check states
  const [emailExists, setEmailExists] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [loginPassword, setLoginPassword] = useState('')
  const [guestPassword, setGuestPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // State flags
  const [loading, setLoading] = useState(false)
  const [psReady, setPsReady] = useState(!!window.PaystackPop)
  const [imgError, setImgError] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  // Coupon application states
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponErr, setCouponErr] = useState('')
  const [couponOk, setCouponOk] = useState('')

  const paidRef = useRef(false)
  const pendingOrderIdRef = useRef(null)

  // Affiliate & Order Bump states
  const [selectedBumps, setSelectedBumps] = useState([])
  const { getReferralCode } = useAffiliate()
  const [affiliateData, setAffiliateData] = useState(null)

  useEffect(() => {
    async function checkReferral() {
      const code = getReferralCode()
      if (code) {
        try {
          const { data } = await supabase
            .from('affiliates')
            .select('id, affiliate_code')
            .eq('affiliate_code', code)
            .eq('status', 'active')
            .maybeSingle()
          if (data) setAffiliateData(data)
        } catch (e) {
          console.warn('[PaymentPage] Referral check error:', e)
        }
      }
    }
    checkReferral()
  }, [])

  useEffect(() => {
    async function fetchBankSettings() {
      try {
        const { data } = await supabase.from('settings').select('*').eq('id', 'bank_config').maybeSingle()
        if (data?.value?.accounts) {
          setBankAccounts(data.value.accounts)
        }
      } catch (err) {
        console.warn('[PaymentPage] Failed to fetch bank settings:', err)
      }
    }
    async function fetchPaymentSettings() {
      try {
        const { data } = await supabase.from('settings').select('*').eq('id', 'payment_config').maybeSingle()
        if (data?.value) {
          setEnableCod(!!data.value.enable_cod)
          if (data.value.paystack_public_key) {
            setPaystackPublicKey(data.value.paystack_public_key)
          }
        }
      } catch (err) {
        console.warn('[PaymentPage] Failed to fetch payment config:', err)
      }
    }
    fetchBankSettings()
    fetchPaymentSettings()
  }, [])

  // Derived attributes
  const isEbook = product ? product.type === 'ebook' : false
  const isPhysical = product ? product.type === 'physical' : false
  const productTitle = product ? product.title.replace(/\s+slug$/i, '') : (isEbook ? 'The N50K Blueprint (PDF)' : isPhysical ? 'Premium Product' : CONFIG.BOOK_TITLE)
  const bonuses = product && Array.isArray(product.features) ? product.features.filter(Boolean) : []
  const basePrice = product ? product.price : CONFIG.PRICE_NAIRA
  const oldPrice = product?.old_price || null

  const checkoutQuantity = (() => {
    try {
      const cart = JSON.parse(localStorage.getItem('ecom_cart')) || []
      const activeVariantId = product?.variant_id ?? null
      const item = cart.find(x => x.id === product?.id && x.variant_id === activeVariantId)
      return item?.quantity || 1
    } catch (e) {
      return 1
    }
  })()

  const discountedPrice = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? Math.round(basePrice * (1 - appliedCoupon.value / 100))
      : Math.max(0, basePrice - appliedCoupon.value)
    : basePrice

  const checkoutSubtotal = discountedPrice * checkoutQuantity

  const bumpsTotal = selectedBumps.reduce((sum, bump) => {
    const base = bump.offered_product?.price || 0
    if (bump.discount_type === 'percentage') {
      return sum + Math.round(base * (1 - bump.discount_value / 100))
    }
    if (bump.discount_type === 'fixed') {
      return sum + Math.max(0, base - bump.discount_value)
    }
    return sum + base
  }, 0)

  // Delivery fee: 0 if product has free_delivery flag OR no fee set.
  // Checks shipping_charge_per_item flag to decide if fee multiplies with quantity or stays fixed/flat rate.
  const deliveryFee = product?.free_delivery 
    ? 0 
    : (product?.shipping_charge_per_item 
        ? (parseFloat(product?.delivery_fee) || 0) * checkoutQuantity 
        : (parseFloat(product?.delivery_fee) || 0))

  const finalTotal = checkoutSubtotal + bumpsTotal + deliveryFee

  // Load product from database and sync with cart
  useEffect(() => {
    async function load() {
      try {
        let activeProduct = null
        
        if (productIdParam) {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdParam)
          let q = supabase.from('products').select('*')
          q = isUUID ? q.eq('id', productIdParam) : q.eq('slug', productIdParam)
          const { data } = await q.maybeSingle()
          if (data) activeProduct = data
        }
        
        if (!activeProduct) {
          // Try loading from cart
          try {
            const cart = JSON.parse(localStorage.getItem('ecom_cart')) || []
            if (cart.length > 0) {
              const { data } = await supabase.from('products').select('*').eq('id', cart[0].id).maybeSingle()
              if (data) activeProduct = data
            }
          } catch (e) {
            console.error('[PaymentPage] Error reading cart:', e)
          }
        }
        
        if (!activeProduct) {
          // Fallback to latest published product
          const { data: fb } = await supabase.from('products').select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false }).limit(1).maybeSingle()
          if (fb) activeProduct = fb
        }
        
        if (activeProduct) {
          const variantIdParam = searchParams.get('variant')
          const variantId = variantIdParam || (() => {
            try {
              const cart = JSON.parse(localStorage.getItem('ecom_cart')) || []
              const item = cart.find(x => x.id === activeProduct.id)
              return item?.variant_id
            } catch (e) {}
          })()

          if (variantId && activeProduct.variations?.variants) {
            const variant = activeProduct.variations.variants.find(v => v.id === variantId)
            if (variant) {
              const optStr = Object.entries(variant.attributes || {})
                .map(([k, v]) => `${v}`)
                .join(', ')

              activeProduct = {
                ...activeProduct,
                variant_id: variant.id,
                title: `${activeProduct.title.replace(/\s+slug$/i, '')} (${optStr})`,
                price: variant.price || activeProduct.price,
                old_price: variant.compare_price || activeProduct.compare_price,
                cover_image: variant.image || activeProduct.cover_image
              }
            }
          }

          setProduct(activeProduct)
          
          // Auto-add checkout product to cart ONLY if genuinely not present.
          // FIX: use ?? null so activeProduct.variant_id (undefined for non-variant products)
          // compares correctly against cart item's variant_id (null). Previously null !== undefined
          // always triggered an overwrite, destroying the user's selected quantity.
          try {
            const cartKey = 'ecom_cart'
            let cart = JSON.parse(localStorage.getItem(cartKey)) || []
            const activeVariantId = activeProduct.variant_id ?? null
            if (!cart.some(item => item.id === activeProduct.id && item.variant_id === activeVariantId)) {
              cart = cart.filter(item => item.id !== activeProduct.id)
              cart.push({
                id: activeProduct.id,
                variant_id: activeVariantId,
                title: activeProduct.title,
                price: activeProduct.price,
                old_price: activeProduct.old_price,
                cover_image: activeProduct.cover_image,
                type: activeProduct.type,
                slug: activeProduct.slug,
                quantity: 1,
                delivery_fee: activeProduct.delivery_fee || 0,
                free_delivery: activeProduct.free_delivery || false,
                shipping_charge_per_item: activeProduct.shipping_charge_per_item || false
              })
              localStorage.setItem(cartKey, JSON.stringify(cart))
              window.dispatchEvent(new Event('cart_updated'))
            }
          } catch (e) {
            console.error('[PaymentPage] Error writing cart:', e)
          }
        }
      } catch (err) {
        console.error('[PaymentPage] load product error:', err)
      } finally {
        setLoadingProduct(false)
      }
    }
    load()
  }, [productIdParam])

  // Track InitiateCheckout once product is loaded
  useEffect(() => {
    if (product && !initiatedCheckoutRef.current) {
      initiatedCheckoutRef.current = true
      trackEvent('initiate_checkout', {
        content_name: productTitle,
        value: finalTotal,
        currency: 'NGN',
        product_id: product.id
      })
    }
  }, [product, productTitle, finalTotal])

  // Pre-populate if customer is logged in
  useEffect(() => {
    if (user) {
      async function loadProfile() {
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
          if (data) {
            setForm(f => ({
              ...f,
              email: user.email || '',
              name: data.full_name || f.name,
              phone: data.shipping_phone || f.phone || '',
              shipping_street: data.shipping_street || f.shipping_street || '',
              shipping_city: data.shipping_city || f.shipping_city || '',
              shipping_state: data.shipping_state || f.shipping_state || '',
              shipping_postal_code: data.shipping_postal_code || f.shipping_postal_code || '',
            }))
          }
        } catch (e) {
          console.warn('[PaymentPage] Error loading profile defaults:', e)
        }
      }
      loadProfile()
    }
  }, [user])

  // Load Paystack SDK
  useEffect(() => {
    if (!window.PaystackPop) {
      const s = document.createElement('script')
      s.src = 'https://js.paystack.co/v1/inline.js'
      s.async = true
      s.onload = () => setPsReady(true)
      document.head.appendChild(s)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Auto-detect email existence to toggle login/register forms
  useEffect(() => {
    if (!form.email || user) { setEmailExists(false); return }
    const email = form.email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setEmailExists(false); return }
    const t = setTimeout(async () => {
      setCheckingEmail(true)
      try {
        const { data } = await supabase.from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle()
        setEmailExists(!!data?.id)
      } finally {
        setCheckingEmail(false)
      }
    }, 700)
    return () => clearTimeout(t)
  }, [form.email, user])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
    // Persist safe fields to localStorage so they survive refreshes
    if (['name', 'email', 'phone', 'shipping_street', 'shipping_city', 'shipping_state', 'shipping_country', 'shipping_postal_code', 'shipping_notes'].includes(k)) {
      localStorage.setItem(`checkout_${k}`, v)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Please enter your full name'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Please enter a valid email address'
    if (!/^(\+234|0)[789]\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid phone number'
    if (!user && !emailExists && guestPassword.length < 6) e.password = 'Password must be at least 6 characters'
    if (!user && emailExists && !loginPassword) e.loginPassword = 'Password is required for this email'
    
    if (isPhysical) {
      if (!form.shipping_street.trim()) e.shipping_street = 'Street address is required'
      if (!form.shipping_city.trim()) e.shipping_city = 'City is required'
      if (!form.shipping_state.trim()) e.shipping_state = 'State / Region is required'
      if (!form.shipping_postal_code.trim()) e.shipping_postal_code = 'Postal / Zip code is required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true); setCouponErr(''); setCouponOk(''); setAppliedCoupon(null)
    try {
      const { data } = await supabase.from('coupons').select('*').eq('code', code).eq('is_active', true).maybeSingle()
      if (!data) { setCouponErr('Invalid or expired coupon code.'); return }
      if (data.usage_limit && data.usage_count >= data.usage_limit) { setCouponErr('This coupon has reached its usage limit.'); return }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponErr('This coupon has expired.'); return }
      setAppliedCoupon(data)
      setCouponOk(`Coupon applied — you save ${data.type === 'percentage' ? `${data.value}%` : formatPrice(data.value)}`)
    } catch { 
      setCouponErr('Could not validate coupon. Please try again.')
    } finally { 
      setCouponLoading(false) 
    }
  }

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingReceipt(true)
    setReceiptName(file.name)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `receipt-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, file)

      if (error) {
        console.warn('[PaymentPage] bucket upload failed, using base64 fallback:', error.message)
        const reader = new FileReader()
        reader.onloadend = () => {
          setReceiptUrl(reader.result)
          setUploadingReceipt(false)
        }
        reader.readAsDataURL(file)
      } else if (data) {
        const { data: { publicUrl } } = supabase.storage
          .from('payment-receipts')
          .getPublicUrl(fileName)
        setReceiptUrl(publicUrl)
        setUploadingReceipt(false)
      }
    } catch (err) {
      console.error('[PaymentPage] receipt upload error:', err)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptUrl(reader.result)
        setUploadingReceipt(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const pay = async () => {
    if (!validate()) return
    if (!psReady || !window.PaystackPop) {
      alert('Payment service is loading. Please wait a moment and try again.')
      return
    }

    const name  = form.name.trim()
    const email = form.email.trim().toLowerCase()
    const phone = form.phone.trim()

    setLoading(true)

    let userId = user?.id || null
    try {
      if (!user) {
        if (emailExists) {
          const { data: si, error: siErr } = await supabase.auth.signInWithPassword({ email, password: loginPassword })
          if (siErr) { 
            setErrors({ loginPassword: 'Incorrect password. Please try again.' })
            setLoading(false)
            return 
          }
          userId = si.user?.id || null
        } else {
          const { data: su, error: suErr } = await supabase.auth.signUp({
            email, password: guestPassword,
            options: { data: { full_name: name } }
          })
          if (suErr) {
            if (suErr.message?.toLowerCase().includes('already registered')) {
              const { data: si2 } = await supabase.auth.signInWithPassword({ email, password: guestPassword })
              userId = si2?.user?.id || null
            } else {
              setErrors({ email: suErr.message }); setLoading(false); return
            }
          } else if (su?.user) {
            userId = su.user.id
            const { data: si3 } = await supabase.auth.signInWithPassword({ email, password: guestPassword })
            if (si3?.user) userId = si3.user.id
          }
        }
      }
    } catch (err) {
      setErrors({ email: 'Could not set up account. Please try again.' }); setLoading(false); return
    }

    if (paymentMethod === 'cod') {
      const ref = `cod_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const affId = affiliateData?.id || null
      const affCode = affiliateData?.affiliate_code || null

      try {
        const { orderId, error: orderErr } = await createPendingOrder({
          reference: ref, name, email, phone,
          productId: product?.id || null,
          amount: checkoutSubtotal,
          deliveryFee: deliveryFee,
          quantity: checkoutQuantity,
          affiliateCode: affCode,
          affiliateId: affId,
          shippingName: isPhysical ? name : null,
          shippingPhone: isPhysical ? phone : null,
          shippingStreet: isPhysical ? form.shipping_street.trim() : null,
          shippingCity: isPhysical ? form.shipping_city.trim() : null,
          shippingState: isPhysical ? form.shipping_state.trim() : null,
          shippingCountry: isPhysical ? form.shipping_country : null,
          shippingPostalCode: isPhysical ? form.shipping_postal_code.trim() : null,
          shippingNotes: isPhysical ? form.shipping_notes.trim() : null,
          paymentMethod: 'cod',
          bankReceiptUrl: null
        })

        if (orderErr) {
          alert('Error placing order: ' + orderErr)
          setLoading(false)
          return
        }

        for (const bump of selectedBumps) {
          const base = bump.offered_product?.price || 0
          const bumpPrice = bump.discount_type === 'percentage'
            ? Math.round(base * (1 - bump.discount_value / 100))
            : bump.discount_type === 'fixed'
              ? Math.max(0, base - bump.discount_value)
              : base

          const bumpIsPhysical = bump.offered_product?.type === 'physical'

          await createPendingOrder({
            reference: `${ref}-bump-${bump.id}`,
            name, email, phone,
            productId: bump.offered_product_id,
            amount: bumpPrice,
            affiliateCode: affCode,
            affiliateId: affId,
            shippingName: bumpIsPhysical ? name : null,
            shippingPhone: bumpIsPhysical ? phone : null,
            shippingStreet: bumpIsPhysical ? form.shipping_street.trim() : null,
            shippingCity: bumpIsPhysical ? form.shipping_city.trim() : null,
            shippingState: bumpIsPhysical ? form.shipping_state.trim() : null,
            shippingCountry: bumpIsPhysical ? form.shipping_country : null,
            shippingPostalCode: bumpIsPhysical ? form.shipping_postal_code.trim() : null,
            shippingNotes: bumpIsPhysical ? form.shipping_notes.trim() : null,
            paymentMethod: 'cod',
            bankReceiptUrl: null
          })
        }

        trackEvent('purchase', {
          value: finalTotal,
          currency: 'NGN',
          content_name: productTitle,
          product_id: product?.id,
          email,
          name,
          phone,
          reference: ref
        })

        localStorage.removeItem('checkout_name')
        localStorage.removeItem('checkout_email')
        localStorage.removeItem('checkout_phone')
        localStorage.removeItem('checkout_shipping_street')
        localStorage.removeItem('checkout_shipping_city')
        localStorage.removeItem('checkout_shipping_state')
        localStorage.removeItem('checkout_shipping_postal_code')
        localStorage.removeItem('checkout_shipping_notes')
        localStorage.removeItem('ecom_cart')
        window.dispatchEvent(new Event('cart_updated'))

        localStorage.setItem('paid_customer', JSON.stringify({
          name, email, phone, ref,
          product_id: product?.id,
          product_type: product?.type,
          product_title: productTitle,
          cover_image: product?.cover_image || null,
          amount: discountedPrice,
          delivery_fee: 0,
          shipping_name: isPhysical ? name : null,
          shipping_phone: isPhysical ? phone : null,
          shipping_street: isPhysical ? form.shipping_street.trim() : null,
          shipping_city: isPhysical ? form.shipping_city.trim() : null,
          shipping_state: isPhysical ? form.shipping_state.trim() : null,
          shipping_country: isPhysical ? form.shipping_country : null,
          shipping_postal_code: isPhysical ? form.shipping_postal_code.trim() : null,
          shipping_notes: isPhysical ? form.shipping_notes.trim() : null,
          payment_method: 'cod'
        }))

        if (isPhysical && userId) {
          try {
            await updateProfileShipping({
              userId,
              street: form.shipping_street.trim(),
              city: form.shipping_city.trim(),
              state: form.shipping_state.trim(),
              postalCode: form.shipping_postal_code.trim(),
              phone: phone,
            })
          } catch (err) {
            console.warn('[PaymentPage] failed saving user default address:', err)
          }
        }

        setLoading(false)
        sendCodOrderPlaced({
          name,
          email,
          phone,
          ref,
          product_title: productTitle,
          product_type: product?.type,
          product_image: product?.cover_image,
          amount: finalTotal,
          shipping_street: isPhysical ? form.shipping_street : undefined,
          shipping_city: isPhysical ? form.shipping_city : undefined,
          shipping_state: isPhysical ? form.shipping_state : undefined,
        })
        navigate('/success')
        return
      } catch (err) {
        console.error('[PaymentPage] COD checkout error:', err)
        alert('An error occurred during order submission. Please try again.')
        setLoading(false)
        return
      }
    }

    if (paymentMethod === 'bank_transfer') {
      if (!receiptUrl) {
        alert('Please upload your bank payment receipt first.')
        setLoading(false)
        return
      }

      const ref = `bank_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const affId = affiliateData?.id || null
      const affCode = affiliateData?.affiliate_code || null

      try {
        const { orderId, error: orderErr } = await createPendingOrder({
          reference: ref, name, email, phone,
          productId: product?.id || null,
          amount: checkoutSubtotal,
          deliveryFee: deliveryFee,
          quantity: checkoutQuantity,
          affiliateCode: affCode,
          affiliateId: affId,
          shippingName: isPhysical ? name : null,
          shippingPhone: isPhysical ? phone : null,
          shippingStreet: isPhysical ? form.shipping_street.trim() : null,
          shippingCity: isPhysical ? form.shipping_city.trim() : null,
          shippingState: isPhysical ? form.shipping_state.trim() : null,
          shippingCountry: isPhysical ? form.shipping_country : null,
          shippingPostalCode: isPhysical ? form.shipping_postal_code.trim() : null,
          shippingNotes: isPhysical ? form.shipping_notes.trim() : null,
          paymentMethod: 'bank_transfer',
          bankReceiptUrl: receiptUrl
        })

        if (orderErr) {
          alert('Error placing order: ' + orderErr)
          setLoading(false)
          return
        }

        for (const bump of selectedBumps) {
          const base = bump.offered_product?.price || 0
          const bumpPrice = bump.discount_type === 'percentage'
            ? Math.round(base * (1 - bump.discount_value / 100))
            : bump.discount_type === 'fixed'
              ? Math.max(0, base - bump.discount_value)
              : base

          const bumpIsPhysical = bump.offered_product?.type === 'physical'

          await createPendingOrder({
            reference: `${ref}-bump-${bump.id}`,
            name, email, phone,
            productId: bump.offered_product_id,
            amount: bumpPrice,
            affiliateCode: affCode,
            affiliateId: affId,
            shippingName: bumpIsPhysical ? name : null,
            shippingPhone: bumpIsPhysical ? phone : null,
            shippingStreet: bumpIsPhysical ? form.shipping_street.trim() : null,
            shippingCity: bumpIsPhysical ? form.shipping_city.trim() : null,
            shippingState: bumpIsPhysical ? form.shipping_state.trim() : null,
            shippingCountry: bumpIsPhysical ? form.shipping_country : null,
            shippingPostalCode: bumpIsPhysical ? form.shipping_postal_code.trim() : null,
            shippingNotes: bumpIsPhysical ? form.shipping_notes.trim() : null,
            paymentMethod: 'bank_transfer',
            bankReceiptUrl: receiptUrl
          })
        }

        trackEvent('purchase', {
          value: finalTotal,
          currency: 'NGN',
          content_name: productTitle,
          product_id: product?.id,
          email,
          name,
          phone,
          reference: ref
        })

        localStorage.removeItem('checkout_name')
        localStorage.removeItem('checkout_email')
        localStorage.removeItem('checkout_phone')
        localStorage.removeItem('checkout_shipping_street')
        localStorage.removeItem('checkout_shipping_city')
        localStorage.removeItem('checkout_shipping_state')
        localStorage.removeItem('checkout_shipping_postal_code')
        localStorage.removeItem('checkout_shipping_notes')
        localStorage.removeItem('ecom_cart')
        window.dispatchEvent(new Event('cart_updated'))

        localStorage.setItem('paid_customer', JSON.stringify({
          name, email, phone, ref,
          product_id: product?.id,
          product_type: product?.type,
          product_title: productTitle,
          cover_image: product?.cover_image || null,
          amount: discountedPrice,
          delivery_fee: 0,
          shipping_name: isPhysical ? name : null,
          shipping_phone: isPhysical ? phone : null,
          shipping_street: isPhysical ? form.shipping_street.trim() : null,
          shipping_city: isPhysical ? form.shipping_city.trim() : null,
          shipping_state: isPhysical ? form.shipping_state.trim() : null,
          shipping_country: isPhysical ? form.shipping_country : null,
          shipping_postal_code: isPhysical ? form.shipping_postal_code.trim() : null,
          shipping_notes: isPhysical ? form.shipping_notes.trim() : null,
          payment_method: 'bank_transfer'
        }))

        if (isPhysical && userId) {
          try {
            await updateProfileShipping({
              userId,
              street: form.shipping_street.trim(),
              city: form.shipping_city.trim(),
              state: form.shipping_state.trim(),
              postalCode: form.shipping_postal_code.trim(),
              phone: phone,
            })
          } catch (err) {
            console.warn('[PaymentPage] failed saving user default address:', err)
          }
        }

        setLoading(false)
        sendBankTransferPending({
          name,
          email,
          phone,
          ref,
          product_title: productTitle,
          product_type: product?.type,
          product_image: product?.cover_image,
          amount: finalTotal,
          bank_name: bankAccounts[0]?.bank_name,
          account_number: bankAccounts[0]?.account_number,
          account_name: bankAccounts[0]?.account_name,
          shipping_street: isPhysical ? form.shipping_street : undefined,
          shipping_city: isPhysical ? form.shipping_city : undefined,
          shipping_state: isPhysical ? form.shipping_state : undefined,
        })
        navigate('/success')
        return
      } catch (err) {
        console.error('[PaymentPage] bank transfer checkout error:', err)
        alert('An error occurred during order submission. Please try again.')
        setLoading(false)
        return
      }
    }

    const ref = `SGS_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const affId = affiliateData?.id || null
    const affCode = affiliateData?.affiliate_code || null

    const { orderId } = await createPendingOrder({
      reference: ref, name, email, phone,
      productId: product?.id || null,
      amount: checkoutSubtotal,
      deliveryFee: deliveryFee,
      quantity: checkoutQuantity,
      affiliateCode: affCode,
      affiliateId: affId,
      shippingName: isPhysical ? name : null,
      shippingPhone: isPhysical ? phone : null,
      shippingStreet: isPhysical ? form.shipping_street.trim() : null,
      shippingCity: isPhysical ? form.shipping_city.trim() : null,
      shippingState: isPhysical ? form.shipping_state.trim() : null,
      shippingCountry: isPhysical ? form.shipping_country : null,
      shippingPostalCode: isPhysical ? form.shipping_postal_code.trim() : null,
      shippingNotes: isPhysical ? form.shipping_notes.trim() : null,
    })
    pendingOrderIdRef.current = orderId

    // Insert pending orders for selected bumps
    for (const bump of selectedBumps) {
      const base = bump.offered_product?.price || 0
      const bumpPrice = bump.discount_type === 'percentage'
        ? Math.round(base * (1 - bump.discount_value / 100))
        : bump.discount_type === 'fixed'
          ? Math.max(0, base - bump.discount_value)
          : base

      const bumpIsPhysical = bump.offered_product?.type === 'physical'

      await createPendingOrder({
        reference: `${ref}-bump-${bump.id}`,
        name, email, phone,
        productId: bump.offered_product_id,
        amount: bumpPrice,
        affiliateCode: affCode,
        affiliateId: affId,
        shippingName: bumpIsPhysical ? name : null,
        shippingPhone: bumpIsPhysical ? phone : null,
        shippingStreet: bumpIsPhysical ? form.shipping_street.trim() : null,
        shippingCity: bumpIsPhysical ? form.shipping_city.trim() : null,
        shippingState: bumpIsPhysical ? form.shipping_state.trim() : null,
        shippingCountry: bumpIsPhysical ? form.shipping_country : null,
        shippingPostalCode: bumpIsPhysical ? form.shipping_postal_code.trim() : null,
        shippingNotes: bumpIsPhysical ? form.shipping_notes.trim() : null,
      })
    }

    // Track payment attempt event in DB and Meta
    trackEvent('payment_attempt', {
      content_name: productTitle,
      value: finalTotal,
      currency: 'NGN',
      product_id: product?.id,
      email,
      name,
      phone
    })

    setLoading(false)
    paidRef.current = false

    try {
      const handler = window.PaystackPop.setup({
        key: paystackPublicKey,
        email,
        amount: finalTotal * 100,
        currency: 'NGN',
        ref,
        metadata: {
          custom_fields: [
            { display_name: 'Name',    variable_name: 'customer_name',  value: name },
            { display_name: 'Phone',   variable_name: 'phone',          value: phone },
            { display_name: 'Product', variable_name: 'product_title',  value: productTitle },
          ]
        },
        callback: (transaction) => {
          paidRef.current = true
          handleSuccess({ reference: transaction.reference || ref, userId, name, email, phone })
        },
        onClose: () => {
          if (!paidRef.current) {
            // Cancel all orders (main and bumps) sharing reference
            supabase.from('orders')
              .update({ status: 'cancelled' })
              .or(`reference.eq.${ref},reference.like.${ref}-bump-%`)
              .then(({ error }) => {
                if (error) console.error('[PaymentPage] Error cancelling orders:', error)
              })
            setLoading(false)
          }
        },
      })
      handler.openIframe()
    } catch (err) {
      console.error('[PaymentPage] Paystack SDK error:', err)
      alert('Could not start payment. Please check your internet connection and refresh the page.')
      setLoading(false)
    }
  }

  const handleSuccess = async ({ reference, userId, name, email, phone }) => {
    setLoading(true)
    try {
      trackEvent('purchase', {
        value: finalTotal,
        currency: 'NGN',
        content_name: productTitle,
        product_id: product?.id,
        email,
        name,
        phone,
        reference
      })

      localStorage.setItem('paid_customer', JSON.stringify({
        name, email, phone, ref: reference,
        product_id: product?.id,
        product_type: product?.type,
        product_title: productTitle,
        cover_image: product?.cover_image || null,
        amount: finalTotal,
        delivery_fee: deliveryFee,
        shipping_name: isPhysical ? name : null,
        shipping_phone: isPhysical ? phone : null,
        shipping_street: isPhysical ? form.shipping_street.trim() : null,
        shipping_city: isPhysical ? form.shipping_city.trim() : null,
        shipping_state: isPhysical ? form.shipping_state.trim() : null,
        shipping_country: isPhysical ? form.shipping_country : null,
        shipping_postal_code: isPhysical ? form.shipping_postal_code.trim() : null,
        shipping_notes: isPhysical ? form.shipping_notes.trim() : null,
      }))

      await completeOrder({
        reference,
        userId,
        productId: product?.id || null,
        productType: product?.type || (isEbook ? 'ebook' : 'physical'),
        name,
        phone,
      })

      localStorage.removeItem('checkout_name')
      localStorage.removeItem('checkout_email')
      localStorage.removeItem('checkout_phone')
      localStorage.removeItem('checkout_shipping_street')
      localStorage.removeItem('checkout_shipping_city')
      localStorage.removeItem('checkout_shipping_state')
      localStorage.removeItem('checkout_shipping_postal_code')
      localStorage.removeItem('checkout_shipping_notes')
      localStorage.removeItem('ecom_cart')
      window.dispatchEvent(new Event('cart_updated'))

      if (isPhysical && userId) {
        try {
          await updateProfileShipping({
            userId,
            street: form.shipping_street.trim(),
            city: form.shipping_city.trim(),
            state: form.shipping_state.trim(),
            postalCode: form.shipping_postal_code.trim(),
            phone: phone,
          })
        } catch (err) {
          console.warn('[PaymentPage] failed saving user default address:', err)
        }
      }
    } catch (err) {
      console.error('[PaymentPage] error during handleSuccess:', err)
    }

    setLoading(false)
    // Send order confirmation email (non-blocking)
    sendOrderConfirmed({
      name,
      email,
      phone,
      ref: reference,
      product_title: productTitle,
      product_type: product?.type,
      product_image: product?.cover_image,
      amount: finalTotal,
      payment_method: 'paystack',
      shipping_street: isPhysical ? form.shipping_street : undefined,
      shipping_city: isPhysical ? form.shipping_city : undefined,
      shipping_state: isPhysical ? form.shipping_state : undefined,
    })
    navigate('/success')
  }

  const displayBonuses = bonuses

  const renderSummaryContent = () => (
    <div className="shopify-summary-content">
      {/* Product Information */}
      <div className="shopify-product-row">
        <div className="shopify-thumbnail-container">
          <div className="shopify-thumbnail-wrapper">
            {product?.cover_image && !imgError ? (
              <img src={product.cover_image} alt={productTitle} onError={() => setImgError(true)} className="shopify-thumbnail-img" />
            ) : (
              <div className="shopify-thumbnail-fallback">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>
              </div>
            )}
            <span className="shopify-thumbnail-badge">{checkoutQuantity}</span>
          </div>
        </div>
        <div className="shopify-product-info">
          <h4 className="shopify-product-title">{productTitle}</h4>
          <span className="shopify-product-desc">
            {isEbook 
              ? 'Digital Download' 
              : isPhysical 
                ? (product?.free_delivery ? 'Physical Product — Free Delivery' : 'Physical Product') 
                : 'Digital Download'}
          </span>
          {checkoutQuantity > 1 && (
            <span className="shopify-product-desc" style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {checkoutQuantity} × {formatPrice(discountedPrice)} each
            </span>
          )}
        </div>
        <div className="shopify-product-price-col">
          <span className="shopify-item-price">{formatPrice(checkoutSubtotal)}</span>
        </div>
      </div>

      {/* Selected Order Bumps */}
      {selectedBumps.map(bump => {
        const base = bump.offered_product?.price || 0
        const bumpPrice = bump.discount_type === 'percentage'
          ? Math.round(base * (1 - bump.discount_value / 100))
          : bump.discount_type === 'fixed'
            ? Math.max(0, base - bump.discount_value)
            : base
        return (
          <div key={bump.id} className="shopify-product-row bump-summary-row" style={{ marginTop: -12, borderTop: '1px dashed #e6e6e6', paddingTop: 12 }}>
            <div className="shopify-thumbnail-container">
              <div className="shopify-thumbnail-wrapper" style={{ width: 48, height: 48 }}>
                {bump.offered_product?.cover_image ? (
                  <img src={bump.offered_product.cover_image} alt="" className="shopify-thumbnail-img" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div className="shopify-thumbnail-fallback" style={{ fontSize: 10 }}>Addon</div>
                )}
                <span className="shopify-thumbnail-badge">1</span>
              </div>
            </div>
            <div className="shopify-product-info">
              <h4 className="shopify-product-title" style={{ fontSize: 13 }}>{bump.headline}</h4>
              <span className="shopify-product-desc" style={{ fontSize: 11 }}>⚡ One-time Addon</span>
            </div>
            <div className="shopify-product-price-col" style={{ fontSize: 13 }}>
              <span>{formatPrice(bumpPrice)}</span>
            </div>
          </div>
        )
      })}

      {/* Bonuses */}
      {displayBonuses.length > 0 && (
        <div className="shopify-bonuses-box">
          <p className="shopify-section-label">Included Bonuses (Free)</p>
          {displayBonuses.map(b => (
            <div key={b} className="shopify-bonus-item">
              <span className="shopify-bonus-text">
                <span className="plus">+</span> {b}
              </span>
              <span className="shopify-free-badge">FREE</span>
            </div>
          ))}
        </div>
      )}

      {/* Coupon Field */}
      <div className="shopify-coupon-container">
        {!appliedCoupon ? (
          <div className="shopify-coupon-input-row">
            <div className="shopify-coupon-field-wrapper">
              <input
                type="text" 
                placeholder="Discount code"
                className="shopify-coupon-input"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponErr(''); setCouponOk('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (couponCode.trim()) applyCoupon();
                  }
                }}
                autoComplete="one-time-code"
                spellCheck="false"
                inputMode="text"
                name="coupon-input"
                id="coupon-input"
              />
            </div>
            <button
              type="button" 
              onClick={() => { if (couponCode.trim()) applyCoupon(); }}
              disabled={couponLoading || !couponCode.trim()}
              className="shopify-coupon-btn"
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          </div>
        ) : (
          <div className="shopify-applied-coupon-tag">
            <span className="tag-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              <strong>{appliedCoupon.code}</strong>
            </span>
            <button 
              type="button" 
              onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponErr(''); setCouponOk('') }}
              className="shopify-remove-coupon-btn"
            >
              ×
            </button>
          </div>
        )}
        {couponErr && <p className="shopify-coupon-err-msg">{couponErr}</p>}
        {couponOk && <p className="shopify-coupon-ok-msg">{couponOk}</p>}
      </div>

      {/* Subtotal, Shipping, Discount Calculations */}
      <div className="shopify-calculations-block">
        <div className="shopify-calc-row">
          <span>Subtotal</span>
          <span className="calc-value">{formatPrice(basePrice)}</span>
        </div>
        {appliedCoupon && (
          <div className="shopify-calc-row highlight-green">
            <span>Discount</span>
            <span className="calc-value">-{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : formatPrice(appliedCoupon.value)}</span>
          </div>
        )}
        {selectedBumps.length > 0 && (
          <div className="shopify-calc-row">
            <span>Add-ons</span>
            <span className="calc-value">{formatPrice(bumpsTotal)}</span>
          </div>
        )}
        <div className="shopify-calc-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            Shipping
          </span>
          <span className="calc-value" style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
            {deliveryFee === 0
              ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Free</>
              : formatPrice(deliveryFee)}
          </span>
        </div>

        
        <div className="shopify-total-row">
          <span className="total-label">Total</span>
          <div className="total-price-wrapper">
            <span className="total-currency">{currency}</span>
            <span className="total-amount">{formatPrice(finalTotal)}</span>
          </div>
        </div>
      </div>


      {/* Safe SSL Guarantee Box */}
      <div className="shopify-guarantee-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <p>Secure checkout. Your order will be processed and dispatched after payment confirmation.</p>
      </div>
    </div>
  )

  if (loadingProduct) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#ffffff', color: '#0f0d0a',
        fontFamily: "var(--font)", zIndex: 9999
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: 160, height: 160, background: 'radial-gradient(circle, rgba(197, 168, 128,0.15) 0%, rgba(197, 168, 128,0) 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(24px)', animation: 'ambient-glow 3s ease-in-out infinite' }} />
          <img src="/logo_black.png" alt={localStorage.getItem('brandName') || 'SAINT GLOBAL SOLAR'} style={{ height: 100, width: 'auto', maxWidth: 280, objectFit: 'contain', marginBottom: 36, filter: 'drop-shadow(0 0 10px rgba(197, 168, 128,0.1))', animation: 'logo-pulse 2.2s ease-in-out infinite' }} />
          <div className="premium-spinner" />
          <p style={{ color: '#64748b', marginTop: 16, fontSize: '14px', letterSpacing: '0.5px', position: 'relative', zIndex: 1 }}>Loading checkout...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .premium-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(15, 23, 42, 0.05);
            border-top-color: var(--gold);
            border-right-color: #e3d5c1;
            border-radius: 50%;
            animation: spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes logo-pulse {
            0%, 100% { transform: scale(1); opacity: 0.85; filter: drop-shadow(0 0 8px rgba(36, 106, 66,0.1)); }
            50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 16px rgba(36, 106, 66,0.3)); }
          }
          @keyframes ambient-glow {
            0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          }
        `}} />
      </div>
    )
  }

  return (
    <div className="sp-checkout-root">
      <style>{`
        /* SHOPIFY THEME CUSTOMIZATION VARIABLES */
        .sp-checkout-root {
          font-family: var(--font), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          min-height: 100vh;
          color: #333333;
          overflow-x: hidden;
        }

        /* GRID LAYOUT */
        .sp-checkout-layout {
          display: grid;
          grid-template-columns: 1fr;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media(min-width: 1000px) {
          .sp-checkout-layout {
            grid-template-columns: 1.15fr 0.85fr;
            min-height: 100vh;
          }
        }

        /* LEFT PANEL (Billing / Information) */
        .sp-left-panel {
          padding: 32px 24px 10px;
          background: #ffffff;
        }
        @media(min-width: 1000px) {
          .sp-left-panel {
            padding: 56px 48px 56px 24px;
            border-right: 1px solid #e6e6e6;
          }
        }
        .sp-logo-wrapper {
          margin-bottom: 24px;
        }
        .sp-logo {
          max-height: 58px;
          width: auto;
        }
        
        /* BREADCRUMB */
        .sp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #707070;
          margin-bottom: 28px;
        }
        .sp-breadcrumb a, .sp-breadcrumb span {
          color: #707070;
        }
        .sp-breadcrumb span.active {
          color: #1a1a1a;
          font-weight: 600;
        }
        .sp-breadcrumb .arrow-separator {
          color: #a0a0a0;
          font-size: 10px;
        }

        /* SECTION TITLE */
        .sp-section-title {
          font-family: 'Asimov', var(--font-heading), sans-serif !important;
          font-size: 17.5px;
          font-weight: 900;
          color: #1a1a1a;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sp-section-sub-link {
          font-family: var(--font), sans-serif !important;
          font-size: 13px;
          color: var(--g600);
          text-decoration: none;
          font-weight: 400 !important;
        }

        /* CONTACT FORM BLOCK */
        .sp-form-card {
          margin-bottom: 36px;
        }
        .sp-input-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* SHOPIFY INPUT FIELD STYLING */
        .sp-field-group {
          position: relative;
          width: 100%;
        }
        .sp-input-container {
          position: relative;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sp-input-container:hover {
          border-color: #cbd5e1;
        }
        .sp-field-group.focused .sp-input-container {
          background: #ffffff;
          border-color: var(--g600);
          box-shadow: 0 0 0 4px rgba(36, 106, 66, 0.12) !important;
        }
        .sp-field-group.has-error .sp-input-container {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
        }
        .sp-input {
          width: 100% !important;
          padding: 24px 14px 8px !important;
          font-size: 14.5px !important;
          border: none !important;
          border-radius: 10px !important;
          background: transparent !important;
          background-color: transparent !important;
          outline: none !important;
          color: #1e293b !important;
          height: 54px !important;
          box-shadow: none !important;
          font-weight: 500 !important;
          line-height: 1.1 !important;
          box-sizing: border-box !important;
          transition: all 0.2s ease;
        }
        .sp-input::placeholder {
          color: transparent !important;
          transition: color 0.15s ease !important;
        }
        .sp-input:focus::placeholder {
          color: #94a3b8 !important;
        }
        .sp-label {
          position: absolute;
          left: 14px;
          top: 17px;
          font-size: 14px;
          color: #64748b;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          font-weight: 500;
        }
        .sp-field-group.focused .sp-label,
        .sp-field-group.has-value .sp-label,
        .sp-input:focus + .sp-label {
          transform: translateY(-9px) !important;
          font-size: 11px !important;
          top: 15px !important;
          color: #64748b;
          font-weight: 600;
        }
        .sp-field-group.focused .sp-label {
          color: var(--g600);
        }
        .sp-field-group.has-error .sp-label {
          color: #ef4444;
        }
        .sp-label-hint {
          font-size: 9.5px;
          color: #94a3b8;
          margin-left: 6px;
          font-weight: normal;
        }
        .sp-pwd-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #707070;
          display: flex;
          align-items: center;
          padding: 0;
        }
        .sp-field-right-elem {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
        .sp-field-error-msg {
          font-size: 12px;
          color: #ff3838;
          margin: 4px 0 0;
          padding-left: 2px;
        }

        /* AUTO DETECTING ACCOUNTS BOXES */
        .sp-detect-box {
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .sp-detect-box.warn {
          background: #fffbef;
          border: 1px solid #fceca7;
          color: #6a4d04;
        }
        .sp-detect-box.info {
          background: #f4f8ff;
          border: 1px solid #d4e5ff;
          color: #1a4480;
        }
        .sp-detect-box p {
          margin: 0 0 6px;
          font-weight: 600;
          font-size: 14px;
        }
        .sp-detect-box small {
          display: block;
          margin-bottom: 12px;
          color: inherit;
          opacity: 0.85;
        }

        /* EXPRESS CHECKOUT SEPARATOR */
        .sp-checkout-separator {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 24px 0;
          color: #707070;
          font-size: 12px;
        }
        .sp-checkout-separator::before, .sp-checkout-separator::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e6e6e6;
        }
        .sp-checkout-separator:not(:empty)::before {
          margin-right: 12px;
        }
        .sp-checkout-separator:not(:empty)::after {
          margin-left: 12px;
        }

        /* PAYMENT BLOCK STYLING */
        .sp-payment-container {
          border: 1px solid #d9d9d9;
          border-radius: 5px;
          overflow: hidden;
          background: #ffffff;
        }
        .sp-payment-header {
          background: #fbfbfb;
          padding: 14px 16px;
          border-bottom: 1px solid #e6e6e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .sp-payment-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          font-size: 14px;
        }
        .sp-payment-header-right {
          display: flex;
          gap: 6px;
        }
        @media(max-width: 550px) {
          .sp-payment-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .sp-payment-header-right {
            padding-left: 24px;
          }
        }
        .sp-payment-body {
          padding: 18px 16px;
          background: #fcfcfc;
          border-bottom: 1px solid #e6e6e6;
        }
        .sp-payment-body p {
          font-size: 13.5px;
          color: #606060;
          margin: 0;
          line-height: 1.5;
        }
        .sp-payment-footer {
          padding: 18px 16px;
          background: #ffffff;
        }

        /* SUBMIT BUTTON */
        .sp-submit-btn {
          width: 100%;
          padding: 16px;
          background: var(--g800);
          color: #ffffff;
          border-radius: 5px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: none;
        }
        .sp-submit-btn:hover {
          background: var(--g900);
        }
        .sp-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* LOGGED IN STRIP */
        .sp-logged-in-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f4fdf8;
          border: 1px solid #cef1dc;
          border-radius: 5px;
          padding: 10px 14px;
          margin-bottom: 18px;
          font-size: 13px;
          color: #1e7040;
        }
        .sp-logout-btn {
          background: none;
          border: none;
          color: #dc2626;
          font-weight: 600;
          cursor: pointer;
          font-size: 12.5px;
          text-decoration: underline;
        }

        /* RIGHT PANEL (Order Summary) */
        .sp-right-panel {
          display: none;
          background: #fafafa;
          padding: 32px 24px;
          border-top: 1px solid #e6e6e6;
        }
        @media(min-width: 1000px) {
          .sp-right-panel {
            display: block;
            padding: 56px 24px 56px 48px;
            border-top: none;
            min-height: 100vh;
            position: sticky;
            top: 0;
            background: #fafafa;
          }
          .sp-right-panel::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: -2000px;
            background: #fafafa;
            z-index: -1;
            pointer-events: none;
          }
        }

        /* SHOPIFY ORDER SUMMARY STYLING */
        .shopify-product-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .shopify-thumbnail-container {
          flex-shrink: 0;
        }
        .shopify-thumbnail-wrapper {
          position: relative;
          width: 64px;
          height: 64px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shopify-thumbnail-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        }
        .shopify-thumbnail-fallback {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--g700), var(--g500));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shopify-thumbnail-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          background: #808080;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }
        .shopify-product-info {
          flex: 1;
          min-width: 0;
        }
        .shopify-product-title {
          font-size: 14px;
          font-weight: 500;
          color: #333333;
          margin: 0 0 4px;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .shopify-product-desc {
          font-size: 12px;
          color: #707070;
          display: block;
        }
        .shopify-product-price-col {
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 500;
          color: #333333;
        }

        /* BONUSES BOX */
        .shopify-bonuses-box {
          border-top: 1px solid #e6e6e6;
          padding: 16px 0;
          margin-bottom: 8px;
        }
        .shopify-section-label {
          font-size: 11.5px;
          font-weight: 600;
          color: #707070;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 10px;
        }
        .shopify-bonus-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          padding: 4px 0;
          color: #444444;
        }
        .shopify-bonus-text .plus {
          color: #16a34a;
          font-weight: bold;
        }
        .shopify-free-badge {
          font-size: 9px;
          font-weight: 700;
          background: #eefdf4;
          border: 1px solid #bcf1cc;
          color: #16a34a;
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* COUPON */
        .shopify-coupon-container {
          border-top: 1px solid #e6e6e6;
          padding: 18px 0;
        }
        .shopify-coupon-input-row {
          display: flex;
          gap: 12px;
        }
        .shopify-coupon-field-wrapper {
          flex: 1;
        }
        .shopify-coupon-input {
          width: 100%;
          height: 40px;
          padding: 8px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 5px;
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.2s;
        }
        .shopify-coupon-input:focus {
          border-color: var(--g600);
        }
        .shopify-coupon-btn {
          height: 40px;
          padding: 0 16px;
          background: #e6e6e6;
          color: #545454;
          border: none;
          border-radius: 5px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }
        .shopify-coupon-btn:not(:disabled) {
          background: #808080;
          color: #ffffff;
        }
        .shopify-coupon-btn:not(:disabled):hover {
          background: #606060;
        }
        .shopify-coupon-btn:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }
        .shopify-applied-coupon-tag {
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 4px;
          padding: 6px 12px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: #545454;
        }
        .tag-left {
          display: flex;
          align-items: center;
        }
        .shopify-remove-coupon-btn {
          background: none;
          border: none;
          color: #707070;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .shopify-remove-coupon-btn:hover {
          color: #1a1a1a;
        }
        .shopify-coupon-err-msg {
          color: #ff3838;
          font-size: 12px;
          margin: 6px 0 0;
        }
        .shopify-coupon-ok-msg {
          color: #16a34a;
          font-size: 12px;
          margin: 6px 0 0;
        }

        /* CALCULATIONS BLOCK */
        .shopify-calculations-block {
          border-top: 1px solid #e6e6e6;
          padding: 16px 0;
        }
        .shopify-calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          color: #545454;
          margin-bottom: 8px;
        }
        .shopify-calc-row.highlight-green {
          color: #16a34a;
        }
        .shopify-calc-row .calc-value {
          font-weight: 500;
        }
        .shopify-calc-row .calc-value.text-muted {
          color: #707070;
        }
        .shopify-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e6e6e6;
        }
        .total-label {
          font-size: 16px;
          font-weight: 500;
          color: #333333;
        }
        .total-price-wrapper {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .total-currency {
          font-size: 11px;
          color: #707070;
        }
        .total-amount {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
        }

        /* SECURE GUARANTEE BOX */
        .shopify-guarantee-box {
          margin-top: 24px;
          display: flex;
          gap: 12px;
          background: #f4f6f8;
          border: 1px solid #e6e6e6;
          border-radius: 5px;
          padding: 12px 14px;
        }
        .shopify-guarantee-box p {
          font-size: 12px;
          color: #545454;
          margin: 0;
          line-height: 1.5;
        }

        /* MOBILE OVERLAY / DRAWER COLLAPSIBLE */
        .sp-mobile-summary-bar {
          display: flex;
          background: #fafafa;
          border-bottom: 1px solid #e6e6e6;
          padding: 16px 24px;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .sp-mobile-summary-bar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: var(--g600);
        }
        .sp-mobile-summary-bar-price {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .sp-mobile-summary-drawer {
          display: none;
          background: #fafafa;
          border-bottom: 1px solid #e6e6e6;
          padding: 24px 24px;
          animation: drawerSlide 0.25s ease-out;
        }
        .sp-mobile-summary-drawer.open {
          display: block;
        }
        @keyframes drawerSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media(min-width: 1000px) {
          .sp-mobile-summary-bar {
            display: none;
          }
          .sp-mobile-summary-drawer {
            display: none !important;
          }
        }

        /* SPINNER */
        .sp-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .sp-email-checking {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #707070;
          margin-top: 6px;
          padding-left: 2px;
        }
        .sp-email-checking-spinner {
          width: 10px;
          height: 10px;
          border: 1.5px solid rgba(0,0,0,0.1);
          border-top-color: var(--g600);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .sp-checkout-footer {
          margin-top: 10px;
          border-top: 1px solid #e6e6e6;
          padding-top: 16px;
          display: flex;
          gap: 14px;
          font-size: 11px;
          color: #707070;
        }
        .sp-checkout-footer a {
          color: #707070;
          text-decoration: none;
        }
        .sp-checkout-footer a:hover {
          color: #1a1a1a;
          text-decoration: underline;
        }
      `}</style>

      {/* Mobile Sticky summary header */}
      <div className="sp-mobile-summary-bar" onClick={() => setSummaryOpen(!summaryOpen)}>
        <div className="sp-mobile-summary-bar-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/></svg>
          <span>{summaryOpen ? 'Hide order summary' : 'Show order summary'}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: summaryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <span className="sp-mobile-summary-bar-price">{formatPrice(finalTotal)}</span>
      </div>
      
      {/* Mobile dropdown cart details */}
      <div className={`sp-mobile-summary-drawer ${summaryOpen ? 'open' : ''}`}>
        {renderSummaryContent()}
      </div>

      <div className="sp-checkout-layout">
        
        {/* LEFT COLUMN: CONTACT, SHIPPING, PAYMENT (WHITE BACK) */}
        <div className="sp-left-panel">
          
          {/* Logo */}
          <div className="sp-logo-wrapper">
            <Link to="/">
              <img src="/logo_black.png" alt="SAINT GLOBAL SOLAR" className="sp-logo" onError={e => { e.currentTarget.style.display = 'none' }} />
            </Link>
          </div>

          {/* Breadcrumb breadcrumb */}
          <nav className="sp-breadcrumb">
            <Link to="/">Home</Link>
            <span className="arrow-separator">›</span>
            <span className="active">Information</span>
            <span className="arrow-separator">›</span>
            <span>Payment</span>
          </nav>

          {/* Contact Information block */}
          <form onSubmit={e => { e.preventDefault(); pay(); }}>
            <div className="sp-form-card">
              <h3 className="sp-section-title">
                Contact Information
                {!user && <Link to="/login" className="sp-section-sub-link">Already have an account? Log in</Link>}
              </h3>

              {/* Logged in state */}
              {user && (
                <div className="sp-logged-in-strip">
                  <span>Logged in as <strong>{user.email}</strong></span>
                  <button type="button" onClick={() => supabase.auth.signOut()} className="sp-logout-btn">Log out</button>
                </div>
              )}

              <div className="sp-input-stack">
                <Field 
                  id="email" 
                  label="Email address" 
                  hint={isEbook ? ' (For downloading delivery)' : ' (For order updates)'} 
                  type="email" 
                  placeholder="chioma@gmail.com" 
                  val={form.email} 
                  err={errors.email} 
                  disabled={!!user} 
                  onChange={v => set('email', v)} 
                />

                {checkingEmail && (
                  <div className="sp-email-checking">
                    <span className="sp-email-checking-spinner" />
                    <span>Checking database...</span>
                  </div>
                )}

                {/* Inline authentication detected - user must input password */}
                {!user && emailExists && !checkingEmail && (
                  <div className="sp-detect-box warn">
                    <p>Existing Account Detected</p>
                    <small>You already have a customer profile. Enter your password to authenticate this purchase.</small>
                    <Field
                      id="inline-login-pw"
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      val={loginPassword}
                      err={errors.loginPassword || loginError}
                      onChange={v => { setLoginPassword(v); setLoginError(''); setErrors(er => ({ ...er, loginPassword: '' })) }}
                      right={<a href="/forgot-password" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--g600)', textDecoration: 'none', fontWeight: 600 }}>Forgot?</a>}
                    />
                  </div>
                )}

                {/* New User detected - create password */}
                {!user && !emailExists && !checkingEmail && form.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) && (
                  <div className="sp-detect-box info">
                    <p>Create Your Account</p>
                    <small>Create a password to track your order, manage returns and access your purchase history.</small>
                    <Field
                      id="guest-pw"
                      label="Create account password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      val={guestPassword}
                      err={errors.password}
                      onChange={v => { setGuestPassword(v); if (errors.password) setErrors(e => ({ ...e, password: '' })) }}
                    />
                  </div>
                )}

                <Field 
                  id="name" 
                  label="Full name" 
                  placeholder="Chioma Adeyemi" 
                  val={form.name} 
                  err={errors.name} 
                  disabled={!!user} 
                  onChange={v => set('name', v)} 
                />

                <Field 
                  id="phone" 
                  label="Phone number (WhatsApp active)" 
                  type="tel" 
                  placeholder="08031234567" 
                  val={form.phone} 
                  err={errors.phone} 
                  onChange={v => set('phone', v)} 
                />

                {isPhysical && (
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', margin: '12px 0 6px' }}>Shipping Address</h4>
                    <Field 
                      id="shipping_street" 
                      label="Street address" 
                      placeholder="12, Allen Avenue" 
                      val={form.shipping_street} 
                      err={errors.shipping_street} 
                      onChange={v => set('shipping_street', v)} 
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <Field 
                        id="shipping_city" 
                        label="City" 
                        placeholder="Ikeja" 
                        val={form.shipping_city} 
                        err={errors.shipping_city} 
                        onChange={v => set('shipping_city', v)} 
                      />
                      <Field 
                        id="shipping_state" 
                        label="State / Region" 
                        placeholder="Lagos" 
                        val={form.shipping_state} 
                        err={errors.shipping_state} 
                        onChange={v => set('shipping_state', v)} 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <Field 
                        id="shipping_postal_code" 
                        label="Postal / Zip code" 
                        placeholder="100001" 
                        val={form.shipping_postal_code} 
                        err={errors.shipping_postal_code} 
                        onChange={v => set('shipping_postal_code', v)} 
                      />
                      <div className="sp-field-group">
                        <div className="sp-input-container" style={{ background: '#f8fafc', borderColor: '#e2e8f0', position: 'relative' }}>
                          <select 
                            value={form.shipping_country} 
                            onChange={e => set('shipping_country', e.target.value)} 
                            className="sp-input"
                            style={{
                              width: '100%',
                              padding: '24px 14px 8px',
                              fontSize: '14.5px',
                              border: 'none',
                              borderRadius: '10px',
                              background: 'transparent',
                              outline: 'none',
                              color: '#1e293b',
                              height: '54px',
                              fontWeight: '500',
                              appearance: 'none',
                              backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 14px center',
                              backgroundSize: '16px'
                            }}
                          >
                            {ALL_COUNTRIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <label className="sp-label" style={{ transform: 'translateY(-9px)', fontSize: '11px', top: '15px', fontWeight: '600' }}>Country</label>
                        </div>
                      </div>
                    </div>
                    <Field 
                      id="shipping_notes" 
                      label="Order notes / delivery instructions (optional)" 
                      placeholder="E.g. Deliver to receptionist" 
                      val={form.shipping_notes} 
                      onChange={v => set('shipping_notes', v)} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Order Bump Section */}
            <OrderBump 
              triggerProductId={product?.id} 
              onBumpsChange={setSelectedBumps} 
              currentTotal={discountedPrice} 
            />

            {/* Payment Section */}
            <div className="sp-form-card">
              <h3 className="sp-section-title">Payment Method</h3>
              
              {/* Paystack Option */}
              <div className="sp-payment-container" style={{ marginBottom: 12, border: paymentMethod === 'paystack' ? '2px solid var(--brand-primary, #0f0d0a)' : '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', margin: 0, width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input 
                      type="radio" 
                      name="payment_method"
                      checked={paymentMethod === 'paystack'} 
                      onChange={() => setPaymentMethod('paystack')}
                      style={{ accentColor: 'var(--brand-primary, #0f0d0a)', cursor: 'pointer', width: 18, height: 18 }} 
                    />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Secure Paystack Gateway</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#707070', fontWeight: 500 }}>CARDS &bull; TRANSFER &bull; USSD</span>
                </label>
                
                {paymentMethod === 'paystack' && (
                  <div className="sp-payment-body" style={{ background: '#f8fafc', padding: 16, borderTop: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>After clicking "Complete Payment", you will be redirected to the secure Paystack checkout pop-up to authorize your payment instantly using your card, bank transfer, or USSD.</p>
                  </div>
                )}
              </div>

              {/* Bank Transfer Option */}
              <div className="sp-payment-container" style={{ border: paymentMethod === 'bank_transfer' ? '2px solid var(--brand-primary, #0f0d0a)' : '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', margin: 0, width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input 
                      type="radio" 
                      name="payment_method"
                      checked={paymentMethod === 'bank_transfer'} 
                      onChange={() => setPaymentMethod('bank_transfer')}
                      style={{ accentColor: 'var(--brand-primary, #0f0d0a)', cursor: 'pointer', width: 18, height: 18 }} 
                    />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Manual Bank Transfer (Direct Upload)</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#707070', fontWeight: 500 }}>BANK UPLOAD &bull; MANUAL REVIEW</span>
                </label>
                
                {paymentMethod === 'bank_transfer' && (
                  <div className="sp-payment-body" style={{ background: '#f8fafc', padding: 16, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                      Please make a transfer of <strong style={{ color: '#0f172a' }}>₦{finalTotal.toLocaleString()}{currency !== 'NGN' ? ` (approx. ${formatPrice(finalTotal)})` : ''}</strong> to any of the bank accounts listed below, then upload a clear screenshot of your payment receipt.
                    </p>

                    {/* Bank list */}
                    {bankAccounts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>Our Bank Accounts</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {bankAccounts.map((acc, idx) => (
                            <div key={idx} style={{ paddingBottom: idx < bankAccounts.length - 1 ? 10 : 0, borderBottom: idx < bankAccounts.length - 1 ? '1px dashed #cbd5e1' : 'none' }}>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand-primary, #0f0d0a)' }}>{acc.bank_name}</div>
                              <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                                Account Number: <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{acc.account_number}</strong>
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Account Name: {acc.account_name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 6, color: '#b91c1c', fontSize: 12.5, fontWeight: 500 }}>
                        ⚠️ Direct bank transfer details are not configured by the admin yet. Please check back later or use Paystack.
                      </div>
                    )}

                    {/* File Upload Input */}
                    {bankAccounts.length > 0 && (
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#3c4257', marginBottom: 6 }}>Upload Payment Receipt (Screenshot/Receipt Image) *</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <input 
                            type="file" 
                            accept="image/*,application/pdf"
                            onChange={handleReceiptUpload}
                            id="receipt-uploader"
                            style={{ display: 'none' }}
                          />
                          <button 
                            type="button" 
                            onClick={() => document.getElementById('receipt-uploader').click()}
                            disabled={uploadingReceipt}
                            style={{ 
                              padding: '8px 14px', 
                              background: '#fff', 
                              border: '1px solid #cbd5e1', 
                              borderRadius: '6px', 
                              cursor: 'pointer', 
                              fontSize: '12.5px', 
                              fontWeight: 600, 
                              color: '#1e293b',
                              transition: 'all 0.15s' 
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >
                            {uploadingReceipt ? 'Uploading...' : 'Choose File'}
                          </button>
                          <span style={{ fontSize: '12.5px', color: receiptUrl ? '#16a34a' : '#64748b', fontWeight: receiptUrl ? 600 : 400 }}>
                            {uploadingReceipt ? 'Uploading receipt...' : receiptUrl ? `✓ Receipt uploaded: ${receiptName || 'File'}` : 'No file selected'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cash on Delivery Option */}
              {enableCod && isPhysical && (
                <div className="sp-payment-container" style={{ marginTop: 12, border: paymentMethod === 'cod' ? '2px solid var(--brand-primary, #0f0d0a)' : '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', margin: 0, width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input 
                        type="radio" 
                        name="payment_method"
                        checked={paymentMethod === 'cod'} 
                        onChange={() => setPaymentMethod('cod')}
                        style={{ accentColor: 'var(--brand-primary, #0f0d0a)', cursor: 'pointer', width: 18, height: 18 }} 
                      />
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>Cash on Delivery (COD)</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#707070', fontWeight: 500 }}>PAY UPON DELIVERY</span>
                  </label>
                  
                  {paymentMethod === 'cod' && (
                    <div className="sp-payment-body" style={{ background: '#f8fafc', padding: 16, borderTop: '1px solid #e2e8f0' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>Pay cash or perform a local mobile transfer directly to the dispatcher upon receiving and confirming your items. Please ensure you enter a valid delivery address above.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Submit footer area */}
              <div className="sp-payment-footer" style={{ marginTop: 20 }}>
                {emailExists && !user && (
                  <p style={{ fontSize: '12.5px', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '10px 12px', marginBottom: 14 }}>
                    ⚠️ Please fill in your account password above to authorize payment processing.
                  </p>
                )}
                
                <button
                  type="submit" 
                  disabled={loading || (emailExists && !user && !loginPassword) || (paymentMethod === 'bank_transfer' && !receiptUrl)}
                  className="sp-submit-btn"
                  style={{
                    background: 'var(--brand-primary, #0f0d0a)',
                    color: '#fff',
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: (loading || (paymentMethod === 'bank_transfer' && !receiptUrl)) ? 'not-allowed' : 'pointer',
                    border: 'none',
                    transition: 'all 0.2s',
                    opacity: (paymentMethod === 'bank_transfer' && !receiptUrl) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {loading ? (
                    <>
                      <span className="sp-spinner" />
                      <span>{paymentMethod === 'bank_transfer' ? 'Submitting Receipt...' : paymentMethod === 'cod' ? 'Placing Order...' : 'Securing Connection...'}</span>
                    </>
                  ) : (
                    <span>
                      {paymentMethod === 'bank_transfer' 
                        ? `Submit Bank Receipt — ${formatPrice(finalTotal)} (₦${finalTotal.toLocaleString()})`
                        : paymentMethod === 'cod'
                          ? `Place Order (Cash on Delivery) — ${formatPrice(finalTotal)} (₦${finalTotal.toLocaleString()})`
                          : `Complete Payment — ${formatPrice(finalTotal)}`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Footer policies Shopify style */}
          <footer className="sp-checkout-footer">
            <Link to="/refund" target="_blank">Refund policy</Link>
            <Link to="/privacy" target="_blank">Privacy policy</Link>
            <Link to="/terms" target="_blank">Terms of service</Link>
            <Link to="/contact" target="_blank">Contact details</Link>
          </footer>

        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY (GREY BACK) */}
        <div className="sp-right-panel">
          {renderSummaryContent()}
        </div>

      </div>
    </div>
  )
}

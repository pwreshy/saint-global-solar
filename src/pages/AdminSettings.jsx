import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminSettings() {
  const { user, profile, refreshProfile } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // Profile fields
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Password fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Platform styling fields
  const [brandName, setBrandName] = useState('Amplified Skills')
  const [supportEmail, setSupportEmail] = useState('support@amplifiedskills.com')

  // Feature Toggles
  const [enableAcademics, setEnableAcademics] = useState(false)
  const [enableAffiliates, setEnableAffiliates] = useState(true)
  const [enablePayouts, setEnablePayouts] = useState(true)
  const [enableUpsells, setEnableUpsells] = useState(true)

  // Payment Configuration fields
  const [paystackPublicKey, setPaystackPublicKey] = useState('')
  const [paystackSecretKey, setPaystackSecretKey] = useState('')
  const [stripePublicKey, setStripePublicKey] = useState('')
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [resendApiKey, setResendApiKey] = useState('')
  const [enableCod, setEnableCod] = useState(false)
  const [enablePaystack, setEnablePaystack] = useState(true)
  const [enableBankTransfer, setEnableBankTransfer] = useState(true)

  // Multi-Currency settings
  const [enableMultiCurrency, setEnableMultiCurrency] = useState(false)
  const [usdRate, setUsdRate] = useState(1500)
  const [eurRate, setEurRate] = useState(1650)
  const [gbpRate, setGbpRate] = useState(1950)

  // Bank Account settings
  const [bankAccounts, setBankAccounts] = useState([])
  const [newBankName, setNewBankName] = useState('')
  const [newAccNum, setNewAccNum] = useState('')
  const [newAccName, setNewAccName] = useState('')

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  useEffect(() => {
    async function loadPlatformSettings() {
      try {
        const { data } = await supabase.from('settings').select('*')
        if (data) {
          const siteConfig = data.find(s => s.id === 'site_config')
          if (siteConfig?.value) {
            setBrandName(siteConfig.value.platform_name || 'SAINT GLOBAL SOLAR')
            setSupportEmail(siteConfig.value.support_email || 'support@saintglobalsolar.com')
            setEnableAcademics(siteConfig.value.enable_academics ?? false)
            setEnableAffiliates(siteConfig.value.enable_affiliates ?? true)
            setEnablePayouts(siteConfig.value.enable_payouts ?? true)
            setEnableUpsells(siteConfig.value.enable_upsells ?? true)
          }
          const payConfig = data.find(s => s.id === 'payment_config')
          if (payConfig?.value) {
            setPaystackPublicKey(payConfig.value.paystack_public_key || '')
            setPaystackSecretKey(payConfig.value.paystack_secret_key || '')
            setStripePublicKey(payConfig.value.stripe_public_key || '')
            setStripeSecretKey(payConfig.value.stripe_secret_key || '')
            setResendApiKey(payConfig.value.resend_api_key || '')
            setEnableCod(!!payConfig.value.enable_cod)
            setEnablePaystack(payConfig.value.enable_paystack !== false)
            setEnableBankTransfer(payConfig.value.enable_bank_transfer !== false)
          }
          const currencyConfig = data.find(s => s.id === 'currency_config')
          if (currencyConfig?.value) {
            setEnableMultiCurrency(!!currencyConfig.value.enable_multi_currency)
            if (currencyConfig.value.rates) {
              setUsdRate(currencyConfig.value.rates.USD || 1500)
              setEurRate(currencyConfig.value.rates.EUR || 1650)
              setGbpRate(currencyConfig.value.rates.GBP || 1950)
            }
          }
          const bankConfig = data.find(s => s.id === 'bank_config')
          if (bankConfig?.value?.accounts) {
            setBankAccounts(bankConfig.value.accounts)
          } else {
            setBankAccounts([])
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadPlatformSettings()
  }, [])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Compress avatar client-side (max 400x400 resolution, quality 0.85)
      const compressedFile = await compressImage(file, 400, 400, 0.85)

      const fileExt = compressedFile.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Try uploading to Supabase Storage in 'avatars' bucket first
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { upsert: true })

      if (!uploadError && data) {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        setAvatarUrl(publicUrl)
        setMessage('Avatar uploaded successfully! Click Save Profile to apply.')
      } else {
        // 2. Fallback to base64 Data URL if bucket upload is not configured or blocked
        console.warn('Storage upload failed, falling back to Base64:', uploadError?.message)
        const reader = new FileReader()
        reader.onloadend = () => {
          setAvatarUrl(reader.result)
          setMessage('Avatar loaded locally. Save profile to persist.')
        }
        reader.readAsDataURL(compressedFile)
      }
    } catch (err) {
      console.error(err)
      setError('Error uploading avatar. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl
        })
        .eq('id', user.id)

      if (updateErr) throw updateErr
      if (refreshProfile) refreshProfile()
      setMessage('Profile settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlatform = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    try {
      // 1. Update site_config
      const { error: err1 } = await supabase
        .from('settings')
        .upsert({
          id: 'site_config',
          value: {
            platform_name: brandName.trim(),
            support_email: supportEmail.trim(),
            refund_days: 30,
            enable_academics: enableAcademics,
            enable_affiliates: enableAffiliates,
            enable_payouts: enablePayouts,
            enable_upsells: enableUpsells
          },
          updated_at: new Date().toISOString()
        })

      // 2. Update payment_config
      const { error: err2 } = await supabase
        .from('settings')
        .upsert({
          id: 'payment_config',
          value: {
            paystack_public_key: paystackPublicKey.trim(),
            paystack_secret_key: paystackSecretKey.trim(),
            stripe_public_key: stripePublicKey.trim(),
            stripe_secret_key: stripeSecretKey.trim(),
            resend_api_key: resendApiKey.trim(),
            enable_cod: enableCod,
            enable_paystack: enablePaystack,
            enable_bank_transfer: enableBankTransfer
          },
          updated_at: new Date().toISOString()
        })

      // 3. Update currency_config
      const { error: err3 } = await supabase
        .from('settings')
        .upsert({
          id: 'currency_config',
          value: {
            enable_multi_currency: enableMultiCurrency,
            rates: {
              NGN: 1,
              USD: Number(usdRate) || 1500,
              EUR: Number(eurRate) || 1650,
              GBP: Number(gbpRate) || 1950
            }
          },
          updated_at: new Date().toISOString()
        })

      if (err1) throw err1
      if (err2) throw err2
      if (err3) throw err3

      // Save in localStorage for immediate sync in frontend header
      localStorage.setItem('brandName', brandName.trim())
      localStorage.setItem('supportEmail', supportEmail.trim())
      localStorage.setItem('enable_academics', enableAcademics)
      localStorage.setItem('enable_affiliates', enableAffiliates)
      localStorage.setItem('enable_payouts', enablePayouts)
      localStorage.setItem('enable_upsells', enableUpsells)

      // Dispatch custom event to notify parent AdminDashboard
      window.dispatchEvent(new Event('brand_settings_updated'))

      setMessage('Platform settings & API credentials updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBankAccount = (e) => {
    if (e) e.preventDefault()
    if (!newBankName.trim() || !newAccNum.trim() || !newAccName.trim()) {
      setError('Please fill in all bank details before adding.')
      return
    }
    setBankAccounts(prev => [
      ...prev,
      {
        bank_name: newBankName.trim(),
        account_number: newAccNum.trim(),
        account_name: newAccName.trim()
      }
    ])
    setNewBankName('')
    setNewAccNum('')
    setNewAccName('')
    setError('')
  }

  const handleRemoveBankAccount = (idx) => {
    setBankAccounts(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateBankSettings = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const { error: err } = await supabase
        .from('settings')
        .upsert({
          id: 'bank_config',
          value: { accounts: bankAccounts },
          updated_at: new Date().toISOString()
        })
      if (err) throw err
      setMessage('Bank account settings updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { error: pwErr } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (pwErr) throw pwErr
      setMessage('Admin credentials updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isDesktop = windowWidth >= 1024

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'var(--font)' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36', margin: 0 }}>Platform Settings</h2>
        <p style={{ color: '#697386', marginTop: 4, fontSize: 13.5 }}>Configure branding guidelines, payment gateway settings, and admin credentials.</p>
      </div>

      {message && <div style={{ padding: 12, background: '#e3fcef', color: '#00875a', borderRadius: 6, marginBottom: 24, fontWeight: 500, fontSize: 13, border: '1px solid #c3f2d7' }}>{message}</div>}
      {error && <div style={{ padding: 12, background: '#ffebe6', color: '#ae2a19', borderRadius: 6, marginBottom: 24, fontWeight: 500, fontSize: 13, border: '1px solid #ffd2ca' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.8fr 1fr' : '1fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left Column: Form Settings Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Admin Profile Form */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#1a1f36' }}>Admin Profile Settings</h3>
            
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Profile Avatar Selection Widget */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
                <img 
                  src={avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                  alt="Avatar Preview" 
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e3e8ee' }}
                />
                <div>
                  <label 
                    htmlFor="avatar-upload"
                    style={{ 
                      display: 'inline-block',
                      background: '#fff', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: 4, 
                      padding: '6px 12px', 
                      fontSize: 12.5, 
                      fontWeight: 500,
                      color: '#4f566b',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    Choose Image File
                  </label>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    style={{ display: 'none' }} 
                  />
                  <div style={{ fontSize: 11, color: '#8792a2', marginTop: 4 }}>JPEG or PNG. Max 1.5MB.</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Full Name</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Avatar URL Link (Alternative)</label>
                <input 
                  type="url" 
                  value={avatarUrl.startsWith('data:') ? '' : avatarUrl} 
                  onChange={e => setAvatarUrl(e.target.value)} 
                  placeholder="https://..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Biography Info</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 70, outline: 'none' }}
                  placeholder="Showcase your professional bio in about segments..."
                />
              </div>

              <button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13.5, transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Platform Identity & Gateway Settings */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#1a1f36' }}>Platform Branding & API Keys</h3>
            <form onSubmit={handleUpdatePlatform} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Brand / Site Title</label>
                  <input 
                    type="text" 
                    value={brandName} 
                    onChange={e => setBrandName(e.target.value)} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Support Contact Email</label>
                  <input 
                    type="email" 
                    value={supportEmail} 
                    onChange={e => setSupportEmail(e.target.value)} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0 6px 0', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paystack Credentials</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Paystack Public Key</label>
                  <input 
                    type="text" 
                    value={paystackPublicKey} 
                    onChange={e => setPaystackPublicKey(e.target.value)} 
                    placeholder="pk_live_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Paystack Secret Key</label>
                  <input 
                    type="password" 
                    value={paystackSecretKey} 
                    onChange={e => setPaystackSecretKey(e.target.value)} 
                    placeholder="sk_live_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0 6px 0', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stripe Credentials</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Stripe Public Key</label>
                  <input 
                    type="text" 
                    value={stripePublicKey} 
                    onChange={e => setStripePublicKey(e.target.value)} 
                    placeholder="pk_live_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Stripe Secret Key</label>
                  <input 
                    type="password" 
                    value={stripeSecretKey} 
                    onChange={e => setStripeSecretKey(e.target.value)} 
                    placeholder="sk_live_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0 6px 0', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Broadcast Mail Keys</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Resend API Key</label>
                <input 
                  type="password" 
                  value={resendApiKey} 
                  onChange={e => setResendApiKey(e.target.value)} 
                  placeholder="re_..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0 6px 0', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Method Visibility</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '10px 0 14px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input 
                    type="checkbox" 
                    id="enablePaystack" 
                    checked={enablePaystack} 
                    onChange={e => setEnablePaystack(e.target.checked)} 
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="enablePaystack" style={{ fontSize: 13, fontWeight: 500, color: '#3c4257', cursor: 'pointer', userSelect: 'none' }}>Enable Secure Paystack Gateway Option</label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input 
                    type="checkbox" 
                    id="enableBankTransfer" 
                    checked={enableBankTransfer} 
                    onChange={e => setEnableBankTransfer(e.target.checked)} 
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="enableBankTransfer" style={{ fontSize: 13, fontWeight: 500, color: '#3c4257', cursor: 'pointer', userSelect: 'none' }}>Enable Manual Bank Transfer Option</label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input 
                    type="checkbox" 
                    id="enableCod" 
                    checked={enableCod} 
                    onChange={e => setEnableCod(e.target.checked)} 
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="enableCod" style={{ fontSize: 13, fontWeight: 500, color: '#3c4257', cursor: 'pointer', userSelect: 'none' }}>Enable Cash on Delivery (COD) Option (Physical Only)</label>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0 6px 0', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feature Toggles</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16, margin: '6px 0 12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input 
                    type="checkbox" 
                    id="enableAcademics" 
                    checked={enableAcademics} 
                    onChange={e => setEnableAcademics(e.target.checked)} 
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="enableAcademics" style={{ fontSize: 13, fontWeight: 500, color: '#3c4257', cursor: 'pointer', userSelect: 'none' }}>Enable Academics (Courses & LMS)</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input 
                    type="checkbox" 
                    id="enableAffiliates" 
                    checked={enableAffiliates} 
                    onChange={e => setEnableAffiliates(e.target.checked)} 
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="enableAffiliates" style={{ fontSize: 13, fontWeight: 500, color: '#3c4257', cursor: 'pointer', userSelect: 'none' }}>Enable Affiliate Program</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input 
                    type="checkbox" 
                    id="enablePayouts" 
                    checked={enablePayouts} 
                    onChange={e => setEnablePayouts(e.target.checked)} 
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="enablePayouts" style={{ fontSize: 13, fontWeight: 500, color: '#3c4257', cursor: 'pointer', userSelect: 'none' }}>Enable Payouts Manager</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input 
                    type="checkbox" 
                    id="enableUpsells" 
                    checked={enableUpsells} 
                    onChange={e => setEnableUpsells(e.target.checked)} 
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="enableUpsells" style={{ fontSize: 13, fontWeight: 500, color: '#3c4257', cursor: 'pointer', userSelect: 'none' }}>Enable Upsell Offers</label>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0 6px 0', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Multi-Currency & Exchange Rates</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px 0' }}>
                <input 
                  type="checkbox" 
                  id="enableMultiCurrency" 
                  checked={enableMultiCurrency} 
                  onChange={e => setEnableMultiCurrency(e.target.checked)} 
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="enableMultiCurrency" style={{ fontSize: 13, fontWeight: 500, color: '#3c4257', cursor: 'pointer', userSelect: 'none' }}>Enable Geolocation Multi-Currency (USD, EUR, GBP)</label>
              </div>

              {enableMultiCurrency && (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr', gap: 16, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>USD Rate (1 USD in NGN)</label>
                    <input 
                      type="number" 
                      value={usdRate} 
                      onChange={e => setUsdRate(e.target.value)} 
                      placeholder="e.g. 1500"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>EUR Rate (1 EUR in NGN)</label>
                    <input 
                      type="number" 
                      value={eurRate} 
                      onChange={e => setEurRate(e.target.value)} 
                      placeholder="e.g. 1650"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>GBP Rate (1 GBP in NGN)</label>
                    <input 
                      type="number" 
                      value={gbpRate} 
                      onChange={e => setGbpRate(e.target.value)} 
                      placeholder="e.g. 1950"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13.5, marginTop: 8, transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {loading ? 'Saving...' : 'Save Configurations'}
              </button>
            </form>
          </div>

          {/* Bank Account Settings Card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#1a1f36' }}>Bank Account Settings (For Manual Transfers)</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: 16 }}>Configure the bank accounts that will be shown to customers at checkout when they select the direct bank transfer payment method.</p>
            
            <form onSubmit={handleUpdateBankSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Existing accounts list */}
              {bankAccounts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>Current Accounts</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bankAccounts.map((acc, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{acc.bank_name}</span>
                          <span style={{ fontSize: 12.5, color: '#475569' }}>Acc No: <strong style={{ color: '#0f172a' }}>{acc.account_number}</strong> &bull; Acc Name: {acc.account_name}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveBankAccount(idx)}
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', border: '2px dashed #cbd5e1', borderRadius: 8, color: '#64748b', fontSize: 13 }}>
                  No bank accounts configured yet. Add one below!
                </div>
              )}

              {/* Add New Account Form */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14, marginTop: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Bank Account</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: 12.5, marginBottom: 4, color: '#3c4257' }}>Bank Name</label>
                    <input 
                      type="text" 
                      value={newBankName} 
                      onChange={e => setNewBankName(e.target.value)} 
                      placeholder="e.g. GTBank"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: 12.5, marginBottom: 4, color: '#3c4257' }}>Account Number</label>
                    <input 
                      type="text" 
                      value={newAccNum} 
                      onChange={e => setNewAccNum(e.target.value)} 
                      placeholder="10 Digits"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: 12.5, marginBottom: 4, color: '#3c4257' }}>Account Name</label>
                    <input 
                      type="text" 
                      value={newAccName} 
                      onChange={e => setNewAccName(e.target.value)} 
                      placeholder="e.g. SAINT GLOBAL SOLAR"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddBankAccount}
                  style={{ marginTop: 12, background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                >
                  + Add to List
                </button>
              </div>

              <button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13.5, marginTop: 8, transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {loading ? 'Saving...' : 'Save Bank Accounts'}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#1a1f36' }}>Security & Credentials</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13.5, transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Beautiful Live Preview Card */}
        <div>
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: 12, 
            padding: 24, 
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)',
            position: 'sticky',
            top: 24
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 13, fontWeight: 600, color: '#1a1f36', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Live Profile Preview
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
              <img 
                src={avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                alt="Avatar" 
                style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb', marginBottom: 12, boxShadow: '0 4px 10px rgba(37, 99, 235,0.15)' }} 
              />
              <h5 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1f36' }}>{fullName || 'Administrator Name'}</h5>
              <span style={{ fontSize: 12, color: '#697386', fontWeight: 500, marginTop: 4 }}>Platform Instructor</span>
              
              <div style={{ borderTop: '1px solid #f1f5f9', width: '100%', margin: '16px 0', paddingTop: 16 }}>
                <p style={{ margin: 0, fontSize: 12.5, color: '#4f566b', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{bio || 'A descriptive biography will be displayed here for students to learn more about your teaching profile.'}"
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', width: '100%', marginTop: 8 }}>
                <span style={{ fontSize: 11, background: '#e3fcef', color: '#00875a', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Active</span>
                <span style={{ fontSize: 11, background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{brandName}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}

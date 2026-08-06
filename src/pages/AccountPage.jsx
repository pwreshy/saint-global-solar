import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import UserMenu from '../components/UserMenu'
import UserAvatar from '../components/UserAvatar'
import { CONFIG } from '../lib/config'

export default function AccountPage() {
  const { user, profile, loading } = useAuth()
  const [orders, setOrders] = useState([])
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')

  const [shipping, setShipping] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
  })
  const [updatingShipping, setUpdatingShipping] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.email) return
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setOrders(data)
      }
      setFetching(false)
    }
    fetchOrders()
  }, [user])

  useEffect(() => {
    async function loadShipping() {
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (data) {
        setShipping({
          street: data.shipping_street || '',
          city: data.shipping_city || '',
          state: data.shipping_state || '',
          postalCode: data.shipping_postal_code || '',
          phone: data.shipping_phone || '',
        })
      }
    }
    loadShipping()
  }, [user])

  const handleUpdateShipping = async (e) => {
    e.preventDefault()
    setUpdatingShipping(true)
    setSuccessMsg('')
    const { error } = await supabase
      .from('profiles')
      .update({
        shipping_street: shipping.street,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_postal_code: shipping.postalCode,
        shipping_phone: shipping.phone,
      })
      .eq('id', user.id)

    setUpdatingShipping(false)
    if (!error) {
      setSuccessMsg('Shipping address updated successfully!')
      setTimeout(() => setSuccessMsg(''), 4000)
    } else {
      alert('Error updating shipping: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#050b14', color: '#fff',
        fontFamily: "var(--font)", zIndex: 9999
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: 160, height: 160, background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0) 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(24px)', animation: 'ambient-glow 3s ease-in-out infinite' }} />
          <img src="/logo_black.png" alt="E-COM WEB" style={{ height: 100, width: 'auto', maxWidth: 280, objectFit: 'contain', marginBottom: 36, filter: 'drop-shadow(0 0 10px rgba(37,99,235,0.15))', animation: 'logo-pulse 2.2s ease-in-out infinite' }} />
          <div className="premium-spinner" />
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: '14px', letterSpacing: '0.5px', position: 'relative', zIndex: 1 }}>Loading Account...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .premium-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.05);
            border-top-color: var(--brand-primary, #0f0d0a);
            border-right-color: var(--brand-hover, #262520);
            border-radius: 50%;
            animation: spin-loader 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          @keyframes spin-loader {
            to { transform: rotate(360deg); }
          }
          @keyframes logo-pulse {
            0%, 100% { transform: scale(1); opacity: 0.85; filter: drop-shadow(0 0 8px rgba(197,168,128,0.1)); }
            50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 16px rgba(197,168,128,0.4)); }
          }
          @keyframes ambient-glow {
            0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          }
        `}} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" />

  const ownsEbook = orders.some(o => o.product.toLowerCase().includes('ebook') || o.amount === 250000 || o.amount === 2500)
  const ownsCourse = profile?.has_access || orders.some(o => o.product.toLowerCase().includes('course') || o.product.toLowerCase().includes('blueprint'))

  return (
    <div className="std-layout">
      
      {/* Top Navbar */}
      <nav className="std-nav">
        <div className="std-nav-left">
          <Link to="/products" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="std-brand-logo" style={{ background: '#db2777' }}>EW</div>
            <span className="std-brand-name" style={{ color: '#1c1d1f' }}>E-COM WEB</span>
          </Link>
        </div>
        <div className="std-nav-right">
          <Link to="/products" className="std-nav-link">Shop Store</Link>
          <UserMenu user={user} />
        </div>
      </nav>

      <main className="std-account-main">
        <div className="std-account-container">
          
          <aside className="std-account-sidebar">
            <div className="std-sidebar-avatar">
              <UserAvatar user={user} size={100} />
              <h3>{user.user_metadata?.full_name || 'Customer'}</h3>
            </div>
            <nav className="std-sidebar-nav">
              <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile & Shipping</button>
              <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}>{CONFIG.ENABLE_DIGITAL_PRODUCTS ? 'Payment History' : 'Orders & Shipments'}</button>
              {CONFIG.ENABLE_DIGITAL_PRODUCTS && (
                <button className={activeTab === 'assets' ? 'active' : ''} onClick={() => setActiveTab('assets')}>Downloads & Assets</button>
              )}
            </nav>
          </aside>

          <section className="std-account-content">
            {activeTab === 'profile' && (
              <div className="std-tab-pane fade-in">
                <h2>Account Profile</h2>
                <p className="std-tab-desc">Manage your profile credentials and shipping defaults.</p>
                
                <form className="std-form" onSubmit={(e) => e.preventDefault()} style={{ display: 'grid', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="std-form-group">
                      <label>Full Name</label>
                      <input type="text" className="std-input" defaultValue={user.user_metadata?.full_name} readOnly disabled />
                    </div>
                    <div className="std-form-group">
                      <label>Email Address</label>
                      <input type="email" className="std-input" defaultValue={user.email} readOnly disabled />
                    </div>
                  </div>

                  <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
                  
                  <h3>Default Shipping Details</h3>
                  <div className="std-form-group">
                    <label>Shipping Phone Number</label>
                    <input 
                      type="text" 
                      className="std-input" 
                      value={shipping.phone} 
                      onChange={e => setShipping({ ...shipping, phone: e.target.value })} 
                      placeholder="e.g. 08031234567"
                    />
                  </div>
                  <div className="std-form-group">
                    <label>Street Address</label>
                    <input 
                      type="text" 
                      className="std-input" 
                      value={shipping.street} 
                      onChange={e => setShipping({ ...shipping, street: e.target.value })} 
                      placeholder="e.g. 12 Allen Avenue"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="std-form-group">
                      <label>City</label>
                      <input 
                        type="text" 
                        className="std-input" 
                        value={shipping.city} 
                        onChange={e => setShipping({ ...shipping, city: e.target.value })} 
                        placeholder="e.g. Ikeja"
                      />
                    </div>
                    <div className="std-form-group">
                      <label>State</label>
                      <input 
                        type="text" 
                        className="std-input" 
                        value={shipping.state} 
                        onChange={e => setShipping({ ...shipping, state: e.target.value })} 
                        placeholder="e.g. Lagos"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="std-form-group">
                      <label>Postal Code</label>
                      <input 
                        type="text" 
                        className="std-input" 
                        value={shipping.postalCode} 
                        onChange={e => setShipping({ ...shipping, postalCode: e.target.value })} 
                        placeholder="e.g. 100001"
                      />
                    </div>
                    <div className="std-form-group">
                      <label>Country</label>
                      <input type="text" className="std-input" value="Nigeria" disabled style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
                    </div>
                  </div>

                  {successMsg && (
                    <div style={{ background: '#ecfdf5', color: '#047857', padding: '12px', borderRadius: '6px', fontSize: '14px', border: '1px solid #a7f3d0' }}>
                      {successMsg}
                    </div>
                  )}

                  <button 
                    type="button" 
                    className="std-btn std-btn-primary" 
                    onClick={handleUpdateShipping}
                    disabled={updatingShipping}
                    style={{ background: 'var(--brand-primary)', border: 'none', cursor: 'pointer', padding: '10px 20px', borderRadius: '4px', color: '#fff', fontWeight: 600 }}
                  >
                    {updatingShipping ? 'Saving...' : 'Update Address'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="std-tab-pane fade-in">
                <h2>{CONFIG.ENABLE_DIGITAL_PRODUCTS ? 'Payment History' : 'Orders & Shipments'}</h2>
                <p className="std-tab-desc">Track and view status indicators of all your premium orders.</p>
                
                <div className="std-table-container">
                  {fetching ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#6a6f73' }}>Loading records...</div>
                  ) : orders.length > 0 ? (
                    <table className="std-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Product</th>
                          <th>Amount</th>
                          <th>Payment</th>
                          {!CONFIG.ENABLE_DIGITAL_PRODUCTS && (
                            <>
                              <th>Shipping</th>
                              <th>Tracking</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => {
                          const totalAmt = order.amount + (order.delivery_fee || 0)
                          return (
                            <tr key={order.id}>
                              <td>{new Date(order.created_at).toLocaleDateString()}</td>
                              <td>{order.product}</td>
                              <td>₦{(totalAmt / (order.amount > 100000 ? 100 : 1)).toLocaleString()}</td>
                              <td>
                                <span className={`order-status-tag ${order.status}`} style={{
                                  padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                                  background: order.status === 'paid' ? '#ecfdf5' : '#fef3c7',
                                  color: order.status === 'paid' ? '#047857' : '#d97706',
                                  border: `1px solid ${order.status === 'paid' ? '#a7f3d0' : '#fde68a'}`
                                }}>
                                  {order.status.toUpperCase()}
                                </span>
                              </td>
                              {!CONFIG.ENABLE_DIGITAL_PRODUCTS && (
                                <>
                                  <td>
                                    {order.shipping_status ? (
                                      <span className={`shipping-status-tag ${order.shipping_status}`} style={{
                                        padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                                        background: order.shipping_status === 'delivered' ? '#ecfdf5' : order.shipping_status === 'shipped' ? '#eff6ff' : '#f1f5f9',
                                        color: order.shipping_status === 'delivered' ? '#047857' : order.shipping_status === 'shipped' ? '#1d4ed8' : '#475569',
                                        border: `1px solid ${order.shipping_status === 'delivered' ? '#a7f3d0' : order.shipping_status === 'shipped' ? '#bfdbfe' : '#cbd5e1'}`
                                      }}>
                                        {order.shipping_status.toUpperCase()}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>N/A</span>
                                    )}
                                  </td>
                                  <td>
                                    {order.tracking_number ? (
                                      <code 
                                        className="tracking-code" 
                                        title="Click to copy tracking code" 
                                        onClick={() => {
                                          navigator.clipboard.writeText(order.tracking_number)
                                          alert('Tracking number copied: ' + order.tracking_number)
                                        }} 
                                        style={{ cursor: 'pointer', background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#db2777', fontWeight: 'bold', fontSize: '12px' }}
                                      >
                                        {order.tracking_number}
                                      </code>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>Unassigned</span>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="std-empty-state">
                      No orders found for this account.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'assets' && CONFIG.ENABLE_DIGITAL_PRODUCTS && (
              <div className="std-tab-pane fade-in">
                <h2>Downloads & Assets</h2>
                <p className="std-tab-desc">Access digital files included with your purchases.</p>
                
                <div className="std-assets-list">
                  {ownsEbook ? (
                    <div className="std-asset-card">
                      <div className="std-asset-icon">📄</div>
                      <div className="std-asset-info">
                        <h4>The N50k Blueprint (E-book)</h4>
                        <p>PDF Document & Bonus Assets</p>
                      </div>
                      <button className="std-btn std-btn-secondary" onClick={() => alert('Download starting...')}>Download</button>
                    </div>
                  ) : null}

                  {ownsCourse ? (
                    <div className="std-asset-card">
                      <div className="std-asset-icon">💼</div>
                      <div className="std-asset-info">
                        <h4>Client Documents Portal</h4>
                        <p>Proposals, Invoices & Contracts</p>
                      </div>
                      <Link to="/dashboard" className="std-btn std-btn-secondary">Access Portal</Link>
                    </div>
                  ) : null}

                  {!ownsEbook && !ownsCourse && (
                    <div className="std-empty-state">
                      No digital assets available.
                    </div>
                  )}
                </div>
              </div>
            )}

          </section>

        </div>
      </main>

    </div>
  )
}

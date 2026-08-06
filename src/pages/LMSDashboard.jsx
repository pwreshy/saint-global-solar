import { useState, useEffect } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/UserMenu'
import { supabase, recoverEnrollmentFromOrders } from '../lib/supabase'
import StudentCertificates from './StudentCertificates'
import UserAvatar from '../components/UserAvatar'

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

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function MyLearningTab({ user }) {
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEnrollments() {
      if (!user) return
      try {
        const { data: enrData, error: enrError } = await supabase
          .from('enrollments')
          .select('course_id, progress')
          .eq('user_id', user.id)

        if (enrError) throw enrError

        const courseIds = (enrData || []).map(e => e.course_id).filter(Boolean)

        if (courseIds.length === 0) {
          setEnrollments([])
          return
        }

        const [coursesRes, productsRes] = await Promise.all([
          supabase.from('courses').select('id, instructor').in('id', courseIds),
          supabase.from('products').select('id, title, cover_image').in('id', courseIds)
        ])

        const coursesData = coursesRes.data || []
        const productsData = productsRes.data || []

        const courseMap = {}
        coursesData.forEach(c => { courseMap[c.id] = c })

        const productMap = {}
        productsData.forEach(p => { productMap[p.id] = p })

        const enhanced = await Promise.all((enrData || []).map(async (e) => {
          const product = productMap[e.course_id]
          if (!product) return null

          const course = courseMap[e.course_id] || { id: e.course_id, instructor: 'Instructor' }

          let totalLessons = 0
          const { data: modulesData, error: modsErr } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', e.course_id)

          if (!modsErr && modulesData && modulesData.length > 0) {
            const moduleIds = modulesData.map(m => m.id)
            const { count, error: lessonsCountErr } = await supabase
              .from('lessons')
              .select('id', { count: 'exact', head: true })
              .in('module_id', moduleIds)

            if (!lessonsCountErr) {
              totalLessons = count || 0
            }
          }

          return {
            progress: e.progress,
            courses: {
              id: course.id,
              instructor: course.instructor,
              products: product
            },
            totalLessons
          }
        }))

        setEnrollments(enhanced.filter(Boolean))
      } catch (err) {
        console.error('Error fetching enrollments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEnrollments()
  }, [user])

  if (loading) {
    return <div style={{ padding: '40px 0', color: '#64748b', fontWeight: 600 }}>Loading courses...</div>
  }

  if (enrollments.length === 0) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', background: '#fff', border: '1px solid #d1d7dc', borderRadius: 4 }}>
        <svg style={{ width: 64, height: 64, color: '#64748b', margin: '0 auto 20px', display: 'block' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#0b1329', fontFamily: 'var(--font-heading)' }}>No Courses Found</h2>
        <p style={{ color: '#64748b', marginBottom: 24, fontSize: 15, maxWidth: 400, margin: '0 auto 24px' }}>You haven't enrolled in any training programs yet. Start learning today!</p>
        <Link to="/products" style={{ background: 'var(--g600)', color: '#fff', padding: '12px 28px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', transition: 'background 0.15s' }}>Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="ud-course-grid">
      {enrollments.map((enr) => {
        const course = enr.courses
        const product = course?.products
        if (!product) return null

        const progressArr = enr.progress || []
        const total = enr.totalLessons || 1
        const percentComplete = Math.min(100, Math.round((progressArr.length / total) * 100))
        const nextLessonLink = `/course/${course.id}`

        return (
          <div key={course.id} className="ud-course-card">
            <div className="ud-course-card-img">
              <img src={product.cover_image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800'} alt={product.title.replace(/\s+slug$/i, '')} />
              <div className="ud-card-overlay">
                <Link to={nextLessonLink} className="ud-play-icon">▶</Link>
              </div>
            </div>
            <div className="ud-course-card-body">
              <h3 className="ud-course-card-title">{product.title.replace(/\s+slug$/i, '')}</h3>
              <p className="ud-course-card-instructor">By {course.instructor || 'Instructor'}</p>
              
              <div className="ud-progress-container">
                <div className="ud-progress-bar-bg">
                  <div className="ud-progress-bar-fill" style={{ width: `${percentComplete}%` }}></div>
                </div>
                <div className="ud-progress-info">
                  <span className="ud-progress-text">{percentComplete}% complete</span>
                  <span className="ud-progress-label">{progressArr.length}/{total} Lessons</span>
                </div>
              </div>
              
              <Link to={nextLessonLink} className="ud-card-btn">
                {percentComplete === 0 ? 'Start Learning' : 'Continue Learning'}
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PurchaseHistoryTab({ user, profile }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const downloadReceipt = (order) => {
    const receiptWindow = window.open('', '_blank', 'width=800,height=900');
    if (!receiptWindow) {
      alert("Please allow popups to view and download your receipt.");
      return;
    }

    const brandName = localStorage.getItem('brandName') || 'SAINT GLOBAL SOLAR';
    const cleanBrandName = brandName.replace(/["']/g, "");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${String(order.id).slice(0, 8).toUpperCase()}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              color: #1e293b;
              padding: 40px 20px;
              margin: 0;
              background-color: #f8fafc;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 40px;
              background-color: #ffffff;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px dashed #e2e8f0;
              padding-bottom: 28px;
              margin-bottom: 32px;
            }
            .logo {
              height: 44px;
              width: auto;
            }
            .title {
              font-size: 20px;
              font-weight: 800;
              color: var(--brand-primary, #0f0d0a);
              margin: 0;
              text-transform: uppercase;
              letter-spacing: 1px;
              background: linear-gradient(135deg, var(--brand-primary, #0f0d0a), var(--g500, #af9063));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .status-badge {
              background-color: #dcfce7;
              color: #15803d;
              padding: 6px 12px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: inline-block;
              margin-top: 6px;
            }
            .receipt-details {
              display: grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: 24px;
              margin-bottom: 36px;
            }
            .details-block h4 {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
              margin: 0 0 8px 0;
              font-weight: 600;
            }
            .details-block p {
              font-size: 14px;
              font-weight: 600;
              color: #0f172a;
              margin: 0;
              line-height: 1.4;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 36px;
            }
            .table th {
              text-align: left;
              padding: 12px;
              background-color: #f8fafc;
              color: #475569;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              border-bottom: 2px solid #e2e8f0;
            }
            .table td {
              padding: 16px 12px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 14px;
            }
            .total-section {
              display: flex;
              justify-content: flex-end;
              border-top: 2px dashed #e2e8f0;
              padding-top: 24px;
              margin-top: 12px;
            }
            .total-box {
              text-align: right;
              width: 240px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 13px;
            }
            .total-amount-row {
              display: flex;
              justify-content: space-between;
              margin-top: 12px;
              border-top: 1px solid #f1f5f9;
              padding-top: 12px;
            }
            .total-amount {
              font-size: 20px;
              font-weight: 800;
              color: var(--brand-primary, #0f0d0a);
            }
            .footer-note {
              text-align: center;
              font-size: 12px;
              color: #64748b;
              margin-top: 56px;
              border-top: 1px solid #f1f5f9;
              padding-top: 28px;
              line-height: 1.6;
            }
            .btn-print {
              display: block;
              width: 100%;
              padding: 14px;
              background: linear-gradient(135deg, var(--brand-primary, #0f0d0a), var(--brand-hover, #262520));
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              text-align: center;
              margin-bottom: 28px;
              box-shadow: 0 4px 10px rgba(15, 13, 10, 0.15);
              transition: all 0.2s;
            }
            .btn-print:hover {
              opacity: 0.95;
              box-shadow: 0 4px 14px rgba(18, 60, 36, 0.3);
            }
            @media print {
              .btn-print {
                display: none;
              }
              body {
                padding: 0;
                background-color: #ffffff;
              }
              .receipt-container {
                border: none;
                box-shadow: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
            
            <div class="header">
              <img class="logo" src="${window.location.origin}/logo.png" alt="${cleanBrandName}" />
              <div style="text-align: right;">
                <h1 class="title">Receipt</h1>
                <span class="status-badge">Paid</span>
              </div>
            </div>
            
            <div class="receipt-details">
              <div class="details-block">
                <h4>Billed To</h4>
                <p style="font-size: 15px; font-weight: 700;">${profile?.full_name || user?.user_metadata?.full_name || 'Valued Customer'}</p>
                <p style="font-weight: normal; color: #64748b; font-size: 13px; margin-top: 4px;">${user?.email || ''}</p>
                ${order.customer_phone ? `<p style="font-weight: normal; color: #64748b; font-size: 13px; margin-top: 2px;">Phone: ${order.customer_phone}</p>` : ''}
              </div>
              <div class="details-block" style="text-align: right;">
                <h4>Transaction</h4>
                <p style="font-size: 13px; font-weight: normal; color: #64748b;">Receipt #: <strong>${String(order.id).slice(0, 8).toUpperCase()}</strong></p>
                <p style="font-size: 13px; font-weight: normal; color: #64748b; margin-top: 4px;">Date: ${new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${order.reference ? `<p style="font-size: 11px; font-weight: normal; color: #94a3b8; margin-top: 4px; font-family: monospace;">Ref: ${order.reference}</p>` : ''}
              </div>

              ${order.shipping_street ? `
                <div class="details-block" style="grid-column: span 2; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 8px;">
                  <h4>Shipping Information</h4>
                  <p style="font-weight: normal; font-size: 13px; line-height: 1.6; color: #475569;">
                    <strong>Recipient Name:</strong> ${order.shipping_name || order.customer_name || ''}<br/>
                    <strong>Recipient Phone:</strong> ${order.shipping_phone || order.customer_phone || ''}<br/>
                    <strong>Address:</strong> ${order.shipping_street || ''}, ${order.shipping_city || ''}, ${order.shipping_state || ''}, ${order.shipping_country || 'Nigeria'}<br/>
                    ${order.shipping_postal_code ? `<strong>Postal Code:</strong> ${order.shipping_postal_code}<br/>` : ''}
                    ${order.shipping_notes ? `<strong>Instructions:</strong> ${order.shipping_notes}` : ''}
                  </p>
                </div>
              ` : ''}
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Product / Item</th>
                  <th style="text-align: right;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 600; color: #0f172a;">
                    ${(order.products?.title || 'Unknown Product').replace(/\s+slug$/i, '')}
                  </td>
                  <td style="text-align: right; font-weight: 700; color: #0f172a;">₦${order.amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-box">
                <div class="total-row">
                  <span style="color: #64748b;">Subtotal:</span>
                  <span style="font-weight: 600; color: #0f172a;">₦${order.amount.toLocaleString()}</span>
                </div>
                <div class="total-row">
                  <span style="color: #64748b;">Shipping:</span>
                  <span style="font-weight: 600; color: #0f172a;">₦${(order.delivery_fee || 0).toLocaleString()}</span>
                </div>
                <div class="total-amount-row">
                  <span style="color: #0f172a; font-weight: 700; font-size: 14px;">Total Paid:</span>
                  <span class="total-amount">₦${(order.amount + (order.delivery_fee || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div class="footer-note">
              <p style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">Thank you for your purchase from ${cleanBrandName}!</p>
              <p style="margin: 0; font-size: 12px;">This receipt is generated automatically. For questions, reach out to our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    receiptWindow.document.write(htmlContent);
    receiptWindow.document.close();
  };

  useEffect(() => {
    async function loadOrders() {
      if (!user) return
      try {
        const { data: ords, error: ordsErr } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_email', user.email)
          .order('created_at', { ascending: false })
        
        if (ordsErr) throw ordsErr
        if (!ords || ords.length === 0) {
          setOrders([])
          return
        }

        const productIds = [...new Set(ords.map(o => o.product_id).filter(Boolean))]
        if (productIds.length > 0) {
          const { data: prods, error: prodsErr } = await supabase
            .from('products')
            .select('id, title')
            .in('id', productIds)

          if (!prodsErr && prods) {
            const prodMap = Object.fromEntries(prods.map(p => [p.id, p]))
            const merged = ords.map(o => ({
              ...o,
              products: prodMap[o.product_id] || null
            }))
            setOrders(merged)
            return
          }
        }
        setOrders(ords.map(o => ({ ...o, products: null })))
      } catch (err) {
        console.error('Error fetching purchase history:', err)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [user])

  if (loading) {
    return <div style={{ padding: '40px 0', color: '#64748b', fontWeight: 600 }}>Loading history...</div>
  }

  return (
    <div className="ud-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table className="ud-table" style={{ minWidth: '600px' }}>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Purchase Date</th>
            <th>Amount Paid</th>
            <th>Payment Status</th>
            <th>Delivery Status</th>
            <th>Tracking</th>
            <th style={{ textAlign: 'right' }}>Receipt</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                No purchases found.
              </td>
            </tr>
          ) : (
            orders.map(order => (
              <tr key={order.id}>
                <td style={{ fontWeight: 700 }}>{(order.products?.title || 'Unknown Product').replace(/\s+slug$/i, '')}</td>
                <td style={{ color: '#64748b' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                <td style={{ fontWeight: 700 }}>₦{order.amount.toLocaleString()}</td>
                <td>
                  <span style={{
                    padding: '4px 10px',
                    background: order.status === 'paid' ? '#dcfce7' : '#fef9c3',
                    color: order.status === 'paid' ? '#15803d' : '#a16207',
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    {order.status.replace(/[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()}
                  </span>
                </td>
                <td>
                  {order.shipping_status ? (
                    <span style={{
                      padding: '4px 10px',
                      background: order.shipping_status === 'delivered' ? '#ecfdf5' : order.shipping_status === 'shipped' ? '#eff6ff' : '#f1f5f9',
                      color: order.shipping_status === 'delivered' ? '#047857' : order.shipping_status === 'shipped' ? 'var(--g700)' : '#475569',
                      border: `1px solid ${order.shipping_status === 'delivered' ? '#a7f3d0' : order.shipping_status === 'shipped' ? '#bfdbfe' : '#cbd5e1'}`,
                      fontWeight: 700,
                      fontSize: 10.5,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      display: 'inline-block',
                      borderRadius: 4
                    }}>
                      {order.shipping_status}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                  )}
                </td>
                <td>
                  {order.tracking_number ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12, color: '#334155', fontWeight: 600 }}>{order.tracking_number}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(order.tracking_number)
                          alert('Tracking number copied!')
                        }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2, color: '#64748b' }}
                        title="Copy tracking number"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>Pending shipment</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {order.status === 'paid' && (
                    <button 
                      onClick={() => downloadReceipt(order)}
                      style={{
                        background: '#eff6ff',
                        color: 'var(--g600)',
                        border: '1px solid #bfdbfe',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dbeafe'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                    >
                      Download
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function SettingsTab({ user }) {
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(user.user_metadata?.avatar_url || null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '')
  const [shipping, setShipping] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
  })

  useEffect(() => {
    async function loadShipping() {
      if (!user) return
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          setShipping({
            street: data.shipping_street || '',
            city: data.shipping_city || '',
            state: data.shipping_state || '',
            postalCode: data.shipping_postal_code || '',
            phone: data.shipping_phone || '',
          })
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadShipping()
  }, [user])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setAvatarError('Image must be under 3MB.')
      return
    }
    setAvatarError('')
    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const publicUrl = publicData?.publicUrl + '?t=' + Date.now()

      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      await refreshProfile()

      setAvatarUrl(publicUrl)
      setMessage('Profile photo updated!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setAvatarError('Upload failed: ' + err.message)
      console.error(err)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      })
      if (error) throw error
      await supabase.from('profiles').update({ 
        full_name: fullName,
        shipping_street: shipping.street,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_postal_code: shipping.postalCode,
        shipping_phone: shipping.phone
      }).eq('id', user.id)
      await refreshProfile()
      setMessage('Profile and shipping details updated successfully.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error(err.message)
      setMessage('Error updating details: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const nameStr = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Student')
  const initials = nameStr.substring(0, 2).toUpperCase()

  return (
    <div className="ud-form-container" style={{ border: '1px solid #cbd5e1', borderRadius: 4 }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 24px', fontFamily: 'var(--font-heading)' }}>Public Profile</h3>
      
      {message && (
        <div style={{ padding: 12, background: '#dcfce7', color: '#166534', borderRadius: 4, marginBottom: 24, fontSize: 14, fontWeight: 700 }}>
          {message}
        </div>
      )}

      {/* Avatar Upload Section */}
      <div className="ud-form-group" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{
                width: 80, height: 80, borderRadius: '50%',
                objectFit: 'cover', border: '3px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          ) : (
            <UserAvatar user={user} size={80} />
          )}
          <label
            htmlFor="avatar-upload"
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--g600)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              transition: 'background 0.15s'
            }}
            title="Upload profile photo"
          >
            {uploadingAvatar ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            )}
          </label>
          <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0b1329', marginBottom: 4 }}>Profile Photo</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>Upload a photo. JPG, PNG or WebP. Max 3MB.</div>
          {avatarError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, fontWeight: 600 }}>{avatarError}</div>}
        </div>
      </div>

      <form onSubmit={handleUpdate}>
        <div className="ud-form-group">
          <label className="ud-form-label">Email Address</label>
          <input type="email" value={user.email} disabled className="ud-form-input" style={{ background: '#f7f9fa', border: '1px solid #cbd5e1', color: '#64748b', cursor: 'not-allowed', borderRadius: 4 }} />
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Email cannot be changed.</p>
        </div>
        <div className="ud-form-group">
          <label className="ud-form-label">Full Name</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={e => setFullName(e.target.value)}
            className="ud-form-input"
            style={{ borderRadius: 4, border: '1px solid #cbd5e1' }}
            required
          />
        </div>
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #cbd5e1', marginBottom: 24 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>Shipping Details</h3>
          <div className="ud-form-group">
            <label className="ud-form-label">Shipping Phone Number</label>
            <input 
              type="text" 
              value={shipping.phone} 
              onChange={e => setShipping({ ...shipping, phone: e.target.value })} 
              className="ud-form-input" 
              style={{ borderRadius: 4, border: '1px solid #cbd5e1' }}
              placeholder="e.g. +234 80 1234 5678" 
            />
          </div>
          <div className="ud-form-group">
            <label className="ud-form-label">Street Address</label>
            <input 
              type="text" 
              value={shipping.street} 
              onChange={e => setShipping({ ...shipping, street: e.target.value })} 
              className="ud-form-input" 
              style={{ borderRadius: 4, border: '1px solid #cbd5e1' }}
              placeholder="e.g. 15 Farms Road" 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="ud-form-group">
              <label className="ud-form-label">City</label>
              <input 
                type="text" 
                value={shipping.city} 
                onChange={e => setShipping({ ...shipping, city: e.target.value })} 
                className="ud-form-input" 
                style={{ borderRadius: 4, border: '1px solid #cbd5e1' }}
                placeholder="e.g. Ikeja" 
              />
            </div>
            <div className="ud-form-group">
              <label className="ud-form-label">State</label>
              <input 
                type="text" 
                value={shipping.state} 
                onChange={e => setShipping({ ...shipping, state: e.target.value })} 
                className="ud-form-input" 
                style={{ borderRadius: 4, border: '1px solid #cbd5e1' }}
                placeholder="e.g. Lagos" 
              />
            </div>
          </div>
          <div className="ud-form-group">
            <label className="ud-form-label">Postal / Zip Code</label>
            <input 
              type="text" 
              value={shipping.postalCode} 
              onChange={e => setShipping({ ...shipping, postalCode: e.target.value })} 
              className="ud-form-input" 
              style={{ borderRadius: 4, border: '1px solid #cbd5e1' }}
              placeholder="e.g. 100001" 
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="ud-form-submit" style={{ borderRadius: 4 }}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function WishlistTab({ user }) {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWishlist = async () => {
    if (!user) return
    try {
      const { data: wishData, error: wishError } = await supabase
        .from('wishlist')
        .select('id, product_id')
        .eq('user_id', user.id)
      
      if (wishError) throw wishError

      const productIds = (wishData || []).map(w => w.product_id).filter(Boolean)

      if (productIds.length === 0) {
        setWishlist([])
        return
      }

      const { data: prodData, error: prodError } = await supabase
        .from('products')
        .select('id, title, description, short_description, price, old_price, cover_image, type')
        .in('id', productIds)

      if (prodError) throw prodError

      const productMap = {}
      ;(prodData || []).forEach(p => { productMap[p.id] = p })

      const assembled = (wishData || []).map(w => {
        const product = productMap[w.product_id]
        if (!product) return null
        return {
          id: w.id,
          product_id: w.product_id,
          products: product
        }
      }).filter(Boolean)

      setWishlist(assembled)
    } catch (err) {
      console.error('Wishlist fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [user])

  const handleRemove = async (wishlistId) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId)
      if (error) throw error
      setWishlist(wishlist.filter(w => w.id !== wishlistId))
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return <div style={{ padding: '40px 0', color: '#64748b', fontWeight: 600 }}>Loading wishlist...</div>
  }

  if (wishlist.length === 0) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', background: '#fff', border: '1px solid #d1d7dc', borderRadius: 4 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#0b1329', fontFamily: 'var(--font-heading)' }}>Your Wishlist is Empty</h2>
        <p style={{ color: '#64748b', marginBottom: 24, fontSize: 15, maxWidth: 400, margin: '0 auto 24px' }}>Browse our training programs and save courses to purchase later.</p>
        <Link to="/products" style={{ background: 'var(--g600)', color: '#fff', padding: '12px 28px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="ud-course-grid">
      {wishlist.map(w => {
        const prod = w.products
        if (!prod) return null
        return (
          <div key={w.id} className="ud-course-card">
            <div className="ud-course-card-img">
              <img src={prod.cover_image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800'} alt={prod.title.replace(/\s+slug$/i, '')} />
              <button 
                onClick={() => handleRemove(w.id)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                title="Remove from wishlist"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              </button>
            </div>
            <div className="ud-course-card-body" style={{ justifyContent: 'space-between' }}>
              <div>
                <h3 className="ud-course-card-title">{prod.title.replace(/\s+slug$/i, '')}</h3>
                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{prod.short_description || getShortDesc(prod)}</p>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#0b1329' }}>₦{prod.price.toLocaleString()}</span>
                  {prod.old_price && <span style={{ fontSize: 13, color: '#64748b', textDecoration: 'line-through' }}>₦{prod.old_price.toLocaleString()}</span>}
                </div>
                <Link to={prod.type === 'course' ? '/course' : '/ebook'} className="ud-card-btn" style={{ background: 'var(--g600)', color: '#fff', border: '1px solid var(--g600)' }}>
                  Buy Now
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NotificationsTab({ user }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadNotifications() {
      if (!user) return
      try {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('user_id', user.id)
        
        const courseIds = (enrollments || []).map(e => e.course_id)

        let announcementsQuery = supabase
          .from('announcements')
          .select('*, courses(products(title))')
          .order('created_at', { ascending: false })
        
        if (courseIds.length > 0) {
          announcementsQuery = announcementsQuery.or(`course_id.in.(${courseIds.join(',')}),course_id.is.null`)
        } else {
          announcementsQuery = announcementsQuery.is('course_id', null)
        }

        const { data: announcements, error: annError } = await announcementsQuery
        if (annError) throw annError

        const { data: replies, error: repError } = await supabase
          .from('qna_answers')
          .select(`
            *,
            profiles (full_name, role),
            qna_questions!inner (
              question,
              user_id,
              courses (
                products (title)
              )
            )
          `)
          .eq('qna_questions.user_id', user.id)
          .neq('author_id', user.id)
          .order('created_at', { ascending: false })

        if (repError) throw repError

        const list = []
        if (announcements) {
          announcements.forEach(a => {
            list.push({
              id: `ann-${a.id}`,
              type: 'announcement',
              title: a.title,
              body: a.body,
              time: new Date(a.created_at),
              sourceName: 'Instructor Broadcast',
              courseTitle: (a.courses?.products?.title || 'General Platform').replace(/\s+slug$/i, '')
            })
          })
        }
        if (replies) {
          replies.forEach(r => {
            list.push({
              id: `reply-${r.id}`,
              type: 'reply',
              title: `New Reply on Q&A Discussion`,
              body: `"${r.answer}" — by ${r.profiles?.full_name || 'Instructor'}`,
              time: new Date(r.created_at),
              sourceName: r.qna_questions?.question,
              courseTitle: (r.qna_questions?.courses?.products?.title || '').replace(/\s+slug$/i, '')
            })
          })
        }

        list.sort((a, b) => b.time - a.time)
        setNotifications(list)
      } catch (err) {
        console.error('Error fetching notifications:', err)
      } finally {
        setLoading(false)
      }
    }
    loadNotifications()
  }, [user])

  if (loading) {
    return <div style={{ padding: '40px 0', color: '#64748b', fontWeight: 600 }}>Loading notifications...</div>
  }

  if (notifications.length === 0) {
    return (
      <div style={{ padding: '80px 24px', textAlign: 'center', background: '#fff', border: '1px solid #d1d7dc', borderRadius: 4 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#0b1329', fontFamily: 'var(--font-heading)' }}>All Caught Up!</h2>
        <p style={{ color: '#64748b', fontSize: 15 }}>No new announcements or replies recorded recently.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {notifications.map(n => (
        <div key={n.id} className="ud-notif-card" style={{ borderRadius: 4 }}>
          <div className="ud-notif-icon">
            {n.type === 'announcement' 
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            }
          </div>
          <div className="ud-notif-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <h4 className="ud-notif-title">{n.title}</h4>
              <span className="ud-notif-meta">{n.time.toLocaleString()}</span>
            </div>
            <p className="ud-notif-body" style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p>
            <div className="ud-notif-meta">
              <span>Source: <strong style={{ color: '#0b1329' }}>{n.sourceName}</strong></span>
              <span style={{ margin: '0 8px' }}>&bull;</span>
              <span>Course: <strong style={{ color: '#0b1329' }}>{n.courseTitle}</strong></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── AFFILIATE TAB ──────────────────────────────────────────────────────────

function AffiliateStatCard({ stat }) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#fff',
        border: '1.5px solid #e2e8f0',
        borderRadius: 14,
        padding: '22px 18px',
        boxShadow: isHovered
          ? '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)'
          : '0 1px 3px rgba(0,0,0,0.02)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        borderColor: isHovered ? stat.color + '50' : '#e2e8f0',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ color: stat.color, marginBottom: 12, display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', padding: 8, borderRadius: 8, background: stat.color + '12' }}>
          {stat.icon}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{stat.value}</div>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{stat.label}</div>
    </div>
  )
}

function AffiliateTab({ user, profile }) {
  const [affiliate, setAffiliate] = useState(null)
  const [commissions, setCommissions] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState('overview')

  const affiliateLink = profile?.affiliate_code
    ? `${window.location.origin}/?ref=${profile.affiliate_code}`
    : null

  useEffect(() => {
    if (!user) return
    loadAffiliateData()
  }, [user])

  async function loadAffiliateData() {
    try {
      // Step 1: fetch affiliate record for this user
      const { data: affData } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      setAffiliate(affData)

      // Step 2: only query commissions & payouts if we have a real affiliate ID
      if (affData?.id) {
        const [commRes, payRes] = await Promise.all([
          supabase.from('affiliate_commissions')
            .select('*, orders(reference, created_at)')
            .eq('affiliate_id', affData.id)
            .order('created_at', { ascending: false })
            .limit(20),
          supabase.from('affiliate_payouts')
            .select('*')
            .eq('affiliate_id', affData.id)
            .order('created_at', { ascending: false })
            .limit(10)
        ])
        setCommissions(commRes.data || [])
        setPayouts(payRes.data || [])
      } else {
        setCommissions([])
        setPayouts([])
      }
    } catch (e) {
      console.error('[AffiliateTab] load error:', e)
    } finally {
      setLoading(false)
    }
  }


  async function handleCopyLink() {
    if (!affiliateLink) return
    try {
      await navigator.clipboard.writeText(affiliateLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch(e) {
      const ta = document.createElement('textarea')
      ta.value = affiliateLink
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function formatNGN(kobo) {
    return `₦${((kobo || 0) / 100).toLocaleString()}`
  }

  const TIER_CONFIG = {
    bronze: { 
      label: 'Bronze', 
      color: '#ea580c', 
      bg: '#fef3e2', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    silver: { 
      label: 'Silver', 
      color: '#475569', 
      bg: '#f1f5f9', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    },
    gold: { 
      label: 'Gold', 
      color: '#a16207', 
      bg: '#fefce8', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    },
    platinum: { 
      label: 'Platinum', 
      color: '#6d28d9', 
      bg: '#f5f3ff', 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <path d="M6 3h12l4 6-10 13L2 9z" />
          <path d="M11 3 8 9l4 13 4-13-3-6" />
          <path d="M2 9h20" />
        </svg>
      )
    }
  }
  const STATUS_COLORS = {
    pending: { bg: '#fef9c3', text: '#854d0e' },
    approved: { bg: '#dcfce7', text: '#166534' },
    paid: { bg: '#dbeafe', text: '#1e40af' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
    cancelled: { bg: '#f3f4f6', text: '#374151' }
  }

  const tier = TIER_CONFIG[affiliate?.tier || 'bronze']
  const pendingEarnings = (affiliate?.total_earnings || 0) - (affiliate?.total_paid || 0)

  if (loading) {
    return <div style={{ padding: '40px 0', color: '#64748b', fontWeight: 600 }}>Loading affiliate data...</div>
  }

  const subTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'commissions', label: `Commissions (${commissions.length})` },
    { id: 'payouts', label: 'Payout History' },
    { id: 'howto', label: 'How It Works' }
  ]

  return (
    <div style={{ fontFamily: 'var(--font)' }}>

      {/* Hero Banner */}
      <div className="affiliate-hero-banner" style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        borderRadius: 16,
        padding: '32px 32px',
        marginBottom: 28,
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Your Affiliate Dashboard</h2>
          </div>
          <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            Share your unique link and earn <strong style={{ color: '#a78bfa' }}>{affiliate?.commission_rate || 20}% commission</strong> on every sale you refer.
          </p>

          {/* Affiliate Link Box */}
          {affiliateLink ? (
            <div className="affiliate-link-box" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, flexShrink: 0 }}>YOUR LINK</span>
              <span style={{ flex: 1, fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace', wordBreak: 'break-all' }}>{affiliateLink}</span>
              <button
                  onClick={handleCopyLink}
                  style={{
                    background: copied ? '#10b981' : '#7c3aed',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '8px 16px', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      Copy Link
                    </>
                  )}
                </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              Your affiliate link is being generated. Please refresh in a moment.
            </div>
          )}

          {/* Your Code */}
          {profile?.affiliate_code && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Your code:</span>
              <span style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: '#a78bfa', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
                {profile.affiliate_code}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>— share anywhere</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="affiliate-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { 
            label: 'Total Clicks', 
            value: affiliate?.total_clicks || 0, 
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            ), 
            color: 'var(--g600)' 
          },
          { 
            label: 'Conversions', 
            value: affiliate?.total_referrals || 0, 
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            ), 
            color: '#059669' 
          },
          { 
            label: 'Total Earned', 
            value: formatNGN(affiliate?.total_earnings), 
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            ), 
            color: '#7c3aed', 
            isAmount: true 
          },
          { 
            label: 'Pending Payout', 
            value: formatNGN(pendingEarnings), 
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ), 
            color: '#d97706', 
            isAmount: true 
          },
          { 
            label: 'Total Paid Out', 
            value: formatNGN(affiliate?.total_paid), 
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ), 
            color: '#059669', 
            isAmount: true 
          },
        ].map(stat => (
          <AffiliateStatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Tier + Commission Rate */}
      <div className="affiliate-tier-container" style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{
          flex: 1, minWidth: 240,
          background: tier.bg, border: `1.5px solid ${tier.color}30`,
          borderRadius: 14, padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
        }}>
          <span style={{ display: 'inline-flex', color: tier.color, padding: 10, borderRadius: 10, background: '#ffffffcc' }}>{tier.icon}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Your Tier</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: tier.color, margin: '2px 0' }}>{tier.label}</div>
            <div style={{ fontSize: 13, color: '#475569' }}>Commission rate: <strong style={{ color: tier.color }}>{affiliate?.custom_rate || affiliate?.commission_rate || 20}%</strong></div>
          </div>
        </div>
        <div style={{
          flex: 1, minWidth: 240,
          background: '#f8fafc', border: '1.5px solid #e2e8f0',
          borderRadius: 14, padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Tier Progress Structure</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 12.5, color: '#64748b' }}>
            <div>Bronze: 0+ sales → <strong style={{ color: '#ea580c' }}>20%</strong></div>
            <div>Silver: 6+ sales → <strong style={{ color: '#475569' }}>25%</strong></div>
            <div>Gold: 21+ sales → <strong style={{ color: '#a16207' }}>30%</strong></div>
            <div>Platinum: 50+ sales → <strong style={{ color: '#6d28d9' }}>35%</strong></div>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, padding: 4, background: '#f1f5f9', borderRadius: 10, width: 'fit-content', overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap' }} className="no-scrollbar">
        {subTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            style={{
              background: activeSubTab === t.id ? '#fff' : 'transparent',
              border: 'none',
              padding: '8px 16px',
              fontWeight: activeSubTab === t.id ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              color: activeSubTab === t.id ? 'var(--g600)' : '#64748b',
              borderRadius: 8,
              boxShadow: activeSubTab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
              fontFamily: 'var(--font)',
              whiteSpace: 'nowrap'
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Overview Sub-tab */}
      {activeSubTab === 'overview' && (
        <div>
          {/* Share CTA */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e40af', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19l7-7 3 3-10 10-10-10 3-3 7 7zm0-16v11"/></svg>
              Share Your Link To Start Earning
            </div>
            <p style={{ fontSize: 13, color: 'var(--g500)', margin: '0 0 14px' }}>Every time someone buys through your link, you earn {affiliate?.commission_rate || 20}% of the sale.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'WhatsApp', bg: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(`Check out Amplified Skills - the best platform to learn in-demand skills! ${affiliateLink || ''}`)}` },
                { label: 'Facebook', bg: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateLink || window.location.origin)}` },
                { label: 'Twitter/X', bg: '#000', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just discovered @AmplifiedSkills - amazing courses for career growth! ${affiliateLink || ''}`)}` },
              ].map(s => (
                <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{ background: s.bg, color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{s.label}</button>
                </a>
              ))}
            </div>
          </div>

          {/* Recent commissions preview */}
          {commissions.length > 0 && (
            <div>
              <div style={{ fontWeight: 700, color: '#0b1329', marginBottom: 12, fontSize: 15 }}>Recent Commissions</div>
              {commissions.slice(0, 3).map(c => {
                const sc = STATUS_COLORS[c.status] || STATUS_COLORS.pending
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0b1329' }}>Order #{c.orders?.reference?.slice(-8) || c.order_id}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#059669' }}>{formatNGN(c.commission_amount)}</div>
                      <span style={{ fontSize: 10, background: sc.bg, color: sc.text, padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>{c.status}</span>
                    </div>
                  </div>
                )
              })}
              <button onClick={() => setActiveSubTab('commissions')} style={{ background: 'none', border: 'none', color: 'var(--g600)', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0 }}>View all commissions →</button>
            </div>
          )}

          {commissions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#f8fafc', color: '#64748b', marginBottom: 14 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0b1329', marginBottom: 8 }}>No commissions yet</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Share your link to start earning. Every sale through your link earns you {affiliate?.commission_rate || 20}% commission!</div>
            </div>
          )}
        </div>
      )}

      {/* Commissions Sub-tab */}
      {activeSubTab === 'commissions' && (
        <div>
          {commissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#f8fafc', color: '#64748b', marginBottom: 14 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0b1329', marginBottom: 8 }}>No commissions yet</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Commissions appear here when someone buys through your referral link.</div>
            </div>
          ) : (
            <div className="responsive-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflowX: 'auto', overflowY: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Order Ref', 'Date', 'Order Amount', 'Commission Rate', 'You Earned', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map(c => {
                    const sc = STATUS_COLORS[c.status] || STATUS_COLORS.pending
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', color: '#0b1329' }}>#{c.orders?.reference?.slice(-8) || '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{formatNGN(c.order_amount)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>{c.commission_rate}%</td>
                        <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: '#059669' }}>{formatNGN(c.commission_amount)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, background: sc.bg, color: sc.text, padding: '3px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>{c.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payouts Sub-tab */}
      {activeSubTab === 'payouts' && (
        <div>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: 6 }}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Payouts are processed monthly. Minimum payout threshold: ₦5,000. Contact support to update your bank details.
          </div>
          {payouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#f8fafc', color: '#64748b', marginBottom: 14 }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21h18M3 10h18M5 10v11M19 10v11M12 10v11M4 6l8-4 8 4z" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0b1329' }}>No payouts yet</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Payouts appear here once admin approves and processes your commissions.</div>
            </div>
          ) : (
            <div className="responsive-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflowX: 'auto', overflowY: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Date', 'Amount', 'Method', 'Reference', 'Status'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: 15, fontWeight: 800, color: '#059669' }}>{formatNGN(p.amount)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.payout_method || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: 'monospace', color: '#64748b' }}>{p.transaction_ref || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, background: p.status === 'paid' ? '#dcfce7' : '#fef9c3', color: p.status === 'paid' ? '#166534' : '#854d0e', padding: '3px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* How It Works Sub-tab */}
      {activeSubTab === 'howto' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { 
              step: '1', 
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#fff' }}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              ), 
              title: 'Share Your Unique Link', 
              desc: 'Your link automatically tracks anyone who clicks it for 30 days. Share on WhatsApp, social media, email, or your blog.' 
            },
            { 
              step: '2', 
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#fff' }}>
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              ), 
              title: 'Your Referral Makes a Purchase', 
              desc: 'When someone buys any product through your link within 30 days, a commission is automatically created for you.' 
            },
            { 
              step: '3', 
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#fff' }}>
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              ), 
              title: 'Commission is Approved', 
              desc: 'Our team reviews and approves commissions within a few days. You can track status in the Commissions tab.' 
            },
            { 
              step: '4', 
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#fff' }}>
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ), 
              title: 'Get Paid Monthly', 
              desc: 'Once your balance reaches ₦5,000, you will receive a bank transfer on or before the 5th of each month.' 
            },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: 16, padding: '20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, var(--g600))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0b1329', marginBottom: 4 }}>Step {item.step}: {item.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── MAIN DASHBOARD COMPONENT ───────────────────────────────────────────────

export default function LMSDashboard() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  
  // Impersonation state
  const impersonatedStr = localStorage.getItem('impersonatedUser')
  const impersonatedUser = impersonatedStr ? JSON.parse(impersonatedStr) : null

  // Default to Account Settings if user navigated from /account specifically
  const initialTab = location.pathname === '/account' ? 'settings' : (localStorage.getItem('enable_academics') === 'true' ? 'learning' : 'history')
  const [activeTab, setActiveTab] = useState(initialTab)
  
  const [features, setFeatures] = useState({
    enable_academics: localStorage.getItem('enable_academics') === 'true',
    enable_affiliates: localStorage.getItem('enable_affiliates') !== 'false'
  })

  useEffect(() => {
    async function loadFlags() {
      try {
        const { data } = await supabase.from('settings').select('*')
        if (data) {
          const siteConfig = data.find(s => s.id === 'site_config')
          if (siteConfig?.value) {
            const academics = siteConfig.value.enable_academics ?? false
            const affiliates = siteConfig.value.enable_affiliates ?? true
            localStorage.setItem('enable_academics', academics)
            localStorage.setItem('enable_affiliates', affiliates)
            setFeatures({
              enable_academics: academics,
              enable_affiliates: affiliates
            })
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadFlags()
  }, [])
  
  // Left Collapsible Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Avatar upload prompt banner state
  const [avatarBannerDismissed, setAvatarBannerDismissed] = useState(
    () => !!sessionStorage.getItem('avatar_prompt_dismissed')
  )

  // ── Enrollment Recovery (DB-based, WooCommerce-style) ────────────────────────
  // When a student lands on the dashboard, we cross-check their paid orders against
  // their enrollments. If any course is missing an enrollment, we create it now.
  // This is the industry-standard safety net (similar to WooCommerce order hooks).
  // No localStorage dependency — reads from real DB data only.
  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function runRecovery() {
      try {
        const recovered = await recoverEnrollmentFromOrders(user.id, user.email)
        if (recovered && !cancelled) {
          // Reload so the new enrollment card appears in MyLearningTab
          window.location.reload()
        }
      } catch (err) {
        console.error('[Dashboard] Enrollment recovery error:', err)
      }
    }

    runRecovery()
    return () => { cancelled = true }
  }, [user])

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#050b14', color: '#fff',
        fontFamily: "var(--font)", zIndex: 9999
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: 160, height: 160, background: 'radial-gradient(circle, rgba(36, 106, 66,0.25) 0%, rgba(36, 106, 66,0) 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(24px)', animation: 'ambient-glow 3s ease-in-out infinite' }} />
          <img src="/logo.png" alt="Amplified Skills" style={{ height: 100, width: 'auto', maxWidth: 280, objectFit: 'contain', marginBottom: 36, filter: 'drop-shadow(0 0 10px rgba(36, 106, 66,0.15))', animation: 'logo-pulse 2.2s ease-in-out infinite' }} />
          <div className="premium-spinner" />
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: '14px', letterSpacing: '0.5px', position: 'relative', zIndex: 1 }}>Loading portal session...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .premium-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.05);
            border-top-color: var(--g600);
            border-right-color: var(--g500);
            border-radius: 50%;
            animation: spin-loader 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          @keyframes spin-loader {
            to { transform: rotate(360deg); }
          }
          @keyframes logo-pulse {
            0%, 100% { transform: scale(1); opacity: 0.85; filter: drop-shadow(0 0 8px rgba(36, 106, 66,0.1)); }
            50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 16px rgba(36, 106, 66,0.4)); }
          }
          @keyframes ambient-glow {
            0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          }
        `}} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  // Allow admin only if they are NOT in impersonating student mode
  if ((profile?.role === 'admin' || user?.app_metadata?.role === 'admin') && !impersonatedUser) {
    return <Navigate to="/admin" />
  }

  // Compute effective user context (uses student credentials if impersonation is active)
  const effectiveUser = impersonatedUser ? {
    id: impersonatedUser.id,
    email: impersonatedUser.email,
    user_metadata: { full_name: impersonatedUser.full_name }
  } : user

  const userEmail = effectiveUser?.email || '';
  const emailName = userEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
  const firstName = effectiveUser?.user_metadata?.full_name?.split(' ')[0] || emailName.split(' ')[0] || 'Student';
  const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const handleStopImpersonating = () => {
    localStorage.removeItem('impersonatedUser')
    window.location.href = '/admin/users'
  }

  const tabLabels = {
    learning: 'All Courses',
    wishlist: 'My Wishlist',
    certificates: 'My Certificates',
    notifications: 'Notifications',
    history: 'Purchase History',
    affiliate: 'Affiliate Program',
    settings: 'Account Settings'
  }

  return (
    <div className="ud-dashboard-layout">
      {/* Impersonation Banner */}
      {impersonatedUser && (
        <div style={{ 
          background: 'linear-gradient(90deg, var(--g600) 0%, #0b1329 100%)', 
          color: '#fff', 
          padding: '12px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          fontSize: 14, 
          fontWeight: 600, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 9999
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Support POV: Viewing as student <strong>{impersonatedUser.full_name || 'Student'}</strong> ({impersonatedUser.email})</span>
          </div>
          <button 
            onClick={handleStopImpersonating}
            style={{ 
              background: '#fff', 
              color: '#0b1329', 
              border: 'none', 
              padding: '8px 16px', 
              fontWeight: 700, 
              cursor: 'pointer',
              fontSize: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              transition: 'all 0.15s ease'
            }}
          >
            Exit POV Support
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="std-nav" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', height: 72, padding: '0 24px', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 90 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle-btn"
            style={{ 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, color: '#0b1329'
            }}
            title="Toggle Menu"
          >
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              width: 18, height: 13, padding: 0, boxSizing: 'border-box',
              outline: 'none', position: 'relative'
            }}>
              <span style={{ width: 18, height: 2, background: 'currentColor', borderRadius: 10, transition: 'all 0.3s ease', transformOrigin: 'left center', transform: sidebarOpen ? 'rotate(45deg) translate(2px, -1px)' : 'none' }}></span>
              <span style={{ width: 18, height: 2, background: 'currentColor', borderRadius: 10, transition: 'all 0.3s ease', opacity: sidebarOpen ? 0 : 1, transform: sidebarOpen ? 'translateX(10px)' : 'none' }}></span>
              <span style={{ width: 18, height: 2, background: 'currentColor', borderRadius: 10, transition: 'all 0.3s ease', transformOrigin: 'left center', transform: sidebarOpen ? 'rotate(-45deg) translate(2px, 1px)' : 'none' }}></span>
            </div>
          </button>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ height: 64, width: 'auto', display: 'block' }} />
          </Link>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <UserMenu user={effectiveUser} />
        </div>
      </nav>

      {/* Shell Workspace */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 72px)', position: 'relative' }}>
        
        {/* Left Collapsible Navigation Sidebar (Microsoft-inspired layout) */}
        <aside className={`ud-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 16px' }}>
            
            {/* Student ID badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '0 8px' }}>
              {effectiveUser?.user_metadata?.avatar_url ? (
                <img
                  src={effectiveUser.user_metadata.avatar_url}
                  alt="Avatar"
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid var(--g600)' }}
                />
              ) : (
                <UserAvatar user={effectiveUser} size={36} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{effectiveUser?.user_metadata?.full_name || capitalizedFirstName}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Customer Workspace</div>
              </div>
            </div>

            {/* Sidebar Navigation links */}
             <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {[
                features.enable_academics && { id: 'learning', label: 'All Courses', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
                { id: 'history', label: 'Purchase History', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
                { id: 'wishlist', label: 'Wishlist', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-7.682-7.682L12 5.67l-1.06-1.06a4.5 4.5 0 00-6.364 0z" /> },
                features.enable_academics && { id: 'certificates', label: 'Certificates', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
                { id: 'notifications', label: 'Notifications', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> },
                { id: 'settings', label: 'Account Settings', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> }
              ].filter(Boolean).map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    if (window.innerWidth < 1024) setSidebarOpen(false)
                  }}
                  className={`ud-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                >
                  <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {item.icon}
                  </svg>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="ud-main-content">
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>

            {/* Avatar Upload Prompt Banner — shows only when no avatar uploaded yet */}
            {!effectiveUser?.user_metadata?.avatar_url && activeTab !== 'settings' && !avatarBannerDismissed && (
              <div style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                border: '1.5px solid #bfdbfe',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <UserAvatar user={effectiveUser} size={48} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 3 }}>
                      Welcome, {capitalizedFirstName}! 👋 Add your profile photo
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>
                      A profile photo personalizes your account and helps us recognize you across your orders.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  <button
                    onClick={() => setActiveTab('settings')}
                    style={{
                      background: 'var(--g600)', color: '#fff', border: 'none',
                      padding: '9px 18px', borderRadius: 8, fontWeight: 700,
                      fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    Upload Photo →
                  </button>
                  <button
                    onClick={() => { sessionStorage.setItem('avatar_prompt_dismissed', '1'); setAvatarBannerDismissed(true) }}
                    style={{
                      background: 'transparent', border: '1px solid #cbd5e1',
                      color: '#64748b', padding: '8px 14px', borderRadius: 8,
                      fontWeight: 600, fontSize: 12, cursor: 'pointer'
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <h2 className="ud-tab-title">{tabLabels[activeTab]}</h2>
            {activeTab === 'learning' && <MyLearningTab user={effectiveUser} />}
            {activeTab === 'wishlist' && <WishlistTab user={effectiveUser} />}
            {activeTab === 'certificates' && <StudentCertificates user={effectiveUser} />}
            {activeTab === 'notifications' && <NotificationsTab user={effectiveUser} />}
            {activeTab === 'history' && <PurchaseHistoryTab user={effectiveUser} profile={profile} />}
            {activeTab === 'affiliate' && <AffiliateTab user={effectiveUser} profile={profile} />}
            {activeTab === 'settings' && <SettingsTab user={effectiveUser} />}
          </div>
        </main>
      </div>

      {/* Embedded CSS Style Overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        .ud-dashboard-layout {
          min-height: 100vh;
          background-color: #f8fafc;
          font-family: var(--font);
          color: #0b1329;
          display: flex;
          flex-direction: column;
        }
        
        .ud-sidebar {
          width: 260px;
          min-width: 260px;
          background-color: #000000;
          border-right: 1px solid #1a1a1a;
          color: #fff;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          overflow: hidden;
          z-index: 80;
        }
        
        .ud-sidebar.closed {
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          border-right: none !important;
        }
        
        .ud-sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: all 0.2s ease;
          border-radius: 4px;
          font-family: var(--font);
        }
        
        .ud-sidebar-item:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
        }
        
        .ud-sidebar-item.active {
          color: #fff;
          background: var(--g600); /* Brand Blue active item */
        }
        
        .ud-sidebar-item svg {
          flex-shrink: 0;
        }
        
        .ud-main-content {
          flex: 1;
          background: #ffffff;
          padding: 40px 32px;
          min-width: 0;
        }
        
        .ud-tab-title {
          font-size: 28px;
          font-weight: 700;
          color: #0b1329;
          margin: 0 0 28px;
          font-family: var(--font-heading) !important;
          letter-spacing: -0.5px;
        }
        
        .ud-course-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 32px;
          padding-bottom: 40px;
        }
        
        .ud-course-card {
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.2s;
          height: 100%;
          border-radius: 4px;
        }
        
        .ud-course-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
          border-color: #cbd5e1;
        }
        
        .ud-course-card-img {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background: #f7f9fa;
          position: relative;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .ud-course-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        
        .ud-course-card:hover .ud-course-card-img img {
          transform: scale(1.03);
        }
        
        .ud-card-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(11, 19, 41, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .ud-course-card:hover .ud-card-overlay {
          opacity: 1;
        }
        
        .ud-play-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0b1329;
          font-size: 20px;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transition: transform 0.15s ease;
        }
        
        .ud-play-icon:hover {
          transform: scale(1.1);
        }
        
        .ud-course-card-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .ud-course-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #0b1329;
          margin: 0 0 6px;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 40px;
          font-family: var(--font-heading) !important;
        }
        
        .ud-course-card-instructor {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .ud-progress-container {
          margin-top: auto;
        }
        
        .ud-progress-bar-bg {
          width: 100%;
          height: 4px;
          background: #e2e8f0;
          margin-bottom: 8px;
          border-radius: 2px;
        }
        
        .ud-progress-bar-fill {
          height: 100%;
          background: var(--g600);
          border-radius: 2px;
        }
        
        .ud-progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .ud-progress-text {
          font-size: 12px;
          font-weight: 700;
          color: #0b1329;
        }
        
        .ud-progress-label {
          font-size: 11px;
          color: #64748b;
        }
        
        .ud-card-btn {
          display: block;
          text-align: center;
          border: 1.5px solid var(--g600);
          background: transparent;
          color: var(--g600);
          padding: 8px 16px;
          font-weight: 700;
          font-size: 13.5px;
          text-decoration: none;
          margin-top: 14px;
          transition: all 0.2s ease;
          border-radius: 4px;
          font-family: var(--font);
        }
        
        .ud-card-btn:hover {
          background: var(--g600);
          color: #fff;
        }
        
        .ud-form-container {
          max-width: 600px;
          border: 1px solid #e2e8f0;
          padding: 32px;
          background: #fff;
          margin-bottom: 40px;
        }
        
        .ud-form-group {
          margin-bottom: 20px;
        }
        
        .ud-form-label {
          display: block;
          font-size: 13.5px;
          font-weight: 700;
          color: #0b1329;
          margin-bottom: 8px;
        }
        
        .ud-form-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          font-size: 14.5px;
          color: #0b1329;
          outline: none;
          border-radius: 4px;
          box-sizing: border-box;
          transition: all 0.15s;
          font-family: var(--font);
        }
        
        .ud-form-input:focus {
          border-color: var(--g600);
          box-shadow: 0 0 0 3px rgba(36, 106, 66, 0.1);
        }
        
        .ud-form-submit {
          background: var(--g600);
          color: #fff;
          border: 1px solid var(--g600);
          padding: 12px 24px;
          font-weight: 700;
          font-size: 14.5px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: var(--font);
        }
        
        .ud-form-submit:hover {
          background: var(--g700);
          border-color: var(--g700);
        }
        
        .ud-form-submit:disabled {
          background: #cbd5e1;
          border-color: #cbd5e1;
          cursor: not-allowed;
        }
        
        .ud-table-container {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow-x: auto;
          margin-bottom: 40px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        
        .ud-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 600px;
        }
        
        .ud-table th {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 14px 20px;
          color: #0b1329;
          font-weight: 700;
          font-size: 13.5px;
          font-family: var(--font);
        }
        
        .ud-table td {
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 20px;
          font-size: 14px;
          color: #0b1329;
          font-family: var(--font);
        }
        
        .ud-table tr:last-child td {
          border-bottom: none;
        }
        
        .ud-notif-card {
          border: 1px solid #e2e8f0;
          padding: 16px 20px;
          margin-bottom: 16px;
          display: flex;
          gap: 16px;
          background: #fff;
        }
        
        .ud-notif-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #eff6ff;
          color: var(--g600);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        
        .ud-notif-content {
          flex: 1;
        }
        
        .ud-notif-title {
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #0b1329;
          font-family: var(--font-heading) !important;
        }
        
        .ud-notif-body {
          font-size: 14px;
          color: #475569;
          line-height: 1.5;
          margin: 0 0 8px;
        }
        
        .ud-notif-meta {
          font-size: 11.5px;
          color: #64748b;
        }
        
        @media (max-width: 1023px) {
          .ud-sidebar {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            transform: translateX(-100%);
            z-index: 99;
          }
          .ud-sidebar.open {
            transform: translateX(0);
            box-shadow: 10px 0 25px rgba(0,0,0,0.15);
            width: 260px;
            min-width: 260px;
          }
          .ud-main-content {
            padding: 32px 16px;
          }
          .ud-tab-title {
            font-size: 24px;
            margin-bottom: 20px;
          }
        }
        
        /* Affiliate Dashboard Responsiveness */
        @media (max-width: 640px) {
          .affiliate-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
          .affiliate-hero-banner {
            padding: 24px 20px !important;
          }
          .affiliate-hero-banner h2 {
            font-size: 19px !important;
          }
          .affiliate-hero-banner p {
            font-size: 13px !important;
            margin-bottom: 16px !important;
          }
          .affiliate-link-box {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            padding: 10px 12px !important;
          }
          .affiliate-link-box span:first-child {
            align-self: flex-start !important;
          }
          .affiliate-link-box button {
            width: 100% !important;
            justify-content: center !important;
          }
          .affiliate-tier-container {
            flex-direction: column !important;
          }
          .responsive-table-wrapper {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
        }
      `}} />
    </div>
  )
}

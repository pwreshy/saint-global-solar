import React, { useState, useEffect, useRef } from 'react'
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePersistedState } from '../hooks/usePersistedState'
import AdminCourses from './AdminCourses'
import AdminCourseBuilder from './AdminCourseBuilder'
import AdminUsers from './AdminUsers'
import AdminOrders from './AdminOrders'
import AdminSettings from './AdminSettings'
import AdminCertificates from './AdminCertificates'
import AdminAnnouncements from './AdminAnnouncements'
import AdminCoupons from './AdminCoupons'
import AdminQnA from './AdminQnA'
import AdminReviews from './AdminReviews'
import AdminPages from './AdminPages'
import AdminAffiliates from './AdminAffiliates'
import AdminPayouts from './AdminPayouts'
import AdminUpsells from './AdminUpsells'
import AdminAnalytics from './AdminAnalytics'
import AdminPlatformAnalytics from './AdminPlatformAnalytics'
import AdminCategories from './AdminCategories'
import AdminLandingPages from './AdminLandingPages'

function AdminOverview({ featureFlags = { enable_academics: true } }) {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, productsCount: 0, conversionRate: 0, courseStats: [], unansweredQna: 0 })
  const [chartData, setChartData] = useState({ revenuePoints: [], orderPoints: [] })
  const [recentPayments, setRecentPayments] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const navigate = useNavigate()

  const [hoveredRevenue, setHoveredRevenue] = useState(null)
  const [hoveredOrder, setHoveredOrder] = useState(null)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function loadStats() {
      try {
          console.log('[AdminStats] Loading stats via client-side parallel queries...')
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

          const [
            resUsersCount,
            resTotalOrders,
            resProdCount,
            resUnansQna,
            resPaidOrdersCount,
            resRevData,
            resRecentOrders,
            resCourses,
            resUsers
          ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            supabase.from('products').select('*', { count: 'exact', head: true }),
            supabase.from('qna_questions').select('*', { count: 'exact', head: true }).eq('is_resolved', false),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
            supabase.from('orders').select('amount').eq('status', 'paid'),
            supabase.from('orders').select(`
              id,
              reference,
              customer_email,
              customer_name,
              amount,
              status,
              created_at,
              products ( title )
            `).order('created_at', { ascending: false }).limit(5),
            supabase.from('courses').select('id, level, products(title), enrollments(id)'),
            supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(5)
          ])

          const usersCount = resUsersCount.count
          const totalOrders = resTotalOrders.count
          const prodCount = resProdCount.count
          const unansQna = resUnansQna.count
          const paidOrdersCount = resPaidOrdersCount.count
          const revData = resRevData.data
          const recentOrders = resRecentOrders.data
          const courses = resCourses.data
          const users = resUsers.data

          const rev = (revData || []).reduce((a, b) => a + (b.amount || 0), 0)
          const rate = totalOrders ? Math.round((paidOrdersCount / totalOrders) * 100) : 0
          const cStats = (courses || []).map(c => ({
            title: c.products?.title || 'Untitled Course',
            level: c.level,
            enrollmentsCount: c.enrollments?.length || 0
          })).sort((a, b) => b.enrollmentsCount - a.enrollmentsCount)

          setStats({ 
            users: usersCount || 0, 
            orders: paidOrdersCount || 0, 
            revenue: rev, 
            productsCount: prodCount || 0,
            conversionRate: rate,
            courseStats: cStats,
            unansweredQna: unansQna || 0
          })

          setRecentPayments(recentOrders || [])
          setRecentUsers(users || [])

        const { data: chartOrders } = await supabase
          .from('orders')
          .select('amount, status, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())

        const last7Days = Array.from({ length: 7 }).map((_, idx) => {
          const date = new Date()
          date.setDate(date.getDate() - idx)
          return date.toISOString().split('T')[0]
        }).reverse()

        const revPoints = last7Days.map(dateStr => {
          const dayAmount = (chartOrders || [])
            .filter(o => o.status === 'paid' && o.created_at.startsWith(dateStr))
            .reduce((sum, o) => sum + (o.amount || 0), 0)
          return { date: dateStr, amount: dayAmount }
        })

        const ordPoints = last7Days.map(dateStr => {
          const count = (chartOrders || [])
            .filter(o => o.created_at.startsWith(dateStr)).length
          return { date: dateStr, count }
        })

        setChartData({
          revenuePoints: revPoints,
          orderPoints: ordPoints
        })

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#697386', fontFamily: 'var(--font)' }}>Loading overview metrics...</div>

  const isSmall = windowWidth < 768

  // Calculate Revenue line points dynamically with inset mapping
  const maxRevenueVal = Math.max(...chartData.revenuePoints.map(p => p.amount), 1000)
  
  const width = 500
  const height = 150
  const paddingLeft = 48
  const paddingRight = 18
  const paddingTop = 15
  const paddingBottom = 32
  
  const plotWidth = width - paddingLeft - paddingRight
  const plotHeight = height - paddingTop - paddingBottom
  const bottomY = paddingTop + plotHeight
  
  const points = chartData.revenuePoints.map((p, idx) => {
    const x = paddingLeft + (idx / 6) * plotWidth
    const y = bottomY - (p.amount / maxRevenueVal) * plotHeight
    return { x, y }
  })

  const getBezierPath = (pts) => {
    if (pts.length === 0) return ''
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`
    let d = `M ${pts[0].x},${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const cp1x = p0.x + (p1.x - p0.x) / 3
      const cp1y = p0.y
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3
      const cp2y = p1.y
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`
    }
    return d
  }

  const bezierLine = getBezierPath(points)
  const bezierArea = points.length > 0 ? `${bezierLine} L ${points[points.length - 1].x},${bottomY} L ${points[0].x},${bottomY} Z` : ''

  // Grid lines and labels for Revenue Chart
  const revenueGridLines = [0, 0.33, 0.66, 1].map(ratio => {
    const y = bottomY - ratio * plotHeight
    const value = ratio * maxRevenueVal
    return { y, value }
  })

  const revenueDateLabels = chartData.revenuePoints.map((p, idx) => {
    const x = paddingLeft + (idx / 6) * plotWidth
    let dateStr = ''
    try {
      const d = new Date(p.date)
      dateStr = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    } catch (e) {
      dateStr = p.date
    }
    return { x, label: dateStr }
  })

  // Calculate Order volume bars dynamically with inset mapping
  const maxOrdersVal = Math.max(...chartData.orderPoints.map(p => p.count), 5)

  const orderGridLines = [0, 0.33, 0.66, 1].map(ratio => {
    const y = bottomY - ratio * plotHeight
    const value = ratio * maxOrdersVal
    return { y, value }
  })

  const orderDateLabels = chartData.orderPoints.map((p, idx) => {
    const x = paddingLeft + (idx / 6) * plotWidth
    let dateStr = ''
    try {
      const d = new Date(p.date)
      dateStr = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    } catch (e) {
      dateStr = p.date
    }
    return { x, label: dateStr }
  })

  const barWidth = 16

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36', margin: 0 }}>Dashboard Overview</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 13.5 }}>Real-time business insights, course engagements, and performance metrics.</p>
        </div>
        
        {/* Quick Actions Panel */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/admin/products')}
            style={{ background: 'var(--g600)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            + Create Product
          </button>
          <button 
            onClick={() => navigate('/admin/announcements')}
            style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#4f566b', padding: '8px 14px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            Broadcast Message
          </button>
          <button 
            onClick={() => navigate('/admin/orders')}
            style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#4f566b', padding: '8px 14px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            View Payouts
          </button>
        </div>
      </div>

      {/* Unanswered Q&A Widget */}
      {stats.unansweredQna > 0 && featureFlags.enable_academics && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 18px', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'rgba(245,158,11,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#92400e' }}>You have <strong>{stats.unansweredQna}</strong> unanswered customer questions in your classes.</span>
          </div>
          <Link to="/admin/qna" style={{ fontSize: 12.5, color: 'var(--g600)', fontWeight: 600, textDecoration: 'none' }}>Answer Now &rarr;</Link>
        </div>
      )}

      {/* ── PREMIUM STATS CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        
        {/* Net Revenue */}
        <div style={{ background: 'linear-gradient(135deg, var(--g800) 0%, var(--g700) 100%)', padding: '22px 20px', borderRadius: 12, boxShadow: '0 4px 20px rgba(36, 106, 66,0.35)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 10, width: 100, height: 100, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Net Revenue</h3>
            <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>₦{stats.revenue.toLocaleString()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
            <span style={{ fontWeight: 700, padding: '2px 7px', background: 'rgba(0,255,150,0.18)', color: '#4ade80', borderRadius: 20 }}>+14.3%</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>vs last week</span>
          </div>
        </div>

        {/* Sales Count */}
        <div style={{ background: '#fff', padding: '22px 20px', borderRadius: 12, border: '1px solid #e8edf3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'rgba(36, 106, 66,0.05)', borderRadius: '0 12px 0 100%' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: '#697386', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Sales Count</h3>
            <div style={{ width: 32, height: 32, background: 'rgba(36, 106, 66,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1f36', letterSpacing: '-0.5px' }}>{stats.orders}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
            <span style={{ fontWeight: 700, color: 'var(--g600)' }}>{stats.conversionRate}%</span>
            <span style={{ color: '#697386' }}>conversion rate</span>
          </div>
        </div>

        {/* Total Learners */}
        <div style={{ background: '#fff', padding: '22px 20px', borderRadius: 12, border: '1px solid #e8edf3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'rgba(36, 106, 66,0.05)', borderRadius: '0 12px 0 100%' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: '#697386', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Total Learners</h3>
            <div style={{ width: 32, height: 32, background: 'rgba(36, 106, 66,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1f36', letterSpacing: '-0.5px' }}>{stats.users}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
            <span style={{ fontWeight: 700, color: 'var(--g600)' }}>Active</span>
            <span style={{ color: '#697386' }}>registered profiles</span>
          </div>
        </div>

        {/* Active Products */}
        <div style={{ background: '#fff', padding: '22px 20px', borderRadius: 12, border: '1px solid #e8edf3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'rgba(245,158,11,0.05)', borderRadius: '0 12px 0 100%' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: '#697386', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Active Products</h3>
            <div style={{ width: 32, height: 32, background: 'rgba(245,158,11,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M20 7H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1f36', letterSpacing: '-0.5px' }}>{stats.productsCount}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>{stats.productsCount}</span>
            <span style={{ color: '#697386' }}>listed assets</span>
          </div>
        </div>

      </div>

      {/* ── MODERN CHARTS SECTION ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: 16 }}>
        
        {/* Chart 1: Revenue Volume – Gradient Area Chart */}
        <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '20px 20px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h4 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>Revenue Growth</h4>
              <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500 }}>Last 7 days · Live transactions</span>
            </div>
            <div style={{ display: 'flex', align: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, background: 'linear-gradient(135deg, rgba(36, 106, 66,0.1), rgba(36, 106, 66,0.05))', color: 'var(--g600)', padding: '4px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid rgba(36, 106, 66,0.15)' }}>● Live</span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              ₦{chartData.revenuePoints.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Total this period</div>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <svg onClick={() => setHoveredRevenue(null)} viewBox="0 0 500 160" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--g600)" stopOpacity="0.25" />
                  <stop offset="55%" stopColor="var(--g600)" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="var(--g600)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="revLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--g500)" />
                  <stop offset="100%" stopColor="var(--g700)" />
                </linearGradient>
                <filter id="revGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              
              {/* Horizontal grid lines */}
              {revenueGridLines.map((line, idx) => (
                <g key={idx}>
                  <line x1={paddingLeft} y1={line.y} x2={width - paddingRight} y2={line.y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={paddingLeft - 6} y={line.y + 4} textAnchor="end" fill="#334155" fontSize="10" fontWeight="600">
                    {line.value >= 1000 ? `₦${(line.value/1000).toFixed(0)}k` : `₦${line.value.toFixed(0)}`}
                  </text>
                </g>
              ))}

              {chartData.revenuePoints.length > 0 && (
                <>
                  {/* Filled area */}
                  <path d={bezierArea} fill="url(#revGrad)" />
                  {/* Line stroke with gradient */}
                  <path d={bezierLine} fill="none" stroke="url(#revLineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#revGlow)" />
                  {/* Data points */}
                  {chartData.revenuePoints.map((p, idx) => {
                    const x = paddingLeft + (idx / 6) * plotWidth
                    const y = bottomY - (p.amount / maxRevenueVal) * plotHeight
                    const isHovered = hoveredRevenue && hoveredRevenue.idx === idx
                    return (
                      <g key={idx}>
                        {isHovered && <circle cx={x} cy={y} r="10" fill="rgba(36, 106, 66,0.1)" />}
                        <circle
                          cx={x} cy={y}
                          r={isHovered ? "5.5" : "3.5"}
                          fill={isHovered ? "var(--g700)" : "var(--g600)"}
                          stroke="#fff" strokeWidth="2"
                          style={{ transition: 'r 0.15s ease, fill 0.15s ease', pointerEvents: 'none' }}
                        />
                        {/* Large transparent hover trigger area for easy interactivity */}
                        <circle
                          cx={x} cy={y}
                          r="18"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                            const leftPct = ((rect.left + rect.width/2) - svgRect.left) / svgRect.width * 100
                            const topPct = (rect.top - svgRect.top) / svgRect.height * 100
                            setHoveredRevenue({ leftPct, topPct, value: `₦${p.amount.toLocaleString()}`, date: new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), idx })
                          }}
                          onMouseLeave={() => setHoveredRevenue(null)}
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                            const leftPct = ((rect.left + rect.width/2) - svgRect.left) / svgRect.width * 100
                            const topPct = (rect.top - svgRect.top) / svgRect.height * 100
                            setHoveredRevenue({ leftPct, topPct, value: `₦${p.amount.toLocaleString()}`, date: new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), idx })
                          }}
                        />
                      </g>
                    )
                  })}
                </>
              )}

              {/* X-axis date labels */}
              {revenueDateLabels.map((lbl, idx) => (
                <text key={idx} x={lbl.x} y={height - 8} textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">
                  {lbl.label}
                </text>
              ))}
            </svg>

            {hoveredRevenue && (
              <div style={{
                position: 'absolute',
                left: `${hoveredRevenue.leftPct}%`,
                top: `${hoveredRevenue.topPct}%`,
                transform: `translate(${hoveredRevenue.idx === 0 ? '0%' : (hoveredRevenue.idx === 6 ? '-100%' : '-50%')}, -120%)`,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(36, 106, 66,0.3)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                zIndex: 100,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--g500)', fontSize: 13 }}>{hoveredRevenue.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{hoveredRevenue.date}</div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Order Volume – Modern Bar Chart */}
        <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '20px 20px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h4 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>Order Volume</h4>
              <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500 }}>Last 7 days · Daily checkouts</span>
            </div>
            <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>● Active</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              {chartData.orderPoints.reduce((sum, p) => sum + p.count, 0)}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Total orders this period</div>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <svg onClick={() => setHoveredOrder(null)} viewBox="0 0 500 160" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {orderGridLines.map((line, idx) => (
                <g key={idx}>
                  <line x1={paddingLeft} y1={line.y} x2={width - paddingRight} y2={line.y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={paddingLeft - 6} y={line.y + 4} textAnchor="end" fill="#334155" fontSize="10" fontWeight="600">
                    {Math.round(line.value)}
                  </text>
                </g>
              ))}

              {chartData.orderPoints.map((p, idx) => {
                const xCenter = paddingLeft + (idx / 6) * plotWidth
                const x = xCenter - barWidth / 2
                const barHeight = Math.max((p.count / maxOrdersVal) * plotHeight, p.count > 0 ? 6 : 2)
                const y = bottomY - barHeight
                const isHov = hoveredOrder && hoveredOrder.idx === idx
                return (
                  <g key={idx}>
                    {isHov && <rect x={x - 2} y={y - 2} width={barWidth + 4} height={barHeight + 2} rx="5" fill="rgba(16,185,129,0.15)" />}
                    <rect
                      x={x} y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 2)}
                      rx="4" ry="4"
                      fill={isHov ? "url(#barGradHover)" : "url(#barGrad)"}
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Full height column hover target trigger */}
                    <rect
                      x={xCenter - 20}
                      y={paddingTop}
                      width={40}
                      height={plotHeight + 5}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                        const leftPct = ((rect.left + rect.width/2) - svgRect.left) / svgRect.width * 100
                        const topPct = (y - 10) / height * 100
                        setHoveredOrder({ leftPct, topPct, value: `${p.count} checkout${p.count === 1 ? '' : 's'}`, date: new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), idx })
                      }}
                      onMouseLeave={() => setHoveredOrder(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                        const leftPct = ((rect.left + rect.width/2) - svgRect.left) / svgRect.width * 100
                        const topPct = (y - 10) / height * 100
                        setHoveredOrder({ leftPct, topPct, value: `${p.count} checkout${p.count === 1 ? '' : 's'}`, date: new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), idx })
                      }}
                    />
                  </g>
                )
              })}

              {/* X-axis labels */}
              {orderDateLabels.map((lbl, idx) => (
                <text key={idx} x={lbl.x} y={height - 8} textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">
                  {lbl.label}
                </text>
              ))}
            </svg>

            {hoveredOrder && (
              <div style={{
                position: 'absolute',
                left: `${hoveredOrder.leftPct}%`,
                top: `${hoveredOrder.topPct}%`,
                transform: `translate(${hoveredOrder.idx === 0 ? '0%' : (hoveredOrder.idx === 6 ? '-100%' : '-50%')}, -120%)`,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                zIndex: 100,
                whiteSpace: 'nowrap',
              }}>
                <div style={{ fontWeight: 700, color: '#34d399', fontSize: 13 }}>{hoveredOrder.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{hoveredOrder.date}</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── TWO-COLUMN ANALYTICS LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '2fr 1fr', gap: 20, alignItems: 'flex-start' }}>
        
        {/* Recent Payments Section */}
        <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #fafbff 0%, #f8fafc 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, background: 'rgba(36, 106, 66,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Payments</h4>
            </div>
            <Link to="/admin/orders" style={{ fontSize: 12.5, color: 'var(--g600)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="admin-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '10px 20px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                  <th style={{ padding: '10px 20px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '10px 20px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                  <th style={{ padding: '10px 20px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No payment logs recorded.</td></tr>
                ) : (
                  recentPayments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '13px 20px', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>₦{p.amount.toLocaleString()}</td>
                      <td style={{ padding: '13px 20px', fontSize: 13 }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          background: p.status === 'paid' ? 'rgba(16,185,129,0.1)' : p.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', 
                          color: p.status === 'paid' ? '#059669' : p.status === 'pending' ? '#d97706' : '#dc2626', 
                          borderRadius: 6, 
                          fontSize: 10.5, 
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{p.customer_name || p.customer_email}</td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{p.products?.title || 'Unknown'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course Performance Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Top Courses Progress Chart */}
          <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, background: 'rgba(36, 106, 66,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              </div>
              <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Course Enrollments</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stats.courseStats.length === 0 ? (
                <span style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic' }}>No active registrations.</span>
              ) : (
                (() => {
                  const maxEnroll = Math.max(...stats.courseStats.map(c => c.enrollmentsCount), 1)
                  const colors = ['var(--g600)', 'var(--g500)', '#10b981', '#f59e0b']
                  return stats.courseStats.slice(0, 4).map((c, idx) => {
                    const percentWidth = Math.round((c.enrollmentsCount / maxEnroll) * 100)
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>{c.title}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: colors[idx % colors.length], flexShrink: 0, marginLeft: 8 }}>{c.enrollmentsCount}</span>
                        </div>
                        <div style={{ height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: `linear-gradient(90deg, ${colors[idx % colors.length]}, ${colors[idx % colors.length]}cc)`, width: `${percentWidth}%`, borderRadius: 4, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    )
                  })
                })()
              )}
            </div>
          </div>

          {/* Latest Members */}
          <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, background: 'rgba(16,185,129,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </div>
              <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Latest Members</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {recentUsers.map((u, idx) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fafbff', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, hsl(${idx * 60 + 220},65%,55%), hsl(${idx * 60 + 240},70%,45%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(u.full_name || u.email || 'S')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name || 'Customer'}</div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

function AdminProducts({ featureFlags }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // all, published, draft
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [dbCategories, setDbCategories] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, statusFilter])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const initialFormState = {
    title: '',
    slug: '',
    type: featureFlags?.enable_academics ? 'course' : 'physical',
    description: '',
    price: '',
    compare_price: '',
    cover_image: '',
    images: [],
    variations: { attributes: [], variants: [] },
    features: '',
    is_published: false,
    is_free: false,
    stock_quantity: '',
    weight: '',
    category: '',
    category_id: '',
    packaging: '',
    origin: '',
    delivery_fee: '',
    free_delivery: false,
    shipping_charge_per_item: false
  }

  const [productForm, setProductForm] = usePersistedState('admin_product_form', initialFormState)

  const [uploading, setUploading] = useState(false)
  const [isVariable, setIsVariable] = useState(false)
  const [newAttrName, setNewAttrName] = useState('')
  const [newAttrOptions, setNewAttrOptions] = useState('')

  const loadDbCategories = async () => {
    try {
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data) setDbCategories(data)
    } catch (err) {
      console.warn('Failed to load categories:', err)
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
    setSelectedProductIds([])
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
    loadDbCategories()
  }, [])

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setIsVariable(false)
    // Only reset the form if they haven't typed a draft yet
    if (!productForm.title && !productForm.description && !productForm.price) {
      setProductForm(initialFormState)
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setProductForm(initialFormState)
  }

  const handleOpenEdit = (p) => {
    setEditingProduct(p)
    const hasVariants = !!(p.variations?.variants && p.variations.variants.length > 0)
    setIsVariable(hasVariants)
    setProductForm({
      title: p.title || '',
      slug: p.slug || '',
      type: p.type || 'course',
      description: p.description || '',
      price: p.price || '',
      compare_price: p.old_price || '',
      cover_image: p.cover_image || '',
      images: Array.isArray(p.images) ? p.images : [],
      variations: p.variations || { attributes: [], variants: [] },
      features: Array.isArray(p.features) ? p.features.join('\n') : '',
      is_published: p.is_published || false,
      is_free: p.is_free || false,
      stock_quantity: p.stock_quantity !== null && p.stock_quantity !== undefined ? p.stock_quantity : '',
      weight: p.weight !== null && p.weight !== undefined ? p.weight : '',
      category: p.meta_title || '',
      category_id: p.category_id || '',
      packaging: p.packaging || '',
      origin: p.origin || '',
      delivery_fee: p.delivery_fee !== null && p.delivery_fee !== undefined ? p.delivery_fee : '',
      free_delivery: p.free_delivery || false,
      shipping_charge_per_item: p.shipping_charge_per_item || false
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleTogglePublish = async (p) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_published: !p.is_published })
        .eq('id', p.id)
      if (error) throw error
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete the ${selectedProductIds.length} selected products?`)) return
    try {
      const { error } = await supabase.from('products').delete().in('id', selectedProductIds)
      if (error) throw error
      setSelectedProductIds([])
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleBulkSetDraft = async () => {
    if (!confirm(`Are you sure you want to move the ${selectedProductIds.length} selected products to Draft?`)) return
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_published: false })
        .in('id', selectedProductIds)
      if (error) throw error
      setSelectedProductIds([])
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleBulkPublish = async () => {
    if (!confirm(`Are you sure you want to publish the ${selectedProductIds.length} selected products?`)) return
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_published: true })
        .in('id', selectedProductIds)
      if (error) throw error
      setSelectedProductIds([])
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  // File Upload Handlers (uploads to course-assets)
  const handleMediaFilesUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    setUploading(true)
    try {
      const uploadedUrls = []
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 10)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      const updatedImages = [...(productForm.images || []), ...uploadedUrls]
      const currentCover = (productForm.cover_image || '').trim()
      const isPlaceholder = currentCover === '/logo.png' || currentCover === '/logo_black.png'
      const cover = (!currentCover || isPlaceholder) ? (uploadedUrls[0] || '') : currentCover
      setProductForm({
        ...productForm,
        images: updatedImages,
        cover_image: cover
      })
    } catch (err) {
      alert(`Upload error: ${err.message}\n\nPlease make sure you have:\n1. Created a public bucket named "products" in your Supabase storage dashboard.\n2. Added a Storage Policy (RLS) for the "products" bucket that allows INSERT and SELECT actions (either for Authenticated users or Anonymous/Public access depending on your needs).`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = (indexToRemove) => {
    const urlToRemove = productForm.images[indexToRemove]
    const updatedImages = productForm.images.filter((_, idx) => idx !== indexToRemove)
    let cover = productForm.cover_image
    if (cover === urlToRemove) {
      cover = updatedImages[0] || ''
    }
    setProductForm({
      ...productForm,
      images: updatedImages,
      cover_image: cover
    })
  }

  // WooCommerce-Style Variations Handlers
  const handleAddAttribute = () => {
    if (!newAttrName.trim() || !newAttrOptions.trim()) return
    const options = newAttrOptions.split(',').map(o => o.trim()).filter(Boolean)
    const attributes = [...(productForm.variations?.attributes || []), { name: newAttrName.trim(), options }]
    setProductForm({
      ...productForm,
      variations: {
        ...(productForm.variations || { attributes: [], variants: [] }),
        attributes
      }
    })
    setNewAttrName('')
    setNewAttrOptions('')
  }

  const handleRemoveAttribute = (idxToRemove) => {
    const attributes = (productForm.variations?.attributes || []).filter((_, idx) => idx !== idxToRemove)
    setProductForm({
      ...productForm,
      variations: {
        ...(productForm.variations || { attributes: [], variants: [] }),
        attributes,
        variants: []
      }
    })
  }

  const handleGenerateVariants = () => {
    const attributes = productForm.variations?.attributes || []
    if (attributes.length === 0) return

    const generateCombinations = (index, current) => {
      if (index === attributes.length) {
        return [current]
      }
      const attr = attributes[index]
      let results = []
      attr.options.forEach(opt => {
        results = results.concat(generateCombinations(index + 1, { ...current, [attr.name]: opt }))
      })
      return results
    }

    const combinations = generateCombinations(0, {})
    const variants = combinations.map(combo => {
      const existing = (productForm.variations?.variants || []).find(v => {
        return Object.entries(combo).every(([k, val]) => v.attributes && v.attributes[k] === val)
      })

      return {
        id: existing?.id || `var_${Math.random().toString(36).substring(2, 7)}`,
        attributes: combo,
        price: existing?.price || productForm.price || '',
        compare_price: existing?.compare_price || productForm.compare_price || '',
        stock: existing?.stock !== undefined ? existing.stock : (productForm.stock_quantity || ''),
        image: existing?.image || '',
        weight: existing?.weight || productForm.weight || ''
      }
    })

    setProductForm({
      ...productForm,
      variations: {
        ...(productForm.variations || { attributes: [], variants: [] }),
        variants
      }
    })
  }

  const handleUpdateVariantField = (idx, field, val) => {
    const variants = [...(productForm.variations?.variants || [])]
    variants[idx] = {
      ...variants[idx],
      [field]: val
    }
    setProductForm({
      ...productForm,
      variations: {
        ...(productForm.variations || { attributes: [], variants: [] }),
        variants
      }
    })
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!productForm.title.trim() || !productForm.slug.trim()) return
    setSubmitting(true)

    const isFree = productForm.is_free
    const payload = {
      title: productForm.title.trim(),
      slug: productForm.slug.trim(),
      type: productForm.type,
      description: productForm.description.trim(),
      price: isFree ? 0 : (parseInt(productForm.price) || 0),
      old_price: isFree ? null : (productForm.compare_price ? parseInt(productForm.compare_price) : null),
      cover_image: (productForm.cover_image || '').trim() && (productForm.cover_image || '').trim() !== '/logo.png' && (productForm.cover_image || '').trim() !== '/logo_black.png'
        ? productForm.cover_image.trim()
        : (productForm.images && productForm.images.find(img => img && img !== '/logo.png' && img !== '/logo_black.png')) || null,
      images: productForm.images || [],
      variations: isVariable 
        ? {
            attributes: productForm.variations?.attributes || [],
            variants: (productForm.variations?.variants || []).filter(v => v.price !== '' && v.price !== undefined && v.price !== null)
          }
        : { attributes: [], variants: [] },
      features: productForm.features.split('\n').map(f => f.trim()).filter(Boolean),
      is_published: productForm.is_published,
      is_free: isFree,
      stock_quantity: productForm.type === 'physical' && productForm.stock_quantity !== '' ? parseInt(productForm.stock_quantity, 10) : null,
      weight: productForm.type === 'physical' && productForm.weight !== '' ? parseFloat(productForm.weight) : null,
      meta_title: productForm.category ? productForm.category.trim() : null,
      category_id: productForm.category_id || null,
      packaging: productForm.packaging ? productForm.packaging.trim() : null,
      origin: productForm.origin ? productForm.origin.trim() : null,
      free_delivery: productForm.free_delivery || false,
      delivery_fee: productForm.free_delivery ? 0 : (productForm.delivery_fee !== '' ? parseFloat(productForm.delivery_fee) : 0),
      shipping_charge_per_item: productForm.shipping_charge_per_item || false
    }

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error

        if (payload.type === 'course') {
          const { error: cErr } = await supabase
            .from('courses')
            .insert({ id: data.id, level: 'beginner', what_you_learn: [] })
          if (cErr) throw cErr
        }
      }
      setShowModal(false)
      loadProducts()
      setProductForm(initialFormState)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDuplicateProduct = async (product) => {
    const countStr = window.prompt(`How many duplicates of "${product.title}" would you like to create?`, "1")
    if (countStr === null) return // User cancelled
    const count = parseInt(countStr, 10)
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid number greater than 0.")
      return
    }

    try {
      const newProducts = []
      for (let i = 1; i <= count; i++) {
        const timestamp = Date.now().toString().slice(-4)
        const rand = Math.floor(Math.random() * 1000)
        const uniqueSlug = `${product.slug}-copy-${i}-${timestamp}-${rand}`
        const titleSuffix = count > 1 ? ` (Copy ${i})` : ' (Copy)'
        const payload = {
          title: `${product.title}${titleSuffix}`,
          slug: uniqueSlug,
          type: product.type,
          description: product.description || '',
          price: product.price || 0,
          old_price: product.old_price || null,
          cover_image: product.cover_image || '',
          images: product.images || [],
          variations: product.variations || { attributes: [], variants: [] },
          features: product.features || [],
          is_published: false,
          is_free: product.is_free || false,
          stock_quantity: product.stock_quantity,
          weight: product.weight,
          meta_title: product.meta_title || null,
          packaging: product.packaging || null,
          origin: product.origin || null,
          free_delivery: product.free_delivery || false,
          delivery_fee: product.delivery_fee || 0,
          shipping_charge_per_item: product.shipping_charge_per_item || false
        }

        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single()

        if (error) throw error
        newProducts.push(data)
      }

      setProducts([...newProducts, ...products])
      alert(`${count} duplicate${count > 1 ? 's' : ''} created successfully as Draft!`)
    } catch (err) {
      alert(`Duplication failed: ${err.message}`)
    }
  }

  const [draggedIndex, setDraggedIndex] = useState(null)

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.parentNode)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const updatedImages = [...productForm.images]
    const draggedItem = updatedImages[draggedIndex]
    updatedImages.splice(draggedIndex, 1)
    updatedImages.splice(index, 0, draggedItem)

    setDraggedIndex(index)
    setProductForm({
      ...productForm,
      images: updatedImages
    })
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSetFeaturedImage = (url) => {
    setProductForm({
      ...productForm,
      cover_image: url
    })
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' ? true : p.type === typeFilter
    const matchesStatus = statusFilter === 'all' ? true : 
                          statusFilter === 'published' ? p.is_published : !p.is_published
    return matchesSearch && matchesType && matchesStatus
  })

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const isMobile = windowWidth < 768

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Products</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Configure course catalogs, eBook items, and prices.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          style={{ background: 'var(--g600)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.08)' }}
        >
          + Add Product
        </button>
      </div>

      {/* ── Bulk Actions Banner ── */}
      {selectedProductIds.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#f0fdf4',
          border: '1.5px solid #bbf7d0',
          padding: '12px 18px',
          borderRadius: 10,
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(36, 106, 66, 0.04)',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: 13.5, color: '#166534', fontWeight: 600 }}>
            {selectedProductIds.length} product{selectedProductIds.length > 1 ? 's' : ''} selected
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleBulkPublish}
              style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s' }}
            >
              Publish Selected
            </button>
            <button
              onClick={handleBulkSetDraft}
              style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s' }}
            >
              Move to Draft
            </button>
            <button
              onClick={handleBulkDelete}
              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.15s' }}
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedProductIds([])}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: '6px 12px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Advanced Filter Row ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: searchQuery ? '#fff' : '#f7f8fa',
          border: `1.5px solid ${searchQuery ? 'var(--g600)' : '#e2e8f0'}`,
          borderRadius: 10,
          padding: '0 10px',
          flex: 1,
          minWidth: 220,
          maxWidth: 360,
          transition: 'all 0.2s ease',
          boxShadow: searchQuery ? '0 0 0 3px rgba(36, 106, 66,0.08)' : 'none',
          gap: 8
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={searchQuery ? 'var(--g600)' : '#94a3b8'} strokeWidth="2" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search products by name or slug..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
            style={{ 
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '8px 0',
              fontSize: 13, 
              outline: 'none',
              color: '#0f172a',
              fontFamily: 'var(--font)'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: '#e2e8f0', border: 'none', borderRadius: 4, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: 12, fontWeight: 700, padding: 0, flexShrink: 0 }}>×</button>
          )}
        </div>
        
        {/* Type filter pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'course', 'ebook', 'physical'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: `1.5px solid ${typeFilter === type ? 'var(--g600)' : '#e2e8f0'}`,
                background: typeFilter === type ? 'var(--g600)' : '#fff',
                color: typeFilter === type ? '#fff' : '#64748b',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textTransform: 'capitalize',
                fontFamily: 'var(--font)'
              }}
            >
              {type === 'all' ? 'All Types' : type === 'course' ? 'Courses' : type === 'ebook' ? 'eBooks' : 'Physical'}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'All Statuses', value: 'all' },
            { label: 'Published', value: 'published' },
            { label: 'Drafts', value: 'draft' }
          ].map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: `1.5px solid ${statusFilter === s.value ? 'var(--g600)' : '#e2e8f0'}`,
                background: statusFilter === s.value ? 'var(--g600)' : '#fff',
                color: statusFilter === s.value ? '#fff' : '#64748b',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font)'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              <strong style={{ color: '#0f172a' }}>{filteredProducts.length}</strong> result{filteredProducts.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); setSelectedProductIds([]) }}
              style={{ fontSize: 11.5, color: 'var(--g600)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, color: '#697386', fontSize: 13 }}>Loading products...</div>
      ) : isMobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#697386', fontSize: 13 }}>No products found</div>
          ) : (
            paginatedProducts.map(p => (
              <div key={p.id} style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e3e8ee' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedProductIds.includes(p.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProductIds(prev => [...prev, p.id])
                      } else {
                        setSelectedProductIds(prev => prev.filter(id => id !== p.id))
                      }
                    }}
                    style={{ width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <img src={p.cover_image} alt={p.title} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1f36' }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: '#697386', textTransform: 'uppercase', marginTop: 2 }}>{p.type}</div>
                  </div>
                </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: p.is_free ? '#10b981' : '#1a1f36' }}>
                    {p.is_free ? 'FREE' : `₦${p.price.toLocaleString()}`}
                  </span>
                  <span style={{ padding: '2px 6px', background: p.is_published ? '#e3fcef' : '#f7f8f9', color: p.is_published ? '#00875a' : '#697386', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f7f8f9', paddingTop: 10 }}>
                  {p.type === 'course' && featureFlags.enable_academics && (
                    <button 
                      onClick={() => navigate(`/admin/courses/${p.id}`)}
                      style={{ background: 'none', border: 'none', color: 'var(--g600)', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
                    >
                      Curriculum
                    </button>
                  )}
                  <button 
                    onClick={() => handleTogglePublish(p)}
                    style={{ background: 'none', border: 'none', color: p.is_published ? '#ea580c' : '#16a34a', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
                  >
                    {p.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => handleDuplicateProduct(p)}
                    style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
                  >
                    Duplicate
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(p)}
                    style={{ background: 'none', border: 'none', color: '#4f566b', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    style={{ background: 'none', border: 'none', color: '#ae2a19', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f8f9', borderBottom: '1px solid #e3e8ee' }}>
                  <th style={{ padding: '12px 20px', width: '40px' }}>
                    <input 
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProductIds(filteredProducts.map(p => p.id))
                        } else {
                          setSelectedProductIds([])
                        }
                      }}
                      style={{ cursor: 'pointer', width: 15, height: 15 }}
                    />
                  </th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Cover</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Title</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Type</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Price</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: '#697386', fontSize: 13 }}>No products found</td></tr>
                ) : (
                  paginatedProducts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f7f8f9' }}>
                      <td style={{ padding: '12px 20px', width: '40px' }}>
                        <input 
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(prev => [...prev, p.id])
                            } else {
                              setSelectedProductIds(prev => prev.filter(id => id !== p.id))
                            }
                          }}
                          style={{ cursor: 'pointer', width: 15, height: 15 }}
                        />
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <img src={p.cover_image} alt={p.title} style={{ width: 44, height: 28, objectFit: 'cover', borderRadius: 4 }} />
                      </td>
                      <td style={{ padding: '12px 20px', fontWeight: 500, color: '#1a1f36', fontSize: 14 }}>{p.title}</td>
                      <td style={{ padding: '12px 20px', textTransform: 'uppercase', color: '#4f566b', fontSize: 12, fontWeight: 500 }}>{p.type}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 600, fontSize: 13, color: p.is_free ? '#10b981' : '#1a1f36' }}>
                        {p.is_free ? 'FREE' : `₦${p.price.toLocaleString()}`}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ padding: '2px 6px', background: p.is_published ? '#e3fcef' : '#f7f8f9', color: p.is_published ? '#00875a' : '#697386', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                          {p.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', gap: 14 }}>
                          {p.type === 'course' && featureFlags.enable_academics && (
                            <button 
                              onClick={() => navigate(`/admin/courses/${p.id}`)}
                              style={{ background: 'none', border: 'none', color: 'var(--g600)', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                            >
                              Curriculum
                            </button>
                          )}
                          <button 
                            onClick={() => handleTogglePublish(p)}
                            style={{ background: 'none', border: 'none', color: p.is_published ? '#ea580c' : '#16a34a', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                          >
                            {p.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button 
                            onClick={() => handleDuplicateProduct(p)}
                            style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                          >
                            Duplicate
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(p)}
                            style={{ background: 'none', border: 'none', color: '#4f566b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)}
                            style={{ background: 'none', border: 'none', color: '#ae2a19', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination Controls ── */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 20,
          padding: '16px 20px',
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e3e8ee',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <span style={{ fontSize: 13, color: '#697386' }}>
            Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> of{' '}
            <strong>{filteredProducts.length}</strong> products
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #e3e8ee',
                background: currentPage === 1 ? '#f7f8f9' : '#ffffff',
                color: currentPage === 1 ? '#a3acb9' : '#4f566b',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font)'
              }}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isSelected = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    border: isSelected ? '1px solid var(--g600)' : '1px solid #e3e8ee',
                    background: isSelected ? 'var(--g600)' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#4f566b',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font)'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #e3e8ee',
                background: currentPage === totalPages ? '#f7f8f9' : '#ffffff',
                color: currentPage === totalPages ? '#a3acb9' : '#4f566b',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: 'var(--font)'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#ffffff', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none !important;
            }
            .no-scrollbar {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
            }
          `}</style>

          {/* Modal Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--brand-primary, #0f0d0a)' }}>
              {editingProduct ? 'Edit Product Details' : 'Register New Product'}
            </h3>
            <button 
              type="button" 
              onClick={handleCloseModal}
              style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '24px 16px' : '32px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
            <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: isMobile ? '24px' : '40px' }}>
              
              {/* Left Column: Core Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Product Name *</label>
                  <input 
                    type="text" 
                    value={productForm.title} 
                    onChange={e => {
                      const title = e.target.value
                      setProductForm({ 
                        ...productForm, 
                        title, 
                        slug: editingProduct ? productForm.slug : generateSlug(title) 
                      })
                    }} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Slug / URL Segment *</label>
                  <input 
                    type="text" 
                    value={productForm.slug} 
                    onChange={e => setProductForm({ ...productForm, slug: generateSlug(e.target.value) })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Type *</label>
                    <select 
                      value={productForm.type} 
                      onChange={e => setProductForm({ ...productForm, type: e.target.value })} 
                      style={{ 
                        width: '100%', 
                        padding: '8px 36px 8px 12px', 
                        borderRadius: 4, 
                        border: '1px solid #cbd5e1', 
                        fontSize: 13,
                        backgroundColor: '#fff',
                        appearance: 'none',
                        backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23697386' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 10px center',
                        backgroundSize: '14px'
                      }}
                    >
                      {featureFlags.enable_academics && <option value="course">Course</option>}
                      {featureFlags.enable_academics && <option value="ebook">eBook</option>}
                      <option value="physical">Physical Product</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Price (NGN) *</label>
                    <input 
                      type="number" 
                      value={productForm.is_free ? '0' : productForm.price} 
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })} 
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, backgroundColor: productForm.is_free ? '#f1f5f9' : '#fff' }} 
                      required={!productForm.is_free && !isVariable} 
                      disabled={productForm.is_free}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Description</label>
                  <textarea 
                    value={productForm.description} 
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 120 }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Features (one per line)</label>
                  <textarea 
                    value={productForm.features} 
                    onChange={e => setProductForm({ ...productForm, features: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 80 }} 
                    placeholder="20+ Premium Videos&#10;Downloadable resources"
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" 
                      id="is_free" 
                      checked={productForm.is_free} 
                      onChange={e => setProductForm({ ...productForm, is_free: e.target.checked })} 
                      style={{ width: 14, height: 14 }} 
                    />
                    <label htmlFor="is_free" style={{ fontWeight: 500, fontSize: 13, color: '#3c4257' }}>Free Product</label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" 
                      id="is_published" 
                      checked={productForm.is_published} 
                      onChange={e => setProductForm({ ...productForm, is_published: e.target.checked })} 
                      style={{ width: 14, height: 14 }} 
                    />
                    <label htmlFor="is_published" style={{ fontWeight: 500, fontSize: 13, color: '#3c4257' }}>Publish Product</label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button type="submit" disabled={submitting} style={{ flex: 1, background: 'var(--brand-primary, #0f0d0a)', color: '#fff', border: 'none', padding: '12px', borderRadius: 4, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'Saving...' : 'Save Product'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCloseModal} 
                    style={{ flex: 1, background: '#f7f8f9', color: '#4f566b', border: '1px solid #cbd5e1', padding: '12px', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Right Column: Gallery, Uploader, Variations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Media Gallery Uploader */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#f8fafc' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#3c4257' }}>Product Gallery Images</label>
                  
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleMediaFilesUpload} 
                    id="media-files-uploader" 
                    style={{ display: 'none' }} 
                  />
                  
                  <label 
                    htmlFor="media-files-uploader"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed #cbd5e1',
                      borderRadius: 6,
                      padding: '16px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      background: '#ffffff',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--brand-primary, #0f0d0a)', fontWeight: 700 }}>
                      {uploading ? '⌛ Uploading images...' : '📁 Click to Upload from PC'}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Supports JPG, PNG images</span>
                  </label>

                  {/* Uploaded Thumbnails list */}
                  {productForm.images && productForm.images.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                      {productForm.images.map((url, i) => (
                        <div 
                          key={i} 
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, i)}
                          onDragOver={(e) => handleDragOver(e, i)}
                          onDragEnd={handleDragEnd}
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 4,
                            overflow: 'hidden',
                            position: 'relative',
                            border: productForm.cover_image === url ? '2.5px solid #10b981' : '1px solid #cbd5e1',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            cursor: 'grab'
                          }}
                        >
                          <img src={url} alt="Uploaded thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleSetFeaturedImage(url)}
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: 2,
                              background: productForm.cover_image === url ? '#10b981' : '#ffffff',
                              color: productForm.cover_image === url ? '#ffffff' : '#64748b',
                              border: 'none',
                              borderRadius: '50%',
                              width: 16,
                              height: 16,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: 9
                            }}
                            title="Set as Featured Cover"
                          >
                            ★
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(i)}
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              right: 2,
                              background: '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '50%',
                              width: 16,
                              height: 16,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: 10,
                              fontWeight: 'bold'
                            }}
                            title="Delete Image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}


                </div>

                {/* Simple Product Fields (Hidden if variable) */}
                {!isVariable && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Compare Price (NGN)</label>
                        <input 
                          type="number" 
                          value={productForm.is_free ? '' : productForm.compare_price} 
                          onChange={e => setProductForm({ ...productForm, compare_price: e.target.value })} 
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, backgroundColor: productForm.is_free ? '#f1f5f9' : '#fff' }} 
                          disabled={productForm.is_free}
                        />
                      </div>
                      {productForm.type === 'physical' && (
                        <div>
                          <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Weight (kg)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={productForm.weight || ''} 
                            onChange={e => setProductForm({ ...productForm, weight: e.target.value ? parseFloat(e.target.value) : '' })} 
                            placeholder="e.g. 0.5" 
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                          />
                        </div>
                      )}
                    </div>

                    {productForm.type === 'physical' && (
                      <div>
                        <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Stock Quantity</label>
                        <input 
                          type="number" 
                          value={productForm.stock_quantity || ''} 
                          onChange={e => setProductForm({ ...productForm, stock_quantity: e.target.value ? parseInt(e.target.value, 10) : '' })} 
                          placeholder="e.g. 100 (leave blank for unlimited)" 
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                        />
                      </div>
                    )}

                    {/* Category Selection */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Product Category</label>
                      <select 
                        value={productForm.category_id || ''} 
                        onChange={e => {
                          const catId = e.target.value
                          const catObj = dbCategories.find(c => c.id === catId)
                          setProductForm({ 
                            ...productForm, 
                            category_id: catId,
                            category: catObj ? catObj.name : '' 
                          })
                        }}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                      >
                        <option value="">Select Category...</option>
                        {dbCategories.filter(c => !c.parent_id).map(parent => (
                          <React.Fragment key={parent.id}>
                            <option value={parent.id}>{parent.name}</option>
                            {dbCategories.filter(c => c.parent_id === parent.id).map(sub => (
                              <option key={sub.id} value={sub.id}>&nbsp;&nbsp;— {sub.name}</option>
                            ))}
                          </React.Fragment>
                        ))}
                      </select>
                    </div>

                    {/* Packaging Field */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Packaging</label>
                      <input 
                        type="text" 
                        value={productForm.packaging || ''} 
                        onChange={e => setProductForm({ ...productForm, packaging: e.target.value })} 
                        placeholder="e.g. Export grade bulk sacks / drums" 
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                      />
                    </div>

                    {/* Origin Field */}
                    <div>
                      <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Origin / Source</label>
                      <input 
                        type="text" 
                        value={productForm.origin || ''} 
                        onChange={e => setProductForm({ ...productForm, origin: e.target.value })} 
                        placeholder="e.g. Nigeria, Southwestern Region" 
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                      />
                    </div>

                    {/* Delivery Settings */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#3c4257' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                        Delivery / Shipping
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <input
                          type="checkbox"
                          id="free_delivery"
                          checked={productForm.free_delivery || false}
                          onChange={e => setProductForm({ ...productForm, free_delivery: e.target.checked, delivery_fee: e.target.checked ? '' : productForm.delivery_fee })}
                          style={{ width: 15, height: 15, accentColor: '#16a34a' }}
                        />
                        <label htmlFor="free_delivery" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, color: '#16a34a', cursor: 'pointer' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          Free Delivery (no shipping charge)
                        </label>
                      </div>
                      {!productForm.free_delivery && (
                        <div>
                          <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>
                            Delivery Fee (₦) <span style={{ color: '#94a3b8', fontWeight: 400 }}>— leave 0 for free</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={productForm.delivery_fee}
                            onChange={e => setProductForm({ ...productForm, delivery_fee: e.target.value })}
                            placeholder="e.g. 2500"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 12 }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <input
                              type="checkbox"
                              id="shipping_charge_per_item"
                              checked={productForm.shipping_charge_per_item || false}
                              onChange={e => setProductForm({ ...productForm, shipping_charge_per_item: e.target.checked })}
                              style={{ width: 14, height: 14 }}
                            />
                            <label htmlFor="shipping_charge_per_item" style={{ fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                              Multiply delivery fee by quantity (Dynamic charging)
                            </label>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
                            Uncheck this to charge a fixed flat rate regardless of quantity purchased.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}


                {/* Variable Product Toggle checkbox */}
                {productForm.type === 'physical' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                    <input 
                      type="checkbox" 
                      id="toggle-variable" 
                      checked={isVariable} 
                      onChange={e => setIsVariable(e.target.checked)} 
                      style={{ width: 15, height: 15 }}
                    />
                    <label htmlFor="toggle-variable" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-primary, #0f0d0a)' }}>
                      This is a Variable Product (Configure variations, attributes & pricing)
                    </label>
                  </div>
                )}

                {/* Variable Products Panel (WooCommerce-Style) */}
                {productForm.type === 'physical' && isVariable && (
                  <div style={{ border: '1px solid #bfdbfe', borderRadius: 8, padding: 14, background: '#eff6ff', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    
                    {/* Attributes setup Section */}
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1e40af', margin: '0 0 10px' }}>1. Configure Product Attributes</h4>
                      
                      {/* List existing attributes */}
                      {productForm.variations?.attributes?.map((attr, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#ffffff', borderRadius: 4, border: '1px solid #dbeafe', marginBottom: 6 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                            <strong>{attr.name}:</strong> {attr.options.join(', ')}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAttribute(idx)}
                            style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {/* Add new attribute trigger */}
                      <div style={{ display: 'flex', flexDirection: windowWidth < 600 ? 'column' : 'row', gap: 10, marginTop: 10 }}>
                        <input 
                          type="text" 
                          placeholder="e.g. Weight" 
                          value={newAttrName} 
                          onChange={e => setNewAttrName(e.target.value)} 
                          style={{ flex: 1, padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, minWidth: '100px' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Options (comma separated: 1kg, 5kg)" 
                          value={newAttrOptions} 
                          onChange={e => setNewAttrOptions(e.target.value)} 
                          style={{ flex: 2, padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, minWidth: '150px' }}
                        />
                        <button 
                          type="button" 
                          onClick={handleAddAttribute}
                          style={{ background: '#1e40af', color: '#ffffff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Generate Variants button */}
                    {productForm.variations?.attributes?.length > 0 && (
                      <div style={{ borderTop: '1px solid #bfdbfe', paddingTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 800, color: '#1e40af', margin: 0 }}>2. Manage Option Variations</h4>
                          <button
                            type="button"
                            onClick={handleGenerateVariants}
                            style={{ background: 'var(--g600)', color: '#ffffff', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Generate/Update Variations
                          </button>
                        </div>

                        {/* Variants configuration table/list */}
                        {productForm.variations?.variants?.map((v, vIdx) => {
                          const comboName = Object.entries(v.attributes).map(([name, opt]) => `${opt}`).join(' / ')
                          return (
                            <div key={v.id} style={{ background: '#ffffff', border: '1px solid #dbeafe', borderRadius: 6, padding: 12, marginBottom: 10 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--g800)', marginBottom: 8 }}>Variation: {comboName}</div>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: windowWidth < 500 ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 8 }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: 10.5, color: '#64748b', marginBottom: 2 }}>Price (NGN)</label>
                                  <input 
                                    type="number" 
                                    value={v.price} 
                                    onChange={e => handleUpdateVariantField(vIdx, 'price', e.target.value ? parseInt(e.target.value) : '')} 
                                    style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: 10.5, color: '#64748b', marginBottom: 2 }}>Compare Price (NGN)</label>
                                  <input 
                                    type="number" 
                                    value={v.compare_price} 
                                    onChange={e => handleUpdateVariantField(vIdx, 'compare_price', e.target.value ? parseInt(e.target.value) : '')} 
                                    style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: windowWidth < 500 ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 8 }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: 10.5, color: '#64748b', marginBottom: 2 }}>Stock Qty</label>
                                  <input 
                                    type="number" 
                                    value={v.stock} 
                                    onChange={e => handleUpdateVariantField(vIdx, 'stock', e.target.value ? parseInt(e.target.value) : '')} 
                                    placeholder="Leave blank for unlimited"
                                    style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: 10.5, color: '#64748b', marginBottom: 2 }}>Weight (kg)</label>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    value={v.weight} 
                                    onChange={e => handleUpdateVariantField(vIdx, 'weight', e.target.value ? parseFloat(e.target.value) : '')} 
                                    placeholder="e.g. 1.0"
                                    style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                                  />
                                </div>
                              </div>

                              {/* Dropdown to select variant specific image */}
                              {productForm.images && productForm.images.length > 0 && (
                                <div>
                                  <label style={{ display: 'block', fontSize: 10.5, color: '#64748b', marginBottom: 2 }}>Variant Image</label>
                                  <select
                                    value={v.image}
                                    onChange={e => handleUpdateVariantField(vIdx, 'image', e.target.value)}
                                    style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, backgroundColor: '#fff' }}
                                  >
                                    <option value="">Use Featured Cover Image</option>
                                    {productForm.images.map((url, imgIdx) => (
                                      <option key={imgIdx} value={url}>Image Thumbnail #{imgIdx + 1}</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const { user, profile, loading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to login if user is not authenticated or not an admin
  useEffect(() => {
    if (!loading) {
      const isAdmin = user?.app_metadata?.role === 'admin' || profile?.role === 'admin';
      if (!user || !isAdmin) {
        navigate('/login')
      }
    }
  }, [user, profile, loading, navigate])

  const [featureFlags, setFeatureFlags] = useState({
    enable_academics: localStorage.getItem('enable_academics') === 'true',
    enable_affiliates: localStorage.getItem('enable_affiliates') !== 'false',
    enable_payouts: localStorage.getItem('enable_payouts') !== 'false',
    enable_upsells: localStorage.getItem('enable_upsells') !== 'false',
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
            const payouts = siteConfig.value.enable_payouts ?? true
            const upsells = siteConfig.value.enable_upsells ?? true

            localStorage.setItem('enable_academics', academics)
            localStorage.setItem('enable_affiliates', affiliates)
            localStorage.setItem('enable_payouts', payouts)
            localStorage.setItem('enable_upsells', upsells)

            setFeatureFlags({
              enable_academics: academics,
              enable_affiliates: affiliates,
              enable_payouts: payouts,
              enable_upsells: upsells,
            })
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadFlags()

    const handleSettingsUpdate = () => {
      setFeatureFlags({
        enable_academics: localStorage.getItem('enable_academics') === 'true',
        enable_affiliates: localStorage.getItem('enable_affiliates') !== 'false',
        enable_payouts: localStorage.getItem('enable_payouts') !== 'false',
        enable_upsells: localStorage.getItem('enable_upsells') !== 'false',
      })
    }
    window.addEventListener('brand_settings_updated', handleSettingsUpdate)
    return () => window.removeEventListener('brand_settings_updated', handleSettingsUpdate)
  }, [])
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true'
  })
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  const [expandedTabs, setExpandedTabs] = useState(() => {
    const active = { Sales: true }
    if (location.pathname.includes('/courses') || location.pathname.includes('/qna') || location.pathname.includes('/reviews')) active.Academics = true
    if (location.pathname.includes('/users')) active['Users & Staff'] = true
    if (location.pathname.includes('/orders') || location.pathname.includes('/coupons') || location.pathname.includes('/products') || location.pathname.includes('/affiliates') || location.pathname.includes('/payouts') || location.pathname.includes('/upsells')) active.Sales = true
    if (location.pathname.includes('/settings') || location.pathname.includes('/announcements')) active.Management = true
    return active
  })

  useEffect(() => {
    setExpandedTabs(prev => {
      const active = { ...prev }
      if (location.pathname.includes('/courses') || location.pathname.includes('/qna') || location.pathname.includes('/reviews')) active.Academics = true
      if (location.pathname.includes('/users')) active['Users & Staff'] = true
      if (location.pathname.includes('/orders') || location.pathname.includes('/coupons') || location.pathname.includes('/products') || location.pathname.includes('/affiliates') || location.pathname.includes('/payouts') || location.pathname.includes('/upsells')) active.Sales = true
      if (location.pathname.includes('/settings') || location.pathname.includes('/announcements')) active.Management = true
      return active
    })
  }, [location.pathname])

  // Custom Header Dropdowns States
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [globalSearch, setGlobalSearch] = useState('')
  const [globalResults, setGlobalResults] = useState([])
  const [searching, setSearching] = useState(false)

  const profileRef = useRef(null)
  const notificationRef = useRef(null)
  const searchRef = useRef(null)

  // Fetch real-time alerts from recent database mutations
  useEffect(() => {
    async function loadAlerts() {
      try {
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('id, reference, customer_name, amount, created_at')
          .order('created_at', { ascending: false })
          .limit(3)
        
        const { data: recentProfiles } = await supabase
          .from('profiles')
          .select('id, email, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        const readAlerts = JSON.parse(localStorage.getItem('adminReadAlerts') || '[]')
        const merged = []
        if (recentOrders) {
          recentOrders.forEach(o => {
            const id = `order-${o.id}`
            merged.push({
              id,
              msg: `New Payment: ₦${o.amount.toLocaleString()} from ${o.customer_name || 'Customer'} (Ref: ${o.reference.slice(0, 8)})`,
              time: new Date(o.created_at).toLocaleDateString() + ' ' + new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: readAlerts.includes(id)
            })
          })
        }
        if (recentProfiles) {
          recentProfiles.forEach(p => {
            const id = `user-${p.id}`
            merged.push({
              id,
              msg: `New Customer registered: ${p.email}`,
              time: new Date(p.created_at).toLocaleDateString() + ' ' + new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: readAlerts.includes(id)
            })
          })
        }
        setAlerts(merged)
      } catch (err) {
        console.error(err)
      }
    }
    if (user) loadAlerts()
  }, [user])

  // Global search autocomplete debouncing logic
  useEffect(() => {
    if (!globalSearch.trim()) {
      setGlobalResults([])
      return
    }
    setSearching(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const query = globalSearch.trim().toLowerCase()
        const results = []

        // Query Products
        const { data: prods } = await supabase.from('products').select('id, title').ilike('title', `%${query}%`).limit(3)
        if (prods) {
          prods.forEach(p => results.push({
            type: 'product',
            title: p.title,
            subtitle: 'Product Catalog',
            path: `/admin/products`
          }))
        }

        // Query Profiles
        const { data: profs } = await supabase.from('profiles').select('id, email, full_name').or(`email.ilike.%${query}%,full_name.ilike.%${query}%`).limit(3)
        if (profs) {
          profs.forEach(p => results.push({
            type: 'user',
            title: p.full_name || p.email,
            subtitle: `Customer Email: ${p.email}`,
            path: `/admin/users`
          }))
        }

        // Query Orders
        const { data: ords } = await supabase.from('orders').select('id, reference, customer_email').or(`reference.ilike.%${query}%,customer_email.ilike.%${query}%`).limit(3)
        if (ords) {
          ords.forEach(o => results.push({
            type: 'order',
            title: `Order Ref: #${(o.reference || 'N/A').slice(0, 12)}`,
            subtitle: `Customer: ${o.customer_email || 'Anonymous'}`,
            path: `/admin/orders`
          }))
        }

        setGlobalResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [globalSearch])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotificationDropdown(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setGlobalResults([])
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  const toggleSidebar = () => {
    const nextVal = !sidebarCollapsed
    setSidebarCollapsed(nextVal)
    localStorage.setItem('adminSidebarCollapsed', String(nextVal))
  }

  const handleMarkAllRead = () => {
    const allIds = alerts.map(a => a.id)
    localStorage.setItem('adminReadAlerts', JSON.stringify(allIds))
    setAlerts(alerts.map(a => ({ ...a, read: true })))
  }

  const handleMarkSingleRead = (id) => {
    const readAlerts = JSON.parse(localStorage.getItem('adminReadAlerts') || '[]')
    if (!readAlerts.includes(id)) {
      readAlerts.push(id)
      localStorage.setItem('adminReadAlerts', JSON.stringify(readAlerts))
    }
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a))
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#697386', fontFamily: 'var(--font)' }}>Loading Admin Session...</div>
  
  if (!user) {
    return null
  }

  if (profile?.role !== 'admin' && user?.app_metadata?.role !== 'admin') {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', fontFamily: 'var(--font)' }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: '#1a1f36' }}>Access Denied</h1>
        <p style={{ color: '#697386', marginBottom: 24, fontSize: 14 }}>You do not have administrative privileges to view this portal.</p>
        <Link to="/" style={{ color: 'var(--g600)', fontWeight: 500, textDecoration: 'none' }}>Return to Home</Link>
      </div>
    )
  }

  const menuGroups = [
    { 
      name: 'Overview', 
      path: '/admin', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /> 
    },
    featureFlags.enable_academics && { 
      name: 'Academics', 
      path: '/admin/courses', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
      subItems: [
        { name: 'All Courses', path: '/admin/courses' },
        { name: 'Q&A Support', path: '/admin/qna' },
        { name: 'Customer Reviews', path: '/admin/reviews' }
      ]
    },
    { 
      name: 'Sales', 
      path: '/admin/products', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
      subItems: [
        { name: 'Products', path: '/admin/products' },
        { name: 'Categories', path: '/admin/categories' },
        { name: 'Orders', path: '/admin/orders' },
        { name: 'Discount Coupons', path: '/admin/coupons' },
        { name: 'Landing Pages', path: '/admin/landing-pages' },
        featureFlags.enable_affiliates && { name: 'Affiliates', path: '/admin/affiliates' },
        featureFlags.enable_payouts && { name: 'Payouts', path: '/admin/payouts' },
        featureFlags.enable_upsells && { name: 'Upsells', path: '/admin/upsells' }
      ].filter(Boolean)
    },
    { 
      name: 'Marketing & Funnels', 
      path: '/admin/analytics', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    },
    { 
      name: 'Platform Analytics', 
      path: '/admin/platform-analytics', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    },
    { 
      name: 'Users & Staff', 
      path: '/admin/users', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
      subItems: [
        { name: 'All Profiles', path: '/admin/users' },
        { name: 'Registered Customers', path: '/admin/users?role=user' },
        { name: 'Instructors & Staff', path: '/admin/users?role=admin' }
      ]
    },
    { 
      name: 'Management', 
      path: '/admin/settings', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
      subItems: [
        { name: 'Platform Settings', path: '/admin/settings' },
        featureFlags.enable_academics && { name: 'Certificates', path: '/admin/certificates' },
        { name: 'Broadcast Emails', path: '/admin/announcements' }
      ].filter(Boolean)
    },
    { 
      name: 'Frontend Pages', 
      path: '/admin/pages', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    }
  ].filter(Boolean)

  const isTablet = windowWidth < 1024
  const isSmall = windowWidth < 768
  const sidebarWidth = sidebarCollapsed ? 72 : 240
  const unreadCount = alerts.filter(a => !a.read).length

  const sidebarContent = (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      padding: '20px 0 0 0', 
      background: '#000000', 
      borderRight: '1px solid #1a1a1a',
      color: '#fff',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Brand area */}
      <div style={{ padding: sidebarCollapsed ? '0 12px' : '0 20px', marginBottom: 28, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <img 
            src="/logo_white.png" 
            alt="Logo" 
            style={{ 
              height: sidebarCollapsed ? 28 : 40,
              width: 'auto',
              maxWidth: sidebarCollapsed ? 40 : 160,
              objectFit: 'contain',
              objectPosition: 'left center',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              display: 'block'
            }} 
          />
        </div>
      </div>

      {/* Navigation tabs */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, padding: '0 10px', overflowY: 'auto' }}>
        {menuGroups.map(t => {
          const hasSubItems = t.subItems && t.subItems.length > 0
          const isExpanded = expandedTabs[t.name]
          const isParentActive = location.pathname === t.path || (t.path !== '/admin' && location.pathname.startsWith(t.path))

          return (
            <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {hasSubItems ? (
                <button
                  onClick={() => {
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false)
                      setExpandedTabs(prev => ({ ...prev, [t.name]: true }))
                    } else {
                      setExpandedTabs(prev => ({ ...prev, [t.name]: !prev[t.name] }))
                    }
                  }}
                  title={sidebarCollapsed ? t.name : undefined}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: isParentActive ? 'var(--gold)' : 'transparent',
                    padding: '10px 14px',
                    color: isParentActive ? '#fff' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 500,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                    gap: 12,
                    fontSize: 13.5,
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
                      {t.icon}
                    </svg>
                    {!sidebarCollapsed && <span>{t.name}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      style={{ 
                        transform: isExpanded ? 'rotate(90deg)' : 'none', 
                        transition: 'transform 0.2s', 
                        color: '#64748b' 
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ) : (
                <Link
                  to={t.path}
                  title={sidebarCollapsed ? t.name : undefined}
                  style={{
                    padding: '10px 14px',
                    color: location.pathname === t.path ? '#fff' : '#94a3b8',
                    textDecoration: 'none',
                    fontWeight: 500,
                    background: location.pathname === t.path ? 'var(--gold)' : 'transparent',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    gap: 12,
                    fontSize: 13.5,
                    transition: 'all 0.2s'
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
                    {t.icon}
                  </svg>
                  {!sidebarCollapsed && <span>{t.name}</span>}
                </Link>
              )}

              {/* Render sub items if expanded and sidebar is not collapsed */}
              {hasSubItems && isExpanded && !sidebarCollapsed && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2, 
                  marginLeft: 26, 
                  borderLeft: '1px solid rgba(249,115,22,0.3)', 
                  paddingLeft: 12,
                  marginTop: 2,
                  marginBottom: 4
                }}>
                  {t.subItems.map(sub => {
                    const isSubActive = location.pathname === sub.path || (location.search ? `${location.pathname}${location.search}` === sub.path : false)
                    return (
                      <Link
                        key={sub.name}
                        to={sub.path}
                        style={{
                          padding: '6px 12px',
                          color: isSubActive ? '#fff' : '#94a3b8',
                          textDecoration: 'none',
                          fontSize: 12.5,
                          fontWeight: 500,
                          borderRadius: 4,
                          background: isSubActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                          transition: 'color 0.2s, background-color 0.2s'
                        }}
                      >
                        {sub.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Profile Details */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid #1c1813', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16,
        background: '#0a0907' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <img 
            src={profile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
            alt="Admin Profile" 
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid var(--g600)' }} 
          />
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'Admin'}
              </div>
              <div style={{ fontSize: 10.5, color: '#a7bdae', fontWeight: 500 }}>Super Admin</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f7f8f9', fontFamily: 'var(--font)' }}>
      
      {/* Sidebar - Desktop */}
      {!isTablet && (
        <aside style={{ 
          width: sidebarWidth, 
          height: '100vh', 
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}>
          {sidebarContent}
        </aside>
      )}

      {/* Sidebar - Mobile/Tablet Drawer */}
      {isTablet && mobileMenuOpen && (
        <>
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,15,25,0.2)', backdropFilter: 'blur(2px)', zIndex: 998 }}
          />
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 999 }}>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content Area - Full height, scrolling internally */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0 }}>
        
        {/* Top Header */}
        <header style={{ 
          background: '#ffffff', 
          borderBottom: '1px solid #e3e8ee', 
          height: 56, 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 24px', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isTablet ? (
              <button 
                onClick={() => setMobileMenuOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#1a1f36', padding: 4 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            ) : (
              <button 
                onClick={toggleSidebar}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#697386', padding: 4 }}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* ── ADVANCED SEARCH BAR ── */}
            <div ref={searchRef} style={{ position: 'relative', display: isSmall ? 'none' : 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: globalSearch ? '#fff' : '#f7f8fa',
                border: `1.5px solid ${globalSearch ? 'var(--g600)' : '#e2e8f0'}`,
                borderRadius: 10,
                padding: '0 8px 0 0',
                width: 300,
                transition: 'all 0.2s ease',
                boxShadow: globalSearch ? '0 0 0 3px rgba(36, 106, 66,0.1)' : 'none',
                overflow: 'hidden'
              }}>
                {/* Search icon */}
                <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: globalSearch ? 'var(--g600)' : '#94a3b8', transition: 'color 0.2s', flexShrink: 0 }}>
                  {searching ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="Search anything… (⌘K)"
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setGlobalSearch(''); setGlobalResults([]) } }}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    padding: '8px 0', 
                    fontSize: 13, 
                    flex: 1,
                    outline: 'none',
                    color: '#0f172a',
                    fontFamily: 'var(--font)',
                    minWidth: 0
                  }}
                />
                {/* Keyboard shortcut hint / clear btn */}
                {globalSearch ? (
                  <button
                    onClick={() => { setGlobalSearch(''); setGlobalResults([]) }}
                    style={{ background: '#e2e8f0', border: 'none', borderRadius: 4, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0, fontSize: 11, fontWeight: 700, padding: 0 }}
                  >×</button>
                ) : (
                  <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0, whiteSpace: 'nowrap' }}>⌘K</kbd>
                )}
              </div>

              {/* Search results dropdown */}
              {globalResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 360,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)',
                  zIndex: 9999,
                  overflow: 'hidden',
                  animation: 'fadeSlideIn 0.15s ease'
                }}>
                  {/* Header */}
                  <div style={{ padding: '10px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {globalResults.length} result{globalResults.length !== 1 ? 's' : ''} found
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>ESC to close</span>
                  </div>

                  {/* Result items */}
                  {globalResults.map((res, i) => {
                    const typeIcons = {
                      product: { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, color: 'var(--g600)', bg: 'rgba(36, 106, 66,0.08)' },
                      user: { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, color: 'var(--g600)', bg: 'rgba(36, 106, 66,0.08)' },
                      order: { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>, color: '#10b981', bg: 'rgba(16,185,129,0.08)' }
                    }
                    const typeStyle = typeIcons[res.type] || typeIcons.product
                    return (
                      <div 
                        key={i}
                        onClick={() => { setGlobalSearch(''); setGlobalResults([]); navigate(res.path) }}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: i < globalResults.length - 1 ? '1px solid #f8fafc' : 'none',
                          transition: 'background 0.12s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: typeStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {typeStyle.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.title}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{res.subtitle}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: typeStyle.color, background: typeStyle.bg, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                            {res.type}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Footer */}
                  <div style={{ padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>↑↓ Navigate</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>↵ Open</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>ESC Dismiss</span>
                  </div>
                </div>
              )}
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
              `}</style>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            
            {/* Custom Notifications Bell with Dropdown */}
            <div ref={notificationRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative', display: 'flex', alignItems: 'center', color: '#4f566b' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#ae2a19', borderRadius: '50%' }} />
                )}
              </button>

              {showNotificationDropdown && (
                <div style={{ 
                  position: 'absolute', 
                  top: 32, 
                  right: 0, 
                  width: 280, 
                  background: '#fff', 
                  border: '1px solid #e3e8ee', 
                  borderRadius: 6, 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)', 
                  zIndex: 200,
                  padding: '8px 0'
                }}>
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid #f7f8f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1f36' }}>Notifications</span>
                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: 'var(--g600)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {alerts.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>No new activity logs.</div>
                    ) : (
                      alerts.map(a => (
                        <div 
                          key={a.id} 
                          onClick={() => handleMarkSingleRead(a.id)}
                          style={{ padding: '10px 16px', borderBottom: '1px solid #f7f8f9', background: a.read ? '#fff' : '#f7f8f9', cursor: 'pointer', transition: 'background 0.15s' }}
                        >
                          <p style={{ margin: 0, fontSize: 12, color: '#3c4257', lineHeight: 1.4, fontWeight: a.read ? 400 : 600 }}>{a.msg}</p>
                          <span style={{ fontSize: 10, color: '#8792a2', marginTop: 4, display: 'block' }}>{a.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <img 
                  src={profile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                  alt="Avatar" 
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#697386" strokeWidth="2.5" style={{ transform: showProfileDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {showProfileDropdown && (
                <div style={{ 
                  position: 'absolute', 
                  top: 36, 
                  right: 0, 
                  width: 160, 
                  background: '#fff', 
                  border: '1px solid #e3e8ee', 
                  borderRadius: 6, 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)', 
                  zIndex: 200,
                  padding: '4px 0'
                }}>
                  <Link to="/admin/settings" onClick={() => setShowProfileDropdown(false)} style={{ display: 'block', padding: '8px 16px', fontSize: 13, color: '#3c4257', textDecoration: 'none', fontWeight: 500 }}>
                    My Account
                  </Link>
                  <Link to="/admin/settings" onClick={() => setShowProfileDropdown(false)} style={{ display: 'block', padding: '8px 16px', fontSize: 13, color: '#3c4257', textDecoration: 'none', fontWeight: 500 }}>
                    Settings
                  </Link>
                  <div style={{ borderTop: '1px solid #f7f8f9', margin: '4px 0' }} />
                  <button 
                    onClick={() => { setShowProfileDropdown(false); logout(); navigate('/login') }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 16px', fontSize: 13, color: '#ae2a19', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Scrollable workspace content */}
        <main style={{ flex: 1, padding: isTablet ? '20px 16px' : '32px 40px', overflowY: 'auto', background: '#f7f8f9' }}>
          <Routes>
            <Route path="/" element={<AdminOverview featureFlags={featureFlags} />} />
            <Route path="/products" element={<AdminProducts featureFlags={featureFlags} />} />
            <Route path="/courses" element={<AdminCourses />} />
            <Route path="/courses/:id" element={<AdminCourseBuilder />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/orders" element={<AdminOrders />} />
            <Route path="/qna" element={<AdminQnA />} />
            <Route path="/announcements" element={<AdminAnnouncements />} />
            <Route path="/coupons" element={<AdminCoupons />} />
            <Route path="/reviews" element={<AdminReviews />} />
            <Route path="/certificates" element={<AdminCertificates />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/pages" element={<AdminPages />} />
            <Route path="/analytics" element={<AdminAnalytics />} />
            <Route path="/platform-analytics" element={<AdminPlatformAnalytics />} />
            <Route path="/affiliates" element={<AdminAffiliates />} />
            <Route path="/payouts" element={<AdminPayouts />} />
            <Route path="/upsells" element={<AdminUpsells />} />
            <Route path="/categories" element={<AdminCategories />} />
            <Route path="/landing-pages" element={<AdminLandingPages />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

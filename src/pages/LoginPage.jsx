import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const EyeClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()

  if (user && !loading) {
    const isAdmin = user?.app_metadata?.role === 'admin' || profile?.role === 'admin'
    if (isAdmin) {
      return <Navigate to="/admin" />
    }
    return <Navigate to="/dashboard" />
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoadingMsg('Authenticating...')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErrorMsg(error.message)
      setLoadingMsg('')
    } else {
      try {
        const { data: { user: loggedInUser } } = await supabase.auth.getUser()
        if (loggedInUser) {
          // Check if admin
          const { data: prof } = await supabase
            .from('profiles')
            .select('role, id')
            .eq('id', loggedInUser.id)
            .single()

          if (prof?.role === 'admin' || loggedInUser.app_metadata?.role === 'admin') {
            navigate('/admin')
            return
          }

          // ── Enrollment recovery: find paid course orders with no enrollment ──
          // This catches users who paid but enrollment was not created for any reason
          if (prof?.id) {
            const { data: paidOrders } = await supabase
              .from('orders')
              .select('product_id, products(id, type)')
              .eq('customer_email', loggedInUser.email.toLowerCase())
              .eq('status', 'paid')

            if (paidOrders && paidOrders.length > 0) {
              for (const order of paidOrders) {
                if (order.products?.type === 'course' && order.product_id) {
                  // Check if enrollment already exists
                  const { data: existingEnr } = await supabase
                    .from('enrollments')
                    .select('id')
                    .eq('user_id', prof.id)
                    .eq('course_id', order.product_id)
                    .maybeSingle()

                  if (!existingEnr) {
                    await supabase.from('enrollments').insert({
                      user_id: prof.id,
                      course_id: order.product_id,
                      progress: []
                    })
                    console.log('Enrollment recovered on login for course', order.product_id)
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Post-login error:', err)
      }
      navigate('/dashboard')
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-container">
        
        <div className="auth-header">
          <Link to="/" className="auth-brand-logo">
            <img src="/logo_black.png" alt={localStorage.getItem('brandName') || 'SAINT GLOBAL SOLAR'} onError={e => { e.currentTarget.style.display = 'none' }} />
          </Link>
          <h2>Welcome back</h2>
          <p>Sign in to your {localStorage.getItem('brandName') || 'SAINT GLOBAL SOLAR'} account to continue.</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="auth-group">
              <div className="auth-password-header">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="auth-forgot-link">Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="auth-input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                    padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="auth-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {errorMsg}
              </div>
            )}

            <button type="submit" disabled={!!loadingMsg} className="auth-submit">
              {loadingMsg || 'Sign In'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </div>
      </div>

      <style>{`
        .auth-layout {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          font-family: var(--font);
          padding: 24px;
        }
        .auth-container {
          width: 100%;
          max-width: 400px;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .auth-brand-logo {
          display: inline-flex; align-items: center; justify-content: center;
          text-decoration: none; margin-bottom: 24px;
        }
        .auth-brand-logo img {
          height: 80px;
          width: auto;
          object-fit: contain;
        }
        .auth-password-toggle {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }
        .auth-password-toggle:hover {
          color: #0f172a;
        }
        .auth-password-toggle svg {
          display: block;
        }
        input[type="password"] {
          padding-right: 44px !important;
        }
        .auth-header h2 {
          font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px; letter-spacing: -0.5px;
        }
        .auth-header p {
          font-size: 15px; color: #64748b; margin: 0;
        }

        .auth-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .auth-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .auth-group label {
          font-size: 14px; font-weight: 600; color: #0f172a;
        }

        .auth-input {
          width: 100%; padding: 12px 16px; font-size: 15px;
          border: 1px solid #cbd5e1; border-radius: 8px;
          background: #ffffff; color: #0f172a; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input:focus {
          outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .auth-input::placeholder { color: #94a3b8; }

        .auth-password-header {
          display: flex; justify-content: space-between; align-items: center;
        }
        .auth-forgot-link {
          font-size: 13px; font-weight: 500; color: #2563eb; text-decoration: none;
        }
        .auth-forgot-link:hover { text-decoration: underline; }

        .auth-submit {
          background: var(--brand-primary, #0f0d0a); color: #ffffff; font-weight: 600; font-size: 15px;
          padding: 12px; border: none; border-radius: 8px; cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
          margin-top: 8px;
        }
        .auth-submit:hover:not(:disabled) { background: var(--brand-hover, #262520); }
        .auth-submit:active:not(:disabled) { transform: scale(0.98); }
        .auth-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .auth-error {
          display: flex; align-items: flex-start; gap: 8px;
          background: #fef2f2; color: #b91c1c; padding: 12px; border-radius: 8px; font-size: 14px;
        }
        .auth-error svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; }

        .auth-footer {
          margin-top: 32px; text-align: center;
        }
        .auth-footer p {
          font-size: 14px; color: #64748b; margin: 0;
        }
         .auth-footer a {
          color: #0f172a; font-weight: 600; text-decoration: none;
        }
        .auth-footer a:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}

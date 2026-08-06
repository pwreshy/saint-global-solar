import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendWelcomeEmail } from '../lib/emailService'

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

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()

  if (user && !loading) {
    const isAdmin = user?.app_metadata?.role === 'admin' || profile?.role === 'admin'
    if (isAdmin) {
      return <Navigate to="/admin" />
    }
    return <Navigate to="/dashboard" />
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoadingMsg('Creating account...')
    setErrorMsg('')
    setSuccessMsg('')

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      setLoadingMsg('')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      setLoadingMsg('')
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        // If auto-confirm is enabled, data.session will be populated and the user is logged in.
        if (data?.session) {
          // Send welcome email (non-blocking)
          sendWelcomeEmail({ name: fullName, email })
          navigate('/dashboard')
        } else {
          // Still send welcome email (they'll confirm email)
          sendWelcomeEmail({ name: fullName, email })
          setSuccessMsg('Registration successful! Please check your email for a verification link or log in if auto-confirmed.')
        }
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setLoadingMsg('')
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-container">
        
        <div className="auth-header">
          <Link to="/" className="auth-brand-logo">
            <img src="/logo_black.png" alt={localStorage.getItem('brandName') || 'SAINT GLOBAL SOLAR'} onError={e => { e.currentTarget.style.display = 'none' }} />
          </Link>
          <h2>Create your account</h2>
          <p>Get started with {localStorage.getItem('brandName') || 'SAINT GLOBAL SOLAR'} today.</p>
        </div>

        <div className="auth-card">
          {successMsg ? (
            <div className="auth-success-state">
              <div className="auth-success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3>Check your email</h3>
              <p>{successMsg}</p>
              <Link to="/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 16 }}>
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="auth-form">
              <div className="auth-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="auth-input"
                  placeholder="John Doe"
                />
              </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password">Password</label>
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

              <div className="auth-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="auth-input"
                    placeholder="••••••••"
                    style={{ paddingRight: 44, width: '100%' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(p => !p)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                      padding: 0, display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
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
                {loadingMsg || 'Sign Up'}
              </button>
            </form>
          )}
        </div>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .auth-layout {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: var(--font);
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

        .auth-success-state {
          text-align: center;
          padding: 16px 0;
        }
        .auth-success-icon {
          width: 56px; height: 56px; background: #dcfce7; color: #16a34a; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .auth-success-icon svg { width: 28px; height: 28px; }
        .auth-success-state h3 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
        .auth-success-state p { font-size: 14px; color: #64748b; margin: 0; line-height: 1.5; }

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
      `}} />
    </div>
  )
}

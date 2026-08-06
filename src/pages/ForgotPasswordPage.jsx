import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) setError(error.message)
    else setMessage('Check your email for the password reset link.')
    
    setLoading(false)
  }

  return (
    <div className="auth-container-root">
      <div className="auth-card-wrapper">
        <Link to="/" className="auth-brand-logo">
          <img src="/logo_black.png" alt={localStorage.getItem('brandName') || 'SAINT GLOBAL SOLAR'} />
        </Link>
        
        <div className="auth-card">
          <div className="auth-header" style={{ marginBottom: 24, textAlign: 'center' }}>
            <h2>Reset Password</h2>
            <p>Enter your email to receive a password reset link.</p>
          </div>
          
          {error && (
            <div className="auth-error" style={{ marginBottom: 20 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div style={{ background: '#f0fdf4', color: '#15803d', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: '14px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>{message}</span>
            </div>
          )}
          
          <form onSubmit={handleReset} className="auth-form">
            <div className="auth-group">
              <label>Email Address</label>
              <input 
                className="auth-input" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="name@email.com"
                required 
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>
              Remember your password? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .auth-container-root {
          background-color: #f8fafc;
          background-image: radial-gradient(circle at 10% 20%, rgba(37,99,235,0.03) 0%, transparent 40%);
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
          padding: 40px 20px;
          box-sizing: border-box;
        }
        .auth-card-wrapper {
          width: 100%; max-width: 440px; display: flex; flex-direction: column; align-items: center;
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
          width: 100%;
          box-sizing: border-box;
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
          font-size: 14px; font-weight: 600; color: #0f172a; text-align: left;
        }
        .auth-input {
          width: 100%; padding: 12px 16px; font-size: 15px;
          border: 1px solid #cbd5e1; border-radius: 8px;
          background: #ffffff; color: #0f172a; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
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
          width: 100%;
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
      `}} />
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TIER_COLORS = {
  bronze:   { bg: '#fef3e2', text: '#ea580c', border: '#fed7aa' },
  silver:   { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  gold:     { bg: '#fefce8', text: '#a16207', border: '#fde68a' },
  platinum: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
}

const STATUS_COLORS = {
  active:    { bg: '#dcfce7', text: '#166534', dot: '#16a34a', border: '#bbf7d0' },
  suspended: { bg: '#fee2e2', text: '#991b1b', dot: '#dc2626', border: '#fecaca' },
  pending:   { bg: '#fef9c3', text: '#854d0e', dot: '#ca8a04', border: '#fef08a' },
}

function TierIcon({ tier, size = 12, color }) {
  if (tier === 'bronze') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    )
  }
  if (tier === 'silver') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    )
  }
  if (tier === 'gold') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2.5" style={{ flexShrink: 0 }}>
      <path d="M6 3h12l4 6-10 13L2 9z"/>
      <path d="M11 3 8 9l4 13 4-13-3-6"/>
      <path d="M2 9h20"/>
    </svg>
  )
}

const PAGE_SIZE = 20

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmtNGN = (kobo) =>
  (Number(kobo || 0) / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const initials = (name) =>
  (name || 'U')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

const avatarColor = (str) => {
  const colors = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
  let hash = 0
  for (let i = 0; i < (str || '').length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM SELECT DROPDOWN COMPONENT & HOOK
// ─────────────────────────────────────────────────────────────────────────────

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

function CustomSelect({ value, onChange, options, minWidth = 140 }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  
  useClickOutside(containerRef, () => setIsOpen(false))

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth, display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '9px 14px',
          borderRadius: 9,
          border: isOpen ? '1.5px solid #6366f1' : '1.5px solid #cbd5e1',
          fontSize: '13.5px',
          color: '#334155',
          backgroundColor: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.15s',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
        }}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
            marginLeft: '8px',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 9999,
            padding: '4px',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                  color: isSelected ? '#1e40af' : '#334155',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
                  textAlign: 'left',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {opt.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function IconBtn({ onClick, title, color = '#4f566b', bg = '#f1f5f9', hoverBg = '#e2e8f0', danger = false, disabled = false, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={disabled}
        title={title}
        style={{
          background: hovered ? (danger ? '#fee2e2' : hoverBg) : bg,
          color: hovered && danger ? '#dc2626' : color,
          border: 'none', borderRadius: 7,
          width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
          flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {children}
      </button>
      {hovered && title && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff',
          fontSize: 11, fontWeight: 600,
          padding: '4px 8px', borderRadius: 4,
          whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 9999,
        }}>
          {title}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid #0f172a',
          }} />
        </div>
      )}
    </div>
  )
}

function TierBadge({ tier }) {
  if (!tier) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
  const t = tier.toLowerCase()
  const c = TIER_COLORS[t] || TIER_COLORS.bronze
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 20, padding: '2px 10px',
      fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3,
      textTransform: 'capitalize',
    }}>
      <TierIcon tier={t} />
      {tier}
    </span>
  )
}

function StatusBadge({ status }) {
  if (!status) return null
  const s = status.toLowerCase()
  const c = STATUS_COLORS[s] || STATUS_COLORS.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 20, padding: '3px 10px',
      fontSize: 11.5, fontWeight: 700,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: c.dot, flexShrink: 0,
        boxShadow: `0 0 0 2px ${c.border}`,
      }} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

function AvatarCell({ profile }) {
  const name = profile?.full_name || profile?.email || 'Unknown'
  const email = profile?.email || ''
  const bg = avatarColor(name)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={name}
          style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e2e8f0' }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ) : (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: `0 2px 6px ${bg}55`,
        }}>
          {initials(name)}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
          {name}
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
          {email}
        </div>
      </div>
    </div>
  )
}

function CopyCode({ code }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontFamily: 'monospace', fontSize: 11.5, fontWeight: 700,
        background: 'var(--g50)', border: '1px solid var(--g100)',
        borderRadius: 5, padding: '3px 8px', color: 'var(--g700)', letterSpacing: 0.5,
      }}>
        {code || '—'}
      </span>
      {code && (
        <button
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy code'}
          style={{
            background: copied ? 'var(--g100)' : 'var(--n100)',
            border: `1px solid ${copied ? 'var(--g200)' : 'var(--n200)'}`,
            borderRadius: 5, width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifycontent: 'center',
            cursor: 'pointer', color: copied ? 'var(--g700)' : 'var(--n600)',
            transition: 'all 0.15s ease',
          }}
        >
          {copied ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          )}
        </button>
      )}
    </div>
  )
}

function InlineRateEditor({ affiliateId, value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  const commit = () => {
    const parsed = parseFloat(val)
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      onSave(affiliateId, parsed)
    } else {
      setVal(value ?? '')
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          ref={inputRef}
          type="number"
          min={0} max={100} step={0.5}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value ?? ''); setEditing(false) } }}
          onBlur={commit}
          style={{
            width: 52, fontSize: 12, fontWeight: 700, color: '#1e293b',
            border: '1.5px solid #6366f1', borderRadius: 5,
            padding: '3px 6px', outline: 'none', textAlign: 'center',
            background: '#f5f3ff',
          }}
        />
        <span style={{ fontSize: 12, color: '#64748b' }}>%</span>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to edit rate"
      style={{
        background: 'none', border: '1px dashed #cbd5e1', borderRadius: 5,
        padding: '3px 8px', cursor: 'pointer',
        fontSize: 13, fontWeight: 700, color: '#3730a3',
        display: 'flex', alignItems: 'center', gap: 4,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#f5f3ff' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'none' }}
    >
      {val ?? '—'}%
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────

function EditAffiliateModal({ affiliate, onClose, onSaved }) {
  const [rate, setRate] = useState(affiliate?.commission_rate ?? 10)
  const [tier, setTier] = useState(affiliate?.tier || 'bronze')
  const [notes, setNotes] = useState(affiliate?.admin_notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const profile = affiliate?.profiles

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const parsed = parseFloat(rate)
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setError('Commission rate must be between 0 and 100.')
      setSaving(false)
      return
    }
    const { error: err } = await supabase
      .from('affiliates')
      .update({ commission_rate: parsed, tier, admin_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', affiliate.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved({ ...affiliate, commission_rate: parsed, tier, admin_notes: notes })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20,
        width: '100%', maxWidth: 500,
        boxShadow: '0 32px 64px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        animation: 'slideUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--g900) 0%, var(--g700) 100%)',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-heading)' }}>Edit Affiliate</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sub)' }}>
              {profile?.full_name || profile?.email || 'Unnamed'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: 8, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', fontSize: 16, lineHeight: 1,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Commission Rate */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Commission Rate (%)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number"
                min={0} max={100} step={0.5}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                style={{
                  width: 100, padding: '10px 14px',
                  border: '1.5px solid #d1d5db', borderRadius: 9,
                  fontSize: 16, fontWeight: 700, color: '#1e293b',
                  outline: 'none', textAlign: 'center',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
              />
              <span style={{ fontSize: 20, fontWeight: 700, color: '#6366f1' }}>%</span>
              <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 4 }}>Standard platform rate is 10%</span>
            </div>
          </div>

          {/* Tier */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Affiliate Tier
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['bronze', 'silver', 'gold', 'platinum'].map((t) => {
                const c = TIER_COLORS[t]
                const selected = tier === t
                return (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    style={{
                      padding: '7px 16px',
                      background: selected ? c.bg : '#f8fafc',
                      border: `2px solid ${selected ? c.border : '#e2e8f0'}`,
                      borderRadius: 20,
                      color: selected ? c.text : '#64748b',
                      fontWeight: selected ? 700 : 500,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <TierIcon tier={t} color={selected ? c.text : '#64748b'} />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Admin Notes <span style={{ color: '#94a3b8', fontWeight: 400 }}>(internal only)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="E.g. Top performer — negotiated custom rate, VIP treatment…"
              style={{
                width: '100%', padding: '10px 14px',
                border: '1.5px solid #d1d5db', borderRadius: 9,
                fontSize: 13.5, color: '#374151', resize: 'vertical',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                transition: 'border-color 0.15s', lineHeight: 1.5,
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          {/* Affiliate stats read-only */}
          <div style={{
            background: '#f8fafc', borderRadius: 10, padding: '14px 16px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
          }}>
            {[
              { label: 'Total Clicks', val: (affiliate?.total_clicks || 0).toLocaleString() },
              { label: 'Conversions', val: (affiliate?.total_referrals || 0).toLocaleString() },
              { label: 'Total Earned', val: fmtNGN(affiliate?.total_earnings || 0) },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '11px', background: '#f8fafc',
                border: '1.5px solid #e2e8f0', borderRadius: 9,
                color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2, padding: '11px',
                background: saving ? 'var(--g200)' : 'linear-gradient(135deg, var(--g600), var(--g505, #2563eb))',
                border: 'none', borderRadius: 9,
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK ACTION BAR
// ─────────────────────────────────────────────────────────────────────────────

function BulkBar({ count, onSuspend, onActivate, onClear, loading }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--g900)',
      borderRadius: 14, padding: '14px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 12px 40px rgba(5,11,20,0.45)',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          background: '#6366f1', color: '#fff',
          borderRadius: 20, padding: '2px 10px',
          fontSize: 13, fontWeight: 700,
        }}>{count}</div>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500 }}>selected</span>
      </div>
      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
      <button
        onClick={onActivate}
        disabled={loading}
        style={{
          background: '#16a34a', border: 'none', borderRadius: 8,
          color: '#fff', fontWeight: 700, fontSize: 13,
          padding: '8px 16px', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: loading ? 0.7 : 1,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Activate
      </button>
      <button
        onClick={onSuspend}
        disabled={loading}
        style={{
          background: '#dc2626', border: 'none', borderRadius: 8,
          color: '#fff', fontWeight: 700, fontSize: 13,
          padding: '8px 16px', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: loading ? 0.7 : 1,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        Suspend
      </button>
      <button
        onClick={onClear}
        style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
          color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13,
          padding: '8px 12px', cursor: 'pointer',
        }}
      >
        Clear
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, gradient, iconBg }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 14,
      padding: '20px 22px',
      display: 'flex', alignItems: 'flex-start', gap: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      flex: 1, minWidth: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: gradient,
        borderRadius: '14px 14px 0 0',
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 11,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '72px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        background: 'linear-gradient(135deg, #f0f0ff, #e0e7ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 8px 24px rgba(99,102,241,0.12)',
      }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
        {hasFilters ? 'No affiliates match your filters' : 'No affiliates yet'}
      </h3>
      <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px', maxWidth: 340, lineHeight: 1.6 }}>
        {hasFilters
          ? "Try adjusting your search or filter criteria to find what you're looking for."
          : 'Once users apply for the affiliate program, they will appear here for you to manage.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            border: 'none', borderRadius: 9,
            color: '#fff', fontWeight: 700, fontSize: 13.5,
            padding: '10px 22px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterTier, setFilterTier] = useState('all')
  const [selected, setSelected] = useState([])
  const [editModal, setEditModal] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, pendingCommissions: 0, totalRevenue: 0 })
  const [bulkLoading, setBulkLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)

  // ── Data Loading ────────────────────────────────────────────────────────

  const computeStats = (data) => {
    const total = data.length
    const active = data.filter((a) => a.status === 'active').length
    const pendingCommissions = data.reduce((acc, a) => {
      const earned = Number(a.total_earnings || 0)
      const paid = Number(a.total_paid || 0)
      return acc + Math.max(0, earned - paid)
    }, 0)
    const totalRevenue = data.reduce((acc, a) => acc + Number(a.total_revenue_generated || 0), 0)
    setStats({ total, active, pendingCommissions, totalRevenue })
  }

  const loadAffiliates = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('affiliates')
      .select(`
        *,
        profiles!affiliates_user_id_fkey(id, full_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })
    if (!error && data) {
      setAffiliates(data)
      computeStats(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadAffiliates() }, [loadAffiliates])

  // ── Toast ──────────────────────────────────────────────────────────────

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Status Change ──────────────────────────────────────────────────────

  const handleStatusChange = async (affiliateId, newStatus) => {
    const { error } = await supabase
      .from('affiliates')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', affiliateId)
    if (error) { showToast('Failed to update status: ' + error.message, 'error'); return }
    setAffiliates((prev) => {
      const updated = prev.map((a) => (a.id === affiliateId ? { ...a, status: newStatus } : a))
      computeStats(updated)
      return updated
    })
    showToast(`Affiliate ${newStatus === 'active' ? 'activated' : 'suspended'} successfully.`)
  }

  // ── Commission Rate Save ───────────────────────────────────────────────

  const handleSaveRate = async (affiliateId, newRate) => {
    const { error } = await supabase
      .from('affiliates')
      .update({ commission_rate: newRate, updated_at: new Date().toISOString() })
      .eq('id', affiliateId)
    if (error) { showToast('Failed to save rate: ' + error.message, 'error'); return }
    setAffiliates((prev) =>
      prev.map((a) => (a.id === affiliateId ? { ...a, commission_rate: newRate } : a))
    )
    showToast('Commission rate updated.')
  }

  // ── Edit Modal Saved ───────────────────────────────────────────────────

  const handleModalSaved = (updated) => {
    setAffiliates((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
    )
    showToast('Affiliate updated successfully.')
  }

  // ── Bulk Actions ───────────────────────────────────────────────────────

  const handleBulkAction = async (newStatus) => {
    setBulkLoading(true)
    const { error } = await supabase
      .from('affiliates')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .in('id', selected)
    setBulkLoading(false)
    if (error) { showToast('Bulk action failed: ' + error.message, 'error'); return }
    setAffiliates((prev) => {
      const updated = prev.map((a) => selected.includes(a.id) ? { ...a, status: newStatus } : a)
      computeStats(updated)
      return updated
    })
    showToast(`${selected.length} affiliate(s) ${newStatus === 'active' ? 'activated' : 'suspended'}.`)
    setSelected([])
  }

  // ── Filtering & Pagination ─────────────────────────────────────────────

  const filtered = affiliates.filter((a) => {
    const profile = a.profiles || {}
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      (profile.full_name || '').toLowerCase().includes(q) ||
      (profile.email || '').toLowerCase().includes(q) ||
      (a.affiliate_code || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    const matchTier = filterTier === 'all' || a.tier === filterTier
    return matchSearch && matchStatus && matchTier
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, filterStatus, filterTier])

  const hasFilters = search || filterStatus !== 'all' || filterTier !== 'all'

  // ── Select Helpers ─────────────────────────────────────────────────────

  const toggleSelect = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleSelectAll = () => {
    const pageIds = paginated.map((a) => a.id)
    const allSelected = pageIds.every((id) => selected.includes(id))
    if (allSelected) setSelected((prev) => prev.filter((id) => !pageIds.includes(id)))
    else setSelected((prev) => [...new Set([...prev, ...pageIds])])
  }

  const pageAllSelected = paginated.length > 0 && paginated.every((a) => selected.includes(a.id))
  const pagePartialSelected = paginated.some((a) => selected.includes(a.id)) && !pageAllSelected

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: 'var(--font, Inter, sans-serif)',
    }}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(30px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        .aff-table-row:hover td { background: var(--g50) !important; }
        
        @media (max-width: 900px) {
          .aff-stats-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 600px) {
          .aff-stats-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .hide-mobile {
            display: none !important;
          }
          .aff-filters-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .aff-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 100px' }}>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="aff-header-row" style={{
          marginBottom: 28,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'linear-gradient(135deg, var(--g800), var(--g600))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Affiliate Program</h1>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
              Manage affiliates, commissions, tiers, and payouts in one place.
            </p>
          </div>

          <button
            onClick={loadAffiliates}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 18px',
              background: '#fff', border: '1.5px solid #e2e8f0',
              borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13.5, fontWeight: 600, color: '#374151',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}
            >
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
            </svg>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ── Stats Row ──────────────────────────────────────────────────── */}
        <div className="aff-stats-grid" style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatCard
            label="Total Affiliates"
            value={loading ? '—' : stats.total.toLocaleString()}
            sub={`${stats.active} active`}
            gradient="linear-gradient(90deg, #6366f1, #8b5cf6)"
            iconBg="#f0f0ff"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            }
          />
          <StatCard
            label="Active Affiliates"
            value={loading ? '—' : stats.active.toLocaleString()}
            sub={stats.total ? `${Math.round((stats.active / stats.total) * 100)}% of total` : '0% of total'}
            gradient="linear-gradient(90deg, #10b981, #059669)"
            iconBg="#f0fdf4"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            }
          />
          <StatCard
            label="Pending Commissions"
            value={loading ? '—' : fmtNGN(stats.pendingCommissions)}
            sub="Unpaid affiliate balances"
            gradient="linear-gradient(90deg, #f59e0b, #d97706)"
            iconBg="#fffbeb"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            }
          />
          <StatCard
            label="Revenue via Affiliates"
            value={loading ? '—' : fmtNGN(stats.totalRevenue)}
            sub="All-time affiliate-driven sales"
            gradient="linear-gradient(90deg, #3b82f6, #1d4ed8)"
            iconBg="#eff6ff"
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"/>
              </svg>
            }
          />
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="aff-filters-row" style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          {/* Search */}
          <div style={{ flex: '1 1 220px', minWidth: 200 }}>
            <input
              type="text"
              placeholder="Search by name, email, or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 14px',
                border: '1.5px solid var(--n200)', borderRadius: 9,
                fontSize: 13.5, color: '#334155', outline: 'none',
                background: '#fafafa',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--g500)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--n200)')}
            />
          </div>

          {/* Status */}
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'suspended', label: 'Suspended' }
            ]}
            minWidth={150}
          />

          {/* Tier */}
          <CustomSelect
            value={filterTier}
            onChange={setFilterTier}
            options={[
              { value: 'all', label: 'All Tiers' },
              { value: 'bronze', label: 'Bronze' },
              { value: 'silver', label: 'Silver' },
              { value: 'gold', label: 'Gold' },
              { value: 'platinum', label: 'Platinum' }
            ]}
            minWidth={130}
          />

          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('all'); setFilterTier('all') }}
              style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 8, padding: '8px 14px',
                color: '#dc2626', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Clear
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {filtered.length} affiliate{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid #e2e8f0', borderTopColor: '#6366f1',
                animation: 'spin 0.7s linear infinite',
              }} />
              <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>Loading affiliates…</span>
            </div>
          ) : paginated.length === 0 ? (
            <EmptyState
              hasFilters={!!hasFilters}
              onClear={() => { setSearch(''); setFilterStatus('all'); setFilterTier('all') }}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ width: 44, padding: '13px 0 13px 18px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={pageAllSelected}
                        ref={(el) => { if (el) el.indeterminate = pagePartialSelected }}
                        onChange={toggleSelectAll}
                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#6366f1' }}
                      />
                    </th>
                    {[
                      { label: 'Affiliate',  w: 200, hideMobile: false },
                      { label: 'Code',       w: 130, hideMobile: false },
                      { label: 'Tier',       w: 100, hideMobile: true },
                      { label: 'Status',     w: 105, hideMobile: false },
                      { label: 'Rate',       w: 85,  hideMobile: true },
                      { label: 'Clicks',     w: 70,  hideMobile: true },
                      { label: 'Referrals',  w: 85,  hideMobile: true },
                      { label: 'Earnings',   w: 125, hideMobile: false },
                      { label: 'Pending',    w: 125, hideMobile: false },
                      { label: 'Joined',     w: 90,  hideMobile: true },
                      { label: 'Actions',    w: 110, hideMobile: false },
                    ].map(({ label, w, hideMobile }) => (
                      <th key={label} className={hideMobile ? 'hide-mobile' : ''} style={{
                        padding: '13px 14px',
                        textAlign: 'left',
                        fontSize: 11.5, fontWeight: 700, color: '#64748b',
                        letterSpacing: 0.5, textTransform: 'uppercase',
                        whiteSpace: 'nowrap', width: w,
                      }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((affiliate, idx) => {
                    const profile = affiliate.profiles || {}
                    const isSelected = selected.includes(affiliate.id)
                    const status = (affiliate.status || 'pending').toLowerCase()
                    const tier   = (affiliate.tier   || 'bronze').toLowerCase()
                    const earnings = Number(affiliate.total_earnings || 0)
                    const paid     = Number(affiliate.total_paid    || 0)
                    const pending  = Math.max(0, earnings - paid)
                    const convRate = affiliate.total_clicks > 0
                      ? Math.round((Number(affiliate.total_referrals || 0) / Number(affiliate.total_clicks)) * 100)
                      : null

                    return (
                      <tr
                        key={affiliate.id}
                        className="aff-table-row"
                        style={{
                          borderBottom: idx < paginated.length - 1 ? '1px solid #f1f5f9' : 'none',
                          background: isSelected
                            ? '#faf5ff'
                            : hoveredRow === affiliate.id ? '#fafbff' : '#fff',
                        }}
                        onMouseEnter={() => setHoveredRow(affiliate.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '14px 0 14px 18px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(affiliate.id)}
                            style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#6366f1' }}
                          />
                        </td>

                        {/* Avatar/Name/Email */}
                        <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <AvatarCell profile={profile} />
                        </td>

                        {/* Code */}
                        <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <CopyCode code={affiliate.affiliate_code} />
                        </td>

                        {/* Tier */}
                        <td className="hide-mobile" style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <TierBadge tier={tier} />
                        </td>

                        {/* Status */}
                        <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <StatusBadge status={status} />
                        </td>

                        {/* Commission Rate */}
                        <td className="hide-mobile" style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <InlineRateEditor
                            affiliateId={affiliate.id}
                            value={affiliate.commission_rate ?? 10}
                            onSave={handleSaveRate}
                          />
                        </td>

                        {/* Clicks */}
                        <td className="hide-mobile" style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#334155' }}>
                            {Number(affiliate.total_clicks || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Referrals */}
                        <td className="hide-mobile" style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#334155' }}>
                            {Number(affiliate.total_referrals || 0).toLocaleString()}
                          </span>
                          {convRate !== null && (
                            <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>
                              {convRate}% conv.
                            </div>
                          )}
                        </td>

                        {/* Total Earnings */}
                        <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                            {fmtNGN(earnings)}
                          </span>
                        </td>

                        {/* Pending Balance */}
                        <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: pending > 0 ? '#b45309' : '#94a3b8',
                          }}>
                            {fmtNGN(pending)}
                          </span>
                          {paid > 0 && (
                            <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>
                              {fmtNGN(paid)} paid
                            </div>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="hide-mobile" style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                            {fmtDate(affiliate.created_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {/* Edit */}
                            <IconBtn
                              onClick={() => setEditModal(affiliate)}
                              title="Edit affiliate"
                              color="#6366f1" bg="#f5f3ff" hoverBg="#ede9fe"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </IconBtn>

                            {/* Suspend / Activate */}
                            {status === 'active' ? (
                              <IconBtn
                                onClick={() => handleStatusChange(affiliate.id, 'suspended')}
                                title="Suspend affiliate"
                                color="#dc2626" bg="#fef2f2" hoverBg="#fee2e2" danger
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                </svg>
                              </IconBtn>
                            ) : (
                              <IconBtn
                                onClick={() => handleStatusChange(affiliate.id, 'active')}
                                title="Activate affiliate"
                                color="#16a34a" bg="#f0fdf4" hoverBg="#dcfce7"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                                  <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                              </IconBtn>
                            )}

                            {/* View Profile */}
                            <IconBtn
                              onClick={() => profile?.id && window.open(`/admin/users?id=${profile.id}`, '_blank')}
                              title="View user profile"
                              color="#0ea5e9" bg="#f0f9ff" hoverBg="#e0f2fe"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            </IconBtn>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {!loading && totalPages > 1 && (
            <div style={{
              borderTop: '1px solid #f1f5f9',
              padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[
                  { label: '«', action: () => setPage(1),                       disabled: page === 1 },
                  { label: 'Prev', action: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1 },
                ].map(({ label, action, disabled }) => (
                  <button key={label} onClick={action} disabled={disabled} style={{
                    padding: '6px 11px', border: '1.5px solid #e2e8f0', borderRadius: 7,
                    background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600,
                    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
                  }}>{label}</button>
                ))}

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p
                  if (totalPages <= 5) p = i + 1
                  else if (page <= 3) p = i + 1
                  else if (page >= totalPages - 2) p = totalPages - 4 + i
                  else p = page - 2 + i
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{
                      width: 34, height: 34,
                      border: p === page ? 'none' : '1.5px solid #e2e8f0',
                      borderRadius: 7,
                      background: p === page ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#fff',
                      color: p === page ? '#fff' : '#475569',
                      fontSize: 13, fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: p === page ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                    }}>{p}</button>
                  )
                })}

                {[
                  { label: 'Next', action: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page === totalPages },
                  { label: '»',    action: () => setPage(totalPages),                          disabled: page === totalPages },
                ].map(({ label, action, disabled }) => (
                  <button key={label} onClick={action} disabled={disabled} style={{
                    padding: '6px 11px', border: '1.5px solid #e2e8f0', borderRadius: 7,
                    background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600,
                    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
                  }}>{label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      {editModal && (
        <EditAffiliateModal
          affiliate={editModal}
          onClose={() => setEditModal(null)}
          onSaved={handleModalSaved}
        />
      )}

      {/* ── Bulk Action Bar ─────────────────────────────────────────────── */}
      {selected.length > 0 && (
        <BulkBar
          count={selected.length}
          loading={bulkLoading}
          onSuspend={() => handleBulkAction('suspended')}
          onActivate={() => handleBulkAction('active')}
          onClear={() => setSelected([])}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 10000,
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          borderLeft: `4px solid ${toast.type === 'error' ? '#dc2626' : '#16a34a'}`,
          borderRadius: 10, padding: '13px 18px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'toastIn 0.25s ease',
          maxWidth: 340,
        }}>
          {toast.type === 'error' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          )}
          <span style={{
            fontSize: 13.5, fontWeight: 600,
            color: toast.type === 'error' ? '#991b1b' : '#166534',
          }}>
            {toast.msg}
          </span>
        </div>
      )}
    </div>
  )
}

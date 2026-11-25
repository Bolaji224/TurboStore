import { useState, useEffect, useRef, useCallback } from 'react'
import { Mail, Copy, Check, X, RefreshCw, ArrowRight, Search } from 'lucide-react'
import { useColors } from '../../context/ThemeContext'
import api from '../../services/api'

const SERVICES = [
  { code: 'google',    name: 'Google / Gmail',  color: '#4285F4' },
  { code: 'facebook',  name: 'Facebook',         color: '#1877F2' },
  { code: 'instagram', name: 'Instagram',        color: '#E1306C' },
  { code: 'twitter',   name: 'Twitter / X',      color: '#1DA1F2' },
  { code: 'tiktok',    name: 'TikTok',           color: '#010101' },
  { code: 'telegram',  name: 'Telegram',         color: '#2CA5E0' },
  { code: 'discord',   name: 'Discord',          color: '#5865F2' },
  { code: 'snapchat',  name: 'Snapchat',         color: '#FFFC00' },
  { code: 'linkedin',  name: 'LinkedIn',         color: '#0A66C2' },
  { code: 'microsoft', name: 'Microsoft',        color: '#00A4EF' },
  { code: 'amazon',    name: 'Amazon',           color: '#FF9900' },
  { code: 'netflix',   name: 'Netflix',          color: '#E50914' },
  { code: 'spotify',   name: 'Spotify',          color: '#1DB954' },
  { code: 'paypal',    name: 'PayPal',           color: '#003087' },
  { code: 'uber',      name: 'Uber',             color: '#000000' },
  { code: 'airbnb',    name: 'Airbnb',           color: '#FF5A5F' },
  { code: 'binance',   name: 'Binance',          color: '#F3BA2F' },
  { code: 'chatgpt',   name: 'ChatGPT',          color: '#10A37F' },
  { code: 'apple',     name: 'Apple / iCloud',   color: '#555555' },
  { code: 'whatsapp',  name: 'WhatsApp',         color: '#25D366' },
]

function ServiceIcon({ name, color }) {
  const dark = color === '#010101' || color === '#000000'
  return (
    <div style={{ width: 44, height: 44, borderRadius: 12, background: dark ? '#1a1a1a' : color + '22', border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 18, fontWeight: 900, color: dark ? '#fff' : color }}>{name[0]}</span>
    </div>
  )
}

function CopyButton({ text, colors }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      style={{ background: copied ? '#16A34A' : 'rgba(22,163,74,0.12)', border: `1px solid ${copied ? '#16A34A' : 'rgba(22,163,74,0.3)'}`, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: copied ? '#fff' : '#16A34A', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .15s', flexShrink: 0 }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// Active order panel — shows email, polls for OTP
function ActiveOrder({ order: initialOrder, onDone, colors }) {
  const [order, setOrder]     = useState(initialOrder)
  const [polling, setPolling] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const pollRef = useRef(null)

  const poll = useCallback(async () => {
    try {
      const r = await api.get(`/email-orders/${order.id}/otp`)
      if (r.data.otp) {
        setOrder(o => ({ ...o, otp: r.data.otp, status: 'otp_received' }))
        setPolling(false)
        return
      }
      const terminal = ['expired', 'cancelled', 'refunded', 'failed']
      if (terminal.includes(r.data.status)) {
        setOrder(o => ({ ...o, status: r.data.status }))
        setPolling(false)
      }
    } catch {}
  }, [order.id])

  useEffect(() => {
    if (!polling) return
    pollRef.current = setInterval(poll, 4000)
    return () => clearInterval(pollRef.current)
  }, [polling, poll])

  async function handleCancel() {
    setCancelling(true)
    try {
      await api.post(`/email-orders/${order.id}/cancel`)
      setOrder(o => ({ ...o, status: 'cancelled' }))
      setPolling(false)
    } catch {}
    setCancelling(false)
  }

  const isTerminal = ['expired', 'cancelled', 'refunded', 'failed', 'otp_received'].includes(order.status)
  const timeLeft = order.expires_at ? Math.max(0, Math.floor((new Date(order.expires_at) - Date.now()) / 1000)) : null

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 4px' }}>
      {/* Service header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <ServiceIcon name={order.service_name} color={SERVICES.find(s => s.code === order.service)?.color || '#16A34A'} />
        <div>
          <p style={{ fontSize: 17, fontWeight: 800, color: colors.text, margin: 0 }}>{order.service_name}</p>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Email OTP · {order.formatted_price}</p>
        </div>
      </div>

      {/* Email address box */}
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Your Temporary Email</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <code style={{ flex: 1, fontSize: 'clamp(13px,3vw,16px)', fontWeight: 700, color: '#16A34A', background: 'rgba(22,163,74,0.08)', padding: '8px 12px', borderRadius: 8, wordBreak: 'break-all', minWidth: 0 }}>
            {order.email_address}
          </code>
          <CopyButton text={order.email_address} colors={colors} />
        </div>
        <p style={{ fontSize: 12, color: colors.textMuted, margin: '10px 0 0', lineHeight: 1.5 }}>
          Enter this email into <strong style={{ color: colors.text }}>{order.service_name}</strong>'s sign-up or verification page. The code will appear below automatically.
        </p>
      </div>

      {/* OTP / status box */}
      {order.otp ? (
        <div style={{ background: 'rgba(22,163,74,0.08)', border: '1.5px solid rgba(22,163,74,0.4)', borderRadius: 14, padding: 24, marginBottom: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.1em' }}>Verification Code</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <span style={{ fontSize: 'clamp(32px,8vw,48px)', fontWeight: 900, color: '#16A34A', fontFamily: 'monospace', letterSpacing: 6 }}>{order.otp}</span>
            <CopyButton text={order.otp} colors={colors} />
          </div>
        </div>
      ) : (
        <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 24, marginBottom: 16, textAlign: 'center' }}>
          {order.status === 'expired' || order.status === 'cancelled' ? (
            <>
              <p style={{ fontSize: 28, margin: '0 0 8px' }}>⏰</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: '0 0 4px' }}>
                {order.status === 'expired' ? 'Order expired' : 'Order cancelled'}
              </p>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Your wallet has been refunded.</p>
            </>
          ) : (
            <>
              <RefreshCw size={22} color="#16A34A" style={{ animation: 'spin 1.2s linear infinite', marginBottom: 10 }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: '0 0 4px' }}>Waiting for verification email…</p>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
                {timeLeft !== null ? `Expires in ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s` : 'Checking every few seconds'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {!isTerminal && (
          <button onClick={handleCancel} disabled={cancelling}
            style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1px solid ${colors.border}`, background: 'transparent', color: '#EF4444', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            {cancelling ? 'Cancelling…' : 'Cancel & Refund'}
          </button>
        )}
        <button onClick={onDone}
          style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: 'linear-gradient(135deg,#16A34A,#15803D)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {order.otp ? 'Get Another' : 'Done'} <ArrowRight size={14} />
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function EmailOtp() {
  const colors = useColors()
  const [price, setPrice]         = useState(null)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [confirm, setConfirm]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)
  const [error, setError]         = useState('')
  const [walletBalance, setWalletBalance] = useState(0)

  useEffect(() => {
    api.get('/email-orders/price').then(r => setPrice(r.data.price_naira)).catch(() => {})
    api.get('/wallet').then(r => setWalletBalance(r.data.balance_naira || 0)).catch(() => {})
  }, [])

  const filtered = SERVICES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleBuy() {
    if (!selected) return
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/email-orders', {
        service:         selected.code,
        service_name:    selected.name,
        idempotency_key: crypto.randomUUID(),
      })
      setConfirm(false)
      setSelected(null)
      setActiveOrder(res.data.order)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (activeOrder) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <ActiveOrder order={activeOrder} onDone={() => setActiveOrder(null)} colors={colors} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Confirm modal */}
      {confirm && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: colors.text, margin: 0 }}>Confirm Email OTP</h3>
              <button onClick={() => { setConfirm(false); setSelected(null) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: colors.textMuted }}><X size={18} /></button>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
              </div>
            )}

            <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <ServiceIcon name={selected.name} color={selected.color} />
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: 0 }}>{selected.name}</p>
                  <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>Email Verification</p>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: colors.textMuted }}>Price</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#16A34A' }}>
                  {price !== null ? `₦${price.toLocaleString()}` : '…'}
                </span>
              </div>
            </div>

            {price !== null && walletBalance < price && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>Insufficient balance. Current: ₦{walletBalance.toLocaleString()}</p>
              </div>
            )}

            <p style={{ fontSize: 12, color: colors.textMuted, margin: '0 0 20px', lineHeight: 1.6 }}>
              A temporary email address will be generated instantly. Enter it into {selected.name}'s sign-up page — the code arrives automatically.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setConfirm(false); setSelected(null) }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={handleBuy} disabled={loading || price === null || walletBalance < (price ?? 0)} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Generating…' : 'Get Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', letterSpacing: '.08em', textTransform: 'uppercase' }}>Email OTP</span>
        <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: colors.text, margin: '6px 0 10px', letterSpacing: '-1px' }}>Temp email, real codes.</h1>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: '0 0 4px' }}>
          Get a disposable email address · verify any app · code delivered instantly
        </p>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>
          Wallet: <strong style={{ color: '#16A34A' }}>₦{walletBalance.toLocaleString()}</strong>
          {price !== null && <span style={{ marginLeft: 12 }}>· Price per email: <strong style={{ color: colors.text }}>₦{price.toLocaleString()}</strong></span>}
        </p>
      </div>

      {/* How it works strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { step: '1', label: 'Pick a service', icon: '🎯' },
          { step: '2', label: 'Get a temp email', icon: '📧' },
          { step: '3', label: 'Code arrives instantly', icon: '⚡' },
        ].map(s => (
          <div key={s.step} style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', margin: '0 0 2px' }}>Step {s.step}</p>
            <p style={{ fontSize: 12, color: colors.text, margin: 0, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
        <input className="input" style={{ paddingLeft: 46, fontSize: 15, height: 50, borderRadius: 12 }} placeholder="Search Google, Facebook, TikTok…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Service grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
        {filtered.map(service => (
          <div key={service.code}
            onClick={() => { setSelected(service); setConfirm(true); setError('') }}
            style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color .15s, transform .12s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = service.color + '88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <ServiceIcon name={service.name} color={service.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: colors.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.name}</p>
              <p style={{ fontSize: 12, color: '#16A34A', margin: '2px 0 0', fontWeight: 500 }}>● Available</p>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Mail size={11} /> Get email
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '56px 0' }}>
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>🔍</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: colors.text, margin: '0 0 8px' }}>No services found</p>
          <button className="btn-secondary" onClick={() => setSearch('')}>Clear search</button>
        </div>
      )}
    </div>
  )
}

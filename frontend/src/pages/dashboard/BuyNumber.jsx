import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, ShoppingCart, Check, X, ArrowRight, RefreshCw } from 'lucide-react'
import { useColors } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const CATEGORIES = ['All', 'Social', 'AI Apps', 'Finance', 'Shopping', 'Gaming']

const PINNED = [
  'whatsapp', 'telegram', 'tiktok', 'instagram', 'twitter',
  'facebook', 'google', 'discord', 'snapchat', 'linkedin',
]

// Map service codes to display categories and colors
const SERVICE_META = {
  whatsapp:  { category: 'Social',   color: '#25D366', name: 'WhatsApp' },
  telegram:  { category: 'Social',   color: '#2CA5E0', name: 'Telegram' },
  google:    { category: 'Social',   color: '#4285F4', name: 'Google / Gmail' },
  instagram: { category: 'Social',   color: '#E1306C', name: 'Instagram' },
  tiktok:    { category: 'Shopping', color: '#010101', name: 'TikTok' },
  twitter:   { category: 'Social',   color: '#1DA1F2', name: 'Twitter / X' },
  facebook:  { category: 'Social',   color: '#1877F2', name: 'Facebook' },
  discord:   { category: 'Social',   color: '#5865F2', name: 'Discord' },
  snapchat:  { category: 'Social',   color: '#FFFC00', name: 'Snapchat' },
  linkedin:  { category: 'Social',   color: '#0A66C2', name: 'LinkedIn' },
  amazon:    { category: 'Shopping', color: '#FF9900', name: 'Amazon' },
  uber:      { category: 'Shopping', color: '#000000', name: 'Uber' },
  paypal:    { category: 'Finance',  color: '#003087', name: 'PayPal' },
  airbnb:    { category: 'Shopping', color: '#FF5A5F', name: 'Airbnb' },
  netflix:   { category: 'Shopping', color: '#E50914', name: 'Netflix' },
  spotify:   { category: 'Shopping', color: '#1DB954', name: 'Spotify' },
  microsoft: { category: 'AI Apps',  color: '#00A4EF', name: 'Microsoft' },
  binance:   { category: 'Finance',  color: '#F3BA2F', name: 'Binance' },
  chatgpt:   { category: 'AI Apps',  color: '#10A37F', name: 'ChatGPT' },
  openai:    { category: 'AI Apps',  color: '#10A37F', name: 'OpenAI' },
  apple:     { category: 'AI Apps',  color: '#555555', name: 'Apple / iCloud' },
}

function getServiceMeta(code) {
  const key = code.toLowerCase()
  return SERVICE_META[key] || { category: 'Other', color: '#16A34A', name: code }
}

function ServiceAvatar({ code, name, color }) {
  const isDark = color === '#010101' || color === '#000000'
  return (
    <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: isDark ? '#1a1a1a' : color + '22', border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 20, fontWeight: 900, color: isDark ? '#fff' : color }}>{name[0]}</span>
    </div>
  )
}

function ConfirmModal({ service, country, onConfirm, onCancel, colors, walletBalance }) {
  const [ordering, setOrdering] = useState(false)
  const [error, setError]       = useState('')

  const priceNaira = Math.round(service.customer_price / 100)
  const hasBalance = walletBalance >= priceNaira

  async function handleBuy() {
    setError('')
    setOrdering(true)
    try {
      await onConfirm()
    } catch (e) {
      setError(e.message || 'Purchase failed. Please try again.')
      setOrdering(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: colors.text, margin: 0 }}>Confirm Purchase</h3>
          <button onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: colors.textMuted, padding: 2 }}><X size={18} /></button>
        </div>

        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}><p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p></div>}

        <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <ServiceAvatar code={service.code} name={service.name} color={service.color} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.text, margin: 0 }}>{service.name}</p>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{country.name}</p>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: colors.textMuted }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#16A34A' }}>₦{priceNaira.toLocaleString()}</span>
          </div>
        </div>

        {!hasBalance && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>Insufficient wallet balance. Current balance: ₦{walletBalance.toLocaleString()}</p>
          </div>
        )}

        <p style={{ fontSize: 12, color: colors.textMuted, margin: '0 0 20px', lineHeight: 1.6 }}>
          ₦{priceNaira.toLocaleString()} will be deducted from your wallet. A virtual number will be assigned instantly.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleBuy} disabled={ordering || !hasBalance} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            {ordering ? 'Processing…' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessScreen({ order, onReset, colors }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ width: 72, height: 72, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <Check size={32} color="#16A34A" />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: colors.text, margin: '0 0 8px' }}>Number Assigned!</h2>
      <p style={{ color: colors.textMuted, margin: '0 0 24px' }}>Your virtual number is ready. Check My Orders for the OTP.</p>
      <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 24, maxWidth: 360, margin: '0 auto 28px' }}>
        <p style={{ fontSize: 12, color: colors.textMuted, margin: '0 0 6px' }}>Order</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: colors.text, margin: '0 0 10px' }}>{order.id}</p>
        <p style={{ fontSize: 12, color: colors.textMuted, margin: '0 0 6px' }}>Assigned Number</p>
        <p style={{ fontSize: 26, fontWeight: 900, color: '#16A34A', fontFamily: 'monospace', margin: '0 0 14px' }}>{order.phone_number}</p>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: colors.textMuted, flexWrap: 'wrap' }}>
          <span>Service: <strong style={{ color: colors.text }}>{order.service_name}</strong></span>
          <span>Price: <strong style={{ color: colors.text }}>{order.formatted_price}</strong></span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={onReset}>Buy Another</button>
        <a href="/dashboard/orders" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          View Orders <ArrowRight size={14} />
        </a>
      </div>
    </div>
  )
}

export default function BuyNumber() {
  const colors        = useColors()
  const { user }      = useAuth()

  const [provider, setProvider]         = useState('fivesim')
  const [countries, setCountries]       = useState([])
  const [country, setCountry]           = useState(null)
  const [services, setServices]         = useState([])
  const [loadingC, setLoadingC]         = useState(false)
  const [loadingS, setLoadingS]         = useState(false)
  const [search, setSearch]             = useState('')
  const [category, setCategory]         = useState('All')
  const [showCountry, setShowCountry]   = useState(false)
  const [selected, setSelected]         = useState(null)
  const [confirm, setConfirm]           = useState(false)
  const [successOrder, setSuccessOrder] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)

  // Fetch wallet balance
  useEffect(() => {
    api.get('/wallet').then(r => setWalletBalance(r.data.balance_naira || 0)).catch(() => {})
  }, [])

  // Fetch countries when provider changes
  useEffect(() => {
    setLoadingC(true)
    setCountries([])
    setCountry(null)
    setServices([])
    api.get('/numbers/countries', { params: { provider } })
      .then(r => {
        const list = r.data.countries || []
        setCountries(list)
        if (list.length) setCountry(list[0])
      })
      .catch(() => {})
      .finally(() => setLoadingC(false))
  }, [provider])

  // Fetch services when country changes
  useEffect(() => {
    if (!country) return
    setLoadingS(true)
    setServices([])
    api.get('/numbers/services', { params: { provider, country: country.code } })
      .then(r => {
        const raw = r.data.services || []
        const enriched = raw.map(s => {
          const meta = getServiceMeta(s.code)
          return { ...s, name: meta.name || s.name, color: meta.color, category: meta.category }
        })
        setServices(enriched)
      })
      .catch(() => {})
      .finally(() => setLoadingS(false))
  }, [country, provider])

  const filtered = useMemo(() => {
    const results = services.filter(s => {
      const matchCat = category === 'All' || s.category === category
      const matchQ   = s.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchQ
    })
    return results.sort((a, b) => {
      const ai = PINNED.indexOf(a.code.toLowerCase())
      const bi = PINNED.indexOf(b.code.toLowerCase())
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [services, search, category])

  const handleConfirm = useCallback(async () => {
    const idempotencyKey = crypto.randomUUID()
    const res = await api.post('/orders', {
      provider,
      country:         country.code,
      service:         selected.code,
      service_name:    selected.name,
      idempotency_key: idempotencyKey,
    })
    setConfirm(false)
    setSuccessOrder(res.data.order)
    // Refresh wallet balance
    api.get('/wallet').then(r => setWalletBalance(r.data.balance_naira || 0)).catch(() => {})
  }, [provider, country, selected])

  if (successOrder) {
    return <SuccessScreen order={successOrder} onReset={() => { setSuccessOrder(null); setSelected(null) }} colors={colors} />
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {confirm && selected && country && (
        <ConfirmModal
          service={selected}
          country={country}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(false)}
          colors={colors}
          walletBalance={walletBalance}
        />
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', letterSpacing: '.08em', textTransform: 'uppercase' }}>All Services</span>
        <h1 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 900, color: colors.text, margin: '6px 0 10px', letterSpacing: '-1px' }}>Every app you can think of.</h1>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Wallet balance: <strong style={{ color: '#16A34A' }}>₦{walletBalance.toLocaleString()}</strong></p>
      </div>

      {/* Country selector */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowCountry(v => !v)} disabled={loadingC}
            style={{ background: colors.cardBg, border: `1.5px solid ${colors.border}`, borderRadius: 10, padding: '9px 18px', fontSize: 14, fontWeight: 600, color: colors.text, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loadingC ? <RefreshCw size={14} className="spin" /> : null}
            {country ? country.name : 'Select Country'}
            <span style={{ fontSize: 10, color: colors.textMuted }}>▼</span>
          </button>
          {showCountry && countries.length > 0 && (
            <div style={{ position: 'absolute', top: '110%', left: 0, background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 8, zIndex: 50, boxShadow: '0 16px 48px rgba(0,0,0,0.18)', minWidth: 240, maxHeight: 320, overflowY: 'auto' }}>
              {countries.map(c => (
                <button key={c.code} onClick={() => { setCountry(c); setShowCountry(false) }}
                  style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: country?.code === c.code ? colors.hoverBg : 'transparent', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 'auto' }}>{c.iso || c.code}</span>
                  {country?.code === c.code && <Check size={13} color="#16A34A" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }} />
        <input className="input" style={{ paddingLeft: 46, fontSize: 15, height: 50, borderRadius: 12 }} placeholder="Search WhatsApp, ChatGPT, TikTok…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '7px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${colors.pillBorder}`, background: category === cat ? colors.pillActiveBg : colors.pillBg, color: category === cat ? colors.pillActiveColor : colors.pillColor }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loadingS && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: colors.textMuted }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Loading services…</p>
        </div>
      )}

      {/* Service grid */}
      {!loadingS && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 10 }}>
          {filtered.slice(0, search ? filtered.length : 12).map(service => (
            <div key={service.code}
              style={{ background: colors.cardBg, border: `1px solid ${selected?.code === service.code ? service.color + '66' : colors.border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'all .18s', cursor: service.qty > 0 ? 'pointer' : 'default', opacity: service.qty > 0 ? 1 : 0.5 }}
              onClick={() => service.qty > 0 && setSelected(service)}
            >
              <ServiceAvatar code={service.code} name={service.name} color={service.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: colors.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.name}</p>
                <p style={{ fontSize: 12, color: service.qty > 0 ? '#16A34A' : colors.textMuted, margin: '2px 0 0', fontWeight: 500 }}>
                  {service.qty > 0 ? `● ${service.qty} available` : '○ Out of stock'}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.text, whiteSpace: 'nowrap' }}>
                  ₦{Math.round(service.customer_price / 100).toLocaleString()}
                </span>
                {service.qty > 0 && (
                  <button onClick={e => { e.stopPropagation(); setSelected(service); setConfirm(true) }}
                    style={{ background: 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                    <ShoppingCart size={12} /> Get number
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingS && filtered.length === 0 && services.length > 0 && (
        <div style={{ textAlign: 'center', padding: '56px 20px' }}>
          <p style={{ fontSize: 32, margin: '0 0 12px' }}>🔍</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: colors.text, margin: '0 0 6px' }}>No services found</p>
          <button className="btn-secondary" onClick={() => { setSearch(''); setCategory('All') }}>Clear filters</button>
        </div>
      )}

      {!loadingS && services.length === 0 && !loadingC && country && (
        <div style={{ textAlign: 'center', padding: '56px 20px' }}>
          <p style={{ fontSize: 14, color: colors.textMuted }}>No services available for this country. Try another.</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

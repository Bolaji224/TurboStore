import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Wallet, PhoneCall, ShoppingBag, Gift, Plus, ArrowRight,
  Copy, CheckCircle, Users, Clock, RefreshCw
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

const SERVICE_COLORS = {
  whatsapp: '#25D366', telegram: '#2CA5E0', google: '#4285F4',
  facebook: '#1877F2', instagram: '#E1306C', twitter: '#000',
  tiktok: '#010101', snapchat: '#FFFC00', discord: '#5865F2',
  amazon: '#FF9900', default: '#16A34A',
}

function serviceColor(s) { return SERVICE_COLORS[s?.toLowerCase()] ?? SERVICE_COLORS.default }

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    function calc() {
      const diff = new Date(expiresAt) - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  return remaining
}

function ActiveOrderCard({ order, isDark, border }) {
  const [copied, setCopied] = useState(false)
  const countdown = useCountdown(order.expires_at)
  const color = serviceColor(order.service)
  const hasOtp = order.status === 'otp_received' && order.otp

  function copyOTP() {
    navigator.clipboard.writeText(order.otp)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color }}>{(order.service_name || order.service)[0].toUpperCase()}</span>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{order.service_name || order.service}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace' }}>{order.phone_number}</p>
          </div>
        </div>
        <span className={`badge ${hasOtp ? 'badge-success' : 'badge-warning'}`}>
          {hasOtp ? '🟢 OTP Received' : '🟡 Waiting for OTP'}
        </span>
      </div>

      {hasOtp ? (
        <div style={{ background: isDark ? 'rgba(22,163,74,0.1)' : '#F0FDF4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Verification Code</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {order.otp.split('').map((d, i) => (
                <span key={i} style={{ width: 32, height: 38, background: isDark ? 'rgba(22,163,74,0.2)' : '#DCFCE7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#16A34A', fontFamily: 'monospace' }}>{d}</span>
              ))}
            </div>
          </div>
          <button onClick={copyOTP}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy OTP'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F59E0B' }}>
            <Clock size={13} />
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{countdown}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>remaining</span>
          </div>
          <Link to="/dashboard/orders" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>View Order →</Link>
        </div>
      )}
    </div>
  )
}

const ACTIVE_STATUSES = ['processing', 'waiting_for_otp', 'otp_received']

export default function Overview() {
  const { user }    = useAuth()
  const { isDark }  = useTheme()
  const navigate    = useNavigate()

  const [walletData,  setWalletData]  = useState(null)
  const [orders,      setOrders]      = useState([])
  const [ordersMeta,  setOrdersMeta]  = useState(null)
  const [recentTxns,  setRecentTxns]  = useState([])
  const [refStats,    setRefStats]    = useState(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/wallet'),
      api.get('/orders', { params: { per_page: 20 } }),
      api.get('/wallet/transactions', { params: { per_page: 5 } }),
      api.get('/referrals/stats'),
    ])
      .then(([w, o, t, r]) => {
        setWalletData(w.data)
        setOrders(o.data.orders ?? [])
        setOrdersMeta(o.data.meta ?? null)
        setRecentTxns((t.data.transactions ?? []).slice(0, 4))
        setRefStats(r.data.stats ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  const balanceNaira   = walletData ? Math.round(walletData.balance_naira ?? 0) : 0
  const activeOrders   = orders.filter(o => ACTIVE_STATUSES.includes(o.status))
  const totalOrders    = ordersMeta?.total ?? 0
  const freeNumbers    = refStats?.available_rewards ?? 0

  // Referral progress: pick closest referral from stats total
  const totalPurchases   = refStats?.total_eligible_purchases ?? 0
  const MILESTONE        = 10
  const currentWindow    = totalPurchases % MILESTONE
  const progressPct      = Math.round((currentWindow / MILESTONE) * 100)
  const purchasesToGo    = MILESTONE - currentWindow

  const border = isDark ? 'rgba(255,255,255,0.07)' : '#E8F5ED'

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--text-muted)' }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Loading dashboard…
      </div>
    )
  }

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
              {greeting}, {firstName} 👋
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>Ready to verify something?</p>
          </div>
          <Link to="/dashboard/buy-number" className="btn-primary" style={{ fontSize: 15, padding: '11px 24px', gap: 8 }}>
            <Plus size={16} /> Buy a Number
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Wallet */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Wallet Balance</p>
            <div style={{ width: 34, height: 34, background: isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} color="#16A34A" />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-1px' }}>
            ₦{balanceNaira.toLocaleString()}
          </p>
          <button onClick={() => navigate('/dashboard/wallet')} className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px', gap: 6 }}>
            <Plus size={12} /> Fund Wallet
          </button>
        </div>

        {/* Active orders */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Active Orders</p>
            <div style={{ width: 34, height: 34, background: isDark ? 'rgba(59,130,246,0.2)' : '#EFF6FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneCall size={16} color="#3B82F6" />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-1px' }}>{activeOrders.length}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px' }}>Currently active</p>
          <Link to="/dashboard/orders" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View Orders <ArrowRight size={12} />
          </Link>
        </div>

        {/* Total orders */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Total Orders</p>
            <div style={{ width: 34, height: 34, background: isDark ? 'rgba(139,92,246,0.2)' : '#F5F3FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={16} color="#8B5CF6" />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-1px' }}>{totalOrders}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px' }}>All time</p>
          <Link to="/dashboard/orders" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View History <ArrowRight size={12} />
          </Link>
        </div>

        {/* Free numbers */}
        <div className="card" style={{ padding: 20, background: isDark ? 'rgba(22,163,74,0.08)' : '#F0FDF4', borderColor: isDark ? 'rgba(22,163,74,0.2)' : '#DCFCE7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#16A34A', margin: 0, fontWeight: 600 }}>Free Numbers</p>
            <div style={{ width: 34, height: 34, background: isDark ? 'rgba(22,163,74,0.2)' : '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gift size={16} color="#16A34A" />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#16A34A', margin: '0 0 4px', letterSpacing: '-1px' }}>
            {freeNumbers > 0 ? `${freeNumbers} 🎁` : '0'}
          </p>
          <p style={{ fontSize: 12, color: isDark ? 'rgba(74,222,128,0.7)' : '#15803D', margin: '0 0 10px' }}>Referral reward{freeNumbers !== 1 ? 's' : ''}</p>
          <Link to="/dashboard/referrals" style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            {freeNumbers > 0 ? 'Use Reward' : 'Earn Rewards'} <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Active orders + Referral */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 24 }}>

        {/* Active orders list */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Active Orders</h3>
            <Link to="/dashboard/orders" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeOrders.length > 0
              ? activeOrders.slice(0, 3).map(order => (
                  <ActiveOrderCard key={order.id} order={order} isDark={isDark} border={border} />
                ))
              : (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 12px' }}>No active orders</p>
                  <Link to="/dashboard/buy-number" className="btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}>Buy Your First Number</Link>
                </div>
              )
            }
          </div>
        </div>

        {/* Referral progress */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 40, height: 40, background: isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎁</div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Earn a Free Number</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Referral rewards</p>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>
            Refer users to TurboStore and earn a free virtual number after every 10 successful purchases.
          </p>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Progress</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>{currentWindow} / {MILESTONE}</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #16A34A, #4ADE80)', borderRadius: 999, transition: 'width .6s ease' }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
              {currentWindow === 0 && totalPurchases === 0
                ? 'Invite friends to get started.'
                : `${purchasesToGo} more purchase${purchasesToGo !== 1 ? 's' : ''} to unlock your next reward.`}
            </p>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <Link to="/dashboard/referrals" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '10px 16px', gap: 6 }}>
              <Users size={14} /> Invite Friends →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Recent Transactions</h3>
          <Link to="/dashboard/transactions" style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
        </div>
        {recentTxns.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            No transactions yet. <Link to="/dashboard/wallet" style={{ color: '#16A34A', fontWeight: 600, textDecoration: 'none' }}>Fund your wallet</Link> to get started.
          </div>
        ) : (
          <div>
            {recentTxns.map((tx, i) => {
              const isCredit = tx.type === 'deposit' || tx.type === 'refund'
              const amountKobo = tx.amount ?? 0
              const amountNaira = Math.abs(amountKobo / 100)
              const formatted = `${isCredit ? '+' : '-'}₦${amountNaira.toLocaleString()}`
              const date = new Date(tx.created_at)
              const isToday = date.toDateString() === new Date().toDateString()
              const label = isToday
                ? `Today, ${date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}`
                : date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })

              return (
                <div key={tx.id ?? i} className="table-row" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isCredit ? (isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4') : (isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {isCredit ? '↙' : '↗'}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{tx.description}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{label}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: isCredit ? '#16A34A' : '#DC2626', whiteSpace: 'nowrap' }}>{formatted}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

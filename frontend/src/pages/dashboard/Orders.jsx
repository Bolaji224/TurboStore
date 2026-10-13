import { useState, useEffect, useCallback } from 'react'
import { Clock, Copy, PhoneCall, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const STATUS_CONFIG = {
  pending:         { label: 'Pending',         cls: 'badge-info' },
  processing:      { label: 'Processing',       cls: 'badge-info' },
  waiting_for_otp: { label: 'Waiting OTP',     cls: 'badge-warning' },
  otp_received:    { label: 'OTP Received',    cls: 'badge-success' },
  completed:       { label: 'Completed',        cls: 'badge-success' },
  cancelled:       { label: 'Cancelled',        cls: 'badge-danger' },
  expired:         { label: 'Expired',          cls: 'badge-danger' },
  failed:          { label: 'Failed',           cls: 'badge-danger' },
  refunded:        { label: 'Refunded',         cls: 'badge-info' },
}

function ExpiryCountdown({ expiresAt }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt) - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
      <Clock size={10} color="#F59E0B" />
      <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600 }}>Expires in {remaining}</span>
    </div>
  )
}

export default function Orders() {
  const [filter, setFilter]   = useState('all')
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res    = await api.get('/orders', { params })
      setOrders(res.data.orders || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  // Auto-refresh active orders every 10 seconds for OTP updates
  useEffect(() => {
    const hasActive = orders.some(o => ['waiting_for_otp', 'otp_received', 'processing'].includes(o.status))
    if (!hasActive) return
    const id = setInterval(fetchOrders, 10000)
    return () => clearInterval(id)
  }, [orders, fetchOrders])

  function copy(text, id) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  async function cancelOrder(ref) {
    if (!confirm('Cancel this order and get a refund?')) return
    try {
      await api.post(`/orders/${ref}/cancel`)
      fetchOrders()
    } catch (e) {
      alert(e.response?.data?.message || 'Cancel failed')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>My Orders</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>All your virtual number orders and OTP codes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '8px 12px' }}>
            <RefreshCw size={14} />
          </button>
          <Link to="/dashboard/buy-number" className="btn-primary">
            <PhoneCall size={15} /> Buy Number
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'waiting_for_otp', 'otp_received', 'completed', 'expired', 'refunded'].map(f => (
          <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Loading orders…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--section-alt)' }}>
                  {['Service', 'Number', 'OTP Code', 'Status', 'Price', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const sc = STATUS_CONFIG[order.status] || { label: order.status, cls: '' }
                  const isActive = ['waiting_for_otp', 'processing'].includes(order.status)
                  return (
                    <tr key={order.id} className="table-row">
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, background: '#16A34A18', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#16A34A' }}>{order.service_name[0]}</span>
                          </div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{order.service_name}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{order.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {order.phone_number ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: 'var(--text)' }}>{order.phone_number}</span>
                            <button onClick={() => copy(order.phone_number, order.id + 'num')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: copied === order.id + 'num' ? '#16A34A' : 'var(--text-muted)' }}>
                              <Copy size={12} />
                            </button>
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {order.otp ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: '#16A34A', letterSpacing: '0.1em' }}>{order.otp}</span>
                            <button onClick={() => copy(order.otp, order.id + 'otp')}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 2, color: copied === order.id + 'otp' ? '#16A34A' : 'var(--text-muted)' }}>
                              <Copy size={12} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            {isActive ? <span style={{ color: '#F59E0B' }}>Waiting…</span> : '—'}
                          </span>
                        )}
                        {isActive && order.expires_at && <ExpiryCountdown expiresAt={order.expires_at} />}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className={`badge ${sc.cls}`}>{sc.label}</span>
                          {isActive && (
                            <button onClick={() => cancelOrder(order.id)}
                              style={{ fontSize: 10, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}>
                              Cancel & Refund
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{order.formatted_price}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 12px' }}>No orders found.</p>
              <Link to="/dashboard/buy-number" className="btn-primary">Buy your first number</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

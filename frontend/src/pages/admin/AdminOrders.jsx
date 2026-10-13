import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, XCircle, Eye } from 'lucide-react'
import adminApi from '../../services/adminApi'

const STATUS_COLORS = {
  processing:      '#F59E0B',
  waiting_for_otp: '#3B82F6',
  otp_received:    '#22C55E',
  cancelled:       '#EF4444',
  expired:         '#6B7280',
  completed:       '#22C55E',
  failed:          '#EF4444',
  refunded:        '#8B5CF6',
}

function fmt(kobo) { return '₦' + Math.round(kobo / 100).toLocaleString() }
function dateStr(iso) { return iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }

const STATUSES = ['processing', 'waiting_for_otp', 'otp_received', 'cancelled', 'expired', 'completed', 'failed', 'refunded']

export default function AdminOrders() {
  const [orders, setOrders]   = useState([])
  const [meta, setMeta]       = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [page, setPage]       = useState(1)
  const [selected, setSelected] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 20, search: search || undefined, status: status || undefined }
      const { data } = await adminApi.get('/orders', { params })
      setOrders(data.orders)
      setMeta(data.meta)
    } catch { setError('Failed to load orders.') }
    finally { setLoading(false) }
  }, [page, search, status])

  useEffect(() => { load() }, [load])

  async function cancelOrder(order) {
    if (!window.confirm(`Cancel order ${order.reference}?`)) return
    setCancelling(true)
    try {
      const { data } = await adminApi.post(`/orders/${order.id}/cancel`)
      setOrders(prev => prev.map(o => o.id === order.id ? data.order : o))
      if (selected?.id === order.id) setSelected(data.order)
    } catch (err) { alert(err.response?.data?.message || 'Failed to cancel order.') }
    finally { setCancelling(false) }
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <Search size={14} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Reference, phone, user…"
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: '#161B26', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          style={{ padding: '9px 12px', background: '#161B26', border: '1px solid #1E2736', borderRadius: 8, color: status ? '#E2E8F0' : '#475569', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        {meta.total !== undefined && <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>{meta.total.toLocaleString()} orders</span>}
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>
        {/* Table */}
        <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E2736' }}>
                  {['Reference', 'User', 'Service', 'Phone', 'Status', 'Price', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center' }}>
                    <div style={{ width: 24, height: 24, border: '2px solid #1E2736', borderTop: '2px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  </td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No orders found.</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id}
                    onClick={() => setSelected(s => s?.id === o.id ? null : o)}
                    style={{ borderBottom: '1px solid #1E2736', cursor: 'pointer', background: selected?.id === o.id ? '#1A2135' : 'transparent', transition: 'background .12s' }}
                    onMouseEnter={e => { if (selected?.id !== o.id) e.currentTarget.style.background = '#1A2135' }}
                    onMouseLeave={e => { if (selected?.id !== o.id) e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: '#94A3B8', fontSize: 12, whiteSpace: 'nowrap' }}>{o.reference}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#E2E8F0', margin: 0, whiteSpace: 'nowrap' }}>{o.user?.name || '—'}</p>
                      <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{o.user?.email || ''}</p>
                    </td>
                    <td style={{ padding: '11px 14px', color: '#94A3B8', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{o.service_name}</td>
                    <td style={{ padding: '11px 14px', color: '#94A3B8', fontFamily: 'monospace', fontSize: 12 }}>{o.phone_number || '—'}</td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ color: STATUS_COLORS[o.status] ?? '#64748B', fontWeight: 600 }}>{o.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ padding: '11px 14px', color: '#E2E8F0', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(o.customer_price)}</td>
                    <td style={{ padding: '11px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>{dateStr(o.created_at)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <button onClick={e => { e.stopPropagation(); setSelected(s => s?.id === o.id ? null : o) }}
                        style={{ padding: '4px 10px', border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', color: '#94A3B8', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta.last_page > 1 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #1E2736', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#475569' }}>Page {meta.current_page} of {meta.last_page}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  style={{ width: 32, height: 32, border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#334155' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={14} />
                </button>
                <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}
                  style={{ width: 32, height: 32, border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', cursor: page >= meta.last_page ? 'not-allowed' : 'pointer', color: page >= meta.last_page ? '#334155' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 84 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1E2736', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Order Detail</p>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', display: 'flex', padding: 2 }}>×</button>
            </div>
            <div style={{ padding: 18 }}>
              {[
                ['Reference',  selected.reference],
                ['Status',     selected.status.replace(/_/g,' ')],
                ['Provider',   selected.provider],
                ['Service',    selected.service_name],
                ['Country',    selected.country],
                ['Phone',      selected.phone_number || '—'],
                ['OTP',        selected.otp || '—'],
                ['Price',      fmt(selected.customer_price)],
                ['User',       selected.user?.email || '—'],
                ['Created',    dateStr(selected.created_at)],
                ['Expires',    dateStr(selected.expires_at)],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E2736' }}>
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 600, textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{val}</span>
                </div>
              ))}
              {['processing', 'waiting_for_otp'].includes(selected.status) && (
                <button onClick={() => cancelOrder(selected)} disabled={cancelling}
                  style={{ width: '100%', marginTop: 14, padding: '9px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: cancelling ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <XCircle size={14} /> {cancelling ? 'Cancelling…' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

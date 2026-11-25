import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import adminApi from '../../services/adminApi'

const spinStyle = {
  border: '3px solid #1E2736', borderTop: '3px solid #16A34A',
  borderRadius: '50%', width: 28, height: 28,
  animation: 'spin 0.8s linear infinite',
}

function fmt(kobo) {
  return '₦' + Math.round(kobo / 100).toLocaleString('en-NG')
}

function dateStr(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLES = {
  paid:        { bg: 'rgba(59,130,246,0.12)',  border: '#3B82F644', color: '#3B82F6' },
  in_progress: { bg: 'rgba(245,158,11,0.12)',  border: '#F59E0B44', color: '#F59E0B' },
  delivered:   { bg: 'rgba(245,158,11,0.12)',  border: '#F59E0B44', color: '#F59E0B' },
  completed:   { bg: 'rgba(34,197,94,0.12)',   border: '#22C55E44', color: '#22C55E' },
  disputed:    { bg: 'rgba(239,68,68,0.12)',   border: '#EF444444', color: '#EF4444' },
  cancelled:   { bg: 'rgba(100,116,139,0.12)', border: '#64748B44', color: '#64748B' },
  refunded:    { bg: 'rgba(100,116,139,0.12)', border: '#64748B44', color: '#64748B' },
}

const STATUS_TABS = ['all', 'paid', 'in_progress', 'delivered', 'completed', 'disputed', 'cancelled', 'refunded']

export default function AdminMarketplaceOrders() {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [status,   setStatus]   = useState('all')
  const [page,     setPage]     = useState(1)
  const [meta,     setMeta]     = useState({ current_page: 1, last_page: 1, total: 0 })
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async (s, p) => {
    setLoading(true); setError('')
    try {
      const params = { page: p, per_page: 20 }
      if (s !== 'all') params.status = s
      const { data } = await adminApi.get('/marketplace/orders', { params })
      setOrders(data.data || [])
      setMeta(data.meta || { current_page: 1, last_page: 1, total: 0 })
    } catch { setError('Failed to load orders.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(status, page) }, [load, status, page])

  async function deleteOrder(id) {
    if (!window.confirm('Delete this order? This cannot be undone.')) return
    setDeleting(id)
    try {
      await adminApi.delete(`/marketplace/orders/${id}`)
      load(status, page)
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_TABS.map(s => (
          <button key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            style={{
              padding: '5px 14px', borderRadius: 20, border: '1px solid',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              borderColor: status === s ? '#16A34A' : '#1E2736',
              background:  status === s ? 'rgba(22,163,74,0.15)' : 'transparent',
              color:       status === s ? '#4ADE80' : '#64748B',
            }}>
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B', alignSelf: 'center' }}>
          {meta.total} total
        </span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div style={spinStyle} /></div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B', fontSize: 14 }}>No orders found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => {
            const ss = STATUS_STYLES[order.status] || { bg: 'transparent', border: '#1E2736', color: '#94A3B8' }
            const canDelete = ['completed', 'cancelled', 'refunded'].includes(order.status)
            return (
              <div key={order.id} style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace' }}>{order.reference}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: ss.bg, border: `1px solid ${ss.border}`, color: ss.color }}>
                        {order.status?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 2px' }}>
                      Service: <span style={{ color: '#CBD5E1' }}>{order.service?.title || '—'}</span>
                    </p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                      Buyer: {order.user?.name || '—'} · Vendor: {order.vendor?.user?.name || '—'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#4ADE80', margin: '0 0 2px' }}>{fmt(order.price_kobo || 0)}</p>
                      <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{dateStr(order.created_at)}</p>
                    </div>
                    {canDelete && (
                      <button
                        disabled={deleting === order.id}
                        onClick={() => deleteOrder(order.id)}
                        style={{ padding: '6px 10px', border: '1px solid #EF4444', borderRadius: 8, background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', opacity: deleting === order.id ? 0.5 : 1 }}>
                        <Trash2 size={13} />
                        {deleting === order.id ? '…' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '7px 14px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontFamily: 'inherit', opacity: page <= 1 ? 0.4 : 1 }}>
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontSize: 13, color: '#64748B' }}>Page {page} of {meta.last_page}</span>
          <button
            disabled={page >= meta.last_page}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '7px 14px', border: '1px solid #16A34A', borderRadius: 8, background: 'rgba(22,163,74,0.12)', color: '#4ADE80', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontFamily: 'inherit', opacity: page >= meta.last_page ? 0.4 : 1 }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

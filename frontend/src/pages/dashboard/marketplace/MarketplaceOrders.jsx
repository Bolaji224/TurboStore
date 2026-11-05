import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { RefreshCw, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../../services/api'

const STATUS_CONFIG = {
  paid:        { label: 'Paid',        cls: 'badge-info' },
  in_progress: { label: 'In Progress', cls: 'badge-warning' },
  delivered:   { label: 'Delivered',   cls: 'badge-warning' },
  completed:   { label: 'Completed',   cls: 'badge-success' },
  disputed:    { label: 'Disputed',    cls: 'badge-danger' },
  cancelled:   { label: 'Cancelled',   cls: 'badge-danger' },
  refunded:    { label: 'Refunded',    cls: 'badge-danger' },
}

function formatNaira(kobo) {
  return '₦' + Math.round(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_FILTERS = [
  { key: 'all',         label: 'All' },
  { key: 'paid',        label: 'Paid' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'delivered',   label: 'Delivered' },
  { key: 'completed',   label: 'Completed' },
  { key: 'disputed',    label: 'Disputed' },
  { key: 'cancelled',   label: 'Cancelled' },
]

export default function MarketplaceOrders() {
  const navigate = useNavigate()

  const [orders,     setOrders]     = useState([])
  const [stats,      setStats]      = useState({})
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, ...(filter !== 'all' && { status: filter }) }
      const res    = await api.get('/marketplace/orders', { params })
      setOrders(res.data.orders || res.data.data || [])
      setTotalPages(res.data.last_page || res.data.meta?.last_page || 1)
      if (res.data.stats) setStats(res.data.stats)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  function handleFilter(key) {
    setFilter(key)
    setPage(1)
  }

  const STAT_CHIPS = [
    { label: 'Total',       value: stats.total || 0,       color: '#64748B' },
    { label: 'Pending',     value: stats.paid || 0,        color: '#3B82F6' },
    { label: 'In Progress', value: stats.in_progress || 0, color: '#F59E0B' },
    { label: 'Completed',   value: stats.completed || 0,   color: '#16A34A' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>My Marketplace Orders</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Track all your social media service orders</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '8px 12px' }}>
            <RefreshCw size={14} />
          </button>
          <Link to="/dashboard/marketplace" className="btn-primary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <ShoppingBag size={14} /> Browse Services
          </Link>
        </div>
      </div>

      {/* Stats chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {STAT_CHIPS.map(chip => (
          <div key={chip.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{chip.label}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: chip.color }}>{chip.value}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn${filter === f.key ? ' active' : ''}`}
            onClick={() => handleFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr 80px', gap: 0, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--section-alt)' }}>
          {['Order Ref', 'Service', 'Vendor', 'Status', 'Amount', 'Date', 'Actions'].map(col => (
            <span key={col} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{col}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <ShoppingBag size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>No orders found</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              {filter === 'all' ? 'You haven\'t placed any orders yet.' : `No ${filter.replace('_', ' ')} orders found.`}
            </p>
            <Link to="/dashboard/marketplace" className="btn-primary" style={{ fontSize: 13, textDecoration: 'none' }}>Browse Services</Link>
          </div>
        ) : (
          orders.map(order => {
            const sc = STATUS_CONFIG[order.status] || { label: order.status, cls: 'badge-info' }
            return (
              <div
                key={order.id}
                className="table-row"
                style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr 80px', gap: 0, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid var(--border)', cursor: 'default' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>
                  {order.reference || order.id}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                  {order.service_title || order.service?.title || '—'}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {order.vendor_name || order.vendor?.business_name || '—'}
                </span>
                <span>
                  <span className={`badge ${sc.cls}`}>{sc.label}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {formatNaira(order.amount_kobo || order.price_kobo || 0)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatDate(order.created_at)}
                </span>
                <div>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={() => navigate(`/dashboard/marketplace/orders/${order.reference || order.id}`)}>
                    View
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button
            className="btn-secondary"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button
            className="btn-primary"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Responsive scroll */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 2fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

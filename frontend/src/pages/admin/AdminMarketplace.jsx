import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Clock, Package, AlertCircle, ShoppingCart,
  TrendingUp, AlertTriangle, ChevronRight, Plus, Trash2
} from 'lucide-react'
import adminApi from '../../services/adminApi'

const PLATFORMS = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'general']
const PLATFORM_ICONS = { facebook: '📘', instagram: '📸', twitter: '🐦', tiktok: '🎵', youtube: '▶️', general: '🛒' }

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

const PLATFORM_COLORS = {
  facebook: '#1877F2', instagram: '#E1306C', twitter: '#1DA1F2',
  tiktok: '#010101', youtube: '#FF0000', general: '#64748B',
}

export default function AdminMarketplace() {
  const [stats, setStats]             = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError]   = useState('')

  const [vendors, setVendors]         = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(true)
  const [vendorsError, setVendorsError] = useState('')

  const [services, setServices]           = useState([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState('')

  const [liveServices, setLiveServices]   = useState([])
  const [liveLoading, setLiveLoading]     = useState(true)

  const [categories, setCategories]   = useState([])
  const [catLoading, setCatLoading]   = useState(true)
  const [newCat, setNewCat]           = useState({ name: '', platform: 'general' })
  const [catSaving, setCatSaving]     = useState(false)

  // Inline reject reason state: { id, type: 'vendor'|'service', value }
  const [rejectPrompt, setRejectPrompt] = useState(null)
  const [actionLoading, setActionLoading] = useState({}) // key: `${type}-${id}-${action}`

  const loadStats = useCallback(async () => {
    setStatsLoading(true); setStatsError('')
    try {
      const { data } = await adminApi.get('/marketplace/stats')
      setStats(data)
    } catch { setStatsError('Failed to load stats.') }
    finally { setStatsLoading(false) }
  }, [])

  const loadVendors = useCallback(async () => {
    setVendorsLoading(true); setVendorsError('')
    try {
      const { data } = await adminApi.get('/marketplace/vendors', { params: { status: 'pending', per_page: 5 } })
      setVendors(data.vendors || data.data || [])
    } catch { setVendorsError('Failed to load vendors.') }
    finally { setVendorsLoading(false) }
  }, [])

  const loadServices = useCallback(async () => {
    setServicesLoading(true); setServicesError('')
    try {
      const { data } = await adminApi.get('/marketplace/services', { params: { status: 'pending_review', per_page: 5 } })
      setServices(data.services || data.data || [])
    } catch { setServicesError('Failed to load services.') }
    finally { setServicesLoading(false) }
  }, [])

  const loadLiveServices = useCallback(async () => {
    setLiveLoading(true)
    try {
      const { data } = await adminApi.get('/marketplace/services', { params: { status: 'approved', per_page: 50 } })
      setLiveServices(data.services || data.data || [])
    } catch {}
    finally { setLiveLoading(false) }
  }, [])

  const loadCategories = useCallback(async () => {
    setCatLoading(true)
    try {
      const { data } = await adminApi.get('/marketplace/categories')
      setCategories(data.data || [])
    } catch {}
    finally { setCatLoading(false) }
  }, [])

  useEffect(() => { loadStats(); loadVendors(); loadServices(); loadCategories(); loadLiveServices() }, [loadStats, loadVendors, loadServices, loadCategories, loadLiveServices])

  function setLoading(key, val) {
    setActionLoading(prev => ({ ...prev, [key]: val }))
  }

  async function approveVendor(id) {
    const key = `vendor-${id}-approve`
    setLoading(key, true)
    try {
      await adminApi.post(`/marketplace/vendors/${id}/approve`)
      await Promise.all([loadVendors(), loadStats()])
    } catch (err) { alert(err.response?.data?.message || 'Action failed') }
    finally { setLoading(key, false) }
  }

  async function rejectVendor(id, reason) {
    const key = `vendor-${id}-reject`
    setLoading(key, true)
    setRejectPrompt(null)
    try {
      await adminApi.post(`/marketplace/vendors/${id}/reject`, { reason })
      await Promise.all([loadVendors(), loadStats()])
    } catch (err) { alert(err.response?.data?.message || 'Action failed') }
    finally { setLoading(key, false) }
  }

  async function approveService(id) {
    const key = `service-${id}-approve`
    setLoading(key, true)
    try {
      await adminApi.post(`/marketplace/services/${id}/approve`)
      await Promise.all([loadServices(), loadStats()])
    } catch (err) { alert(err.response?.data?.message || 'Action failed') }
    finally { setLoading(key, false) }
  }

  async function rejectService(id, reason) {
    const key = `service-${id}-reject`
    setLoading(key, true)
    setRejectPrompt(null)
    try {
      await adminApi.post(`/marketplace/services/${id}/reject`, { reason })
      await Promise.all([loadServices(), loadStats()])
    } catch (err) { alert(err.response?.data?.message || 'Action failed') }
    finally { setLoading(key, false) }
  }

  async function deleteService(id) {
    if (!confirm('Permanently delete this approved service? This cannot be undone.')) return
    try {
      await adminApi.delete(`/marketplace/services/${id}`)
      await Promise.all([loadLiveServices(), loadStats()])
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete service') }
  }

  async function createCategory() {
    if (!newCat.name.trim()) return
    setCatSaving(true)
    try {
      await adminApi.post('/marketplace/categories', newCat)
      setNewCat({ name: '', platform: 'general' })
      loadCategories()
    } catch (err) { alert(err.response?.data?.message || 'Failed to create category') }
    finally { setCatSaving(false) }
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category?')) return
    try {
      await adminApi.delete(`/marketplace/categories/${id}`)
      loadCategories()
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete') }
  }

  const statCards = stats ? [
    { label: 'Total Vendors',    value: stats.total_vendors,    icon: Briefcase,     color: '#3B82F6',  highlight: false },
    { label: 'Pending Approval', value: stats.pending_vendors,  icon: Clock,         color: '#F59E0B',  highlight: stats.pending_vendors > 0 },
    { label: 'Live Services',    value: stats.total_services,   icon: Package,       color: '#16A34A',  highlight: false },
    { label: 'Pending Review',   value: stats.pending_services, icon: AlertCircle,   color: '#F59E0B',  highlight: stats.pending_services > 0 },
    { label: 'Total Orders',     value: stats.total_orders,     icon: ShoppingCart,  color: '#8B5CF6',  highlight: false },
    { label: 'Total Revenue',    value: fmt(stats.total_revenue_kobo ?? 0), icon: TrendingUp, color: '#16A34A', highlight: false, isString: true },
    { label: 'Open Disputes',    value: stats.pending_disputes, icon: AlertTriangle, color: '#EF4444',  highlight: stats.pending_disputes > 0 },
  ] : []

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Stats */}
      {statsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div style={spinStyle} />
        </div>
      ) : statsError ? (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: '#EF4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          {statsError}
          <button onClick={loadStats} style={{ marginLeft: 'auto', padding: '4px 10px', border: '1px solid #EF4444', borderRadius: 6, background: 'transparent', color: '#EF4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <div key={card.label} style={{
                background: card.highlight ? `rgba(${card.color === '#F59E0B' ? '245,158,11' : '239,68,68'},0.08)` : '#161B26',
                border: `1px solid ${card.highlight ? card.color + '44' : '#1E2736'}`,
                borderRadius: 12, padding: '16px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: card.color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={card.color} />
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{card.label}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: card.highlight ? card.color : '#E2E8F0', margin: 0 }}>
                  {card.isString ? card.value : (card.value ?? 0).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Two-column content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Pending Vendors */}
        <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E2736', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>Pending Vendor Applications</h3>
            <Link to="/admin/marketplace/vendors" style={{ fontSize: 12, color: '#4ADE80', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              View All <ChevronRight size={13} />
            </Link>
          </div>

          {vendorsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div style={spinStyle} /></div>
          ) : vendorsError ? (
            <div style={{ padding: 20, color: '#EF4444', fontSize: 13 }}>{vendorsError} <button onClick={loadVendors} style={{ marginLeft: 8, color: '#4ADE80', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button></div>
          ) : vendors.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>No pending applications</div>
          ) : (
            <div>
              {vendors.map(v => (
                <div key={v.id}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E2736' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.business_name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>{v.user?.email || v.email || '—'}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#475569' }}>Applied {dateStr(v.created_at)}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          disabled={actionLoading[`vendor-${v.id}-approve`]}
                          onClick={() => approveVendor(v.id)}
                          style={{ padding: '5px 10px', border: '1px solid #16A34A', borderRadius: 6, background: 'rgba(22,163,74,0.12)', color: '#4ADE80', fontSize: 11, fontWeight: 600, cursor: actionLoading[`vendor-${v.id}-approve`] ? 'not-allowed' : 'pointer', opacity: actionLoading[`vendor-${v.id}-approve`] ? 0.6 : 1, fontFamily: 'inherit' }}>
                          {actionLoading[`vendor-${v.id}-approve`] ? '…' : 'Approve'}
                        </button>
                        <button
                          disabled={actionLoading[`vendor-${v.id}-reject`]}
                          onClick={() => setRejectPrompt({ id: v.id, type: 'vendor', value: '' })}
                          style={{ padding: '5px 10px', border: '1px solid #EF4444', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: actionLoading[`vendor-${v.id}-reject`] ? 0.6 : 1, fontFamily: 'inherit' }}>
                          Reject
                        </button>
                      </div>
                    </div>
                    {/* Inline reject reason */}
                    {rejectPrompt?.id === v.id && rejectPrompt?.type === 'vendor' && (
                      <div style={{ marginTop: 10, padding: 12, background: '#0D1117', borderRadius: 8, border: '1px solid #1E2736' }}>
                        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#94A3B8' }}>Rejection reason:</p>
                        <textarea
                          rows={3}
                          value={rejectPrompt.value}
                          onChange={e => setRejectPrompt(p => ({ ...p, value: e.target.value }))}
                          placeholder="Enter reason…"
                          style={{ width: '100%', background: '#161B26', border: '1px solid #1E2736', borderRadius: 6, color: '#E2E8F0', fontSize: 12, padding: 8, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button
                            disabled={!rejectPrompt.value.trim() || actionLoading[`vendor-${v.id}-reject`]}
                            onClick={() => rejectVendor(v.id, rejectPrompt.value)}
                            style={{ padding: '5px 12px', border: '1px solid #EF4444', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!rejectPrompt.value.trim() || actionLoading[`vendor-${v.id}-reject`]) ? 0.5 : 1 }}>
                            {actionLoading[`vendor-${v.id}-reject`] ? 'Rejecting…' : 'Confirm Reject'}
                          </button>
                          <button onClick={() => setRejectPrompt(null)} style={{ padding: '5px 12px', border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', color: '#64748B', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Services */}
        <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E2736', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>Services Pending Review</h3>
            <Link to="/admin/marketplace/services" style={{ fontSize: 12, color: '#4ADE80', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              View All <ChevronRight size={13} />
            </Link>
          </div>

          {servicesLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div style={spinStyle} /></div>
          ) : servicesError ? (
            <div style={{ padding: 20, color: '#EF4444', fontSize: 13 }}>{servicesError} <button onClick={loadServices} style={{ marginLeft: 8, color: '#4ADE80', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button></div>
          ) : services.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>No services pending review</div>
          ) : (
            <div>
              {services.map(s => {
                const platform = s.platform || 'general'
                const platformColor = PLATFORM_COLORS[platform] || '#64748B'
                return (
                  <div key={s.id}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E2736' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: platformColor, background: platformColor + '1A', border: `1px solid ${platformColor}33`, borderRadius: 4, padding: '1px 6px', textTransform: 'capitalize' }}>{platform}</span>
                            <span style={{ fontSize: 11, color: '#64748B' }}>{s.vendor?.business_name || '—'}</span>
                          </div>
                          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#4ADE80', fontWeight: 600 }}>
                            {fmt(s.price_kobo ?? (s.price ?? 0) * 100)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            disabled={actionLoading[`service-${s.id}-approve`]}
                            onClick={() => approveService(s.id)}
                            style={{ padding: '5px 10px', border: '1px solid #16A34A', borderRadius: 6, background: 'rgba(22,163,74,0.12)', color: '#4ADE80', fontSize: 11, fontWeight: 600, cursor: actionLoading[`service-${s.id}-approve`] ? 'not-allowed' : 'pointer', opacity: actionLoading[`service-${s.id}-approve`] ? 0.6 : 1, fontFamily: 'inherit' }}>
                            {actionLoading[`service-${s.id}-approve`] ? '…' : 'Approve'}
                          </button>
                          <button
                            disabled={actionLoading[`service-${s.id}-reject`]}
                            onClick={() => setRejectPrompt({ id: s.id, type: 'service', value: '' })}
                            style={{ padding: '5px 10px', border: '1px solid #EF4444', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: actionLoading[`service-${s.id}-reject`] ? 0.6 : 1, fontFamily: 'inherit' }}>
                            Reject
                          </button>
                        </div>
                      </div>
                      {/* Inline reject reason */}
                      {rejectPrompt?.id === s.id && rejectPrompt?.type === 'service' && (
                        <div style={{ marginTop: 10, padding: 12, background: '#0D1117', borderRadius: 8, border: '1px solid #1E2736' }}>
                          <p style={{ margin: '0 0 6px', fontSize: 12, color: '#94A3B8' }}>Rejection reason:</p>
                          <textarea
                            rows={3}
                            value={rejectPrompt.value}
                            onChange={e => setRejectPrompt(p => ({ ...p, value: e.target.value }))}
                            placeholder="Enter reason…"
                            style={{ width: '100%', background: '#161B26', border: '1px solid #1E2736', borderRadius: 6, color: '#E2E8F0', fontSize: 12, padding: 8, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button
                              disabled={!rejectPrompt.value.trim() || actionLoading[`service-${s.id}-reject`]}
                              onClick={() => rejectService(s.id, rejectPrompt.value)}
                              style={{ padding: '5px 12px', border: '1px solid #EF4444', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!rejectPrompt.value.trim() || actionLoading[`service-${s.id}-reject`]) ? 0.5 : 1 }}>
                              {actionLoading[`service-${s.id}-reject`] ? 'Rejecting…' : 'Confirm Reject'}
                            </button>
                            <button onClick={() => setRejectPrompt(null)} style={{ padding: '5px 12px', border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', color: '#64748B', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Live (Approved) Services ── */}
      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden', marginTop: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E2736', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>Live Services</h3>
          <span style={{ fontSize: 12, color: '#64748B' }}>{liveServices.length} approved</span>
        </div>
        {liveLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div style={spinStyle} /></div>
        ) : liveServices.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>No approved services yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E2736' }}>
                  {['Service', 'Vendor', 'Platform', 'Price', 'Orders', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveServices.map(s => {
                  const platformColor = PLATFORM_COLORS[s.platform] || '#64748B'
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #1E2736' }}>
                      <td style={{ padding: '11px 16px', maxWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {s.image_url
                            ? <img src={s.image_url} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                            : <div style={{ width: 36, height: 36, background: platformColor + '1A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{PLATFORM_ICONS[s.platform] || '🛒'}</div>
                          }
                          <span style={{ color: '#E2E8F0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{s.vendor?.business_name || '—'}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: platformColor, background: platformColor + '1A', border: `1px solid ${platformColor}33`, borderRadius: 4, padding: '2px 8px', textTransform: 'capitalize' }}>{s.platform || 'general'}</span>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#4ADE80', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(s.starting_price_kobo ?? 0)}</td>
                      <td style={{ padding: '11px 16px', color: '#64748B' }}>{s.order_count ?? 0}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <button
                          onClick={() => deleteService(s.id)}
                          style={{ padding: '5px 10px', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 6, background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Categories ── */}
      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: 20, marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: '0 0 16px' }}>Service Categories</h3>

        {/* Add form */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={newCat.name}
            onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
            placeholder="Category name…"
            onKeyDown={e => e.key === 'Enter' && createCategory()}
            style={{ flex: '1 1 180px', padding: '7px 12px', background: '#0F1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
          />
          <select
            value={newCat.platform}
            onChange={e => setNewCat(p => ({ ...p, platform: e.target.value }))}
            style={{ flex: '0 1 140px', padding: '7px 12px', background: '#0F1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
            {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <button
            onClick={createCategory}
            disabled={!newCat.name.trim() || catSaving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: catSaving || !newCat.name.trim() ? '#1E2736' : 'linear-gradient(135deg,#16A34A,#15803D)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: !newCat.name.trim() || catSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !newCat.name.trim() ? 0.5 : 1 }}>
            <Plus size={14} /> {catSaving ? 'Adding…' : 'Add'}
          </button>
        </div>

        {/* List */}
        {catLoading ? (
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Loading…</p>
        ) : categories.length === 0 ? (
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>No categories yet. Add one above.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0F1117', border: '1px solid #1E2736', borderRadius: 8, padding: '6px 10px 6px 12px' }}>
                <span style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>{cat.icon && `${cat.icon} `}{cat.name}</span>
                <span style={{ fontSize: 11, color: '#475569', marginLeft: 2 }}>{cat.platform}</span>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: 2, marginLeft: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

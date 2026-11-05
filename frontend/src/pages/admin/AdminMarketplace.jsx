import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Clock, Package, AlertCircle, ShoppingCart,
  TrendingUp, AlertTriangle, ChevronRight
} from 'lucide-react'
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

  const [services, setServices]       = useState([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState('')

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

  useEffect(() => { loadStats(); loadVendors(); loadServices() }, [loadStats, loadVendors, loadServices])

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
    </div>
  )
}

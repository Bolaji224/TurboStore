import { useEffect, useState, useCallback, Fragment } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
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
  draft:          { bg: 'rgba(100,116,139,0.12)',  border: '#64748B44', color: '#64748B' },
  pending_review: { bg: 'rgba(245,158,11,0.12)',   border: '#F59E0B44', color: '#F59E0B' },
  approved:       { bg: 'rgba(34,197,94,0.12)',    border: '#22C55E44', color: '#22C55E' },
  rejected:       { bg: 'rgba(239,68,68,0.12)',    border: '#EF444444', color: '#EF4444' },
  suspended:      { bg: 'rgba(220,38,38,0.12)',    border: '#DC262644', color: '#DC2626' },
}

const STATUS_TABS = ['all', 'pending_review', 'approved', 'rejected', 'suspended', 'draft']

const PLATFORMS = ['all', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'general']

const PLATFORM_COLORS = {
  facebook: '#1877F2', instagram: '#E1306C', twitter: '#1DA1F2',
  tiktok: '#010101', youtube: '#FF0000', general: '#64748B',
}

function statusLabel(s) {
  if (s === 'pending_review') return 'Pending Review'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function AdminMarketplaceServices() {
  const [services, setServices]   = useState([])
  const [meta, setMeta]           = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [status, setStatus]       = useState('all')
  const [platform, setPlatform]   = useState('all')
  const [page, setPage]           = useState(1)
  const [expanded, setExpanded]   = useState({}) // id -> bool

  // Modal state
  const [modal, setModal]         = useState(null) // { service, action, reason }
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Per-row approve loading
  const [approveLoading, setApproveLoading] = useState({})

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = { page, per_page: 20 }
      if (status !== 'all') params.status = status
      if (platform !== 'all') params.platform = platform
      const { data } = await adminApi.get('/marketplace/services', { params })
      setServices(data.services || data.data || [])
      setMeta(data.meta || { current_page: page, last_page: 1, total: (data.services || data.data || []).length })
    } catch { setError('Failed to load services.') }
    finally { setLoading(false) }
  }, [page, status, platform])

  useEffect(() => { load() }, [load])

  function toggleExpand(id) {
    setExpanded(p => ({ ...p, [id]: !p[id] }))
  }

  async function approveService(service) {
    setApproveLoading(p => ({ ...p, [service.id]: true }))
    try {
      await adminApi.post(`/marketplace/services/${service.id}/approve`)
      await load()
    } catch (err) { alert(err.response?.data?.message || 'Action failed') }
    finally { setApproveLoading(p => ({ ...p, [service.id]: false })) }
  }

  async function handleModalConfirm() {
    if (!modal) return
    setModalLoading(true); setModalError('')
    const { service, action, reason } = modal
    try {
      await adminApi.post(`/marketplace/services/${service.id}/${action}`, { reason })
      setModal(null)
      await load()
    } catch (err) {
      setModalError(err.response?.data?.message || 'Action failed')
    } finally { setModalLoading(false) }
  }

  const totalPages = meta.last_page ?? 1

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '1 1 auto' }}>
          {STATUS_TABS.map(s => {
            const active = status === s
            return (
              <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                style={{
                  padding: '7px 13px', border: `1px solid ${active ? '#16A34A' : '#1E2736'}`,
                  borderRadius: 8, background: active ? 'rgba(22,163,74,0.12)' : 'transparent',
                  color: active ? '#4ADE80' : '#64748B', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                {statusLabel(s === 'all' ? 'all' : s)}
              </button>
            )
          })}
        </div>

        {/* Platform filter */}
        <div style={{ position: 'relative' }}>
          <select
            value={platform}
            onChange={e => { setPlatform(e.target.value); setPage(1) }}
            style={{ appearance: 'none', padding: '8px 32px 8px 12px', background: '#161B26', border: '1px solid #1E2736', borderRadius: 8, color: '#94A3B8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
            {PLATFORMS.map(p => (
              <option key={p} value={p}>{p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={12} color="#64748B" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>

        {meta.total !== undefined && (
          <span style={{ fontSize: 12, color: '#475569' }}>{meta.total} services</span>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          {error}
          <button onClick={load} style={{ marginLeft: 'auto', padding: '4px 10px', border: '1px solid #EF4444', borderRadius: 6, background: 'transparent', color: '#EF4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div style={spinStyle} /></div>
        ) : services.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748B', fontSize: 14 }}>No services found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E2736' }}>
                  {['Title', 'Platform', 'Vendor', 'Category', 'Price (₦)', 'Status', 'Submitted', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map(s => {
                  const st = (s.status || 'draft').toLowerCase()
                  const styles = STATUS_STYLES[st] || STATUS_STYLES.draft
                  const plat = (s.platform || 'general').toLowerCase()
                  const platColor = PLATFORM_COLORS[plat] || '#64748B'
                  const isExpanded = expanded[s.id]
                  const priceKobo = s.starting_price_kobo ?? 0

                  return (
                    <Fragment key={s.id}>
                      <tr
                        style={{ borderBottom: isExpanded ? 'none' : '1px solid #1E2736', background: '#161B26', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#1E2736'}
                        onMouseLeave={e => e.currentTarget.style.background = '#161B26'}>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: '#E2E8F0', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.title}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: platColor, background: platColor + '1A', border: `1px solid ${platColor}33`, borderRadius: 4, padding: '2px 7px', textTransform: 'capitalize' }}>
                            {plat}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 12, color: '#94A3B8', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.vendor?.business_name || '—'}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748B', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.category?.name || '—'}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: '#4ADE80', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {fmt(priceKobo)}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: styles.color, background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                            {statusLabel(st)}
                          </span>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                          {dateStr(s.created_at)}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            {(st === 'pending_review' || st === 'suspended') && (
                              <button
                                disabled={approveLoading[s.id]}
                                onClick={() => approveService(s)}
                                style={{ padding: '5px 10px', border: '1px solid #16A34A', borderRadius: 6, background: 'rgba(22,163,74,0.12)', color: '#4ADE80', fontSize: 11, fontWeight: 600, cursor: approveLoading[s.id] ? 'not-allowed' : 'pointer', opacity: approveLoading[s.id] ? 0.6 : 1, fontFamily: 'inherit' }}>
                                {approveLoading[s.id] ? '…' : st === 'suspended' ? 'Reinstate' : 'Approve'}
                              </button>
                            )}
                            {st === 'pending_review' && (
                              <button
                                onClick={() => setModal({ service: s, action: 'reject', reason: '' })}
                                style={{ padding: '5px 10px', border: '1px solid #EF4444', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Reject
                              </button>
                            )}
                            {st === 'approved' && (
                              <button
                                onClick={() => setModal({ service: s, action: 'suspend', reason: '' })}
                                style={{ padding: '5px 10px', border: '1px solid #F59E0B', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                Suspend
                              </button>
                            )}
                            <button
                              onClick={() => toggleExpand(s.id)}
                              style={{ padding: '5px 10px', border: '1px solid #1E2736', borderRadius: 6, background: isExpanded ? '#1E2736' : 'transparent', color: '#94A3B8', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                              Details {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr style={{ borderBottom: '1px solid #1E2736' }}>
                          <td colSpan={8} style={{ padding: '0 16px 16px' }}>
                            <div style={{ background: '#0D1117', border: '1px solid #1E2736', borderRadius: 8, padding: 16 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                                {s.description && (
                                  <div>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</p>
                                    <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
                                      {s.description.slice(0, 200)}{s.description.length > 200 ? '…' : ''}
                                    </p>
                                  </div>
                                )}
                                {s.what_you_get && (
                                  <div>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What You Get</p>
                                    <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
                                      {s.what_you_get.slice(0, 200)}{s.what_you_get.length > 200 ? '…' : ''}
                                    </p>
                                  </div>
                                )}
                                {s.rejection_reason && (
                                  <div>
                                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rejection Reason</p>
                                    <p style={{ margin: 0, fontSize: 13, color: '#EF4444', lineHeight: 1.6 }}>{s.rejection_reason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #1E2736' }}>
            <span style={{ fontSize: 12, color: '#475569' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                style={{ padding: '6px 10px', border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', color: page <= 1 ? '#1E2736' : '#94A3B8', cursor: page <= 1 ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={14} />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                style={{ padding: '6px 10px', border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', color: page >= totalPages ? '#1E2736' : '#94A3B8', cursor: page >= totalPages ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reason Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: 24, width: '100%', maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#E2E8F0', textTransform: 'capitalize' }}>
              {modal.action} Service
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {modal.service.title}
            </p>
            <label style={{ display: 'block', fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>
              Reason <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              rows={4}
              value={modal.reason}
              onChange={e => setModal(m => ({ ...m, reason: e.target.value }))}
              placeholder={`Enter ${modal.action} reason…`}
              style={{ width: '100%', background: '#0D1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, padding: 10, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
            />
            {modalError && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#EF4444' }}>{modalError}</p>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                disabled={!modal.reason.trim() || modalLoading}
                onClick={handleModalConfirm}
                style={{
                  flex: 1, padding: '9px 14px', border: `1px solid ${modal.action === 'suspend' ? '#F59E0B' : '#EF4444'}`,
                  borderRadius: 8, background: modal.action === 'suspend' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                  color: modal.action === 'suspend' ? '#F59E0B' : '#EF4444',
                  fontSize: 13, fontWeight: 600, cursor: (!modal.reason.trim() || modalLoading) ? 'not-allowed' : 'pointer',
                  opacity: (!modal.reason.trim() || modalLoading) ? 0.5 : 1, fontFamily: 'inherit',
                }}>
                {modalLoading ? 'Processing…' : `Confirm ${modal.action.charAt(0).toUpperCase() + modal.action.slice(1)}`}
              </button>
              <button
                disabled={modalLoading}
                onClick={() => { setModal(null); setModalError('') }}
                style={{ padding: '9px 16px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: '#64748B', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

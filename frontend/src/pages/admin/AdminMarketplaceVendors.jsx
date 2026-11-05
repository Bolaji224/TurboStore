import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import adminApi from '../../services/adminApi'

const spinStyle = {
  border: '3px solid #1E2736', borderTop: '3px solid #16A34A',
  borderRadius: '50%', width: 28, height: 28,
  animation: 'spin 0.8s linear infinite',
}

function dateStr(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLES = {
  pending:   { bg: 'rgba(245,158,11,0.12)', border: '#F59E0B44', color: '#F59E0B' },
  approved:  { bg: 'rgba(34,197,94,0.12)',  border: '#22C55E44', color: '#22C55E' },
  suspended: { bg: 'rgba(239,68,68,0.12)',  border: '#EF444444', color: '#EF4444' },
  rejected:  { bg: 'rgba(100,116,139,0.12)',border: '#64748B44', color: '#64748B' },
}

const STATUS_TABS = ['all', 'pending', 'approved', 'suspended', 'rejected']

export default function AdminMarketplaceVendors() {
  const [vendors, setVendors]     = useState([])
  const [meta, setMeta]           = useState({})
  const [chipMeta, setChipMeta]   = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [status, setStatus]       = useState('all')
  const [page, setPage]           = useState(1)

  // Modal state
  const [modal, setModal]         = useState(null) // { vendor, action: 'reject'|'suspend', reason: '' }
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Per-row approve loading
  const [approveLoading, setApproveLoading] = useState({})

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = { page, per_page: 20 }
      if (status !== 'all') params.status = status
      const { data } = await adminApi.get('/marketplace/vendors', { params })
      setVendors(data.vendors || data.data || [])
      setMeta(data.meta || { current_page: page, last_page: 1, total: (data.vendors || data.data || []).length })
    } catch { setError('Failed to load vendors.') }
    finally { setLoading(false) }
  }, [page, status])

  // Load chip counts (fetch totals for each status)
  const loadChips = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        ['pending', 'approved', 'suspended', 'rejected'].map(s =>
          adminApi.get('/marketplace/vendors', { params: { status: s, per_page: 1 } })
        )
      )
      const counts = {}
      ;['pending', 'approved', 'suspended', 'rejected'].forEach((s, i) => {
        if (results[i].status === 'fulfilled') {
          counts[s] = results[i].value.data.meta?.total ?? (results[i].value.data.vendors || results[i].value.data.data || []).length
        }
      })
      setChipMeta(counts)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadChips() }, [loadChips])

  async function approveVendor(vendor) {
    setApproveLoading(p => ({ ...p, [vendor.id]: true }))
    try {
      await adminApi.post(`/marketplace/vendors/${vendor.id}/approve`)
      await load()
      loadChips()
    } catch (err) { alert(err.response?.data?.message || 'Action failed') }
    finally { setApproveLoading(p => ({ ...p, [vendor.id]: false })) }
  }

  async function handleModalConfirm() {
    if (!modal) return
    setModalLoading(true); setModalError('')
    const { vendor, action, reason } = modal
    try {
      await adminApi.post(`/marketplace/vendors/${vendor.id}/${action}`, { reason })
      setModal(null)
      await load()
      loadChips()
    } catch (err) {
      setModalError(err.response?.data?.message || 'Action failed')
    } finally { setModalLoading(false) }
  }

  const totalPages = meta.last_page ?? 1

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Stats chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUS_TABS.map(s => {
            const count = s === 'all' ? meta.total : chipMeta[s]
            const active = status === s
            return (
              <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                style={{
                  padding: '7px 14px', border: `1px solid ${active ? '#16A34A' : '#1E2736'}`,
                  borderRadius: 8, background: active ? 'rgba(22,163,74,0.12)' : 'transparent',
                  color: active ? '#4ADE80' : '#64748B', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {count !== undefined && (
                  <span style={{ background: active ? 'rgba(74,222,128,0.15)' : '#1E2736', color: active ? '#4ADE80' : '#94A3B8', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {meta.total !== undefined && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#475569' }}>{meta.total} vendors</span>
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
        ) : vendors.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748B', fontSize: 14 }}>No vendors found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E2736' }}>
                  {['Business Name', 'User Email', 'Commission %', 'Status', 'Applied', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => {
                  const st = (v.status || 'pending').toLowerCase()
                  const styles = STATUS_STYLES[st] || STATUS_STYLES.pending
                  return (
                    <tr key={v.id}
                      style={{ borderBottom: '1px solid #1E2736', background: '#161B26', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1E2736'}
                      onMouseLeave={e => e.currentTarget.style.background = '#161B26'}>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#E2E8F0', fontWeight: 600, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.business_name}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#94A3B8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.user?.email || v.email || '—'}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#94A3B8' }}>
                        {v.commission_percent != null ? `${v.commission_percent}%` : '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: styles.color, background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: 6, padding: '3px 8px', textTransform: 'capitalize' }}>
                          {st}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {dateStr(v.created_at)}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(st === 'pending' || st === 'suspended') && (
                            <button
                              disabled={approveLoading[v.id]}
                              onClick={() => approveVendor(v)}
                              style={{ padding: '5px 10px', border: '1px solid #16A34A', borderRadius: 6, background: 'rgba(22,163,74,0.12)', color: '#4ADE80', fontSize: 11, fontWeight: 600, cursor: approveLoading[v.id] ? 'not-allowed' : 'pointer', opacity: approveLoading[v.id] ? 0.6 : 1, fontFamily: 'inherit' }}>
                              {approveLoading[v.id] ? '…' : st === 'suspended' ? 'Reinstate' : 'Approve'}
                            </button>
                          )}
                          {st === 'pending' && (
                            <button
                              onClick={() => setModal({ vendor: v, action: 'reject', reason: '' })}
                              style={{ padding: '5px 10px', border: '1px solid #EF4444', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Reject
                            </button>
                          )}
                          {st === 'approved' && (
                            <button
                              onClick={() => setModal({ vendor: v, action: 'suspend', reason: '' })}
                              style={{ padding: '5px 10px', border: '1px solid #F59E0B', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                              Suspend
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/admin/marketplace/vendors?vendor_id=${v.id}`, '_self')}
                            style={{ padding: '5px 10px', border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', color: '#64748B', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={11} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
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
              {modal.action} Vendor
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B' }}>
              {modal.vendor.business_name}
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

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
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

const REASON_LABELS = {
  not_delivered: 'Service Not Delivered',
  wrong_service: 'Wrong Service Delivered',
  quality_issue: 'Quality Issue',
  other:         'Other',
}

function ResolveModal({ dispute, onDone, onClose }) {
  const [resolution, setResolution] = useState('no_refund')
  const [note,       setNote]       = useState('')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  async function submit() {
    if (!note.trim()) { setError('Resolution note is required.'); return }
    setLoading(true); setError('')
    try {
      await adminApi.post(`/marketplace/disputes/${dispute.id}/resolve`, { resolution, note })
      onDone()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to resolve dispute.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#E2E8F0' }}>Resolve Dispute</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ background: '#0D1117', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.4px' }}>Order</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', margin: '0 0 6px', fontFamily: 'monospace' }}>{dispute.marketplace_order?.reference || '—'}</p>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 2px' }}>Buyer: <span style={{ color: '#94A3B8' }}>{dispute.user?.name || '—'}</span></p>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 6px' }}>Vendor: <span style={{ color: '#94A3B8' }}>{dispute.vendor?.user?.name || '—'}</span></p>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 2px' }}>Reason: <span style={{ color: '#F59E0B' }}>{REASON_LABELS[dispute.reason] || dispute.reason}</span></p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '6px 0 0', lineHeight: 1.5 }}>{dispute.description}</p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 8 }}>Resolution</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { val: 'refund',    label: 'Refund Buyer',      desc: 'Buyer gets wallet refund, vendor earning reversed' },
              { val: 'no_refund', label: 'Favour Vendor',     desc: 'No refund, vendor keeps earnings' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setResolution(opt.val)}
                style={{ flex: 1, padding: '10px 12px', border: '1.5px solid', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .15s',
                  borderColor: resolution === opt.val ? (opt.val === 'refund' ? '#EF4444' : '#16A34A') : '#1E2736',
                  background:  resolution === opt.val ? (opt.val === 'refund' ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)') : 'transparent',
                }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: resolution === opt.val ? (opt.val === 'refund' ? '#EF4444' : '#4ADE80') : '#94A3B8', margin: '0 0 3px' }}>{opt.label}</p>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0, lineHeight: 1.4 }}>{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Resolution Note *</label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Explain the decision to both parties…"
            style={{ width: '100%', background: '#0D1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, padding: '10px 12px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', lineHeight: 1.5 }}
          />
        </div>

        {error && <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: '#64748B', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button
            disabled={loading}
            onClick={submit}
            style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: resolution === 'refund' ? '#EF4444' : '#16A34A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Resolving…' : 'Confirm Resolution'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminMarketplaceDisputes() {
  const [disputes,  setDisputes]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [status,    setStatus]    = useState('open')
  const [page,      setPage]      = useState(1)
  const [meta,      setMeta]      = useState({ current_page: 1, last_page: 1, total: 0 })
  const [resolving, setResolving] = useState(null)

  const load = useCallback(async (s, p) => {
    setLoading(true); setError('')
    try {
      const params = { page: p, per_page: 20 }
      if (s !== 'all') params.status = s
      const { data } = await adminApi.get('/marketplace/disputes', { params })
      setDisputes(data.data || [])
      setMeta(data.meta || { current_page: 1, last_page: 1, total: 0 })
    } catch { setError('Failed to load disputes.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(status, page) }, [load, status, page])

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {resolving && (
        <ResolveModal
          dispute={resolving}
          onDone={() => { setResolving(null); load(status, page) }}
          onClose={() => setResolving(null)}
        />
      )}

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'open', 'resolved'].map(s => (
          <button key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            style={{
              padding: '5px 14px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              borderColor: status === s ? '#16A34A' : '#1E2736',
              background:  status === s ? 'rgba(22,163,74,0.15)' : 'transparent',
              color:       status === s ? '#4ADE80' : '#64748B',
            }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B', alignSelf: 'center' }}>{meta.total} total</span>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div style={spinStyle} /></div>
      ) : disputes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B', fontSize: 14 }}>No disputes found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {disputes.map(d => (
            <div key={d.id} style={{ background: '#161B26', border: `1px solid ${d.status === 'open' ? '#EF444433' : '#1E2736'}`, borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace' }}>{d.marketplace_order?.reference || `#${d.id}`}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                      background: d.status === 'open' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                      border: d.status === 'open' ? '1px solid #EF444444' : '1px solid #22C55E44',
                      color: d.status === 'open' ? '#EF4444' : '#22C55E',
                    }}>
                      {d.status === 'open' ? 'Open' : 'Resolved'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', border: '1px solid #F59E0B44', color: '#F59E0B' }}>
                      {REASON_LABELS[d.reason] || d.reason}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Buyer: <span style={{ color: '#94A3B8' }}>{d.user?.name || '—'}</span></span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Vendor: <span style={{ color: '#94A3B8' }}>{d.vendor?.user?.name || '—'}</span></span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Filed: <span style={{ color: '#94A3B8' }}>{dateStr(d.created_at)}</span></span>
                  </div>

                  <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {d.description}
                  </p>

                  {d.resolution_note && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: '#0D1117', borderRadius: 8, borderLeft: '3px solid #22C55E' }}>
                      <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 3px', textTransform: 'uppercase' }}>Resolution</p>
                      <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>{d.resolution_note}</p>
                    </div>
                  )}
                </div>

                {d.status === 'open' && (
                  <button
                    onClick={() => setResolving(d)}
                    style={{ padding: '7px 14px', border: '1px solid #EF4444', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '7px 14px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontFamily: 'inherit', opacity: page <= 1 ? 0.4 : 1 }}>
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontSize: 13, color: '#64748B' }}>Page {page} of {meta.last_page}</span>
          <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}
            style={{ padding: '7px 14px', border: '1px solid #16A34A', borderRadius: 8, background: 'rgba(22,163,74,0.12)', color: '#4ADE80', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontFamily: 'inherit', opacity: page >= meta.last_page ? 0.4 : 1 }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

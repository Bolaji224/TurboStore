import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Clock, Loader, DollarSign, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import adminApi from '../../services/adminApi'

function fmt(kobo) { return '₦' + Math.round(kobo / 100).toLocaleString('en-NG') }
function dateStr(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_STYLES = {
  pending:    { bg: 'rgba(245,158,11,0.12)',  color: '#F59E0B', label: 'Pending' },
  approved:   { bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', label: 'Approved' },
  processing: { bg: 'rgba(139,92,246,0.12)',  color: '#8B5CF6', label: 'Processing' },
  paid:       { bg: 'rgba(74,222,128,0.12)',  color: '#4ADE80', label: 'Paid' },
  failed:     { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', label: 'Failed' },
  cancelled:  { bg: 'rgba(100,116,139,0.12)', color: '#64748B', label: 'Cancelled' },
  rejected:   { bg: 'rgba(100,116,139,0.12)', color: '#64748B', label: 'Rejected' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function ActionModal({ title, children, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1E2736', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, border: '1px solid #2D3748' }}>
        <h3 style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>{title}</h3>
        {children}
        <button onClick={onClose} style={{ marginTop: 8, width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #2D3748', background: 'transparent', color: '#64748B', cursor: 'pointer', fontSize: 13 }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #2D3748', background: '#0F1117', color: '#E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}

export default function AdminMarketplacePayouts() {
  const [payouts, setPayouts]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('pending')
  const [expanded, setExpanded] = useState(null)
  const [modal, setModal]       = useState(null) // { type, payout }
  const [form, setForm]         = useState({})
  const [busy, setBusy]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = {}
      if (filter) params.status = filter
      const { data } = await adminApi.get('/marketplace/payouts', { params })
      setPayouts(data.data || [])
    } catch { setError('Failed to load payouts.') }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  function openModal(type, payout) {
    setForm({})
    setModal({ type, payout })
  }

  async function runAction() {
    if (!modal) return
    setBusy(true)
    try {
      const { type, payout } = modal
      if (type === 'approve') {
        await adminApi.post(`/marketplace/payouts/${payout.id}/approve`)
      } else if (type === 'processing') {
        await adminApi.post(`/marketplace/payouts/${payout.id}/mark-processing`)
      } else if (type === 'paid') {
        await adminApi.post(`/marketplace/payouts/${payout.id}/mark-paid`, {
          payment_reference: form.ref,
          note: form.note || undefined,
        })
      } else if (type === 'reject') {
        await adminApi.post(`/marketplace/payouts/${payout.id}/reject`, { admin_note: form.note })
      } else if (type === 'failed') {
        await adminApi.post(`/marketplace/payouts/${payout.id}/mark-failed`, { admin_note: form.note })
      }
      setModal(null)
      load()
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const filters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'processing', label: 'Processing' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#E2E8F0', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Supplier Payouts</h2>
        <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>Review, approve and confirm supplier settlement requests.</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            style={{ padding: '6px 16px', borderRadius: 999, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
              background: filter === f.value ? 'rgba(74,222,128,0.12)' : 'transparent',
              color: filter === f.value ? '#4ADE80' : '#64748B',
              borderColor: filter === f.value ? 'rgba(74,222,128,0.3)' : '#2D3748',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}><Loader size={24} style={{ animation: 'spin 0.8s linear infinite' }} /></div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 14, color: '#EF4444', marginBottom: 16 }}>{error}</div>}

      {!loading && payouts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <DollarSign size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No payouts found for this status.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {payouts.map(p => {
          const isExpanded = expanded === p.id
          const bank = p.bank_details || {}
          return (
            <div key={p.id} style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
              {/* Row header */}
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 700, margin: '0 0 2px' }}>
                    {p.vendor?.business_name || '—'}
                  </p>
                  <p style={{ color: '#64748B', fontSize: 12, margin: 0 }}>{p.vendor?.user?.email}</p>
                </div>
                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <p style={{ color: '#4ADE80', fontSize: 16, fontWeight: 800, margin: '0 0 2px' }}>{fmt(p.amount_kobo)}</p>
                  <p style={{ color: '#64748B', fontSize: 11, margin: 0 }}>{dateStr(p.created_at)}</p>
                </div>
                <StatusBadge status={p.status} />
                <button onClick={() => setExpanded(isExpanded ? null : p.id)}
                  style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ padding: '0 20px 18px', borderTop: '1px solid #1E2736' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 14, marginBottom: 16 }}>
                    <div>
                      <p style={{ color: '#64748B', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 6px' }}>Bank Details</p>
                      <p style={{ color: '#E2E8F0', fontSize: 13, margin: '0 0 3px' }}>{bank.bank_name || '—'}</p>
                      <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 3px', fontFamily: 'monospace' }}>{bank.account_number || '—'}</p>
                      <p style={{ color: '#94A3B8', fontSize: 12, margin: 0 }}>{bank.account_name || '—'}</p>
                    </div>
                    <div>
                      <p style={{ color: '#64748B', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 6px' }}>Timeline</p>
                      <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 3px' }}>Requested: {dateStr(p.created_at)}</p>
                      {p.reviewed_at && <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 3px' }}>Reviewed: {dateStr(p.reviewed_at)}</p>}
                      {p.processed_at && <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 3px' }}>Processed: {dateStr(p.processed_at)}</p>}
                      {p.payment_reference && <p style={{ color: '#4ADE80', fontSize: 12, margin: '0 0 3px', fontFamily: 'monospace' }}>Ref: {p.payment_reference}</p>}
                    </div>
                  </div>
                  {p.admin_note && (
                    <div style={{ background: 'rgba(245,158,11,0.07)', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
                      <p style={{ color: '#F59E0B', fontSize: 12, margin: 0 }}><strong>Admin note:</strong> {p.admin_note}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {p.status === 'pending' && (
                      <>
                        <button onClick={() => openModal('approve', p)}
                          style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Approve
                        </button>
                        <button onClick={() => openModal('reject', p)}
                          style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === 'approved' && (
                      <>
                        <button onClick={() => openModal('processing', p)}
                          style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#8B5CF6', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Mark Processing
                        </button>
                        <button onClick={() => openModal('paid', p)}
                          style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Mark Paid
                        </button>
                      </>
                    )}
                    {p.status === 'processing' && (
                      <>
                        <button onClick={() => openModal('paid', p)}
                          style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Mark Paid
                        </button>
                        <button onClick={() => openModal('failed', p)}
                          style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Mark Failed
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action modals */}
      {modal?.type === 'approve' && (
        <ActionModal title="Approve Payout" onClose={() => setModal(null)}>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 20px' }}>
            Approve payout of <strong style={{ color: '#4ADE80' }}>{fmt(modal.payout.amount_kobo)}</strong> for{' '}
            <strong style={{ color: '#E2E8F0' }}>{modal.payout.vendor?.business_name}</strong>?
          </p>
          <button onClick={runAction} disabled={busy}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
            {busy ? 'Approving…' : 'Confirm Approve'}
          </button>
        </ActionModal>
      )}

      {modal?.type === 'processing' && (
        <ActionModal title="Mark as Processing" onClose={() => setModal(null)}>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 20px' }}>
            Mark this payout as processing? This indicates the bank transfer has been initiated.
          </p>
          <button onClick={runAction} disabled={busy}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#8B5CF6', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
            {busy ? 'Updating…' : 'Mark Processing'}
          </button>
        </ActionModal>
      )}

      {modal?.type === 'paid' && (
        <ActionModal title="Confirm Payment" onClose={() => setModal(null)}>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 16px' }}>
            Confirm that <strong style={{ color: '#4ADE80' }}>{fmt(modal.payout.amount_kobo)}</strong> has been transferred to the supplier.
          </p>
          <InputField label="Payment Reference *" value={form.ref || ''} onChange={v => setForm(f => ({ ...f, ref: v }))} placeholder="Bank transfer ref / transaction ID" />
          <InputField label="Note (optional)" value={form.note || ''} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="Any additional notes" />
          <button onClick={runAction} disabled={busy || !form.ref?.trim()}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#16A34A', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 8, opacity: !form.ref?.trim() ? 0.5 : 1 }}>
            {busy ? 'Confirming…' : 'Confirm Paid'}
          </button>
        </ActionModal>
      )}

      {(modal?.type === 'reject' || modal?.type === 'failed') && (
        <ActionModal title={modal.type === 'reject' ? 'Reject Payout' : 'Mark as Failed'} onClose={() => setModal(null)}>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 16px' }}>
            {modal.type === 'reject'
              ? 'Rejecting will release the reserved earnings back to the supplier.'
              : 'Marking as failed will release reserved earnings so the supplier can retry.'}
          </p>
          <InputField label="Reason *" value={form.note || ''} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="Explain the reason…" />
          <button onClick={runAction} disabled={busy || !form.note?.trim()}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer', marginBottom: 8, opacity: !form.note?.trim() ? 0.5 : 1 }}>
            {busy ? 'Processing…' : modal.type === 'reject' ? 'Reject & Release' : 'Mark Failed & Release'}
          </button>
        </ActionModal>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

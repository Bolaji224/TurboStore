import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserX, CheckCircle, Wallet, ShoppingCart, AlertTriangle } from 'lucide-react'
import adminApi from '../../services/adminApi'

function fmt(kobo) { return '₦' + Math.round(kobo / 100).toLocaleString() }
function date(iso) { return iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }

const STATUS_COLORS = {
  processing: '#F59E0B', waiting_for_otp: '#3B82F6',
  otp_received: '#22C55E', cancelled: '#EF4444', expired: '#6B7280',
}

export default function AdminUserDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState('overview')

  // Action modals state
  const [suspendModal, setSuspendModal]   = useState(false)
  const [restoreModal, setRestoreModal]   = useState(false)
  const [walletModal, setWalletModal]     = useState(false)
  const [reason, setReason]               = useState('')
  const [walletAmt, setWalletAmt]         = useState('')
  const [walletDesc, setWalletDesc]       = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError]     = useState('')

  async function load() {
    setLoading(true)
    try {
      const { data } = await adminApi.get(`/users/${id}`)
      setDetail(data)
    } catch {
      setError('Failed to load user.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleSuspend() {
    if (!reason.trim()) { setActionError('Reason is required.'); return }
    setActionLoading(true); setActionError('')
    try {
      const { data } = await adminApi.post(`/users/${id}/suspend`, { reason })
      setDetail(prev => ({ ...prev, user: data.user }))
      setSuspendModal(false); setReason('')
    } catch (err) { setActionError(err.response?.data?.message || 'Failed.') }
    finally { setActionLoading(false) }
  }

  async function handleRestore() {
    setActionLoading(true); setActionError('')
    try {
      const { data } = await adminApi.post(`/users/${id}/restore`)
      setDetail(prev => ({ ...prev, user: data.user }))
      setRestoreModal(false)
    } catch (err) { setActionError(err.response?.data?.message || 'Failed.') }
    finally { setActionLoading(false) }
  }

  async function handleWalletAdjust() {
    if (!walletAmt || isNaN(parseFloat(walletAmt))) { setActionError('Enter a valid amount.'); return }
    if (!walletDesc.trim()) { setActionError('Description is required.'); return }
    setActionLoading(true); setActionError('')
    try {
      const { data } = await adminApi.post(`/users/${id}/wallet/adjust`, {
        amount_naira: parseFloat(walletAmt),
        description: walletDesc,
      })
      setDetail(prev => ({ ...prev, user: data.user }))
      setWalletModal(false); setWalletAmt(''); setWalletDesc('')
    } catch (err) { setActionError(err.response?.data?.message || 'Failed.') }
    finally { setActionLoading(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #1E2736', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return <div style={{ color: '#EF4444', padding: 20 }}>{error}</div>

  const { user, orders, transactions, stats } = detail

  return (
    <div>
      {/* Back */}
      <button onClick={() => navigate('/admin/users')}
        style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B', fontSize: 13, fontFamily: 'inherit', padding: 0, marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Users
      </button>

      {/* Header */}
      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{(user.name || 'U').charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>{user.name}</h2>
              {user.is_suspended && (
                <span style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, fontSize: 11, color: '#EF4444', fontWeight: 600 }}>Suspended</span>
              )}
              {user.admin_role && (
                <span style={{ padding: '2px 8px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>{user.admin_role.replace('_',' ')}</span>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>{user.email} · ID #{user.id} · Joined {date(user.created_at)}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => { setWalletModal(true); setActionError('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Wallet size={13} /> Adjust Wallet
          </button>
          {user.is_suspended ? (
            <button onClick={() => { setRestoreModal(true); setActionError('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, background: 'rgba(34,197,94,0.08)', color: '#4ADE80', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <CheckCircle size={13} /> Restore
            </button>
          ) : !user.admin_role && (
            <button onClick={() => { setSuspendModal(true); setActionError('') }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <UserX size={13} /> Suspend
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Wallet Balance', value: fmt(user.wallet_balance), color: '#22C55E' },
          { label: 'Total Orders',   value: stats.total_orders.toLocaleString(), color: '#3B82F6' },
          { label: 'Total Deposited',value: fmt(stats.total_deposited), color: '#F59E0B' },
          { label: 'Total Spent',    value: fmt(stats.total_spent), color: '#8B5CF6' },
        ].map(s => (
          <div key={s.label} style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 10, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: '#475569', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {['orders', 'transactions'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '7px 16px', border: `1px solid ${tab === t ? '#16A34A' : '#1E2736'}`, borderRadius: 8, background: tab === t ? 'rgba(22,163,74,0.1)' : 'transparent', color: tab === t ? '#4ADE80' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
        {tab === 'orders' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E2736' }}>
                {['Reference', 'Service', 'Country', 'Status', 'Price', 'Date'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#475569' }}>No orders yet.</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #1E2736' }}>
                  <td style={{ padding: '11px 16px', fontFamily: 'monospace', color: '#94A3B8', fontSize: 12 }}>{o.reference}</td>
                  <td style={{ padding: '11px 16px', color: '#E2E8F0', textTransform: 'capitalize' }}>{o.service_name}</td>
                  <td style={{ padding: '11px 16px', color: '#94A3B8', textTransform: 'capitalize' }}>{o.country}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ color: STATUS_COLORS[o.status] ?? '#64748B', fontWeight: 600 }}>{o.status.replace(/_/g, ' ')}</span>
                  </td>
                  <td style={{ padding: '11px 16px', color: '#E2E8F0', fontWeight: 600 }}>{fmt(o.customer_price)}</td>
                  <td style={{ padding: '11px 16px', color: '#64748B' }}>{date(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E2736' }}>
                {['Reference', 'Type', 'Amount', 'Balance After', 'Description', 'Date'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#475569' }}>No transactions yet.</td></tr>
              ) : transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #1E2736' }}>
                  <td style={{ padding: '11px 16px', fontFamily: 'monospace', color: '#94A3B8', fontSize: 12 }}>{t.reference}</td>
                  <td style={{ padding: '11px 16px', color: '#E2E8F0', textTransform: 'capitalize' }}>{t.type.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: t.amount > 0 ? '#22C55E' : '#EF4444' }}>
                    {t.amount > 0 ? '+' : ''}{fmt(Math.abs(t.amount))}
                  </td>
                  <td style={{ padding: '11px 16px', color: '#94A3B8' }}>{fmt(t.balance_after)}</td>
                  <td style={{ padding: '11px 16px', color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                  <td style={{ padding: '11px 16px', color: '#64748B' }}>{date(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {(suspendModal || restoreModal || walletModal) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) { setSuspendModal(false); setRestoreModal(false); setWalletModal(false) } }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#161B26', border: '1px solid #1E2736', borderRadius: 14, padding: 24 }}>
            {suspendModal && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <AlertTriangle size={20} color="#F59E0B" />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Suspend User</h3>
                </div>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Suspending <strong style={{ color: '#E2E8F0' }}>{user.name}</strong> will prevent them from accessing the platform.</p>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Reason *</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Enter suspension reason…"
                  style={{ width: '100%', padding: '10px 12px', background: '#0F1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                {actionError && <p style={{ color: '#EF4444', fontSize: 12, margin: '8px 0 0' }}>{actionError}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => setSuspendModal(false)} style={{ flex: 1, padding: '9px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={handleSuspend} disabled={actionLoading}
                    style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {actionLoading ? 'Suspending…' : 'Suspend'}
                  </button>
                </div>
              </>
            )}

            {restoreModal && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <CheckCircle size={20} color="#22C55E" />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Restore User</h3>
                </div>
                <p style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Are you sure you want to restore <strong style={{ color: '#E2E8F0' }}>{user.name}</strong>?</p>
                {actionError && <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 8px' }}>{actionError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setRestoreModal(false)} style={{ flex: 1, padding: '9px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={handleRestore} disabled={actionLoading}
                    style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {actionLoading ? 'Restoring…' : 'Restore Access'}
                  </button>
                </div>
              </>
            )}

            {walletModal && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Wallet size={20} color="#F59E0B" />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Adjust Wallet</h3>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Current balance: <strong style={{ color: '#E2E8F0' }}>{fmt(user.wallet_balance)}</strong>. Enter a positive number to credit, negative to debit.</p>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Amount (₦) *</label>
                <input type="number" value={walletAmt} onChange={e => setWalletAmt(e.target.value)} placeholder="e.g. 500 or -200"
                  style={{ width: '100%', padding: '10px 12px', background: '#0F1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 12 }} />
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>Description *</label>
                <input type="text" value={walletDesc} onChange={e => setWalletDesc(e.target.value)} placeholder="Admin credit — support resolution"
                  style={{ width: '100%', padding: '10px 12px', background: '#0F1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                {actionError && <p style={{ color: '#EF4444', fontSize: 12, margin: '8px 0 0' }}>{actionError}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => setWalletModal(false)} style={{ flex: 1, padding: '9px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={handleWalletAdjust} disabled={actionLoading}
                    style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, background: '#F59E0B', color: '#000', fontSize: 13, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {actionLoading ? 'Saving…' : 'Apply Adjustment'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

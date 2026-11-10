import { useCallback, useEffect, useState } from 'react'
import {
  Rocket, Send, RefreshCw, RotateCcw, AlertTriangle, Users, UserCheck, UserPlus,
  CheckCircle2, Clock, XCircle, MinusCircle, Mail, X,
} from 'lucide-react'
import adminApi from '../../services/adminApi'
import { useAdminAuth } from '../../context/AdminAuthContext'

const card   = { background: '#161B26', border: '1px solid #1E2736', borderRadius: 12 }
const muted  = '#64748B'
const btn    = (bg, enabled = true) => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', border: 'none', borderRadius: 8,
  background: enabled ? bg : '#1E2736', color: enabled ? '#fff' : '#475569', fontSize: 12.5, fontWeight: 600,
  cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
})
const ghostBtn = (enabled = true) => ({
  ...btn('transparent', enabled), border: '1px solid #1E2736', color: enabled ? '#CBD5E1' : '#475569', background: 'transparent',
})

function Stat({ icon: Icon, label, value, color = '#E2E8F0', hint }) {
  return (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: muted, fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        <Icon size={14} /> {label}
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color, margin: '8px 0 0', letterSpacing: '-0.02em' }}>{value ?? '—'}</p>
      {hint && <p style={{ fontSize: 11.5, color: '#475569', margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}

export default function AdminLaunchCampaign() {
  const { admin }                   = useAdminAuth()
  const isSuper                     = admin?.admin_role === 'super_admin'
  const [stats, setStats]           = useState(null)
  const [failures, setFailures]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [busy, setBusy]             = useState('')        // which action is running
  const [notice, setNotice]         = useState(null)      // { type, text }
  const [confirmOpen, setConfirm]   = useState(false)
  const [typed, setTyped]           = useState('')
  const [testMode, setTestMode]     = useState('activate')

  const load = useCallback(async () => {
    try {
      const { data } = await adminApi.get('/launch-campaign')
      setStats(data.stats)
      setFailures(data.recent_failures)
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'Failed to load campaign status.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Poll while emails are in flight so progress is visible.
  useEffect(() => {
    if (!stats?.pending_delivery) return
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [stats?.pending_delivery, load])

  async function run(name, request, onOk) {
    setBusy(name); setNotice(null)
    try {
      const { data } = await request()
      if (data.stats) setStats(data.stats)
      setNotice({ type: 'success', text: data.message })
      onOk?.(data)
      load()
    } catch (err) {
      const d = err.response?.data
      setNotice({ type: 'error', text: d?.message || 'Request failed.' })
      if (d?.eligible !== undefined) load()
    } finally {
      setBusy('')
    }
  }

  const sync  = () => run('sync',  () => adminApi.post('/launch-campaign/sync'))
  const test  = () => run('test',  () => adminApi.post('/launch-campaign/test', { mode: testMode }))
  const retry = () => run('retry', () => adminApi.post('/launch-campaign/retry'))
  const send  = () => run('send',  () => adminApi.post('/launch-campaign/send', { confirm_count: stats.eligible }),
                          () => { setConfirm(false); setTyped('') })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #1E2736', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const eligible   = stats?.eligible ?? 0
  const lastSync   = stats?.last_sync?.at ? new Date(stats.last_sync.at).toLocaleString() : 'never'
  const etaMinutes = stats ? Math.ceil(eligible / Math.max(1, stats.batch_size)) * stats.batch_delay_seconds / 60 : 0

  return (
    <div style={{ maxWidth: 1040 }}>
      <p style={{ fontSize: 13, color: muted, margin: '0 0 20px' }}>
        Notify waitlist subscribers that TurboStore is live. Recipients are imported from the Klaviyo waitlist;
        each person is emailed at most once.
      </p>

      {notice && (
        <div style={{
          borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13,
          background: notice.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)',
          border: `1px solid ${notice.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
          color: notice.type === 'error' ? '#EF4444' : '#4ADE80',
        }}>{notice.text}</div>
      )}

      {!stats?.klaviyo_configured && (
        <div style={{ ...card, padding: '12px 16px', marginBottom: 16, borderColor: 'rgba(234,179,8,0.3)', color: '#FACC15', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertTriangle size={15} /> Klaviyo is not configured on the server (KLAVIYO_PRIVATE_API_KEY, KLAVIYO_WAITLIST_LIST_ID), so the waitlist cannot be synced.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Stat icon={Users}        label="Waitlist total"      value={stats.total_waitlist} hint={`Last sync: ${lastSync}`} />
        <Stat icon={Rocket}       label="Eligible to send"    value={eligible} color="#4ADE80" />
        <Stat icon={UserCheck}    label="Existing accounts"   value={stats.existing_accounts} />
        <Stat icon={UserPlus}     label="Accounts created"    value={stats.accounts_created} hint={`${stats.accounts_activated} activated`} />
        <Stat icon={CheckCircle2} label="Emails sent"         value={stats.sent} color="#4ADE80" />
        <Stat icon={Clock}        label="Pending delivery"    value={stats.pending_delivery} color="#60A5FA" />
        <Stat icon={XCircle}      label="Failed"              value={stats.failed} color={stats.failed ? '#F87171' : '#E2E8F0'} />
        <Stat icon={MinusCircle}  label="Skipped"             value={stats.skipped} hint="Unsubscribed or suspended" />
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ ...card, padding: 18 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: '0 0 4px' }}>1. Sync waitlist</p>
          <p style={{ fontSize: 12.5, color: muted, margin: '0 0 14px' }}>Import the latest sign-ups from Klaviyo. Read-only — sends nothing.</p>
          <button style={btn('#2563EB', isSuper && stats.klaviyo_configured && !busy)} disabled={!isSuper || !stats.klaviyo_configured || !!busy} onClick={sync}>
            <RefreshCw size={13} /> {busy === 'sync' ? 'Syncing…' : 'Sync from Klaviyo'}
          </button>
        </div>

        <div style={{ ...card, padding: 18 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: '0 0 4px' }}>2. Send a test</p>
          <p style={{ fontSize: 12.5, color: muted, margin: '0 0 14px' }}>Sends a preview to <strong style={{ color: '#CBD5E1' }}>{admin?.email}</strong> only.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={testMode} onChange={e => setTestMode(e.target.value)}
              style={{ background: '#0F1117', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 12.5, padding: '8px 10px', fontFamily: 'inherit' }}>
              <option value="activate">New account (activate)</option>
              <option value="verify">Unverified account</option>
              <option value="login">Existing account</option>
            </select>
            <button style={ghostBtn(!busy)} disabled={!!busy} onClick={test}>
              <Mail size={13} /> {busy === 'test' ? 'Sending…' : 'Send test email'}
            </button>
          </div>
        </div>

        <div style={{ ...card, padding: 18, borderColor: 'rgba(22,163,74,0.35)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: '0 0 4px' }}>3. Launch</p>
          <p style={{ fontSize: 12.5, color: muted, margin: '0 0 14px' }}>
            {eligible
              ? <>Email <strong style={{ color: '#4ADE80' }}>{eligible}</strong> eligible subscriber{eligible === 1 ? '' : 's'}.</>
              : 'No one is waiting for a launch email.'}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={btn('#16A34A', isSuper && eligible > 0 && !busy)} disabled={!isSuper || !eligible || !!busy}
              onClick={() => { setTyped(''); setConfirm(true) }}>
              <Send size={13} /> Send official launch email
            </button>
            <button style={ghostBtn(isSuper && stats.retryable > 0 && !busy)} disabled={!isSuper || !stats.retryable || !!busy} onClick={retry}>
              <RotateCcw size={13} /> {busy === 'retry' ? 'Retrying…' : `Retry failed (${stats.retryable})`}
            </button>
          </div>
        </div>
      </div>

      {!isSuper && (
        <p style={{ fontSize: 12.5, color: '#FACC15', margin: '0 0 20px' }}>
          Only super admins can sync, send or retry. You can view progress and send yourself a test.
        </p>
      )}

      {/* Failures */}
      {failures.length > 0 && (
        <div style={{ ...card, overflow: 'hidden' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', margin: 0, padding: '14px 16px', borderBottom: '1px solid #1E2736' }}>Recent failed deliveries</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E2736' }}>
                  {['Email', 'Attempts', 'Last error', 'When'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {failures.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #1E2736' }}>
                    <td style={{ padding: '10px 14px', color: '#E2E8F0' }}>{f.email}</td>
                    <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{f.launch_email_attempts}</td>
                    <td style={{ padding: '10px 14px', color: '#F87171', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.launch_email_last_error}>{f.launch_email_last_error}</td>
                    <td style={{ padding: '10px 14px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{new Date(f.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="launch-confirm-title"
          style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,12,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}>
          <div style={{ ...card, background: '#0F1117', width: '100%', maxWidth: 460, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 id="launch-confirm-title" style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Rocket size={18} color="#4ADE80" /> Send official launch email?
              </h2>
              <button onClick={() => setConfirm(false)} aria-label="Close" style={{ background: 'none', border: 'none', color: muted, cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.6, margin: '0 0 10px' }}>
              This will email <strong style={{ color: '#4ADE80' }}>{eligible}</strong> waitlist subscriber{eligible === 1 ? '' : 's'} and
              create accounts for those who don't have one yet. It cannot be undone.
            </p>
            <p style={{ fontSize: 12.5, color: muted, lineHeight: 1.6, margin: '0 0 16px' }}>
              Delivery runs in the background in batches of {stats.batch_size} every {stats.batch_delay_seconds}s
              {etaMinutes > 0 && <> (about {Math.ceil(etaMinutes)} min)</>}. A queue worker must be running.
            </p>
            <label style={{ display: 'block', fontSize: 12.5, color: '#CBD5E1', marginBottom: 6 }}>
              Type <strong style={{ color: '#F8FAFC' }}>{eligible}</strong> to confirm
            </label>
            <input value={typed} onChange={e => setTyped(e.target.value.trim())} inputMode="numeric" autoFocus
              style={{ width: '100%', boxSizing: 'border-box', background: '#161B26', border: '1px solid #1E2736', borderRadius: 8, color: '#F8FAFC', fontSize: 14, padding: '10px 12px', marginBottom: 18, fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button style={ghostBtn(!busy)} disabled={!!busy} onClick={() => setConfirm(false)}>Cancel</button>
              <button style={btn('#16A34A', typed === String(eligible) && !busy)} disabled={typed !== String(eligible) || !!busy} onClick={send}>
                <Send size={13} /> {busy === 'send' ? 'Queuing…' : `Send to ${eligible}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

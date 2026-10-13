import { useState, useEffect } from 'react'
import { Lock, Shield, Eye, EyeOff, LogOut, AlertTriangle, Check, Fingerprint, Plus, Trash2 } from 'lucide-react'
import { startRegistration } from '@simplewebauthn/browser'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

const SESSIONS = [
  { device: 'Chrome · Windows 10', location: 'Lagos, Nigeria',    time: 'Active now',   current: true },
  { device: 'Safari · iPhone 14',  location: 'Lagos, Nigeria',    time: '2 hours ago',  current: false },
  { device: 'Firefox · Ubuntu',    location: 'Abuja, Nigeria',    time: '3 days ago',   current: false },
]

export default function Security() {
  const { isDark } = useTheme()
  const [show, setShow]   = useState({ cur: false, new: false, con: false })
  const [form, setForm]   = useState({ current: '', newPass: '', confirm: '' })
  const [twoFA, setTwoFA] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  // Passkey state
  const [passkeys,     setPasskeys]     = useState([])
  const [pkLoading,    setPkLoading]    = useState(false)
  const [pkRegistering,setPkRegistering]= useState(false)
  const [pkError,      setPkError]      = useState('')
  const [pkSuccess,    setPkSuccess]    = useState('')

  useEffect(() => { loadPasskeys() }, [])

  async function loadPasskeys() {
    try {
      const res = await api.get('/auth/passkey')
      setPasskeys(res.data.passkeys)
    } catch { /* not critical */ }
  }

  async function handleAddPasskey() {
    setPkError('')
    setPkSuccess('')
    setPkRegistering(true)
    try {
      // 1. Get registration options
      const optRes = await api.get('/auth/passkey/register/options')
      const options = optRes.data

      // 2. Trigger fingerprint prompt
      const credential = await startRegistration({ optionsJSON: options })

      // 3. Verify with server
      const verifyRes = await api.post('/auth/passkey/register/verify', {
        ...credential,
        name: 'My Passkey',
      })

      setPkSuccess('Passkey added! You can now sign in with your fingerprint.')
      await loadPasskeys()
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPkError('Passkey setup was cancelled.')
      } else if (err.name === 'InvalidStateError') {
        setPkError('A passkey for this device already exists.')
      } else {
        setPkError(err.response?.data?.message || 'Failed to create passkey. Please try again.')
      }
    } finally {
      setPkRegistering(false)
      setTimeout(() => { setPkSuccess(''); setPkError('') }, 5000)
    }
  }

  async function handleDeletePasskey(id) {
    try {
      await api.delete(`/auth/passkey/${id}`)
      setPasskeys(p => p.filter(k => k.id !== id))
    } catch { /* ignore */ }
  }

  function toggle(k) { setShow(s => ({ ...s, [k]: !s[k] })) }

  async function handleSave(e) {
    e.preventDefault()
    if (form.newPass !== form.confirm || form.newPass.length < 8) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false); setSaved(true)
    setForm({ current: '', newPass: '', confirm: '' })
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Security</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage your account security settings.</p>
      </div>

      {/* ── Passkeys ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Fingerprint size={16} color="#16A34A" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Passkeys</h3>
          </div>
          <button
            onClick={handleAddPasskey}
            disabled={pkRegistering}
            className="btn-primary"
            style={{ gap: 6, padding: '8px 16px', fontSize: 13 }}
          >
            <Plus size={13} />
            {pkRegistering ? 'Touch your sensor…' : 'Add Passkey'}
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
          Passkeys use your device's fingerprint or Face ID to sign you in instantly — no password needed.
        </p>

        {pkSuccess && (
          <div style={{ background: 'rgba(22,163,74,0.1)', border: '1.5px solid rgba(22,163,74,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={14} color="#16A34A" />
            <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>{pkSuccess}</span>
          </div>
        )}
        {pkError && (
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1.5px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} color="#DC2626" />
            <span style={{ fontSize: 13, color: '#DC2626' }}>{pkError}</span>
          </div>
        )}

        {passkeys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
            <Fingerprint size={32} color="var(--border)" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, margin: 0 }}>No passkeys yet. Add one to enable fingerprint sign-in.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {passkeys.map((pk, i, arr) => (
              <div key={pk.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Fingerprint size={16} color="#16A34A" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{pk.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      Added {new Date(pk.created_at).toLocaleDateString()}
                      {pk.last_used_at && ` · Last used ${new Date(pk.last_used_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePasskey(pk.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 6, display: 'flex', borderRadius: 6 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Change password ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Lock size={16} color="#16A34A" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Change Password</h3>
        </div>
        <form onSubmit={handleSave}>
          {[
            { key: 'cur', name: 'current', label: 'Current Password', placeholder: 'Enter current password' },
            { key: 'new', name: 'newPass', label: 'New Password',     placeholder: 'Minimum 8 characters' },
            { key: 'con', name: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 16, position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <input name={f.name} type={show[f.key] ? 'text' : 'password'} className="input" placeholder={f.placeholder}
                  value={form[f.name]} onChange={e => setForm(v => ({ ...v, [f.name]: e.target.value }))}
                  style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => toggle(f.key)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {show[f.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          {form.newPass && form.confirm && form.newPass !== form.confirm && (
            <p style={{ fontSize: 12, color: '#DC2626', margin: '-8px 0 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={12} /> Passwords do not match.
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={saving || !form.current || !form.newPass || form.newPass !== form.confirm || form.newPass.length < 8} style={{ gap: 7 }}>
            {saving ? 'Updating…' : saved ? <><Check size={14} /> Updated!</> : 'Update Password'}
          </button>
        </form>
      </div>

      {/* ── 2FA ── */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={18} color="#16A34A" />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>Two-Factor Authentication</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Add an extra layer of security to your account.</p>
            </div>
          </div>
          <button onClick={() => setTwoFA(v => !v)}
            style={{ width: 48, height: 26, background: twoFA ? '#16A34A' : 'var(--border)', borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: twoFA ? 24 : 3, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </button>
        </div>
        {twoFA && (
          <div style={{ marginTop: 16, padding: 16, background: isDark ? 'rgba(22,163,74,0.1)' : '#F0FDF4', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            2FA is enabled. You will be asked for a code from your authenticator app when logging in.
          </div>
        )}
      </div>

      {/* ── Sessions ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Active Sessions</h3>
          <button style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
            <LogOut size={12} /> Logout All
          </button>
        </div>
        {SESSIONS.map((s, i) => (
          <div key={i} className="table-row" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{s.device}</p>
                {s.current && <span className="badge badge-success">Current</span>}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{s.location} · {s.time}</p>
            </div>
            {!s.current && (
              <button style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

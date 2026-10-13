import { useState } from 'react'
import { Bell, Moon, Sun, Globe, Clock, Check } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, background: value ? '#16A34A' : 'var(--border)', borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: value ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

export default function Settings() {
  const { isDark, toggle } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const [notifs, setNotifs] = useState({
    email:    true,
    otp:      true,
    referral: true,
    wallet:   true,
    expiry:   true,
  })

  const [prefs, setPrefs] = useState({
    language: 'en',
    timezone: 'Africa/Lagos',
  })

  function toggleNotif(key) {
    setNotifs(n => ({ ...n, [key]: !n[key] }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 900))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Settings</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage your preferences and account settings.</p>
      </div>

      {/* Notifications */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Bell size={16} color="#16A34A" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Notifications</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { key: 'email',    label: 'Email Notifications',    desc: 'Receive updates and alerts via email.' },
            { key: 'otp',      label: 'OTP Notifications',      desc: 'Be notified the moment your OTP arrives.' },
            { key: 'referral', label: 'Referral Notifications', desc: 'Updates on referral progress and rewards.' },
            { key: 'wallet',   label: 'Wallet Notifications',   desc: 'Alerts for deposits and spending.' },
            { key: 'expiry',   label: 'Order Expiry Alerts',    desc: 'Notified 2 minutes before a number expires.' },
          ].map((item, i, arr) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{item.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
              </div>
              <Toggle value={notifs[item.key]} onChange={() => toggleNotif(item.key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          {isDark ? <Moon size={16} color="#16A34A" /> : <Sun size={16} color="#16A34A" />}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Appearance</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>Dark Mode</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Switch between light and dark theme.</p>
          </div>
          <Toggle value={isDark} onChange={toggle} />
        </div>
      </div>

      {/* Localization */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Globe size={16} color="#16A34A" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Localization</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Language</label>
            <select className="input" value={prefs.language} onChange={e => { setPrefs(p => ({ ...p, language: e.target.value })); setSaved(false) }}>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Timezone</label>
            <select className="input" value={prefs.timezone} onChange={e => { setPrefs(p => ({ ...p, timezone: e.target.value })); setSaved(false) }}>
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ gap: 7 }}>
        {saving ? 'Saving…' : saved ? <><Check size={14} /> Preferences Saved!</> : 'Save Preferences'}
      </button>
    </div>
  )
}

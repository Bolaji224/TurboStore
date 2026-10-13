import { useState } from 'react'
import { User, Camera, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function Profile() {
  const { user }   = useAuth()
  const { isDark } = useTheme()

  const [form, setForm] = useState({
    name:  user?.name  || 'Bolaji Miracle',
    email: user?.email || 'bolajimiracle6@gmail.com',
    phone: '',
  })
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    setSaved(true)
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Profile</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage your personal information.</p>
      </div>

      {/* Avatar */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 28 }}>{(form.name || 'U').charAt(0).toUpperCase()}</span>
            </div>
            <button style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, background: '#16A34A', border: '2px solid var(--card-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={12} color="#fff" />
            </button>
          </div>
          <div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '0 0 2px' }}>{form.name}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 6px' }}>{form.email}</p>
            <span className="badge badge-success">Verified Account</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 20px' }}>Personal Information</h3>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Full Name</label>
              <input name="name" className="input" value={form.name} onChange={handleChange} placeholder="Your full name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Phone Number</label>
              <input name="phone" className="input" value={form.phone} onChange={handleChange} placeholder="+234 000 000 0000" />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Email Address</label>
            <input name="email" className="input" value={form.email} onChange={handleChange} placeholder="your@email.com" type="email" />
          </div>
          <button type="submit" className="btn-primary" disabled={saving} style={{ gap: 7 }}>
            {saving ? 'Saving…' : saved ? <><Check size={14} /> Saved!</> : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px' }}>Account Details</h3>
        {[
          { label: 'Account ID',   value: 'TS-00001' },
          { label: 'Date Joined',  value: 'September 2026' },
          { label: 'Account Type', value: 'Standard' },
          { label: 'Status',       value: 'Active' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

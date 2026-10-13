import { useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import adminApi from '../../services/adminApi'

const DEFAULT_SETTINGS = [
  { key: 'site_maintenance',    value: 'false',  type: 'boolean', description: 'Put site in maintenance mode' },
  { key: 'min_deposit_naira',   value: '100',    type: 'integer', description: 'Minimum deposit amount (₦)' },
  { key: 'referral_bonus_count',value: '10',     type: 'integer', description: 'Purchases needed per referral reward' },
  { key: 'support_email',       value: '',       type: 'string',  description: 'Support contact email' },
  { key: 'default_provider',    value: 'fivesim',type: 'string',  description: 'Default SMS provider' },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')
  const [dirty, setDirty]       = useState(false)

  useEffect(() => {
    adminApi.get('/settings')
      .then(({ data }) => {
        if (data.settings.length === 0) {
          setSettings(DEFAULT_SETTINGS)
          setDirty(true)
        } else {
          setSettings(data.settings)
        }
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false))
  }, [])

  function updateField(i, field, val) {
    setSettings(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
    setDirty(true)
    setSuccess('')
  }

  function addRow() {
    setSettings(prev => [...prev, { key: '', value: '', type: 'string', description: '' }])
    setDirty(true)
  }

  function removeRow(i) {
    setSettings(prev => prev.filter((_, idx) => idx !== i))
    setDirty(true)
  }

  async function save() {
    const valid = settings.filter(s => s.key.trim())
    if (!valid.length) { setError('No valid settings to save.'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      const { data } = await adminApi.post('/settings', { settings: valid })
      setSettings(data.settings)
      setDirty(false)
      setSuccess('Settings saved successfully.')
    } catch (err) { setError(err.response?.data?.message || 'Failed to save settings.') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #1E2736', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Manage system-wide configuration keys.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={addRow}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Plus size={13} /> Add Row
          </button>
          <button onClick={save} disabled={!dirty || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', borderRadius: 8, background: dirty && !saving ? '#16A34A' : '#14532D', color: '#fff', fontSize: 12, fontWeight: 600, cursor: dirty && !saving ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            <Save size={13} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error   && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>{error}</div>}
      {success && <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#4ADE80', fontSize: 13 }}>{success}</div>}

      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E2736' }}>
              {['Key', 'Type', 'Value', 'Description', ''].map(h => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {settings.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569' }}>No settings yet. Click "Add Row" to create one.</td></tr>
            )}
            {settings.map((s, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1E2736' }}>
                <td style={{ padding: '10px 14px' }}>
                  <input value={s.key} onChange={e => updateField(i, 'key', e.target.value)}
                    placeholder="setting_key"
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#E2E8F0', fontSize: 13, fontFamily: 'monospace', minWidth: 140 }} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <select value={s.type} onChange={e => updateField(i, 'type', e.target.value)}
                    style={{ background: '#0F1117', border: '1px solid #1E2736', borderRadius: 6, color: '#E2E8F0', fontSize: 12, padding: '4px 8px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                    {['string', 'integer', 'boolean', 'json'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  {s.type === 'boolean' ? (
                    <select value={s.value} onChange={e => updateField(i, 'value', e.target.value)}
                      style={{ background: '#0F1117', border: '1px solid #1E2736', borderRadius: 6, color: '#E2E8F0', fontSize: 12, padding: '4px 8px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  ) : (
                    <input value={s.value ?? ''} onChange={e => updateField(i, 'value', e.target.value)}
                      placeholder="value"
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: '#4ADE80', fontSize: 13, fontFamily: 'monospace', width: '100%', minWidth: 120 }} />
                  )}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <input value={s.description ?? ''} onChange={e => updateField(i, 'description', e.target.value)}
                    placeholder="Description…"
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#64748B', fontSize: 12, fontFamily: 'inherit', width: '100%', minWidth: 160 }} />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <button onClick={() => removeRow(i)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', padding: 4, display: 'flex', alignItems: 'center', opacity: 0.6 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: '#334155', marginTop: 12 }}>
        Changes are not saved automatically. Click "Save Changes" to persist.
      </p>
    </div>
  )
}

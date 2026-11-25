import { useEffect, useState } from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import adminApi from '../../services/adminApi'

const TABS = ['General', 'Email / SMTP', 'Paystack', 'Pricing']
const EMAIL_KEYS   = ['mail_host','mail_port','mail_username','mail_password','mail_encryption','mail_from_address','mail_from_name']
const PAYSTACK_KEYS = ['paystack_secret_key','paystack_public_key']
const PRICING_KEYS  = ['usd_ngn_rate','markup_pct','min_profit_naira']

function Field({ label, value, onChange, type = 'text', placeholder = '', hint }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%' }} />
      {hint && <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0' }}>{hint}</p>}
    </div>
  )
}

function SaveBar({ saving, success, error, onSave, dirty }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
      <button className="btn-primary" onClick={onSave} disabled={saving || !dirty} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
        <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
      </button>
      {success && <span style={{ fontSize: 13, color: '#4ADE80' }}>{success}</span>}
      {error   && <span style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</span>}
    </div>
  )
}

export default function AdminSettings() {
  const [tab, setTab]           = useState('General')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')
  const [dirty, setDirty]       = useState(false)

  const [general, setGeneral]   = useState([])
  const [email, setEmail]       = useState({ mail_host: '', mail_port: '587', mail_username: '', mail_password: '', mail_encryption: 'tls', mail_from_address: '', mail_from_name: '' })
  const [paystack, setPaystack] = useState({ paystack_secret_key: '', paystack_public_key: '' })
  const [pricing, setPricing]   = useState({ usd_ngn_rate: '1600', markup_pct: '30', min_profit_naira: '500' })
  const [overrides, setOverrides] = useState([])
  const [newOvr, setNewOvr]     = useState({ country: '', service: '', price: '' })

  useEffect(() => {
    setLoading(true)
    adminApi.get('/settings')
      .then(({ data }) => {
        const map = {}
        ;(data.settings || []).forEach(s => { map[s.key] = s })

        setEmail(prev  => Object.fromEntries(Object.keys(prev).map(k => [k, map[k]?.value ?? prev[k]])))
        setPaystack(prev => Object.fromEntries(Object.keys(prev).map(k => [k, map[k]?.value ?? prev[k]])))
        setPricing(prev => Object.fromEntries(Object.keys(prev).map(k => [k, map[k]?.value ?? prev[k]])))

        setOverrides(
          Object.entries(map)
            .filter(([k]) => k.startsWith('price_override.'))
            .map(([k, v]) => { const p = k.split('.'); return { key: k, country: p[1] || '', service: p[2] || '', price: v.value } })
        )

        const usedKeys = new Set([...EMAIL_KEYS, ...PAYSTACK_KEYS, ...PRICING_KEYS])
        const gen = (data.settings || []).filter(s => !usedKeys.has(s.key) && !s.key.startsWith('price_override.'))
        setGeneral(gen.length > 0 ? gen : [
          { key: 'site_maintenance',    value: 'false',   type: 'boolean', description: 'Put site in maintenance mode' },
          { key: 'min_deposit_naira',   value: '100',     type: 'integer', description: 'Minimum deposit amount (₦)' },
          { key: 'referral_bonus_count',value: '10',      type: 'integer', description: 'Purchases needed per referral reward' },
          { key: 'support_email',       value: '',        type: 'string',  description: 'Support contact email' },
          { key: 'default_provider',    value: 'fivesim', type: 'string',  description: 'Default SMS provider' },
        ])
      })
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false))
  }, [])

  function markDirty() { setDirty(true); setSuccess(''); setError('') }

  async function saveSettings(entries) {
    setSaving(true); setSuccess(''); setError('')
    try {
      await adminApi.post('/settings', { settings: entries.filter(s => s.key?.trim()) })
      setSuccess('Saved.'); setDirty(false)
    } catch (err) { setError(err.response?.data?.message || 'Failed to save.') }
    finally { setSaving(false) }
  }

  function saveGeneral() { saveSettings(general) }

  function saveEmail() {
    const labels = { mail_host: 'SMTP host', mail_port: 'SMTP port', mail_username: 'SMTP username', mail_password: 'SMTP password', mail_encryption: 'SMTP encryption', mail_from_address: 'From address', mail_from_name: 'From name' }
    saveSettings(Object.entries(email).map(([key, value]) => ({ key, value, type: key === 'mail_port' ? 'integer' : 'string', description: labels[key] || key })))
  }

  function savePaystack() {
    saveSettings([
      { key: 'paystack_secret_key', value: paystack.paystack_secret_key, type: 'string', description: 'Paystack secret key' },
      { key: 'paystack_public_key', value: paystack.paystack_public_key, type: 'string', description: 'Paystack public key' },
    ])
  }

  async function savePricing() {
    const entries = [
      { key: 'usd_ngn_rate',     value: pricing.usd_ngn_rate,    type: 'integer', description: 'USD → NGN exchange rate' },
      { key: 'markup_pct',       value: pricing.markup_pct,       type: 'integer', description: 'Markup % over provider cost' },
      { key: 'min_profit_naira', value: pricing.min_profit_naira, type: 'integer', description: 'Minimum flat profit per order (₦)' },
      ...overrides.map(o => ({ key: `price_override.${o.country.toLowerCase()}.${o.service.toLowerCase()}`, value: o.price, type: 'integer', description: `Fixed price: ${o.country}/${o.service}` })),
    ]
    saveSettings(entries)
  }

  async function deleteOverride(key) {
    try { await adminApi.delete(`/settings/${key}`); setOverrides(p => p.filter(o => o.key !== key)) } catch {}
  }

  function addOverride() {
    if (!newOvr.country.trim() || !newOvr.service.trim() || !newOvr.price) return
    const key = `price_override.${newOvr.country.trim().toLowerCase()}.${newOvr.service.trim().toLowerCase()}`
    setOverrides(p => [...p.filter(o => o.key !== key), { key, ...newOvr }])
    setNewOvr({ country: '', service: '', price: '' })
    markDirty()
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #1E2736', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: '1px solid #1E2736' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setDirty(false); setSuccess(''); setError('') }}
            style={{ padding: '9px 20px', background: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid #16A34A' : '2px solid transparent', color: tab === t ? '#4ADE80' : '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {tab === 'General' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 110px 36px', gap: 8, marginBottom: 4 }}>
            {['Key', 'Value', 'Type', ''].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{h}</span>)}
          </div>
          {general.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 110px 36px', gap: 8, alignItems: 'center' }}>
              <input className="input" placeholder="key" value={s.key} onChange={e => { const g=[...general]; g[i]={...g[i],key:e.target.value}; setGeneral(g); markDirty() }} style={{ fontSize: 12 }} />
              <input className="input" placeholder="value" value={s.value} onChange={e => { const g=[...general]; g[i]={...g[i],value:e.target.value}; setGeneral(g); markDirty() }} style={{ fontSize: 12 }} />
              <select className="input" value={s.type} onChange={e => { const g=[...general]; g[i]={...g[i],type:e.target.value}; setGeneral(g); markDirty() }} style={{ fontSize: 12 }}>
                {['string','integer','boolean','json'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => { setGeneral(p=>p.filter((_,j)=>j!==i)); markDirty() }} style={{ background:'transparent',border:'1px solid #EF4444',borderRadius:8,color:'#EF4444',cursor:'pointer',height:38,display:'flex',alignItems:'center',justifyContent:'center' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button className="btn-secondary" style={{ fontSize: 13, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }} onClick={() => { setGeneral(p=>[...p,{key:'',value:'',type:'string',description:''}]); markDirty() }}>
            <Plus size={13} /> Add Row
          </button>
          <SaveBar saving={saving} success={success} error={error} onSave={saveGeneral} dirty={dirty} />
        </div>
      )}

      {/* ── Email / SMTP ── */}
      {tab === 'Email / SMTP' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Overrides <code style={{ background:'#1E2736',padding:'1px 6px',borderRadius:4 }}>.env</code> mail settings live — no redeploy needed.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="SMTP Host" value={email.mail_host} onChange={v => { setEmail(p=>({...p,mail_host:v})); markDirty() }} placeholder="mail.turbostores.store" />
            <Field label="SMTP Port" value={email.mail_port} onChange={v => { setEmail(p=>({...p,mail_port:v})); markDirty() }} placeholder="587" type="number" />
            <Field label="Username" value={email.mail_username} onChange={v => { setEmail(p=>({...p,mail_username:v})); markDirty() }} placeholder="noreply@turbostores.store" />
            <Field label="Password" value={email.mail_password} onChange={v => { setEmail(p=>({...p,mail_password:v})); markDirty() }} type="password" placeholder="••••••••" />
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 5 }}>Encryption</label>
              <select className="input" style={{ width: '100%' }} value={email.mail_encryption} onChange={e => { setEmail(p=>({...p,mail_encryption:e.target.value})); markDirty() }}>
                <option value="tls">TLS (recommended)</option>
                <option value="ssl">SSL</option>
                <option value="">None</option>
              </select>
            </div>
            <Field label="From Address" value={email.mail_from_address} onChange={v => { setEmail(p=>({...p,mail_from_address:v})); markDirty() }} placeholder="noreply@turbostores.store" />
          </div>
          <Field label="From Name" value={email.mail_from_name} onChange={v => { setEmail(p=>({...p,mail_from_name:v})); markDirty() }} placeholder="Turbostore" />
          <SaveBar saving={saving} success={success} error={error} onSave={saveEmail} dirty={dirty} />
        </div>
      )}

      {/* ── Paystack ── */}
      {tab === 'Paystack' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Overrides <code style={{ background:'#1E2736',padding:'1px 6px',borderRadius:4 }}>.env</code> Paystack keys live. Use <strong style={{ color:'#E2E8F0' }}>sk_live_</strong> / <strong style={{ color:'#E2E8F0' }}>pk_live_</strong> for production.</p>
          <Field label="Secret Key (sk_live_…)" value={paystack.paystack_secret_key} onChange={v => { setPaystack(p=>({...p,paystack_secret_key:v})); markDirty() }} type="password" placeholder="sk_live_…" hint="Never share this. Backend only." />
          <Field label="Public Key (pk_live_…)" value={paystack.paystack_public_key} onChange={v => { setPaystack(p=>({...p,paystack_public_key:v})); markDirty() }} placeholder="pk_live_…" hint="Safe to use in the frontend." />
          <SaveBar saving={saving} success={success} error={error} onSave={savePaystack} dirty={dirty} />
        </div>
      )}

      {/* ── Pricing ── */}
      {tab === 'Pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field label="USD → NGN Rate" value={pricing.usd_ngn_rate} onChange={v => { setPricing(p=>({...p,usd_ngn_rate:v})); markDirty() }} type="number" placeholder="1600" hint="e.g. 1600" />
            <Field label="Markup %" value={pricing.markup_pct} onChange={v => { setPricing(p=>({...p,markup_pct:v})); markDirty() }} type="number" placeholder="30" hint="30 = 30% over cost" />
            <Field label="Min Profit (₦)" value={pricing.min_profit_naira} onChange={v => { setPricing(p=>({...p,min_profit_naira:v})); markDirty() }} type="number" placeholder="500" hint="Floor profit per order" />
          </div>

          <div style={{ borderTop: '1px solid #1E2736', paddingTop: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', margin: '0 0 4px' }}>Fixed Price Overrides</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 14px', lineHeight: 1.6 }}>
              Set a fixed naira price for a specific country + service, bypassing the markup formula entirely.<br />
              Country and service must match the provider's exact code — e.g. <code style={{ background:'#1E2736',padding:'1px 5px',borderRadius:4 }}>usa</code> / <code style={{ background:'#1E2736',padding:'1px 5px',borderRadius:4 }}>whatsapp</code>.
            </p>

            {overrides.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 36px', gap: 8 }}>
                  {['Country', 'Service', 'Fixed Price (₦)', ''].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{h}</span>)}
                </div>
                {overrides.map(o => (
                  <div key={o.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 36px', gap: 8, alignItems: 'center' }}>
                    <input className="input" value={o.country} readOnly style={{ opacity: 0.6, fontSize: 13 }} />
                    <input className="input" value={o.service} readOnly style={{ opacity: 0.6, fontSize: 13 }} />
                    <input className="input" type="number" value={o.price} onChange={e => { setOverrides(p => p.map(x => x.key===o.key ? {...x,price:e.target.value} : x)); markDirty() }} style={{ fontSize: 13 }} />
                    <button onClick={() => deleteOverride(o.key)} style={{ background:'transparent',border:'1px solid #EF4444',borderRadius:8,color:'#EF4444',cursor:'pointer',height:38,display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 80px', gap: 8, alignItems: 'center' }}>
              <input className="input" placeholder="Country (e.g. usa)" value={newOvr.country} onChange={e => setNewOvr(p=>({...p,country:e.target.value}))} style={{ fontSize: 13 }} />
              <input className="input" placeholder="Service (e.g. whatsapp)" value={newOvr.service} onChange={e => setNewOvr(p=>({...p,service:e.target.value}))} style={{ fontSize: 13 }} />
              <input className="input" type="number" placeholder="4000" value={newOvr.price} onChange={e => setNewOvr(p=>({...p,price:e.target.value}))} style={{ fontSize: 13 }} />
              <button className="btn-secondary" onClick={addOverride} style={{ fontSize: 13, display:'flex',alignItems:'center',justifyContent:'center',gap:5,height:38 }}>
                <Plus size={13} /> Add
              </button>
            </div>
          </div>

          <SaveBar saving={saving} success={success} error={error} onSave={savePricing} dirty={dirty} />
        </div>
      )}
    </div>
  )
}

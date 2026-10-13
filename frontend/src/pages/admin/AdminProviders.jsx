import { useState } from 'react'
import { CheckCircle, ExternalLink, Boxes } from 'lucide-react'
import adminApi from '../../services/adminApi'

const PROVIDERS = [
  {
    id:      'fivesim',
    name:    '5SIM',
    website: 'https://5sim.net',
    desc:    'Global virtual phone number provider with large country coverage.',
    features: ['200+ countries', 'Instant activation', 'Wide service coverage'],
  },
  {
    id:      'smspool',
    name:    'SMSPool',
    website: 'https://smspool.net',
    desc:    'High-quality SMS verification numbers from multiple regions.',
    features: ['Real numbers', 'Low prices', 'Fast delivery'],
  },
  {
    id:      'grizzly',
    name:    'GrizzlySMS',
    website: 'https://grizzlysms.com',
    desc:    'Reliable SMS activation service with competitive pricing.',
    features: ['Stable uptime', 'Bulk available', 'API support'],
  },
]

export default function AdminProviders() {
  const [testing, setTesting]   = useState({})
  const [results, setResults]   = useState({})

  async function testProvider(id) {
    setTesting(p => ({ ...p, [id]: true }))
    setResults(p => ({ ...p, [id]: null }))
    try {
      // Hit the public countries endpoint as a health check
      const { data } = await adminApi.get(`/../../numbers/countries?provider=${id}`)
      const count = Array.isArray(data?.countries) ? data.countries.length : Object.keys(data?.countries ?? {}).length
      setResults(p => ({ ...p, [id]: { ok: true, msg: `OK — ${count} countries loaded` } }))
    } catch (err) {
      setResults(p => ({ ...p, [id]: { ok: false, msg: err.response?.data?.message || 'Connection failed' } }))
    } finally {
      setTesting(p => ({ ...p, [id]: false }))
    }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
        Configured SMS providers. Provider credentials are set via environment variables.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {PROVIDERS.map(p => (
          <div key={p.id} style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Boxes size={16} color="#16A34A" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>{p.name}</p>
                  <a href={p.website} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                    onClick={e => e.stopPropagation()}>
                    {p.website.replace('https://', '')} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22C55E', flexShrink: 0, marginTop: 4, boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
            </div>

            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.5 }}>{p.desc}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
              {p.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={12} color="#16A34A" />
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>{f}</span>
                </div>
              ))}
            </div>

            {results[p.id] && (
              <div style={{ padding: '8px 10px', borderRadius: 6, marginBottom: 10, background: results[p.id].ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${results[p.id].ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: 12, color: results[p.id].ok ? '#4ADE80' : '#EF4444' }}>
                {results[p.id].msg}
              </div>
            )}

            <button onClick={() => testProvider(p.id)} disabled={testing[p.id]}
              style={{ width: '100%', padding: '8px', border: '1px solid #1E2736', borderRadius: 8, background: 'transparent', color: testing[p.id] ? '#475569' : '#94A3B8', fontSize: 12, fontWeight: 600, cursor: testing[p.id] ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
              onMouseEnter={e => { if (!testing[p.id]) { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.color = '#4ADE80' }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E2736'; e.currentTarget.style.color = testing[p.id] ? '#475569' : '#94A3B8' }}>
              {testing[p.id] ? 'Testing…' : 'Test Connection'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

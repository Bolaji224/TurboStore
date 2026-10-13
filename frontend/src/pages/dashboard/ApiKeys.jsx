import { Key, Zap, Lock, Code2, ArrowRight, Bell } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const FEATURES = [
  {
    icon: Key,
    color: '#16A34A',
    darkBg: 'rgba(22,163,74,0.15)',
    lightBg: '#F0FDF4',
    title: 'Secure API Keys',
    desc: 'Generate and manage scoped API keys with fine-grained permissions and automatic rotation.',
  },
  {
    icon: Zap,
    color: '#F59E0B',
    darkBg: 'rgba(245,158,11,0.15)',
    lightBg: '#FFFBEB',
    title: 'Instant Number Provisioning',
    desc: 'Buy virtual numbers programmatically in milliseconds. No dashboard required.',
  },
  {
    icon: Lock,
    color: '#3B82F6',
    darkBg: 'rgba(59,130,246,0.15)',
    lightBg: '#EFF6FF',
    title: 'Webhook Delivery',
    desc: 'Receive OTPs and status updates directly to your endpoint the moment they arrive.',
  },
  {
    icon: Code2,
    color: '#8B5CF6',
    darkBg: 'rgba(139,92,246,0.15)',
    lightBg: '#F5F3FF',
    title: 'SDK Support',
    desc: 'Official SDKs for Node.js, Python, and PHP — plus a full OpenAPI spec.',
  },
]

export default function ApiKeys() {
  const { isDark } = useTheme()

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 0' }}>

      {/* Badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4', border: isDark ? '1px solid rgba(22,163,74,0.3)' : '1px solid #DCFCE7', borderRadius: 999, padding: '6px 16px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 0 3px rgba(22,163,74,0.25)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', letterSpacing: '.08em' }}>IN DEVELOPMENT</span>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ width: 80, height: 80, background: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4', border: isDark ? '2px solid rgba(22,163,74,0.2)' : '2px solid #DCFCE7', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Key size={36} color="#16A34A" />
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
          Developer API
          <br />
          <span style={{ color: '#16A34A' }}>Coming Soon</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', margin: '0 auto', maxWidth: 480, lineHeight: 1.7 }}>
          We're building a powerful REST API so you can integrate TurboStore's virtual number
          verification directly into your apps and workflows.
        </p>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 40 }}>
        {FEATURES.map(f => (
          <div key={f.title} className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 42, height: 42, background: isDark ? f.darkBg : f.lightBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <f.icon size={20} color={f.color} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 5px' }}>{f.title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={15} color="#16A34A" /> Roadmap
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { phase: 'Phase 1', label: 'Core API — buy, poll, cancel numbers', status: 'Building', done: false, active: true },
            { phase: 'Phase 2', label: 'Webhook delivery for OTP events',       status: 'Planned',  done: false, active: false },
            { phase: 'Phase 3', label: 'SDK releases (Node.js, Python, PHP)',    status: 'Planned',  done: false, active: false },
            { phase: 'Phase 4', label: 'OpenAPI spec & interactive docs',        status: 'Planned',  done: false, active: false },
          ].map((item, i, arr) => (
            <div key={item.phase} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: i < arr.length - 1 ? 20 : 0, position: 'relative' }}>
              {/* Line */}
              {i < arr.length - 1 && (
                <div style={{ position: 'absolute', left: 11, top: 28, width: 2, bottom: 0, background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }} />
              )}
              {/* Dot */}
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: item.active ? '#16A34A' : (isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9'), border: item.active ? '3px solid rgba(22,163,74,0.25)' : '2px solid ' + (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                {item.active && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: item.active ? '#16A34A' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{item.phase}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: item.active ? (isDark ? 'rgba(22,163,74,0.2)' : '#DCFCE7') : (isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9'), color: item.active ? '#16A34A' : 'var(--text-muted)' }}>
                    {item.status}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, fontWeight: item.active ? 600 : 400 }}>{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notify CTA */}
      <div style={{ background: 'linear-gradient(135deg, #063B2D, #16A34A)', borderRadius: 16, padding: '28px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={22} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Be the first to know</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>We'll notify you at your registered email when the API launches.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>You're on the list</span>
          <CheckBadge />
        </div>
      </div>
    </div>
  )
}

function CheckBadge() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="rgba(255,255,255,0.2)" />
      <path d="M5 8l2 2 4-4" stroke="#4ADE80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

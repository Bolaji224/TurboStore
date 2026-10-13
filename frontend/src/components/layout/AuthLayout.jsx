import Logo from '../shared/Logo'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel */}
      <div style={{
        flex: '0 0 480px',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 48px',
        justifyContent: 'center',
      }}>
        <div style={{ marginBottom: 40 }}>
          <Logo size="lg" />
        </div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>{title}</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{subtitle}</p>
        </div>
        {children}
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #063B2D 0%, #075E45 50%, #16A34A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(74,222,128,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(74,222,128,0.06)', pointerEvents: 'none' }} />

        {/* Phone mockup */}
        <div style={{
          width: 220,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 28,
          padding: 20,
          marginBottom: 36,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 16px', marginBottom: 10 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Number</p>
            <p style={{ color: '#4ADE80', fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>+1 (555) 234-5678</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
              <span style={{ color: '#4ADE80', fontSize: 10, fontWeight: 600 }}>WhatsApp Verified</span>
            </div>
          </div>
          {['SMS from WhatsApp', 'Your code: 482751', 'Valid for 10 mins'].map((txt, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>{txt}</p>
            </div>
          ))}
        </div>

        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 10px', textAlign: 'center' }}>
          Virtual Numbers for Any Platform
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', maxWidth: 300, lineHeight: 1.6, margin: 0 }}>
          Get instant OTP verification numbers for WhatsApp, Telegram, Google, and 50+ platforms worldwide.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 24, marginTop: 32 }}>
          {[['50+', 'Platforms'], ['180+', 'Countries'], ['99.9%', 'Uptime']].map(([val, lbl]) => (
            <div key={lbl} style={{ textAlign: 'center' }}>
              <p style={{ color: '#4ADE80', fontSize: 18, fontWeight: 800, margin: 0 }}>{val}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>{lbl}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

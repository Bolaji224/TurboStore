import Logo from '../shared/Logo'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Left panel: form ── */}
      <div style={{
        flex: '0 0 460px',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        padding: '52px 48px',
        justifyContent: 'center',
        boxShadow: '4px 0 40px rgba(0,0,0,0.06)',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ marginBottom: 44 }}>
          <Logo size="lg" />
        </div>

        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 27, fontWeight: 800, color: '#0F172A', margin: '0 0 7px', letterSpacing: '-0.5px' }}>{title}</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
        </div>

        {children}
      </div>

      {/* ── Right panel: dark premium ── */}
      <div className="landing-dot-grid" style={{
        flex: 1,
        background: '#030C06',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated orbs */}
        <div className="orb-1" style={{ position: 'absolute', top: '-10%', right: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(22,163,74,0.22) 0%, transparent 68%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div className="orb-2" style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(5,150,105,0.16) 0%, transparent 68%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div className="orb-3" style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(74,222,128,0.08) 0%, transparent 68%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        {/* Phone image */}
        <img
          src="/phone-hero.png"
          alt="TurboStore App"
          className="phone-float"
          style={{
            height: 420,
            width: 'auto',
            objectFit: 'contain',
            position: 'relative',
            zIndex: 10,
            marginBottom: 40,
            filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.55)) drop-shadow(0 0 60px rgba(22,163,74,0.2))',
          }}
        />

        {/* Copy */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10, maxWidth: 340 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
            Instant numbers for<br />
            <span className="gradient-text" style={{ fontSize: '1em' }}>any platform, worldwide.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 14, margin: '0 0 32px', lineHeight: 1.7 }}>
            Virtual phone numbers from 180+ countries. Receive OTPs in real-time for WhatsApp, Telegram, Google, and 50+ services.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 28 }}>
            {[['50K+', 'Users'], ['180+', 'Countries'], ['99.9%', 'Uptime']].map(([val, lbl]) => (
              <div key={lbl} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#4ADE80', letterSpacing: '-0.5px' }}>{val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 500 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hide right panel on small screens */}
      <style>{`
        @media (max-width: 860px) {
          .auth-right-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}

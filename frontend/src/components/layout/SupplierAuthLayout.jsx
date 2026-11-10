import Logo from '../shared/Logo'

export default function SupplierAuthLayout({ children, title, subtitle }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Left panel: form ── */}
      <div className="auth-left-panel" style={{
        flex: '0 0 480px',
        background: '#0D1117',
        display: 'flex',
        flexDirection: 'column',
        padding: '52px 48px',
        justifyContent: 'center',
        boxShadow: '4px 0 40px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ marginBottom: 8 }}>
          <Logo size="lg" />
        </div>

        {/* Supplier badge */}
        <div style={{ marginBottom: 36 }}>
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#4ADE80', background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.25)', borderRadius: 6, padding: '3px 10px',
          }}>
            Supplier Portal
          </span>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 27, fontWeight: 800, color: '#E2E8F0', margin: '0 0 7px', letterSpacing: '-0.5px' }}>{title}</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
        </div>

        {children}
      </div>

      {/* ── Right panel: supplier value prop ── */}
      <div className="auth-right-panel landing-dot-grid" style={{
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
        {/* Orbs */}
        <div style={{ position: 'absolute', top: '-10%', right: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(22,163,74,0.22) 0%, transparent 68%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(5,150,105,0.16) 0%, transparent 68%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(74,222,128,0.08) 0%, transparent 68%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        {/* Icon */}
        <div style={{ position: 'relative', zIndex: 10, marginBottom: 40 }}>
          <div style={{
            width: 100, height: 100, borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(22,163,74,0.3), rgba(6,59,45,0.6))',
            border: '1px solid rgba(74,222,128,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(22,163,74,0.2)',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        </div>

        {/* Copy */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10, maxWidth: 380 }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.8px', lineHeight: 1.2 }}>
            Sell your services to<br />
            <span className="gradient-text" style={{ fontSize: '1em' }}>50,000+ active buyers.</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 14, margin: '0 0 40px', lineHeight: 1.8 }}>
            List your social media, marketing and growth services on Turbostore. Get paid automatically when buyers confirm delivery.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', textAlign: 'left' }}>
            {[
              ['Automatic payouts', 'Earnings released to your account within 48 hours of confirmation'],
              ['Zero upfront cost', 'No listing fees. We only charge a 10% commission on completed orders'],
              ['Full dashboard', 'Track orders, manage services, and monitor earnings in real time'],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#4ADE80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .auth-right-panel  { display: none !important; }
          .auth-left-panel   { flex: 1 1 100% !important; min-width: 0 !important; }
        }
        @media (max-width: 480px) {
          .auth-left-panel   { padding: 40px 24px !important; }
        }
      `}</style>
    </div>
  )
}

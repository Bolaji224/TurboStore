import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Globe, Zap, CreditCard, Code, ArrowRight,
  ChevronDown, ChevronUp, Check, Wallet, Phone, Sun, Moon
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const FEATURES = [
  { icon: Shield,      title: 'Secure & Reliable',         desc: 'Your privacy comes first.' },
  { icon: Globe,       title: 'Global Coverage',            desc: 'Numbers from multiple countries.' },
  { icon: Zap,         title: 'Instant Delivery',           desc: 'Get your number and OTP in seconds.' },
  { icon: Wallet,      title: 'Affordable Pricing',         desc: 'Get more value for your money.' },
  { icon: CreditCard,  title: 'Multiple Payment Options',   desc: 'Fund your wallet with ease.' },
  { icon: Code,        title: 'Developer Friendly',         desc: 'Power your apps with our API.' },
]

const STEPS = [
  { n: '01', title: 'Create Account',  desc: 'Create your TurboStore account in seconds.' },
  { n: '02', title: 'Fund Wallet',     desc: 'Add funds securely to your TurboStore wallet.' },
  { n: '03', title: 'Choose Number',   desc: 'Select a country, service and available number.' },
  { n: '04', title: 'Receive OTP',     desc: 'Receive the SMS verification code and complete your verification.' },
]

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'USA' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'PL', name: 'Poland' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'JP', name: 'Japan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'SG', name: 'Singapore' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GH', name: 'Ghana' },
  { code: 'MA', name: 'Morocco' },
  { code: 'RO', name: 'Romania' },
  { code: 'TR', name: 'Turkey' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'RS', name: 'Serbia' },
]

const FAQS = [
  { q: 'What is TurboStore?',                   a: 'TurboStore is a virtual number and SMS OTP verification platform for developers, businesses and digital teams.' },
  { q: 'How does TurboStore work?',              a: 'Fund your wallet, pick a country and service, receive a temporary number, then get the OTP SMS in your dashboard.' },
  { q: 'How do I buy a virtual number?',         a: 'Go to Buy Number, choose your country and platform, confirm, and the number is assigned instantly.' },
  { q: 'Which countries are supported?',         a: 'TurboStore supports numbers from 180+ countries globally.' },
  { q: 'How does pricing work?',                 a: 'You pay per successful verification. Prices vary by country and platform. All pricing is visible before purchase.' },
  { q: "What happens if an OTP isn't received?", a: 'If no OTP arrives within 10 minutes the order is auto-refunded to your wallet.' },
  { q: 'Can I use TurboStore through an API?',   a: 'Yes — generate an API key in your dashboard and use our REST API to automate number purchases.' },
  { q: 'How do I fund my wallet?',               a: 'Click Fund Wallet, enter an amount, and pay securely via Paystack with card, bank transfer or USSD.' },
]

function FeatureIcon({ icon: Icon }) {
  return (
    <div style={{ width: 48, height: 48, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, flexShrink: 0 }}>
      <Icon size={22} color="#16A34A" strokeWidth={1.8} />
    </div>
  )
}

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null)
  const { isDark, toggle } = useTheme()
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#E8F5ED'
  const muted  = isDark ? 'rgba(255,255,255,0.45)' : '#64748B'

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: 'hidden', background: 'var(--page-bg)', color: 'var(--text)', transition: 'background .25s, color .25s' }}>

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: isDark ? 'rgba(3,26,17,0.97)' : 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${border}`, transition: 'background .25s' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(145deg,#16A34A,#063B2D)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 3h12l-6 6h4.5l-7.5 8 2.5-6H4.5L10 5H4V3z" fill="#4ADE80"/>
              </svg>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: isDark ? '#4ADE80' : '#063B2D' }}>TurboStore</span>
          </Link>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={toggle}
              style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, transition: 'background .2s' }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: muted, textDecoration: 'none', padding: '7px 16px', borderRadius: 8 }}>Login</Link>
            <Link to="/register" style={{ background: 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', borderRadius: 10, padding: '9px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 2px 10px rgba(22,163,74,.3)' }}>
              Create Account
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section id="hero" style={{ background: 'var(--page-bg)', position: 'relative', overflow: 'hidden' }}>

        <div style={{ position: 'absolute', top: -120, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, #DCFCE7 0%, transparent 70%)', pointerEvents: 'none', opacity: isDark ? 0.08 : 1 }} />
        <div style={{ position: 'absolute', top: 60, right: 120, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, #BBF7D0 0%, transparent 65%)', pointerEvents: 'none', opacity: isDark ? 0.06 : 1 }} />

        {/* Page header with logo + tagline */}
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '36px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <div style={{ width: 58, height: 58, background: 'linear-gradient(145deg,#16A34A,#063B2D)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(22,163,74,.35)' }}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path d="M6 4h18l-9 9h7l-11 13 3.5-9H7l9-10H6V4z" fill="#4ADE80"/>
                </svg>
              </div>
              <span style={{ fontSize: 36, fontWeight: 900, color: isDark ? '#4ADE80' : '#063B2D', letterSpacing: '-1px' }}>Turbostore</span>
            </div>
            <p style={{ fontSize: 13, color: muted, margin: 0, letterSpacing: '0.03em' }}>
              Virtual Numbers &nbsp;•&nbsp; OTP Verification &nbsp;•&nbsp; Global Access
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingTop: 6 }}>
            <div style={{ width: 3, height: 52, background: '#16A34A', borderRadius: 4, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px', lineHeight: 1.25 }}>Verify. Register. Build.</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0, lineHeight: 1.25 }}>Without Limits.</p>
            </div>
          </div>
        </div>

        {/* Hero content: left text + right phone */}
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 24px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start', minHeight: 560 }}>

          {/* LEFT */}
          <div style={{ paddingBottom: 48, paddingTop: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#063B2D', color: '#4ADE80', borderRadius: 999, padding: '7px 20px', marginBottom: 24 }}>
              <Zap size={13} fill="#4ADE80" color="#4ADE80" />
              <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.07em' }}>WE'RE LIVE</span>
            </div>

            <h1 style={{ margin: '0 0 20px', lineHeight: 1.06, letterSpacing: '-1.5px' }}>
              <span style={{ display: 'block', fontSize: 'clamp(44px,5vw,68px)', fontWeight: 900, color: 'var(--text)' }}>Your Trusted</span>
              <span style={{ display: 'block', fontSize: 'clamp(44px,5vw,68px)', fontWeight: 900, color: '#16A34A' }}>Virtual Number &amp;</span>
              <span style={{ display: 'block', fontSize: 'clamp(44px,5vw,68px)', fontWeight: 900, color: isDark ? '#4ADE80' : '#063B2D' }}>OTP Platform</span>
            </h1>

            <p style={{ fontSize: 16, color: muted, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 460 }}>
              Get temporary virtual phone numbers, receive SMS OTPs, and complete your verifications — quickly, securely, and affordably.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '22px 16px' }}>
              {FEATURES.map(f => (
                <div key={f.title}>
                  <FeatureIcon icon={f.icon} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', lineHeight: 1.3 }}>{f.title}</p>
                  <p style={{ fontSize: 12, color: muted, margin: 0, lineHeight: 1.45 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — phone mockup (intentionally light/fixed colors as phone screen UI) */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 0 }}>

            <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #16A34A 0%, #063B2D 60%, transparent 80%)', opacity: 0.18, pointerEvents: 'none' }} />

            <div style={{ position: 'absolute', top: 20, right: 10, zIndex: 20, background: '#fff', borderRadius: 18, padding: '12px 22px', boxShadow: '0 8px 32px rgba(22,163,74,.22)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, color: '#16A34A', fontWeight: 900, letterSpacing: 4 }}>* * *</span>
            </div>

            <div style={{ position: 'absolute', bottom: 100, left: 10, zIndex: 20, width: 56, height: 56, background: 'linear-gradient(135deg,#16A34A,#4ADE80)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(22,163,74,.45)' }}>
              <Phone size={24} color="#fff" fill="#fff" />
            </div>

            <div style={{ width: 295, background: '#0B1F14', borderRadius: 50, padding: '16px 12px 20px', boxShadow: '0 40px 90px rgba(6,59,45,.5), 0 0 0 1.5px rgba(255,255,255,.06)', position: 'relative', zIndex: 10 }}>
              <div style={{ width: 100, height: 28, background: '#0B1F14', borderRadius: 14, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1a2e1f' }} />
              </div>

              <div style={{ background: '#fff', borderRadius: 36, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 22, height: 22, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                        <path d="M4 3h12l-6 6h4.5l-7.5 8 2.5-6H4.5L10 5H4V3z" fill="#4ADE80"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#063B2D' }}>Turbostore</span>
                  </div>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#94A3B8' }} />)}
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg,#063B2D 0%,#16A34A 100%)', margin: '0 12px 12px', borderRadius: 18, padding: '18px 18px 16px' }}>
                  <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 10.5, margin: '0 0 5px', fontWeight: 600, letterSpacing: '.04em' }}>Wallet Balance</p>
                  <p style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 14px', letterSpacing: '-.5px' }}>₦25,000.00</p>
                  <div style={{ background: 'rgba(255,255,255,.18)', borderRadius: 10, padding: '8px 0', textAlign: 'center', cursor: 'pointer' }}>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>+ Fund Wallet</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '0 10px 12px', gap: 4, textAlign: 'center' }}>
                  {[{ emoji: '📞', lbl: 'Buy Number' },{ emoji: '📋', lbl: 'My Orders' },{ emoji: '👛', lbl: 'Wallet' },{ emoji: '⚙️', lbl: 'Settings' }].map(a => (
                    <div key={a.lbl}>
                      <div style={{ width: 40, height: 40, background: '#F0FDF4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px', fontSize: 17 }}>{a.emoji}</div>
                      <p style={{ fontSize: 9, color: '#475569', margin: 0, fontWeight: 500, lineHeight: 1.2 }}>{a.lbl}</p>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '0 12px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}>Popular Countries</span>
                    <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>View All</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[{ flag:'🇺🇸', name:'United States', code:'+1' },{ flag:'🇬🇧', name:'United Kingdom', code:'+44' },{ flag:'🇨🇦', name:'Canada', code:'+1' },{ flag:'🇩🇪', name:'Germany', code:'+49' }].map(c => (
                      <div key={c.name} style={{ background: '#F8FAF9', borderRadius: 10, padding: '7px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>{c.flag}</span>
                          <div>
                            <p style={{ fontSize: 9.5, fontWeight: 700, color: '#0F172A', margin: 0 }}>{c.name}</p>
                            <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>{c.code}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>›</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '0 12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}>Recent Orders</span>
                    <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 600 }}>View All</span>
                  </div>
                  <div style={{ background: '#F8FAF9', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🇺🇸</span>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', margin: 0 }}>WhatsApp</p>
                          <p style={{ fontSize: 9.5, color: '#94A3B8', margin: 0, fontFamily: 'monospace' }}>+1 234 567 8900</p>
                        </div>
                      </div>
                      <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 9.5, fontWeight: 700, borderRadius: 6, padding: '2px 8px' }}>Delivered</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10.5, color: '#475569' }}>OTP: <strong style={{ color: '#16A34A', fontFamily: 'monospace', letterSpacing: '1px' }}>4821</strong></span>
                      <span style={{ fontSize: 9.5, color: '#94A3B8' }}>2 mins ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,.25)', borderRadius: 2, margin: '12px auto 0' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section id="how" style={{ background: 'var(--section-alt)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', letterSpacing: '.08em', textTransform: 'uppercase' }}>Simple Process</span>
            <h2 style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)', margin: '8px 0 12px', letterSpacing: '-1px' }}>How It Works</h2>
            <p style={{ fontSize: 16, color: muted, margin: 0 }}>Four simple steps to get your OTP verified.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ background: 'var(--card-bg)', border: `1px solid ${border}`, borderRadius: 18, padding: 28, position: 'relative' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#16A34A', marginBottom: 14, opacity: .5 }}>{s.n}</div>
                <div style={{ width: 48, height: 48, background: isDark ? 'rgba(22,163,74,0.2)' : 'linear-gradient(135deg,#F0FDF4,#DCFCE7)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 22 }}>
                  {['🔐','💳','📱','✅'][i]}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: muted, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, background: isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4', border: `1.5px solid ${border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                    <ArrowRight size={12} color="#16A34A" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          COUNTRIES
      ══════════════════════════════════════════ */}
      <section id="countries" style={{ padding: '80px 24px', background: 'var(--page-bg)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', letterSpacing: '.1em', textTransform: 'uppercase' }}>Countries</span>
            <h2 style={{ fontSize: 42, fontWeight: 900, color: 'var(--text)', margin: '8px 0 10px', letterSpacing: '-1.5px', lineHeight: 1.1 }}>195 countries, and growing.</h2>
            <p style={{ fontSize: 15, color: muted, margin: 0 }}>Pick the country your target app expects, not just where you live.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 8 }} className="countries-grid">
            {COUNTRIES.map(c => (
              <Link key={c.code} to="/register"
                style={{ background: 'var(--card-bg)', border: `1px solid ${border}`, borderRadius: 12, padding: '16px 10px 14px', textAlign: 'center', cursor: 'pointer', transition: 'all .18s', textDecoration: 'none', display: 'block' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#16A34A'; e.currentTarget.style.background = isDark ? 'rgba(22,163,74,0.1)' : '#F0FDF4' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = 'var(--card-bg)' }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '.02em' }}>{c.code}</p>
                <p style={{ fontSize: 10.5, color: muted, margin: 0, lineHeight: 1.3 }}>{c.name}</p>
              </Link>
            ))}
            {/* +160 more tile */}
            <Link to="/register" style={{ background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: 12, padding: '16px 10px 14px', textAlign: 'center', cursor: 'pointer', textDecoration: 'none', display: 'block' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>+160</p>
              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)', margin: 0 }}>more</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section id="pricing" style={{ background: 'var(--section-alt)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', letterSpacing: '.08em', textTransform: 'uppercase' }}>Simple Pricing</span>
            <h2 style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)', margin: '8px 0 12px', letterSpacing: '-1px' }}>Pay Per Verification</h2>
            <p style={{ fontSize: 16, color: muted, margin: 0 }}>No subscriptions. No hidden fees. Top up your wallet and pay only for what you use.</p>
          </div>

          <div style={{ background: 'linear-gradient(135deg,#063B2D,#16A34A)', borderRadius: 24, padding: 40, color: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', margin: '0 0 8px', fontWeight: 600 }}>Starting from</p>
              <p style={{ fontSize: 48, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-2px' }}>₦3,000</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', margin: '0 0 24px' }}>per successful verification</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', margin: '0 0 6px' }}>Actual price varies by country & platform</p>
              <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4ADE80', color: '#063B2D', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                Start for Free <ArrowRight size={15} />
              </Link>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {['Temporary virtual number','Instant OTP delivery','Real-time order tracking','Wallet-based payment','API access included','Refund if OTP not received'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 22, height: 22, background: 'rgba(74,222,128,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} color="#4ADE80" />
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,.85)' }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DEVELOPER API
      ══════════════════════════════════════════ */}
      <section id="api" style={{ background: '#063B2D', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(74,222,128,.15)', borderRadius: 999, padding: '6px 16px', marginBottom: 20 }}>
              <Code size={13} color="#4ADE80" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', letterSpacing: '.06em' }}>DEVELOPER API</span>
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15 }}>
              Build TurboStore Into Your Workflow
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,.6)', margin: '0 0 28px', lineHeight: 1.7 }}>
              Integrate virtual numbers and OTP verification directly into your applications using the TurboStore REST API.
            </p>
            {['Instant number allocation','Real-time OTP webhooks','Order status polling','Full country & platform data','Wallet balance API','Detailed usage analytics'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Check size={14} color="#4ADE80" />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.8)' }}>{f}</span>
              </div>
            ))}
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4ADE80', color: '#063B2D', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 800, textDecoration: 'none', marginTop: 24 }}>
              Explore API <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ background: '#081810', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ background: '#0A1F12', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              {['#EF4444','#F59E0B','#22C55E'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginLeft: 8, fontFamily: 'monospace' }}>turbostore.js</span>
            </div>
            <pre style={{ margin: 0, padding: '24px 22px', fontSize: 13, lineHeight: 1.8, fontFamily: "'Fira Code', 'Consolas', monospace", overflowX: 'auto', color: '#94A3B8' }}>
{`// Buy a virtual number
const res = await turboStore.numbers.buy({
  country: `}<span style={{ color: '#4ADE80' }}>"US"</span>{`,
  service: `}<span style={{ color: '#4ADE80' }}>"whatsapp"</span>{`
});

const { number, order_id } = res;
// number → "+1 (555) 234-5678"

// Poll for OTP
const otp = await turboStore
  .orders
  .waitForOtp(order_id);

console.log(`}<span style={{ color: '#4ADE80' }}>`OTP: ${'${otp.code}'}`</span>{`);
// OTP: 4821`}
            </pre>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '80px 24px', background: 'var(--page-bg)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', letterSpacing: '.08em', textTransform: 'uppercase' }}>FAQ</span>
            <h2 style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)', margin: '8px 0 12px', letterSpacing: '-1px' }}>Frequently Asked Questions</h2>
            <p style={{ fontSize: 16, color: muted, margin: 0 }}>Everything you need to know about TurboStore.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', transition: 'all .2s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: openFaq === i ? (isDark ? 'rgba(74,222,128,0.08)' : '#F0FDF4') : 'var(--card-bg)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>{f.q}</span>
                  {openFaq === i ? <ChevronUp size={17} color="#16A34A" style={{ flexShrink: 0 }} /> : <ChevronDown size={17} color={muted} style={{ flexShrink: 0 }} />}
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', background: isDark ? 'rgba(74,222,128,0.05)' : '#F0FDF4' }}>
                    <p style={{ fontSize: 14, color: muted, margin: 0, lineHeight: 1.75 }}>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section style={{ background: '#063B2D', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 28 }}>
          <div>
            <h2 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-1px', lineHeight: 1.15 }}>
              Ready to get started?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', margin: 0, maxWidth: 480 }}>
              Join thousands of developers and businesses using TurboStore for instant OTP verification.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <Link to="/register" style={{ background: '#16A34A', color: '#fff', borderRadius: 999, padding: '16px 36px', fontSize: 16, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 24px rgba(22,163,74,.45)' }}>
              Get Started Today <ArrowRight size={17} />
            </Link>
            <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, margin: 0 }}>
              Join thousands who trust Turbostore.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ background: '#060F0A', padding: '56px 24px 24px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path d="M4 3h12l-6 6h4.5l-7.5 8 2.5-6H4.5L10 5H4V3z" fill="#4ADE80"/>
                  </svg>
                </div>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>TurboStore</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.7, margin: 0 }}>
                Virtual numbers and OTP verification for developers, businesses and digital teams.
              </p>
            </div>

            {[
              { title: 'Product',    links: ['Virtual Numbers','OTP Verification','Pricing','Countries','API'] },
              { title: 'Company',    links: ['About','Contact','FAQ','Terms','Privacy'] },
              { title: 'Developers', links: ['API Docs','API Status','Webhooks','Developer Guide'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '0 0 16px' }}>{col.title}</h4>
                {col.links.map(l => (
                  <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,.4)', textDecoration: 'none', marginBottom: 11, transition: 'color .15s' }}
                    onMouseEnter={e => e.target.style.color = '#4ADE80'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.4)'}>
                    {l}
                  </a>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', margin: 0 }}>© 2026 TurboStore. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[{ icon: Shield, label: 'Secure Payments' },{ icon: Globe, label: 'Global Numbers' },{ icon: Zap, label: 'Instant OTPs' },{ icon: Code, label: 'Developer API' }].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <item.icon size={14} color="#4ADE80" />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', fontWeight: 500 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          #hero > div:nth-child(3) { grid-template-columns: 1fr !important; }
          #hero > div:nth-child(2) { display: none; }
          #how > div > div:nth-child(2) { grid-template-columns: 1fr 1fr !important; }
          #api > div { grid-template-columns: 1fr !important; }
          footer > div > div:first-child { grid-template-columns: 1fr 1fr !important; }
          section[id="pricing"] > div > div:nth-child(2) { grid-template-columns: 1fr !important; }
          .countries-grid { grid-template-columns: repeat(5, 1fr) !important; }
        }
        @media (max-width: 500px) {
          #how > div > div:nth-child(2) { grid-template-columns: 1fr !important; }
          footer > div > div:first-child { grid-template-columns: 1fr !important; }
          .countries-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

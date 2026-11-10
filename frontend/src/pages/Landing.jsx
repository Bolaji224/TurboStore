import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Globe, Zap, Code, ArrowRight,
  ChevronDown, ChevronUp, Check, Wallet, Phone,
  RefreshCw, Star, Users, TrendingUp, Sun, Moon, Lock, Activity
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

/* ── Data ──────────────────────────────────────────────────── */
const ROTATING_WORDS = ['WhatsApp', 'Google', 'Telegram', 'Instagram', 'TikTok', 'Discord']

const SERVICES = [
  { icon: '💬', name: 'WhatsApp' }, { icon: '✈️', name: 'Telegram' },
  { icon: '📸', name: 'Instagram' }, { icon: '🎵', name: 'TikTok' },
  { icon: '🐦', name: 'Twitter / X' }, { icon: '👻', name: 'Snapchat' },
  { icon: '🎮', name: 'Discord' }, { icon: '▶️', name: 'YouTube' },
  { icon: '🛒', name: 'Amazon' }, { icon: '💳', name: 'PayPal' },
  { icon: '📘', name: 'Facebook' }, { icon: '🎬', name: 'Netflix' },
  { icon: '🚗', name: 'Uber' }, { icon: '📧', name: 'Gmail' },
  { icon: '🔍', name: 'Google' }, { icon: '🎮', name: 'Steam' },
]

const STATS = [
  { value: '50,000+', label: 'Verified Users',  icon: Users,     count: 50000, suffix: '+' },
  { value: '180+',    label: 'Countries',        icon: Globe,     count: 180,   suffix: '+' },
  { value: '99.9%',   label: 'Uptime SLA',       icon: TrendingUp,count: 99.9, suffix: '%' },
]

const FEATURES = [
  { icon: Shield,    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  title: 'Bank-Level Security',  desc: 'End-to-end encrypted transactions. Your data stays fully protected at every step.' },
  { icon: Globe,     color: '#16A34A', bg: 'rgba(22,163,74,0.12)',   title: 'Global Coverage',       desc: 'Numbers from 180+ countries available 24/7, with no geographic limits or barriers.' },
  { icon: Zap,       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  title: 'Instant Delivery',      desc: 'Numbers in under 2 seconds. OTPs forwarded in real-time the moment they arrive.' },
  { icon: Wallet,    color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  title: 'Pay Per Use',           desc: 'No subscriptions. Fund your wallet once and spend only on what you actually verify.' },
  { icon: RefreshCw, color: '#EC4899', bg: 'rgba(236,72,153,0.12)',  title: 'Auto-Refund',           desc: 'No OTP received? Your full amount is returned to your wallet within minutes, always.' },
  { icon: Code,      color: '#14B8A6', bg: 'rgba(20,184,166,0.12)',  title: 'Developer API',         desc: 'Full REST API with real-time webhooks. Automate thousands of verifications at scale.' },
]

const STEPS = [
  { n: '01', emoji: '🔐', title: 'Create Account',  desc: 'Sign up with email or Google — no credit card needed to start.' },
  { n: '02', emoji: '💳', title: 'Fund Wallet',      desc: 'Add funds via card, bank transfer, or USSD in seconds.' },
  { n: '03', emoji: '📱', title: 'Buy a Number',     desc: 'Choose your country and service, get a live number instantly.' },
  { n: '04', emoji: '✅', title: 'Receive OTP',      desc: 'Your SMS code appears in your dashboard in real-time.' },
]

const COUNTRIES_ROW1 = [
  { code: 'NG', name: 'Nigeria',        flag: '🇳🇬' },
  { code: 'US', name: 'USA',            flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India',          flag: '🇮🇳' },
  { code: 'DE', name: 'Germany',        flag: '🇩🇪' },
  { code: 'FR', name: 'France',         flag: '🇫🇷' },
  { code: 'CA', name: 'Canada',         flag: '🇨🇦' },
  { code: 'AU', name: 'Australia',      flag: '🇦🇺' },
  { code: 'JP', name: 'Japan',          flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil',         flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico',         flag: '🇲🇽' },
  { code: 'SG', name: 'Singapore',      flag: '🇸🇬' },
]

const COUNTRIES_ROW2 = [
  { code: 'KE', name: 'Kenya',          flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa',   flag: '🇿🇦' },
  { code: 'GH', name: 'Ghana',          flag: '🇬🇭' },
  { code: 'TH', name: 'Thailand',       flag: '🇹🇭' },
  { code: 'PH', name: 'Philippines',    flag: '🇵🇭' },
  { code: 'TR', name: 'Turkey',         flag: '🇹🇷' },
  { code: 'PL', name: 'Poland',         flag: '🇵🇱' },
  { code: 'UA', name: 'Ukraine',        flag: '🇺🇦' },
  { code: 'NL', name: 'Netherlands',    flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden',         flag: '🇸🇪' },
  { code: 'HK', name: 'Hong Kong',      flag: '🇭🇰' },
  { code: 'ID', name: 'Indonesia',      flag: '🇮🇩' },
]

const TESTIMONIALS = [
  { name: 'Adewale Okonkwo', role: 'Fullstack Developer', avatar: 'AO', text: 'TurboStore completely changed how I handle account automation. Integrated the API in 30 minutes and it just works — numbers are instant and OTPs never fail.' },
  { name: 'Sarah Chen',      role: 'Product Manager',     avatar: 'SC', text: 'Our entire QA team uses TurboStore for smoke testing. Wallet billing keeps costs predictable and the numbers arrive faster than I can even switch windows.' },
  { name: 'Emeka Nwosu',     role: 'Digital Marketer',    avatar: 'EN', text: 'Finally an OTP service that works reliably in Nigeria AND refunds actually happen. Been using it for 8 months and it never lets me down.' },
]

const FAQS = [
  { q: 'What is TurboStore?',              a: 'TurboStore is a virtual phone number and SMS OTP verification platform built for developers, businesses, and digital teams. Get temporary numbers from 180+ countries in seconds.' },
  { q: 'How fast is OTP delivery?',        a: 'Numbers are allocated in under 2 seconds. OTPs are forwarded to your dashboard in real-time — typically within 1–30 seconds of the sender dispatching them.' },
  { q: "What if I don't receive an OTP?",  a: 'If no OTP arrives within 10 minutes, your order is automatically canceled and the full amount refunded to your wallet. No support tickets needed.' },
  { q: 'Which countries are supported?',   a: 'Over 180 countries including Nigeria, USA, United Kingdom, India, Germany, France, Canada, Australia, Kenya, Ghana, and many more.' },
  { q: 'How does pricing work?',           a: 'You pay per successful verification. Prices vary by country and service. All costs are shown upfront before purchase — no subscriptions, no hidden fees.' },
  { q: 'Can I automate with the REST API?',a: 'Yes. Every account includes full API access. Generate your key from the dashboard and start automating number purchases and OTP retrieval programmatically.' },
]

function SectionBadge({ children, color = '#4ADE80', border = 'rgba(22,163,74,0.25)', bg = 'rgba(22,163,74,0.1)' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, border: `1px solid ${border}`, borderRadius: 999, padding: '5px 16px', marginBottom: 18 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{ fontSize: 11.5, fontWeight: 700, color, letterSpacing: '.09em' }}>{children}</span>
    </div>
  )
}

function CountUp({ end, suffix = '', duration = 1800, isDark }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const startTime = performance.now()
        const isDecimal = end % 1 !== 0
        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          const current = eased * end
          setVal(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current))
          if (progress < 1) requestAnimationFrame(tick)
          else setVal(end)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])

  return <span ref={ref}>{end >= 1000 ? `${Math.floor(val / 1000)}K` : val}{suffix}</span>
}

/* ── Main component ─────────────────────────────────────────── */
export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null)
  const [wordIdx, setWordIdx] = useState(0)
  const [wordVisible, setWordVisible] = useState(true)
  const { isDark, toggle } = useTheme()

  /* ── Theme palette ── */
  const bg      = isDark ? '#030C06'                  : '#ffffff'
  const bgAlt   = isDark ? '#040F08'                  : '#F8FAF9'
  const bgAlt2  = isDark ? '#08130A'                  : '#F0FDF4'
  const navBg   = isDark ? 'rgba(3,12,6,0.82)'        : 'rgba(255,255,255,0.95)'
  const navBdr  = isDark ? 'rgba(74,222,128,0.1)'     : 'rgba(22,163,74,0.18)'
  const h1      = isDark ? '#fff'                     : '#0F172A'
  const body    = isDark ? 'rgba(255,255,255,0.52)'   : '#64748B'
  const muted   = isDark ? 'rgba(255,255,255,0.38)'   : '#94A3B8'
  const cardBg  = isDark ? 'rgba(255,255,255,0.028)'  : '#ffffff'
  const cardBdr = isDark ? 'rgba(255,255,255,0.07)'   : 'rgba(22,163,74,0.14)'
  const itemBg  = isDark ? 'rgba(255,255,255,0.03)'   : 'rgba(22,163,74,0.04)'
  const itemBdr = isDark ? 'rgba(255,255,255,0.07)'   : 'rgba(22,163,74,0.12)'
  const secBdr  = isDark ? 'rgba(255,255,255,0.04)'   : 'rgba(22,163,74,0.1)'
  const lgnTxt  = isDark ? 'rgba(255,255,255,0.55)'   : '#475569'
  const lgnBdr  = isDark ? 'rgba(255,255,255,0.1)'    : '#E2E8F0'
  const tglBg   = isDark ? 'rgba(255,255,255,0.08)'   : 'rgba(22,163,74,0.06)'
  const tglBdr  = isDark ? 'rgba(255,255,255,0.12)'   : 'rgba(22,163,74,0.22)'
  const tglClr  = isDark ? '#fff'                     : '#16A34A'
  const statBdr = isDark ? 'rgba(255,255,255,0.07)'   : 'rgba(22,163,74,0.12)'
  const faqBg   = isDark ? 'rgba(255,255,255,0.025)'  : '#ffffff'
  const faqBdr  = isDark ? 'rgba(255,255,255,0.07)'   : 'rgba(22,163,74,0.12)'
  const codeBg  = isDark ? '#080F0A'                  : '#F8FAF9'
  const codeHdr = isDark ? 'rgba(255,255,255,0.03)'   : '#F0FDF4'
  const cardShadow = isDark ? 'none' : '0 2px 16px rgba(22,163,74,0.08)'

  /* ── Scroll-reveal ── */
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target) } }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  /* ── Word rotation ── */
  useEffect(() => {
    const id = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => {
        setWordIdx(i => (i + 1) % ROTATING_WORDS.length)
        setWordVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden', transition: 'background 0.3s' }}>

      {/* ══════════════ NAVBAR ══════════════ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: navBg,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${navBdr}`,
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <img src="/logo.png" alt="TurboStore" style={{ height: 36, objectFit: 'contain' }} />
          </Link>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            {/* Telegram */}
            <a id="nav-telegram" href="#" target="_blank" rel="noopener noreferrer"
              style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${tglBdr}`, background: tglBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tglClr, transition: 'all 0.2s', flexShrink: 0, textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#29B6F6'; e.currentTarget.style.color = '#29B6F6'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = tglBdr; e.currentTarget.style.color = tglClr; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2L2 9.5l7 2.5 2.5 7 3.5-4 5 4 1.5-17z"/>
                <path d="M9 12l9-7"/>
              </svg>
            </a>

            {/* X (Twitter) */}
            <a id="nav-twitter" href="#" target="_blank" rel="noopener noreferrer"
              style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${tglBdr}`, background: tglBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tglClr, transition: 'all 0.2s', flexShrink: 0, textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'; e.currentTarget.style.color = isDark ? '#fff' : '#000'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = tglBdr; e.currentTarget.style.color = tglClr; }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            {/* Theme toggle */}
            <button onClick={toggle}
              style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${tglBdr}`, background: tglBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tglClr, transition: 'all 0.2s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(22,163,74,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = tglBdr; }}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link id="nav-sell" to="/supplier/register"
              style={{ fontSize: 14, fontWeight: 600, color: isDark ? '#4ADE80' : '#16A34A', textDecoration: 'none', padding: '8px 4px', borderRadius: 9, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Sell on Turbostore
            </Link>
            <Link to="/login"
              style={{ fontSize: 14, fontWeight: 600, color: lgnTxt, textDecoration: 'none', padding: '8px 18px', borderRadius: 9, border: `1px solid ${lgnBdr}`, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = isDark ? '#fff' : '#16A34A'; e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.22)' : '#16A34A'; }}
              onMouseLeave={e => { e.currentTarget.style.color = lgnTxt; e.currentTarget.style.borderColor = lgnBdr; }}>
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════ HERO ══════════════ */}
      <section id="hero" className="landing-dot-grid" style={{ background: bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '90px 24px 70px', position: 'relative', overflow: 'hidden', transition: 'background 0.3s' }}>

        {/* Animated orbs */}
        <div className="orb-1" style={{ position: 'absolute', top: '-8%', right: '-4%', width: 720, height: 720, borderRadius: '50%', background: `radial-gradient(circle at center, ${isDark ? 'rgba(22,163,74,0.18)' : 'rgba(22,163,74,0.1)'} 0%, transparent 68%)`, filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div className="orb-2" style={{ position: 'absolute', top: '15%', left: '-8%', width: 580, height: 580, borderRadius: '50%', background: `radial-gradient(circle at center, ${isDark ? 'rgba(5,150,105,0.14)' : 'rgba(22,163,74,0.07)'} 0%, transparent 65%)`, filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div className="orb-3" style={{ position: 'absolute', bottom: '-5%', right: '15%', width: 460, height: 460, borderRadius: '50%', background: `radial-gradient(circle at center, ${isDark ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.06)'} 0%, transparent 65%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div className="orb-4" style={{ position: 'absolute', bottom: '30%', left: '25%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle at center, ${isDark ? 'rgba(16,185,129,0.1)' : 'rgba(22,163,74,0.05)'} 0%, transparent 70%)`, filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div id="hero-grid" style={{ maxWidth: 1140, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center', position: 'relative', zIndex: 10 }}>

          {/* LEFT — Copy */}
          <div>
            {/* Live badge */}
            <div className="fade-up-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.28)', borderRadius: 999, padding: '6px 18px 6px 10px', marginBottom: 30 }}>
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14 }}>
                <span style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: 'rgba(74,222,128,0.3)', animation: 'pulseRing 2s ease-out infinite' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', display: 'block', position: 'relative', zIndex: 1 }} />
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#4ADE80', letterSpacing: '0.06em' }}>LIVE · TRUSTED BY 50,000+ USERS</span>
            </div>

            {/* Headline */}
            <h1 className="fade-up-2" style={{ margin: '0 0 22px', lineHeight: 1.07, letterSpacing: '-2px' }}>
              <span style={{ display: 'block', fontSize: 'clamp(42px, 5.2vw, 72px)', fontWeight: 900, color: h1, transition: 'color 0.3s' }}>Verify</span>
              <span style={{ display: 'block', fontSize: 'clamp(42px, 5.2vw, 72px)', fontWeight: 900, minHeight: '1.15em', position: 'relative', overflow: 'hidden' }}>
                <span className="gradient-text" style={{
                  display: 'inline-block',
                  opacity: wordVisible ? 1 : 0,
                  transform: wordVisible ? 'translateY(0)' : 'translateY(16px)',
                  transition: 'opacity 0.28s ease, transform 0.28s ease',
                }}>{ROTATING_WORDS[wordIdx]}.</span>
              </span>
              <span style={{ display: 'block', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.38)' : '#94A3B8', letterSpacing: '-1px', transition: 'color 0.3s' }}>Instantly. Globally.</span>
            </h1>

            <p className="fade-up-3" style={{ fontSize: 17, color: body, lineHeight: 1.78, margin: '0 0 38px', maxWidth: 470, transition: 'color 0.3s' }}>
              Instant virtual phone numbers from 180+ countries. Get SMS OTPs in real-time — built for developers, teams, and solo builders who move fast.
            </p>

            {/* CTA row */}
            <div className="fade-up-3" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-glow"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', borderRadius: 12, padding: '14px 30px', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(22,163,74,0.42)' }}>
                Start Free <ArrowRight size={16} />
              </Link>
              <a href="#pricing"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(22,163,74,0.06)', color: isDark ? 'rgba(255,255,255,0.82)' : '#16A34A', borderRadius: 12, padding: '14px 24px', fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(22,163,74,0.2)'}`, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(22,163,74,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(22,163,74,0.06)'; }}>
                See Pricing
              </a>
            </div>
            <div className="fade-up-3" style={{ display: 'flex', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
              {[
                { icon: Lock, text: 'No credit card' },
                { icon: Zap,  text: 'Instant access' },
                { icon: Activity, text: '99.9% uptime' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={12} color="#16A34A" strokeWidth={2.5} />
                  <span style={{ fontSize: 12.5, color: muted, fontWeight: 500, transition: 'color 0.3s' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="fade-up-4" style={{ display: 'flex', gap: 0, paddingTop: 28, borderTop: `1px solid ${statBdr}`, transition: 'border-color 0.3s' }}>
              {STATS.map((s, i) => (
                <div key={s.label} style={{ flex: 1, paddingRight: i < STATS.length - 1 ? 24 : 0, borderRight: i < STATS.length - 1 ? `1px solid ${statBdr}` : 'none', paddingLeft: i > 0 ? 24 : 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#16A34A', letterSpacing: '-1px', lineHeight: 1.1 }}>
                    <CountUp end={s.count} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: 12, color: muted, marginTop: 4, fontWeight: 500, transition: 'color 0.3s' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Phone mockup */}
          <div id="phone-col" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 580 }}>
            <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(22,163,74,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
            {/* Floating live activity */}
            <div style={{ position: 'absolute', top: -10, left: -10, zIndex: 20, borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(22,163,74,0.08)' : '#F0FDF4', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: `1px solid ${isDark ? 'rgba(22,163,74,0.22)' : 'rgba(22,163,74,0.25)'}`, boxShadow: isDark ? 'none' : '0 4px 20px rgba(22,163,74,0.1)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', boxShadow: '0 0 8px rgba(74,222,128,0.9)', animation: 'pulseRing 1.8s ease-out infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', whiteSpace: 'nowrap' }}>1,247 OTPs delivered today</span>
            </div>

            {/* Floating card: OTP */}
            <div className="card-float-1" style={{ position: 'absolute', top: 30, right: -16, zIndex: 20, borderRadius: 18, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(22,163,74,0.2)'}`, boxShadow: isDark ? 'none' : '0 8px 32px rgba(22,163,74,0.12)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#16A34A,#4ADE80)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(22,163,74,0.4)' }}>
                <Zap size={18} color="#fff" fill="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8', marginBottom: 2, fontWeight: 500 }}>OTP Received</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#16A34A', fontFamily: "'Fira Code', 'Consolas', monospace", letterSpacing: '4px' }}>4 8 2 1</div>
              </div>
            </div>

            {/* Floating card: Number ready */}
            <div className="card-float-2" style={{ position: 'absolute', bottom: 70, left: -22, zIndex: 20, borderRadius: 18, padding: '13px 17px', display: 'flex', alignItems: 'center', gap: 12, background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(22,163,74,0.2)'}`, boxShadow: isDark ? 'none' : '0 8px 32px rgba(22,163,74,0.12)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Phone size={17} color="#16A34A" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8', marginBottom: 2, fontWeight: 500 }}>Number Ready</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: h1, fontFamily: "'Fira Code', 'Consolas', monospace", transition: 'color 0.3s' }}>+1 555 234 5678</div>
              </div>
            </div>

            {/* Phone image */}
            <img
              src="/phone-hero.png"
              alt="TurboStore App"
              className="phone-float"
              style={{
                height: 520,
                width: 'auto',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 10,
                filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.55)) drop-shadow(0 0 60px rgba(22,163,74,0.2))',
              }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════ TRUST BAR ══════════════ */}
      <div style={{ background: bgAlt, borderTop: `1px solid ${secBdr}`, borderBottom: `1px solid ${secBdr}`, padding: '28px 24px', transition: 'background 0.3s, border-color 0.3s' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: muted, letterSpacing: '.08em', marginRight: 36, whiteSpace: 'nowrap', transition: 'color 0.3s' }}>WORKS WITH</span>
          {[
            { name: 'WhatsApp', color: '#25D366' },
            { name: 'Telegram', color: '#2AABEE' },
            { name: 'Google',   color: '#4285F4' },
            { name: 'Instagram',color: '#E1306C' },
            { name: 'TikTok',   color: isDark ? '#fff' : '#0F172A' },
            { name: 'Discord',  color: '#5865F2' },
            { name: 'Twitter',  color: '#1DA1F2' },
            { name: 'Amazon',   color: '#FF9900' },
          ].map((b, i) => (
            <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 24px', borderRight: i < 7 ? `1px solid ${secBdr}` : 'none' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 8px ${b.color}60` }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.38)' : '#94A3B8', whiteSpace: 'nowrap', transition: 'color 0.3s' }}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ SERVICES MARQUEE ══════════════ */}
      <div style={{ background: bgAlt2, padding: '20px 0', borderTop: `1px solid ${secBdr}`, borderBottom: `1px solid ${secBdr}`, transition: 'background 0.3s' }}>
        <div className="marquee-fade" style={{ overflow: 'hidden' }}>
          <div className="marquee-rtl" style={{ display: 'flex', gap: 10, width: 'max-content' }}>
            {[...SERVICES, ...SERVICES].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: itemBg, border: `1px solid ${itemBdr}`, borderRadius: 999, padding: '8px 18px', flexShrink: 0, transition: 'background 0.3s' }}>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: muted, whiteSpace: 'nowrap', transition: 'color 0.3s' }}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ FEATURES ══════════════ */}
      <section id="features" style={{ background: bg, padding: '110px 24px', transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div data-reveal style={{ textAlign: 'center', marginBottom: 68 }}>
            <SectionBadge>WHY TURBOSTORE</SectionBadge>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 54px)', fontWeight: 900, color: h1, margin: '0 0 18px', letterSpacing: '-1.5px', lineHeight: 1.1, transition: 'color 0.3s' }}>
              Everything you need,<br /><span className="gradient-text">nothing you don't.</span>
            </h2>
            <p style={{ fontSize: 17, color: body, margin: '0 auto', maxWidth: 500, lineHeight: 1.75, transition: 'color 0.3s' }}>
              Built from the ground up for reliability, speed, and affordability — every feature earns its place.
            </p>
          </div>
          <div id="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {FEATURES.map((f, fi) => (
              <div key={f.title} data-reveal data-delay={String(fi + 1)} className="feature-hover"
                style={{ background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 22, padding: '30px 28px', cursor: 'default', boxShadow: cardShadow, transition: 'background 0.3s, border-color 0.3s', position: 'relative', overflow: 'hidden' }}>
                {/* subtle top accent line */}
                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: `linear-gradient(90deg, transparent, ${f.color}60, transparent)` }} />
                <div style={{ width: 52, height: 52, background: f.bg, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, border: `1px solid ${f.color}30` }}>
                  <f.icon size={22} color={f.color} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: h1, margin: '0 0 9px', letterSpacing: '-0.2px', transition: 'color 0.3s' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: body, margin: 0, lineHeight: 1.75, transition: 'color 0.3s' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how" style={{ background: bgAlt, padding: '110px 24px', borderTop: `1px solid ${secBdr}`, transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div data-reveal style={{ textAlign: 'center', marginBottom: 68 }}>
            <SectionBadge>SIMPLE PROCESS</SectionBadge>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 54px)', fontWeight: 900, color: h1, margin: '0 0 14px', letterSpacing: '-1.5px', lineHeight: 1.1, transition: 'color 0.3s' }}>
              Up and running<br /><span className="gradient-text">in 4 simple steps.</span>
            </h2>
            <p style={{ fontSize: 16, color: muted, margin: 0, transition: 'color 0.3s' }}>No complicated setup. No long forms. Just results.</p>
          </div>
          <div id="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 47, left: '14%', right: '14%', height: 1, borderTop: '1.5px dashed rgba(22,163,74,0.25)', zIndex: 0, pointerEvents: 'none' }} />
            {STEPS.map((s, i) => (
              <div key={s.n} data-reveal data-delay={String(i + 1)}
                style={{ background: cardBg, border: `1px solid ${i === 0 ? 'rgba(22,163,74,0.35)' : cardBdr}`, borderRadius: 22, padding: '28px 22px', textAlign: 'center', position: 'relative', zIndex: 1, boxShadow: cardShadow, transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(22,163,74,0.4)'; e.currentTarget.style.background = isDark ? 'rgba(22,163,74,0.04)' : '#F0FDF4'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = i === 0 ? 'rgba(22,163,74,0.35)' : cardBdr; e.currentTarget.style.background = cardBg; }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
                  <div style={{ width: 66, height: 66, background: i === 0 ? 'linear-gradient(135deg,rgba(22,163,74,0.22),rgba(22,163,74,0.1))' : isDark ? 'rgba(255,255,255,0.04)' : '#F8FAF9', border: i === 0 ? '1px solid rgba(22,163,74,0.45)' : `1px solid ${cardBdr}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto' }}>
                    {s.emoji}
                  </div>
                  <div style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, background: i === 0 ? '#4ADE80' : '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(22,163,74,0.4)' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: '#fff' }}>{i + 1}</span>
                  </div>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: h1, margin: '0 0 8px', letterSpacing: '-0.2px', transition: 'color 0.3s' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: muted, margin: 0, lineHeight: 1.7, transition: 'color 0.3s' }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 52 }}>
            <Link to="/register" className="btn-glow"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', borderRadius: 12, padding: '14px 34px', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(22,163,74,0.38)' }}>
              Get Your First Number Free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ COUNTRIES MARQUEE ══════════════ */}
      <section style={{ background: bg, padding: '110px 24px', borderTop: `1px solid ${secBdr}`, transition: 'background 0.3s' }}>
        <div data-reveal style={{ maxWidth: 1140, margin: '0 auto', textAlign: 'center', marginBottom: 56 }}>
          <SectionBadge>GLOBAL COVERAGE</SectionBadge>
          <h2 style={{ fontSize: 'clamp(30px, 4vw, 54px)', fontWeight: 900, color: h1, margin: '0 0 14px', letterSpacing: '-1.5px', lineHeight: 1.1, transition: 'color 0.3s' }}>
            180+ countries,<br /><span className="gradient-text">and growing.</span>
          </h2>
          <p style={{ fontSize: 16, color: muted, margin: 0, transition: 'color 0.3s' }}>
            Pick any country your target app expects — not just where you live.
          </p>
        </div>
        <div className="marquee-fade" style={{ overflow: 'hidden', marginBottom: 10 }}>
          <div className="marquee-rtl" style={{ display: 'flex', gap: 10, width: 'max-content' }}>
            {[...COUNTRIES_ROW1, ...COUNTRIES_ROW1].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: itemBg, border: `1px solid ${itemBdr}`, borderRadius: 14, padding: '13px 20px', flexShrink: 0, transition: 'background 0.3s' }}>
                <span style={{ fontSize: 24 }}>{c.flag}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: h1, lineHeight: 1.2, transition: 'color 0.3s' }}>{c.code}</div>
                  <div style={{ fontSize: 11, color: muted, lineHeight: 1.2, transition: 'color 0.3s' }}>{c.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="marquee-fade" style={{ overflow: 'hidden' }}>
          <div className="marquee-ltr" style={{ display: 'flex', gap: 10, width: 'max-content' }}>
            {[...COUNTRIES_ROW2, ...COUNTRIES_ROW2].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: itemBg, border: `1px solid ${itemBdr}`, borderRadius: 14, padding: '13px 20px', flexShrink: 0, transition: 'background 0.3s' }}>
                <span style={{ fontSize: 24 }}>{c.flag}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: h1, lineHeight: 1.2, transition: 'color 0.3s' }}>{c.code}</div>
                  <div style={{ fontSize: 11, color: muted, lineHeight: 1.2, transition: 'color 0.3s' }}>{c.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section style={{ background: bgAlt, padding: '110px 24px', borderTop: `1px solid ${secBdr}`, transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div data-reveal style={{ textAlign: 'center', marginBottom: 64 }}>
            <SectionBadge>WHAT PEOPLE SAY</SectionBadge>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 54px)', fontWeight: 900, color: h1, margin: '0 0 18px', letterSpacing: '-1.5px', lineHeight: 1.1, transition: 'color 0.3s' }}>
              Loved by thousands of users<br /><span className="gradient-text">around the world.</span>
            </h2>
            {/* Aggregate rating */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB', border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.25)'}`, borderRadius: 999, padding: '8px 20px' }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[...Array(5)].map((_, j) => <Star key={j} size={13} color="#F59E0B" fill="#F59E0B" />)}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.8)' : '#92400E' }}>4.9 / 5</span>
              <span style={{ fontSize: 12.5, color: isDark ? 'rgba(255,255,255,0.35)' : '#A16207' }}>from 2,400+ reviews</span>
            </div>
          </div>
          <div id="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} data-reveal data-delay={String(i + 1)} className="feature-hover"
                style={{ background: cardBg, border: `1px solid ${cardBdr}`, borderRadius: 22, padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: cardShadow, transition: 'background 0.3s, border-color 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[...Array(5)].map((_, j) => <Star key={j} size={13} color="#F59E0B" fill="#F59E0B" />)}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 999, padding: '2px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={9} strokeWidth={3} /> Verified
                  </span>
                </div>
                <p style={{ fontSize: 14.5, color: isDark ? 'rgba(255,255,255,0.68)' : '#475569', lineHeight: 1.78, margin: 0, flex: 1, transition: 'color 0.3s' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: `1px solid ${cardBdr}` }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#16A34A,#063B2D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#4ADE80' }}>{t.avatar}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: h1, transition: 'color 0.3s' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: muted, transition: 'color 0.3s' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ PRICING ══════════════ */}
      <section id="pricing" style={{ background: bg, padding: '110px 24px', borderTop: `1px solid ${secBdr}`, transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div data-reveal style={{ textAlign: 'center', marginBottom: 64 }}>
            <SectionBadge>SIMPLE PRICING</SectionBadge>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 54px)', fontWeight: 900, color: h1, margin: '0 0 16px', letterSpacing: '-1.5px', lineHeight: 1.1, transition: 'color 0.3s' }}>
              Pay only for what<br /><span className="gradient-text">you actually use.</span>
            </h2>
            <p style={{ fontSize: 17, color: body, margin: 0, transition: 'color 0.3s' }}>No subscriptions. No hidden fees. Top up once, spend at your pace.</p>
          </div>
          <div data-reveal data-delay="1" id="pricing-inner" className="pricing-glow"
            style={{ background: 'linear-gradient(135deg, rgba(6,59,45,0.9) 0%, rgba(22,163,74,0.18) 100%)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 28, padding: '52px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'center', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
            <div>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', margin: '0 0 8px', fontWeight: 700, letterSpacing: '.06em' }}>STARTING FROM</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 58, fontWeight: 900, color: '#fff', letterSpacing: '-2.5px', lineHeight: 1 }}>₦3,000</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '0 0 36px', lineHeight: 1.6 }}>per successful verification<br /><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>Price varies by country & service</span></p>
              <Link to="/register" className="btn-glow"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4ADE80', color: '#063B2D', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 8px 28px rgba(74,222,128,0.3)' }}>
                Start for Free <ArrowRight size={16} />
              </Link>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {['Temporary virtual number', 'Instant OTP delivery', 'Real-time order tracking', 'Wallet-based payments', 'Full API access included', 'Auto-refund guarantee'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 24, height: 24, background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.32)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={12} color="#4ADE80" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)' }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════════ DEVELOPER API ══════════════ */}
      <section id="api" style={{ background: bgAlt, padding: '110px 24px', borderTop: `1px solid ${secBdr}`, transition: 'background 0.3s' }}>
        <div data-reveal id="api-grid" style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <SectionBadge color="#2DD4BF" border="rgba(20,184,166,0.28)" bg="rgba(20,184,166,0.08)">DEVELOPER API</SectionBadge>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 900, color: h1, margin: '0 0 18px', letterSpacing: '-1.5px', lineHeight: 1.1, transition: 'color 0.3s' }}>
              Build TurboStore<br />into your workflow.
            </h2>
            <p style={{ fontSize: 16, color: body, margin: '0 0 36px', lineHeight: 1.8, transition: 'color 0.3s' }}>
              Full REST API with real-time webhooks. Automate thousands of verifications programmatically in minutes.
            </p>
            {['Instant number allocation', 'Real-time OTP webhooks', 'Order status polling', 'Full country & platform data', 'Wallet balance & history API'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 15 }}>
                <Check size={15} color="#16A34A" strokeWidth={2.5} />
                <span style={{ fontSize: 15, color: isDark ? 'rgba(255,255,255,0.65)' : '#475569', transition: 'color 0.3s' }}>{f}</span>
              </div>
            ))}
            <Link to="/register" className="btn-glow"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#16A34A', color: '#fff', borderRadius: 12, padding: '13px 26px', fontSize: 14, fontWeight: 700, textDecoration: 'none', marginTop: 22, boxShadow: '0 6px 22px rgba(22,163,74,0.35)' }}>
              Get Your API Key <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{ background: codeBg, borderRadius: 22, overflow: 'hidden', border: `1px solid ${cardBdr}`, boxShadow: isDark ? '0 40px 80px rgba(0,0,0,0.45)' : '0 12px 48px rgba(22,163,74,0.1)', transition: 'background 0.3s' }}>
            <div style={{ background: codeHdr, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${cardBdr}` }}>
              {['#EF4444', '#F59E0B', '#22C55E'].map(c => (
                <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
              ))}
              <span style={{ fontSize: 12, color: muted, marginLeft: 8, fontFamily: "'Fira Code', monospace", transition: 'color 0.3s' }}>turbostore.js</span>
            </div>
            <pre style={{ margin: 0, padding: '28px 26px', fontSize: 13, lineHeight: 2, fontFamily: "'Fira Code', 'Consolas', monospace", overflowX: 'auto', color: isDark ? '#64748B' : '#94A3B8' }}>
{`// Initialize the client
`}<span style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#64748B' }}>const</span>{` turbo `}<span style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#64748B' }}>=</span>{` `}<span style={{ color: '#2DD4BF' }}>TurboStore</span>{`({ apiKey });

`}<span style={{ color: isDark ? 'rgba(255,255,255,0.22)' : '#94A3B8' }}>// Buy a virtual number</span>{`
`}<span style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#64748B' }}>const</span>{` { number, order_id } =
  `}<span style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#64748B' }}>await</span>{` turbo.`}<span style={{ color: '#16A34A' }}>numbers</span>{`.`}<span style={{ color: '#2DD4BF' }}>buy</span>{`({
    country: `}<span style={{ color: '#F59E0B' }}>"US"</span>{`,
    service: `}<span style={{ color: '#F59E0B' }}>"whatsapp"</span>{`
  });

`}<span style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#64748B' }}>const</span>{` otp = `}<span style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#64748B' }}>await</span>{` turbo
  .`}<span style={{ color: '#16A34A' }}>orders</span>{`.`}<span style={{ color: '#2DD4BF' }}>waitForOtp</span>{`(order_id);

console.`}<span style={{ color: '#2DD4BF' }}>log</span>{`(`}<span style={{ color: '#F59E0B' }}>`OTP: ${'${otp.code}'}`</span>{`);
`}<span style={{ color: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }}>// → OTP: 4821</span>
            </pre>
          </div>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section id="faq" style={{ padding: '110px 24px', background: bg, borderTop: `1px solid ${secBdr}`, transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div data-reveal style={{ textAlign: 'center', marginBottom: 60 }}>
            <SectionBadge>FAQ</SectionBadge>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 54px)', fontWeight: 900, color: h1, margin: '0 0 14px', letterSpacing: '-1.5px', lineHeight: 1.1, transition: 'color 0.3s' }}>
              Frequently asked<br /><span className="gradient-text">questions.</span>
            </h2>
          </div>
          <div data-reveal data-delay="1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ background: openFaq === i ? (isDark ? 'rgba(22,163,74,0.06)' : '#F0FDF4') : faqBg, border: `1px solid ${openFaq === i ? 'rgba(22,163,74,0.35)' : faqBdr}`, borderRadius: 16, overflow: 'hidden', transition: 'all 0.2s', boxShadow: cardShadow }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', gap: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: openFaq === i ? '#16A34A' : h1, textAlign: 'left', lineHeight: 1.45, transition: 'color 0.2s' }}>{f.q}</span>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: openFaq === i ? 'rgba(22,163,74,0.12)' : isDark ? 'rgba(255,255,255,0.05)' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {openFaq === i ? <ChevronUp size={15} color="#16A34A" /> : <ChevronDown size={15} color={muted} />}
                  </div>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 22px 22px' }}>
                    <p style={{ fontSize: 14.5, color: body, margin: 0, lineHeight: 1.82 }}>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA — always dark green ══════════════ */}
      <section style={{ background: '#040F08', padding: '90px 24px 100px', borderTop: `1px solid ${secBdr}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none' }}>
          <div className="orb-1" style={{ width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(22,163,74,0.1) 0%, transparent 68%)', filter: 'blur(50px)', transform: 'translate(-50%,-50%)' }} />
        </div>
        <div data-reveal style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <SectionBadge>GET STARTED TODAY</SectionBadge>
          <h2 style={{ fontSize: 'clamp(34px, 5vw, 68px)', fontWeight: 900, color: '#fff', margin: '0 0 22px', letterSpacing: '-2.5px', lineHeight: 1.05 }}>
            Ready to start<br /><span className="gradient-text">verifying instantly?</span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.42)', margin: '0 0 44px', lineHeight: 1.75 }}>
            Join 50,000+ developers and businesses using TurboStore for fast, reliable OTP verification worldwide.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-glow"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#16A34A,#15803D)', color: '#fff', borderRadius: 14, padding: '16px 38px', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 10px 40px rgba(22,163,74,0.42)' }}>
              Create Free Account <ArrowRight size={17} />
            </Link>
            <Link to="/login"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: '16px 30px', fontSize: 16, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
              Login
            </Link>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginTop: 22, letterSpacing: '0.02em' }}>No credit card required · Instant access · Cancel anytime</p>
          {/* Avatar row social proof */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 32 }}>
            <div style={{ display: 'flex' }}>
              {['#16A34A','#2563EB','#9333EA','#DC2626','#F59E0B'].map((c, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${c}, ${c}aa)`, border: '2px solid rgba(3,15,8,0.9)', marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                  {['A','S','M','J','K'][i]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              <span style={{ color: '#4ADE80', fontWeight: 700 }}>+50,000</span> users already verified
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════ METRICS BAR ══════════════ */}
      <div style={{ background: isDark ? '#020A04' : '#F0FDF4', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(22,163,74,0.12)'}`, padding: '32px 24px', transition: 'background 0.3s' }}>
        <div id="metrics-bar" style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {[
            { icon: Zap,       val: '<2s',    label: 'Average OTP delivery time',    c: '#F59E0B' },
            { icon: Shield,    val: '100%',   label: 'Auto-refund guarantee',         c: '#3B82F6' },
            { icon: Globe,     val: '180+',   label: 'Countries available worldwide', c: '#16A34A' },
            { icon: Activity,  val: '99.9%',  label: 'Platform uptime SLA',           c: '#8B5CF6' },
          ].map((m, i) => (
            <div key={m.label} style={{ textAlign: 'center', padding: '0 20px', borderRight: i < 3 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(22,163,74,0.1)'}` : 'none' }}>
              <div style={{ width: 36, height: 36, background: `${m.c}15`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: `1px solid ${m.c}30` }}>
                <m.icon size={16} color={m.c} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: isDark ? '#fff' : '#0F172A', letterSpacing: '-0.8px', lineHeight: 1.1 }}>{m.val}</div>
              <div style={{ fontSize: 11.5, color: muted, marginTop: 4, fontWeight: 500, lineHeight: 1.4, transition: 'color 0.3s' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════ FOOTER — always dark ══════════════ */}
      <footer style={{ background: '#020A04', padding: '48px 24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          {/* Logo + links side by side */}
          <div id="footer-grid" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
            {/* Left: logo + description */}
            <div>
              <div style={{ marginBottom: 14 }}>
                <img src="/logo.png" alt="TurboStore" style={{ height: 32, objectFit: 'contain' }} />
              </div>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.28)', lineHeight: 1.8, margin: 0, maxWidth: 230 }}>
                Virtual numbers and OTP verification for developers, businesses, and digital teams worldwide.
              </p>
            </div>

            {/* Right: company links spread horizontally */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 0' }}>
              {['About', 'Contact', 'FAQ', 'Terms', 'Privacy', 'Refunds', 'Cookies'].map((l, i, arr) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center' }}>
                  <a href="#" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', padding: '4px 18px', transition: 'color .15s' }}
                    onMouseEnter={e => e.target.style.color = '#4ADE80'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}>
                    {l}
                  </a>
                  {i < arr.length - 1 && (
                    <span style={{ width: 1, height: 13, background: 'rgba(255,255,255,0.1)', display: 'inline-block' }} />
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', margin: 0 }}>© 2026 TurboStore. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ══ Responsive ══ */}
      <style>{`
        @media (max-width: 900px) {
          #hero-grid         { grid-template-columns: 1fr !important; }
          #phone-col         { display: none !important; }
          #features-grid     { grid-template-columns: 1fr 1fr !important; }
          #steps-grid        { grid-template-columns: 1fr 1fr !important; }
          #api-grid          { grid-template-columns: 1fr !important; }
          #testimonials-grid { grid-template-columns: 1fr !important; }
          #pricing-inner     { grid-template-columns: 1fr !important; }
          #footer-grid       { grid-template-columns: 1fr 1fr !important; }
          #metrics-bar       { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
        }
        @media (max-width: 580px) {
          #features-grid     { grid-template-columns: 1fr !important; }
          #steps-grid        { grid-template-columns: 1fr !important; }
          #testimonials-grid { grid-template-columns: 1fr !important; }
          #footer-grid       { grid-template-columns: 1fr !important; }
          #metrics-bar       { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 540px) {
          #nav-telegram { display: none !important; }
          #nav-twitter  { display: none !important; }
          #nav-sell     { display: none !important; }
          #hero { padding: 80px 20px 50px !important; }
          #hero h1 span { letter-spacing: -1px !important; }
        }
        @media (max-width: 400px) {
          #metrics-bar   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

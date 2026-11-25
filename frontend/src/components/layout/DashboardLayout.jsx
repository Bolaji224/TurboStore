import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, PhoneCall, ClipboardList, Wallet,
  Receipt, Key, User, Settings, LogOut, Menu, X, Bell,
  Users, Gift, Shield, ChevronDown, HelpCircle, ShoppingBag, Mail
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Logo from '../shared/Logo'

const NOTIF_ICONS = {
  otp_received:    '🔑',
  wallet_funded:   '💰',
  referral_reward: '🎁',
  order_cancelled: '❌',
}

const consumerNavItems = [
  { section: 'Main', items: [
    { to: '/dashboard',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
    { to: '/dashboard/buy-number', label: 'Buy Number', icon: PhoneCall },
    { to: '/dashboard/email-otp',  label: 'Email OTP',  icon: Mail },
    { to: '/dashboard/orders',     label: 'My Orders',  icon: ClipboardList },
    { to: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag, children: [
      { to: '/dashboard/marketplace/orders', label: 'Orders', icon: ClipboardList },
    ]},
  ]},
  { section: 'Wallet', items: [
    { to: '/dashboard/wallet',       label: 'Wallet',       icon: Wallet },
    { to: '/dashboard/transactions', label: 'Transactions', icon: Receipt },
  ]},
  { section: 'Rewards', items: [
    { to: '/dashboard/referrals', label: 'Referrals', icon: Users },
    { to: '/dashboard/rewards',   label: 'Rewards',   icon: Gift },
  ]},
  { section: 'Developer', items: [
    { to: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  ]},
  { section: 'Account', items: [
    { to: '/dashboard/profile',  label: 'Profile',  icon: User },
    { to: '/dashboard/security', label: 'Security', icon: Shield },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]},
]

const supplierNavItems = [
  { section: 'Virtual Numbers', items: [
    { to: '/dashboard/buy-number', label: 'Buy Number', icon: PhoneCall },
    { to: '/dashboard/orders',     label: 'My Orders',  icon: ClipboardList },
  ]},
  { section: 'Wallet', items: [
    { to: '/dashboard/wallet',       label: 'Wallet',       icon: Wallet },
    { to: '/dashboard/transactions', label: 'Transactions', icon: Receipt },
  ]},
  { section: 'Rewards', items: [
    { to: '/dashboard/referrals', label: 'Referrals', icon: Users },
    { to: '/dashboard/rewards',   label: 'Rewards',   icon: Gift },
  ]},
  { section: 'Supplier', items: [
    { to: '/dashboard/marketplace/vendor', label: 'Supplier Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'Developer', items: [
    { to: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  ]},
  { section: 'Account', items: [
    { to: '/dashboard/profile',  label: 'Profile',  icon: User },
    { to: '/dashboard/security', label: 'Security', icon: Shield },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]},
]

const pageTitles = {
  '/dashboard':                              'Dashboard',
  '/dashboard/buy-number':                   'Buy Number',
  '/dashboard/email-otp':                    'Email OTP',
  '/dashboard/orders':                       'My Orders',
  '/dashboard/wallet':                       'Wallet',
  '/dashboard/transactions':                 'Transactions',
  '/dashboard/referrals':                    'Referrals',
  '/dashboard/rewards':                      'Rewards',
  '/dashboard/api-keys':                     'API Keys',
  '/dashboard/profile':                      'Profile',
  '/dashboard/security':                     'Security',
  '/dashboard/settings':                     'Settings',
  '/dashboard/marketplace':                  'Marketplace',
  '/dashboard/marketplace/orders':           'Marketplace Orders',
  '/dashboard/marketplace/vendor':           'Supplier Dashboard',
  '/dashboard/marketplace/vendor/services':  'My Services',
  '/dashboard/marketplace/vendor/orders':    'Supplier Orders',
  '/dashboard/marketplace/vendor/earnings':  'Earnings',
}

// Supplier-only routes — consumers cannot access these
const SUPPLIER_ONLY = ['/dashboard/marketplace/vendor']


function timeAgo(iso) {
  const diff = Date.now() - new Date(iso)
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function DashboardLayout() {
  const [open, setOpen]               = useState(false)
  const [mobile, setMobile]           = useState(window.innerWidth <= 768)
  const [showNotifs, setShowNotifs]   = useState(false)
  const [showUser, setShowUser]       = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState(new Set())
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [walletBalance, setWalletBalance] = useState(null)
  const { user, logout }        = useAuth()
  const navigate                = useNavigate()
  const location                = useLocation()
  const notifsRef               = useRef(null)
  const userRef                 = useRef(null)

  const pageTitle = pageTitles[location.pathname] || 'Dashboard'

  const fetchNotifications = useCallback(() => {
    api.get('/notifications')
      .then(r => {
        setNotifications(r.data.notifications ?? [])
        setUnreadCount(r.data.unread_count ?? 0)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 30000)
    return () => clearInterval(id)
  }, [fetchNotifications])

  // Refresh wallet balance on every page navigation so it's always current
  useEffect(() => {
    api.get('/wallet').then(r => setWalletBalance(r.data.balance_naira)).catch(() => {})
  }, [location.pathname])

  // Route guard — block consumers from supplier-only routes
  useEffect(() => {
    if (!user) return
    if (user.user_type !== 'supplier') {
      const path = location.pathname
      const isSupplierOnly = SUPPLIER_ONLY.some(r => path === r || path.startsWith(r + '/'))
      if (isSupplierOnly) navigate('/dashboard', { replace: true })
    }
  }, [user, location.pathname])

  function openNotifs() {
    setShowNotifs(v => !v)
    setShowUser(false)
    // Mark all read when panel opens
    if (unreadCount > 0) {
      api.post('/notifications/read-all')
        .then(() => {
          setUnreadCount(0)
          setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
        })
        .catch(() => {})
    }
  }

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    function onClickOutside(e) {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false)
      if (userRef.current    && !userRef.current.contains(e.target))    setShowUser(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <div
        className={`sidebar-overlay${open ? ' show' : ''}`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`sidebar${open ? ' open' : ''}`}
      >
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <Logo />
        </div>
        <nav style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
          {(user?.user_type === 'supplier' ? supplierNavItems : consumerNavItems).map(group => (
            <div key={group.section}>
              <div className="nav-section">{group.section}</div>
              {group.items.map(item => {
                if (item.children) {
                  const autoOpen = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                  const isOpen = autoOpen || openDropdowns.has(item.to)
                  const toggleDd = () => setOpenDropdowns(prev => {
                    const next = new Set(prev)
                    if (next.has(item.to)) next.delete(item.to)
                    else next.add(item.to)
                    return next
                  })
                  return (
                    <div key={item.to + item.label}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={() => setOpen(false)}
                          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                          style={{ flex: 1, borderRadius: 8 }}
                        >
                          <item.icon size={16} />
                          {item.label}
                        </NavLink>
                        <button
                          onClick={toggleDd}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', height: 36, flexShrink: 0 }}>
                          <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>
                      </div>
                      {isOpen && (
                        <div style={{ paddingLeft: 10, borderLeft: '2px solid var(--border)', marginLeft: 14, marginTop: 2, marginBottom: 2 }}>
                          {item.children.map(child => (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              end={child.end}
                              onClick={() => setOpen(false)}
                              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                              style={{ fontSize: 13, padding: '7px 10px' }}
                            >
                              <child.icon size={14} />
                              {child.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
                return (
                  <NavLink
                    key={item.to + item.label}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `nav-item${isActive && item.to !== '#' ? ' active' : ''}`
                    }
                  >
                    <item.icon size={16} />
                    {item.label}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <a href="https://t.me/Turbo_storess" target="_blank" rel="noopener noreferrer" className="nav-item">
            <HelpCircle size={16} /> Help & Support
          </a>
          <button onClick={handleLogout} className="nav-item" style={{ color: '#EF4444' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          {/* Left — title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {mobile && (
              <button onClick={() => setOpen(o => !o)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'var(--text)' }}>
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{pageTitle}</h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Welcome back, {user?.name?.split(' ')[0] || 'User'}</p>
            </div>
          </div>

          {/* Right — actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Wallet balance chip */}
            {!mobile && (
              <button onClick={() => navigate('/dashboard/wallet')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Wallet size={13} color="#16A34A" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>₦{Math.round(walletBalance ?? user?.wallet_naira ?? 0).toLocaleString()}</span>
              </button>
            )}

            {/* Notification bell */}
            <div style={{ position: 'relative' }} ref={notifsRef}>
              <button className="theme-toggle" onClick={openNotifs} style={{ position: 'relative' }}>
                <Bell size={16} color="var(--text-muted)" />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, background: '#EF4444', borderRadius: '50%', border: '1.5px solid var(--card-bg)' }} />
                )}
              </button>

              {showNotifs && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 'min(320px, calc(100vw - 20px))', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.14)', zIndex: 200, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Notifications</span>
                    {unreadCount > 0 && <span className="badge badge-success">{unreadCount} new</span>}
                  </div>

                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No notifications yet
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start', background: n.unread ? 'rgba(22,163,74,0.06)' : 'transparent', cursor: 'default', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = n.unread ? 'rgba(22,163,74,0.06)' : 'transparent'}>
                        <span style={{ fontSize: 20, lineHeight: 1 }}>{NOTIF_ICONS[n.type] ?? '🔔'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{n.title}</p>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0', lineHeight: 1.4 }}>{n.body}</p>
                        </div>
                        {n.unread && <div style={{ width: 7, height: 7, background: '#16A34A', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div style={{ position: 'relative' }} ref={userRef}>
              <button onClick={() => { setShowUser(v => !v); setShowNotifs(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                </div>
                {!mobile && (
                  <>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{user?.name || 'User'}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{user?.email || ''}</p>
                    </div>
                    <ChevronDown size={14} color="var(--text-muted)" />
                  </>
                )}
              </button>

              {showUser && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 190, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.14)', zIndex: 200, overflow: 'hidden' }}>
                  {[
                    { label: 'Profile',  icon: User,     to: '/dashboard/profile' },
                    { label: 'Security', icon: Shield,   to: '/dashboard/security' },
                    { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
                  ].map(item => (
                    <button key={item.label} onClick={() => { navigate(item.to); setShowUser(false) }}
                      style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'inherit', textAlign: 'left', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <item.icon size={14} color="var(--text-muted)" /> {item.label}
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={handleLogout}
                      style={{ width: '100%', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#EF4444', fontFamily: 'inherit', textAlign: 'left', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LogOut size={14} color="#EF4444" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: 'clamp(14px, 3vw, 24px)', background: 'var(--page-bg)', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </div>
      </div>

      {/* Telegram support button */}
      <a
        href="https://t.me/+2349019679152"
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with support on Telegram"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          width: 52, height: 52, borderRadius: '50%',
          background: '#229ED9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(34,158,217,0.5)',
          transition: 'transform .15s, box-shadow .15s',
          textDecoration: 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(34,158,217,0.7)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 20px rgba(34,158,217,0.5)' }}
      >
        {/* Telegram SVG icon */}
        <svg width="26" height="26" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      </a>
    </>
  )
}

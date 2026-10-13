import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, PhoneCall, ClipboardList, Wallet,
  Receipt, Key, BookOpen, User, Settings, LogOut, Menu, X, Bell,
  Sun, Moon, Users, Gift, Shield, ChevronDown, HelpCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import Logo from '../shared/Logo'

const NOTIF_ICONS = {
  otp_received:    '🔑',
  wallet_funded:   '💰',
  referral_reward: '🎁',
  order_cancelled: '❌',
}

const navItems = [
  { section: 'Main', items: [
    { to: '/dashboard',            label: 'Dashboard',  icon: LayoutDashboard, end: true },
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
  { section: 'Developer', items: [
    { to: '/dashboard/api-keys', label: 'API Keys',      icon: Key },
    { to: '#',                   label: 'Documentation', icon: BookOpen },
  ]},
  { section: 'Account', items: [
    { to: '/dashboard/profile',  label: 'Profile',  icon: User },
    { to: '/dashboard/security', label: 'Security', icon: Shield },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]},
]

const pageTitles = {
  '/dashboard':              'Dashboard',
  '/dashboard/buy-number':   'Buy Number',
  '/dashboard/orders':       'My Orders',
  '/dashboard/wallet':       'Wallet',
  '/dashboard/transactions': 'Transactions',
  '/dashboard/referrals':    'Referrals',
  '/dashboard/rewards':      'Rewards',
  '/dashboard/api-keys':     'API Keys',
  '/dashboard/profile':      'Profile',
  '/dashboard/security':     'Security',
  '/dashboard/settings':     'Settings',
}


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
  const [open, setOpen]             = useState(false)
  const [mobile, setMobile]         = useState(window.innerWidth <= 768)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUser, setShowUser]     = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const { user, logout }        = useAuth()
  const { isDark, toggle }      = useTheme()
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
      <div className={`sidebar-overlay${open ? ' show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <Logo />
        </div>
        <nav style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
          {navItems.map(group => (
            <div key={group.section}>
              <div className="nav-section">{group.section}</div>
              {group.items.map(item => (
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
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <a href="#" className="nav-item">
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
            {/* Theme toggle */}
            <button className="theme-toggle" onClick={toggle} title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
              {isDark ? <Sun size={16} color="#4ADE80" /> : <Moon size={16} color="#64748B" />}
            </button>

            {/* Wallet balance chip */}
            {!mobile && (
              <button onClick={() => navigate('/dashboard/wallet')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4', border: `1px solid ${isDark ? 'rgba(22,163,74,0.3)' : '#DCFCE7'}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                <Wallet size={13} color="#16A34A" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>₦{Math.round(user?.wallet_naira ?? 0).toLocaleString()}</span>
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
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 320, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,0.14)', zIndex: 200, overflow: 'hidden' }}>
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
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start', background: n.unread ? (isDark ? 'rgba(22,163,74,0.06)' : '#F7FFF9') : 'transparent', cursor: 'default', transition: 'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = n.unread ? (isDark ? 'rgba(22,163,74,0.06)' : '#F7FFF9') : 'transparent'}>
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
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LogOut size={14} color="#EF4444" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: 24, background: 'var(--page-bg)', minHeight: 'calc(100vh - 60px)' }}>
          <Outlet />
        </div>
      </div>
    </>
  )
}

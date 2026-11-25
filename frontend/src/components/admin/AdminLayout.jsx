import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShoppingCart, Wallet, Receipt,
  Settings, LogOut, Menu, X, Shield, ChevronDown, Bell,
  BarChart3, Gift, Boxes, Store, Briefcase, Package, CreditCard, PieChart, Rocket, AlertOctagon
} from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import adminApi from '../../services/adminApi'

const NAV = [
  { section: 'Overview', items: [
    { to: '/admin',        label: 'Dashboard', icon: LayoutDashboard, end: true },
  ]},
  { section: 'Management', items: [
    { to: '/admin/users',  label: 'Users',    icon: Users },
    { to: '/admin/orders', label: 'Orders',   icon: ShoppingCart },
  ]},
  { section: 'Finance', items: [
    { to: '/admin/wallet',       label: 'Wallet',       icon: Wallet },
    { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
  ]},
  { section: 'Growth', items: [
    { to: '/admin/referrals', label: 'Referrals', icon: Gift },
    { to: '/admin/reports',   label: 'Reports',   icon: BarChart3 },
    { to: '/admin/launch-campaign', label: 'Launch Campaign', icon: Rocket },
  ]},
  { section: 'Marketplace', items: [
    { to: '/admin/marketplace',                  label: 'Marketplace',      icon: Store },
    { to: '/admin/marketplace/vendors',          label: 'Vendors',          icon: Briefcase },
    { to: '/admin/marketplace/services',         label: 'Services',         icon: Package },
    { to: '/admin/marketplace/payouts',          label: 'Supplier Payouts', icon: CreditCard },
    { to: '/admin/marketplace/supplier-reports', label: 'Supplier Reports', icon: PieChart },
    { to: '/admin/marketplace/disputes',         label: 'Disputes',         icon: AlertOctagon },
  ]},
  { section: 'System', items: [
    { to: '/admin/providers', label: 'Providers', icon: Boxes },
    { to: '/admin/settings',  label: 'Settings',  icon: Settings },
  ]},
]

const PAGE_TITLES = {
  '/admin':              'Dashboard',
  '/admin/users':        'Users',
  '/admin/orders':       'Orders',
  '/admin/wallet':       'Wallet',
  '/admin/transactions': 'Transactions',
  '/admin/referrals':    'Referrals',
  '/admin/reports':      'Reports',
  '/admin/launch-campaign': 'Launch Campaign',
  '/admin/providers':              'Providers',
  '/admin/settings':               'Settings',
  '/admin/marketplace':                    'Marketplace Overview',
  '/admin/marketplace/vendors':           'Marketplace Vendors',
  '/admin/marketplace/services':          'Marketplace Services',
  '/admin/marketplace/payouts':           'Supplier Payouts',
  '/admin/marketplace/supplier-reports':  'Supplier Reports',
  '/admin/marketplace/disputes':          'Marketplace Disputes',
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [isMobile, setIsMobile]         = useState(window.innerWidth <= 768)
  const { admin, logout }               = useAdminAuth()
  const navigate                        = useNavigate()
  const location                        = useLocation()
  const [notifs, setNotifs]             = useState([])
  const [unread, setUnread]             = useState(0)
  const [showNotifs, setShowNotifs]     = useState(false)
  const notifRef                        = useRef(null)

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Admin'

  const fetchNotifs = useCallback(async () => {
    try {
      const r = await adminApi.get('/notifications')
      setNotifs(r.data.notifications || [])
      setUnread(r.data.unread_count || 0)
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  useEffect(() => {
    function onClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function markAllRead() {
    try {
      await adminApi.post('/notifications/read-all')
      setUnread(0)
      setNotifs(n => n.map(x => ({ ...x, unread: false })))
    } catch {}
  }

  function timeAgo(iso) {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (diff < 60)   return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0F1117', color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Overlay */}
      {sidebarOpen && isMobile && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, background: '#161B26', borderRight: '1px solid #1E2736',
        display: 'flex', flexDirection: 'column',
        position: isMobile ? 'fixed' : 'sticky', top: 0, height: '100vh',
        transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform .25s ease', zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1E2736', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Turbostore</p>
            <p style={{ fontSize: 10, color: '#64748B', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 8px 4px', margin: 0 }}>
                {group.section}
              </p>
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                    borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                    color: isActive ? '#4ADE80' : '#94A3B8',
                    background: isActive ? 'rgba(74,222,128,0.08)' : 'transparent',
                    transition: 'all .15s',
                  })}
                >
                  <item.icon size={15} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px', borderTop: '1px solid #1E2736' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 4, background: '#1E2736' }}>
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{(admin?.name || 'A').charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin?.name}</p>
              <p style={{ fontSize: 10, color: '#64748B', margin: 0, textTransform: 'capitalize' }}>{admin?.admin_role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, fontSize: 13, color: '#EF4444', fontFamily: 'inherit', transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ height: 60, background: '#161B26', borderBottom: '1px solid #1E2736', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(o => !o)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 4 }}>
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>{pageTitle}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Notification bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowNotifs(o => !o); if (!showNotifs && unread > 0) markAllRead() }}
                style={{ position: 'relative', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 6, borderRadius: 8, transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, background: '#EF4444', borderRadius: '50%', fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 320, background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.4)', zIndex: 200, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E2736', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>Notifications</span>
                    {unread > 0 && (
                      <button onClick={markAllRead} style={{ fontSize: 11, color: '#4ADE80', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifs.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', padding: '24px 16px', margin: 0 }}>No notifications yet</p>
                    ) : notifs.map(n => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #1E2736', background: n.unread ? 'rgba(74,222,128,0.04)' : 'transparent', cursor: 'default' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: n.unread ? '#4ADE80' : '#94A3B8', margin: '0 0 3px' }}>{n.title}</p>
                            <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.4 }}>{n.body}</p>
                          </div>
                          <span style={{ fontSize: 10, color: '#475569', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '4px 10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 6, fontSize: 11, color: '#4ADE80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {admin?.admin_role?.replace('_', ' ')}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: 'clamp(14px, 3vw, 24px)', background: '#0F1117', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

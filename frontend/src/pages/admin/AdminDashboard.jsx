import { useEffect, useState } from 'react'
import { Users, ShoppingCart, Wallet, TrendingUp, Activity, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import adminApi from '../../services/adminApi'

function StatCard({ icon: Icon, label, value, sub, color = '#16A34A' }) {
  return (
    <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <div style={{ width: 36, height: 36, background: `${color}18`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#E2E8F0', margin: '0 0 4px' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{sub}</p>}
    </div>
  )
}

const STATUS_CONFIG = {
  processing:      { color: '#F59E0B', icon: Clock },
  waiting_for_otp: { color: '#3B82F6', icon: Clock },
  otp_received:    { color: '#22C55E', icon: CheckCircle },
  cancelled:       { color: '#EF4444', icon: XCircle },
  expired:         { color: '#6B7280', icon: AlertCircle },
}

function fmt(kobo) {
  return '₦' + Math.round(kobo / 100).toLocaleString()
}

export default function AdminDashboard() {
  const [data, setData]       = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    Promise.all([
      adminApi.get('/dashboard/overview'),
      adminApi.get('/dashboard/activity'),
    ])
      .then(([ov, ac]) => {
        setData(ov.data)
        setActivity(ac.data.activity ?? [])
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #1E2736', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error) return (
    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 20, color: '#EF4444', fontSize: 14 }}>{error}</div>
  )

  const { users, orders, revenue, wallet } = data

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users}       label="Total Users"    value={users.total.toLocaleString()}         sub={`+${users.new_today} today · +${users.new_week} this week`} />
        <StatCard icon={ShoppingCart} label="Total Orders"  value={orders.total.toLocaleString()}        sub={`${orders.today} today · ${orders.active} active`} color="#3B82F6" />
        <StatCard icon={Wallet}       label="Revenue (Month)" value={fmt(revenue.this_month)}            sub={`Total: ${fmt(revenue.total)}`} color="#F59E0B" />
        <StatCard icon={TrendingUp}   label="Wallet Balance" value={fmt(wallet.total_balance)}           sub="Sum of all user wallets" color="#8B5CF6" />
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        {/* Recent activity */}
        <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E2736', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={15} color="#64748B" />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Recent Activity</p>
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {activity.length === 0 ? (
              <p style={{ padding: 20, color: '#475569', fontSize: 13, textAlign: 'center' }}>No activity yet.</p>
            ) : activity.map((item, i) => (
              <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid #1E2736', display: 'flex', alignItems: 'center', gap: 12 }}>
                {item.type === 'order' ? (
                  <>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_CONFIG[item.status]?.color ?? '#64748B', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: '#E2E8F0', margin: 0, fontWeight: 500 }}>
                        Order <span style={{ color: '#64748B', fontFamily: 'monospace' }}>{item.reference}</span>
                      </p>
                      <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>{item.user?.email}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 12, color: STATUS_CONFIG[item.status]?.color ?? '#64748B', margin: 0, fontWeight: 600 }}>{item.status}</p>
                      <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>{fmt(item.amount)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: '#E2E8F0', margin: 0, fontWeight: 500 }}>New registration</p>
                      <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>{item.user?.email}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Order status breakdown */}
        <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E2736' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Orders by Status</p>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {Object.entries(orders.by_status ?? {}).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status] ?? { color: '#64748B' }
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color }} />
                    <span style={{ fontSize: 12, color: '#94A3B8', textTransform: 'capitalize' }}>{status.replace(/_/g, ' ')}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

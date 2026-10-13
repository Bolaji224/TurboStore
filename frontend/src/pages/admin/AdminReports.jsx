import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingCart, Users, DollarSign } from 'lucide-react'
import adminApi from '../../services/adminApi'

function fmt(kobo) { return '₦' + Math.round(kobo / 100).toLocaleString() }

function MiniBar({ data, valueKey, labelKey, color = '#16A34A', formatter = v => v }) {
  if (!data?.length) return <p style={{ color: '#475569', fontSize: 13, padding: '16px 0' }}>No data for this period.</p>
  const max = Math.max(...data.map(d => d[valueKey])) || 1
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${(d[valueKey] / max) * 72}px`, minHeight: d[valueKey] > 0 ? 2 : 0, opacity: 0.85 }} />
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = '#16A34A' }) {
  return (
    <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
        <div style={{ width: 32, height: 32, background: `${color}18`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', margin: '0 0 4px' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default function AdminReports() {
  const [days, setDays]           = useState(30)
  const [revenue, setRevenue]     = useState(null)
  const [orders, setOrders]       = useState(null)
  const [users, setUsers]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      adminApi.get(`/reports/revenue?days=${days}`),
      adminApi.get(`/reports/orders?days=${days}`),
      adminApi.get(`/reports/users?days=${days}`),
    ])
      .then(([r, o, u]) => {
        setRevenue(r.data)
        setOrders(o.data)
        setUsers(u.data)
      })
      .catch(() => setError('Failed to load report data.'))
      .finally(() => setLoading(false))
  }, [days])

  const periods = [7, 14, 30, 60, 90]

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {periods.map(d => (
          <button key={d} onClick={() => setDays(d)}
            style={{ padding: '7px 14px', border: `1px solid ${days === d ? '#16A34A' : '#1E2736'}`, borderRadius: 8, background: days === d ? 'rgba(22,163,74,0.1)' : 'transparent', color: days === d ? '#4ADE80' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {d}d
          </button>
        ))}
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <div style={{ width: 28, height: 28, border: '3px solid #1E2736', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <StatCard icon={DollarSign} label={`Revenue (${days}d)`}    value={fmt(revenue?.total_30d ?? 0)}  sub={`7d: ${fmt(revenue?.total_7d ?? 0)} · All: ${fmt(revenue?.total_all ?? 0)}`} color="#F59E0B" />
            <StatCard icon={ShoppingCart} label={`Orders (${days}d)`}   value={orders?.by_day?.reduce((s, d) => s + d.total, 0).toLocaleString() ?? '0'} sub="Total in selected period" color="#3B82F6" />
            <StatCard icon={Users} label={`New Users (${days}d)`}       value={(users?.total_30d ?? 0).toLocaleString()} sub={`7d: ${users?.total_7d ?? 0} · All: ${users?.total_all ?? 0}`} />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
            <ChartCard title="Revenue by Day" sub={`Last ${days} days`}>
              <MiniBar data={revenue?.by_day} valueKey="total" labelKey="day" color="#F59E0B" />
            </ChartCard>
            <ChartCard title="Orders by Day" sub={`Last ${days} days`}>
              <MiniBar data={orders?.by_day} valueKey="total" labelKey="day" color="#3B82F6" />
            </ChartCard>
            <ChartCard title="Registrations by Day" sub={`Last ${days} days`}>
              <MiniBar data={users?.by_day} valueKey="count" labelKey="day" color="#16A34A" />
            </ChartCard>
          </div>

          {/* Tables row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* By provider */}
            <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #1E2736' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Orders by Provider</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E2736' }}>
                    {['Provider', 'Orders', 'Revenue'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!orders?.by_provider?.length ? (
                    <tr><td colSpan={3} style={{ padding: '20px 16px', color: '#475569', fontSize: 13 }}>No data.</td></tr>
                  ) : orders.by_provider.map(r => (
                    <tr key={r.provider} style={{ borderBottom: '1px solid #1E2736' }}>
                      <td style={{ padding: '10px 16px', color: '#E2E8F0', fontWeight: 600, textTransform: 'capitalize' }}>{r.provider}</td>
                      <td style={{ padding: '10px 16px', color: '#94A3B8' }}>{r.count.toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', color: '#4ADE80', fontWeight: 600 }}>{fmt(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top services */}
            <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #1E2736' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Top Services (All Time)</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E2736' }}>
                    {['Service', 'Orders'].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!orders?.by_service?.length ? (
                    <tr><td colSpan={2} style={{ padding: '20px 16px', color: '#475569', fontSize: 13 }}>No data.</td></tr>
                  ) : orders.by_service.map((r, i) => (
                    <tr key={r.service} style={{ borderBottom: '1px solid #1E2736' }}>
                      <td style={{ padding: '10px 16px', color: '#E2E8F0', textTransform: 'capitalize' }}>
                        <span style={{ background: 'rgba(22,163,74,0.1)', color: '#4ADE80', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 700, marginRight: 7 }}>#{i + 1}</span>
                        {r.service}
                      </td>
                      <td style={{ padding: '10px 16px', color: '#94A3B8', fontWeight: 600 }}>{r.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ChartCard({ title, sub, children }) {
  return (
    <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: '16px 18px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', margin: '0 0 2px' }}>{title}</p>
      <p style={{ fontSize: 11, color: '#475569', margin: '0 0 14px' }}>{sub}</p>
      {children}
    </div>
  )
}

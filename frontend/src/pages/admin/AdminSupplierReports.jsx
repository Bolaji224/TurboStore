import { useEffect, useState, useCallback } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign, Download } from 'lucide-react'
import adminApi from '../../services/adminApi'

function fmt(kobo) { return '₦' + Math.round(kobo / 100).toLocaleString('en-NG') }
function pct(a, b) { return b === 0 ? '0%' : Math.round((a / b) * 100) + '%' }

function MetricCard({ label, value, sub, color = '#4ADE80' }) {
  return (
    <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: '16px 18px' }}>
      <p style={{ color: '#64748B', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 8px' }}>{label}</p>
      <p style={{ color, fontSize: 20, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.5px' }}>{value}</p>
      {sub && <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default function AdminSupplierReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = {}
      if (dateFrom) params.date_from = dateFrom
      if (dateTo)   params.date_to   = dateTo
      const { data } = await adminApi.get('/marketplace/supplier-reports', { params })
      setReports(data.data || [])
    } catch { setError('Failed to load supplier reports.') }
    finally { setLoading(false) }
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  // Platform-wide totals
  const totals = reports.reduce((acc, r) => {
    acc.gross    += r.gross_sales_kobo
    acc.commission += r.commission_kobo
    acc.net      += r.net_earnings_kobo
    acc.pending  += r.pending_kobo
    acc.available += r.available_kobo
    acc.paidOut  += r.paid_out_kobo
    return acc
  }, { gross: 0, commission: 0, net: 0, pending: 0, available: 0, paidOut: 0 })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#E2E8F0', fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Supplier Financial Reports</h2>
        <p style={{ color: '#64748B', fontSize: 13, margin: 0 }}>Per-supplier breakdown of gross sales, 10% commission, net earnings and payout status.</p>
      </div>

      {/* Date filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #2D3748', background: '#161B26', color: '#E2E8F0', fontSize: 13, outline: 'none' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #2D3748', background: '#161B26', color: '#E2E8F0', fontSize: 13, outline: 'none' }} />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #2D3748', background: 'transparent', color: '#64748B', fontSize: 12, cursor: 'pointer', marginTop: 16 }}>
            Clear
          </button>
        )}
      </div>

      {/* Platform totals */}
      {!loading && reports.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          <MetricCard label="Gross Sales" value={fmt(totals.gross)} />
          <MetricCard label="Commission (10%)" value={fmt(totals.commission)} color="#F59E0B" sub={pct(totals.commission, totals.gross) + ' of gross'} />
          <MetricCard label="Supplier Net" value={fmt(totals.net)} color="#3B82F6" />
          <MetricCard label="Pending Earnings" value={fmt(totals.pending)} color="#F59E0B" />
          <MetricCard label="Available Balance" value={fmt(totals.available)} color="#4ADE80" />
          <MetricCard label="Total Paid Out" value={fmt(totals.paidOut)} color="#8B5CF6" />
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <div style={{ width: 28, height: 28, border: '3px solid #1E2736', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading…
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: 14, color: '#EF4444' }}>{error}</div>
      )}

      {!loading && reports.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <BarChart3 size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No supplier data found.</p>
        </div>
      )}

      {/* Per-supplier table */}
      {!loading && reports.length > 0 && (
        <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E2736' }}>
                  {['Supplier', 'Rate', 'Orders', 'Gross Sales', 'Commission', 'Supplier Net', 'Pending', 'Available', 'Reserved', 'Paid Out'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r.vendor_id} style={{ borderBottom: i < reports.length - 1 ? '1px solid #1E2736' : 'none' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ color: '#E2E8F0', fontWeight: 600, margin: '0 0 2px', whiteSpace: 'nowrap' }}>{r.business_name}</p>
                      <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>{r.user?.email}</p>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{r.commission_rate}%</td>
                    <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{r.total_orders}</td>
                    <td style={{ padding: '12px 16px', color: '#E2E8F0', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(r.gross_sales_kobo)}</td>
                    <td style={{ padding: '12px 16px', color: '#F59E0B', whiteSpace: 'nowrap' }}>{fmt(r.commission_kobo)}</td>
                    <td style={{ padding: '12px 16px', color: '#3B82F6', whiteSpace: 'nowrap' }}>{fmt(r.net_earnings_kobo)}</td>
                    <td style={{ padding: '12px 16px', color: '#F59E0B', whiteSpace: 'nowrap' }}>{fmt(r.pending_kobo)}</td>
                    <td style={{ padding: '12px 16px', color: '#4ADE80', whiteSpace: 'nowrap' }}>{fmt(r.available_kobo)}</td>
                    <td style={{ padding: '12px 16px', color: '#8B5CF6', whiteSpace: 'nowrap' }}>{fmt(r.reserved_kobo)}</td>
                    <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{fmt(r.paid_out_kobo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Plus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

const TYPE_CONFIG = {
  deposit:    { label: 'Deposit',    cls: 'badge-success' },
  purchase:   { label: 'Purchase',   cls: 'badge-danger' },
  refund:     { label: 'Refund',     cls: 'badge-success' },
  adjustment: { label: 'Adjustment', cls: 'badge-info' },
}

export default function Transactions() {
  const [filter, setFilter]   = useState('all')
  const [txns, setTxns]       = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const { isDark } = useTheme()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/wallet/transactions'),
      api.get('/wallet'),
    ]).then(([txRes, wRes]) => {
      setTxns(txRes.data.transactions || [])
      setSummary(wRes.data)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? txns : txns.filter(t => t.type === filter)

  const totalDeposited = summary ? Math.round((summary.total_deposited || 0) / 100) : 0
  const totalSpent     = summary ? Math.round((summary.total_spent    || 0) / 100) : 0
  const balance        = summary ? Math.round(summary.balance_naira   || 0)       : 0

  const summaryCards = [
    { label: 'Total Deposited',  value: `₦${totalDeposited.toLocaleString()}`, green: true },
    { label: 'Total Spent',      value: `₦${totalSpent.toLocaleString()}`,      green: false },
    { label: 'Current Balance',  value: `₦${balance.toLocaleString()}`,          green: false },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Transactions</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Your complete wallet transaction history</p>
        </div>
        <Link to="/dashboard/wallet" className="btn-primary">
          <Plus size={15} /> Fund Wallet
        </Link>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {summaryCards.map(c => (
          <div key={c.label} className="card" style={{ padding: 18 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', fontWeight: 500 }}>{c.label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: c.green ? '#16A34A' : 'var(--text)', margin: 0 }}>
              {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {['all', 'deposit', 'purchase', 'refund'].map(f => (
          <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : TYPE_CONFIG[f]?.label + 's' || f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 14 }}>Loading transactions…</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--section-alt)' }}>
                  {['Description', 'Amount', 'Type', 'Balance After', 'Reference', 'Date'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => {
                  const isCredit = tx.amount > 0
                  const color    = isCredit ? '#16A34A' : '#DC2626'
                  const tc       = TYPE_CONFIG[tx.type] || { label: tx.type, cls: '' }
                  return (
                    <tr key={i} className="table-row">
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, background: isCredit ? (isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4') : (isDark ? 'rgba(220,38,38,0.2)' : '#FEF2F2'), borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isCredit ? <ArrowDownCircle size={14} color="#16A34A" /> : <ArrowUpCircle size={14} color="#DC2626" />}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{tx.description}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{tx.formatted}</td>
                      <td style={{ padding: '12px 16px' }}><span className={`badge ${tc.cls}`}>{tc.label}</span></td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{tx.balance_fmt}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{tx.reference}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>No transactions yet.</p>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

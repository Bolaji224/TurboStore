import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import adminApi from '../../services/adminApi'

function fmt(kobo) { return '₦' + Math.round(Math.abs(kobo) / 100).toLocaleString() }
function dateStr(iso) { return iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }

const TYPE_COLORS = {
  deposit:      '#22C55E',
  purchase:     '#EF4444',
  refund:       '#3B82F6',
  admin_credit: '#F59E0B',
  bonus:        '#8B5CF6',
}

const TYPES = ['deposit', 'purchase', 'refund', 'admin_credit']

export default function AdminTransactions() {
  const [txns, setTxns]       = useState([])
  const [meta, setMeta]       = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [type, setType]       = useState('')
  const [page, setPage]       = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 25, search: search || undefined, type: type || undefined }
      const { data } = await adminApi.get('/transactions', { params })
      setTxns(data.transactions)
      setMeta(data.meta)
    } catch { setError('Failed to load transactions.') }
    finally { setLoading(false) }
  }, [page, search, type])

  useEffect(() => { load() }, [load])

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <Search size={14} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Reference, description, user…"
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: '#161B26', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1) }}
          style={{ padding: '9px 12px', background: '#161B26', border: '1px solid #1E2736', borderRadius: 8, color: type ? '#E2E8F0' : '#475569', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        {meta.total !== undefined && <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>{meta.total.toLocaleString()} transactions</span>}
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>{error}</div>}

      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E2736' }}>
                {['Reference', 'User', 'Type', 'Amount', 'Balance After', 'Description', 'Date'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ width: 24, height: 24, border: '2px solid #1E2736', borderTop: '2px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </td></tr>
              ) : txns.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No transactions found.</td></tr>
              ) : txns.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #1E2736', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1A2135'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 14px', fontFamily: 'monospace', color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>{t.reference}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#E2E8F0', margin: 0, whiteSpace: 'nowrap' }}>{t.user?.name || '—'}</p>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{t.user?.email || ''}</p>
                  </td>
                  <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${TYPE_COLORS[t.type] ?? '#64748B'}18`, color: TYPE_COLORS[t.type] ?? '#64748B', textTransform: 'capitalize' }}>
                      {t.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: t.amount > 0 ? '#22C55E' : '#EF4444', whiteSpace: 'nowrap' }}>
                    {t.amount > 0 ? '+' : '-'}{fmt(t.amount)}
                  </td>
                  <td style={{ padding: '11px 14px', color: '#94A3B8', whiteSpace: 'nowrap' }}>{fmt(t.balance_after)}</td>
                  <td style={{ padding: '11px 14px', color: '#64748B', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                  <td style={{ padding: '11px 14px', color: '#64748B', whiteSpace: 'nowrap', fontSize: 12 }}>{dateStr(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta.last_page > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1E2736', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#475569' }}>Page {meta.current_page} of {meta.last_page}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                style={{ width: 32, height: 32, border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#334155' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={14} />
              </button>
              <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}
                style={{ width: 32, height: 32, border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', cursor: page >= meta.last_page ? 'not-allowed' : 'pointer', color: page >= meta.last_page ? '#334155' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

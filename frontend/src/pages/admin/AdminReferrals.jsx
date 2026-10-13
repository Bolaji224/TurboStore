import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Gift, Users, Award, TrendingUp } from 'lucide-react'
import adminApi from '../../services/adminApi'

function StatCard({ icon: Icon, label, value, color = '#16A34A' }) {
  return (
    <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
        <div style={{ width: 32, height: 32, background: `${color}18`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 24, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>{value}</p>
    </div>
  )
}

function dateStr(iso) { return iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }

export default function AdminReferrals() {
  const [stats, setStats]           = useState(null)
  const [referrals, setReferrals]   = useState([])
  const [meta, setMeta]             = useState({})
  const [loading, setLoading]       = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(1)

  useEffect(() => {
    adminApi.get('/referrals/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Failed to load stats.'))
      .finally(() => setLoading(false))
  }, [])

  const loadList = useCallback(async () => {
    setListLoading(true)
    try {
      const params = { page, per_page: 20, search: search || undefined }
      const { data } = await adminApi.get('/referrals', { params })
      setReferrals(data.referrals)
      setMeta(data.meta)
    } catch { setError('Failed to load referrals.') }
    finally { setListLoading(false) }
  }, [page, search])

  useEffect(() => { loadList() }, [loadList])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #1E2736', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div>
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>{error}</div>}

      {stats && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
            <StatCard icon={Users}    label="Relationships"      value={stats.stats.total_relationships.toLocaleString()} />
            <StatCard icon={TrendingUp} label="Eligible Purchases" value={stats.stats.total_eligible_purchases.toLocaleString()} color="#3B82F6" />
            <StatCard icon={Gift}     label="Available Rewards"  value={stats.stats.rewards_available.toLocaleString()} color="#22C55E" />
            <StatCard icon={Award}    label="Redeemed Rewards"   value={stats.stats.rewards_redeemed.toLocaleString()} color="#F59E0B" />
          </div>

          {/* Top referrers */}
          {stats.top_referrers?.length > 0 && (
            <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #1E2736' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>Top Referrers</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1E2736' }}>
                      {['User', 'Email', 'Total Referrals', 'Eligible Purchases'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_referrers.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1E2736' }}>
                        <td style={{ padding: '10px 16px', color: '#E2E8F0', fontWeight: 600 }}>
                          <span style={{ background: 'rgba(22,163,74,0.1)', color: '#4ADE80', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700, marginRight: 8 }}>#{i + 1}</span>
                          {r.name}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#64748B' }}>{r.email}</td>
                        <td style={{ padding: '10px 16px', color: '#E2E8F0', fontWeight: 600 }}>{r.total_referrals}</td>
                        <td style={{ padding: '10px 16px', color: '#4ADE80', fontWeight: 600 }}>{r.total_eligible}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Referral list */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
          <Search size={14} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search referrer or referred…"
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: '#161B26', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        {meta.total !== undefined && <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>{meta.total.toLocaleString()} relationships</span>}
      </div>

      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E2736' }}>
                {['Referrer', 'Referred User', 'Code Used', 'Eligible Purchases', 'Joined'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{ width: 24, height: 24, border: '2px solid #1E2736', borderTop: '2px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                </td></tr>
              ) : referrals.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No referrals found.</td></tr>
              ) : referrals.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #1E2736', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1A2135'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '11px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', margin: 0 }}>{r.referrer?.name || '—'}</p>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{r.referrer?.email}</p>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', margin: 0 }}>{r.referred?.name || '—'}</p>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{r.referred?.email}</p>
                  </td>
                  <td style={{ padding: '11px 16px', fontFamily: 'monospace', color: '#4ADE80', fontSize: 12 }}>{r.referral_code_used}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#1E2736', borderRadius: 3, overflow: 'hidden', maxWidth: 80 }}>
                        <div style={{ height: '100%', background: '#16A34A', borderRadius: 3, width: `${Math.min((r.eligible_purchases % 10) / 10 * 100, 100)}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#E2E8F0', fontWeight: 700 }}>{r.eligible_purchases}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', color: '#64748B', fontSize: 12 }}>{dateStr(r.created_at)}</td>
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

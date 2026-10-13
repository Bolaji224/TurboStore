import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, UserX, CheckCircle, Filter } from 'lucide-react'
import adminApi from '../../services/adminApi'

function fmt(kobo) {
  return '₦' + Math.round(kobo / 100).toLocaleString()
}

function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso)
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers]     = useState([])
  const [meta, setMeta]       = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [filter, setFilter]   = useState('all') // all | suspended

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, search: search || undefined, per_page: 20 }
      if (filter === 'suspended') params.is_suspended = 1
      const { data } = await adminApi.get('/users', { params })
      setUsers(data.users)
      setMeta(data.meta)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }, [page, search, filter])

  useEffect(() => { load() }, [load])

  function handleSearch(e) {
    setSearch(e.target.value)
    setPage(1)
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
          <Search size={14} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Search by name or email…"
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: '#161B26', border: '1px solid #1E2736', borderRadius: 8, color: '#E2E8F0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>
        {['all', 'suspended'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            style={{ padding: '8px 14px', border: `1px solid ${filter === f ? '#16A34A' : '#1E2736'}`, borderRadius: 8, background: filter === f ? 'rgba(22,163,74,0.12)' : 'transparent', color: filter === f ? '#4ADE80' : '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
            {f === 'all' ? 'All Users' : 'Suspended'}
          </button>
        ))}
        {meta.total !== undefined && (
          <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>{meta.total.toLocaleString()} users</span>
        )}
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 13 }}>{error}</div>}

      {/* Table */}
      <div style={{ background: '#161B26', border: '1px solid #1E2736', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1E2736' }}>
                {['User', 'Wallet', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
                  <div style={{ width: 24, height: 24, border: '2px solid #1E2736', borderTop: '2px solid #16A34A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#475569' }}>No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id}
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                  style={{ borderBottom: '1px solid #1E2736', cursor: 'pointer', transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1A2135'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#16A34A,#063B2D)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{(u.name || 'U').charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', margin: 0 }}>{u.name}</p>
                        <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#E2E8F0', fontWeight: 600 }}>{fmt(u.wallet_balance)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.is_suspended ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, fontSize: 11, color: '#EF4444', fontWeight: 600 }}>
                        <UserX size={10} /> Suspended
                      </span>
                    ) : u.admin_role ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>
                        {u.admin_role.replace('_', ' ')}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 5, fontSize: 11, color: '#4ADE80', fontWeight: 600 }}>
                        <CheckCircle size={10} /> Active
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>{timeAgo(u.created_at)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={e => { e.stopPropagation(); navigate(`/admin/users/${u.id}`) }}
                      style={{ padding: '5px 12px', border: '1px solid #1E2736', borderRadius: 6, background: 'transparent', color: '#94A3B8', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

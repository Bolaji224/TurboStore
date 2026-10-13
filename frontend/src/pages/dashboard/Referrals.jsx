import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, CheckCircle, Users, Gift, TrendingUp, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

export default function Referrals() {
  const { user }   = useAuth()
  const { isDark } = useTheme()
  const navigate   = useNavigate()

  const [stats,     setStats]     = useState(null)
  const [referrals, setReferrals] = useState([])
  const [rewards,   setRewards]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [copied,    setCopied]    = useState(false)

  const referralCode = user?.referral_code ?? ''
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`

  useEffect(() => {
    Promise.all([
      api.get('/referrals/stats'),
      api.get('/referrals'),
      api.get('/referrals/rewards'),
    ])
      .then(([s, r, rw]) => {
        setStats(s.data.stats)
        setReferrals(r.data.referrals ?? [])
        setRewards(rw.data.rewards ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function copyLink() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Pick the referral closest to its next milestone for the progress card
  const bestReferral = referrals.length > 0
    ? referrals.reduce((a, b) => (b.progress > a.progress ? b : a), referrals[0])
    : null

  const progressValue  = bestReferral ? bestReferral.progress : 0
  const progressTarget = 10
  const progressPct    = Math.round((progressValue / progressTarget) * 100)

  const availableRewards = rewards.filter(r => r.status === 'available')

  const statCards = [
    { label: 'Total Referrals',       value: stats?.total_referrals ?? 0,          icon: Users,        color: '#3B82F6', darkBg: 'rgba(59,130,246,0.2)',  lightBg: '#EFF6FF' },
    { label: 'Eligible Purchases',    value: stats?.total_eligible_purchases ?? 0,  icon: TrendingUp,   color: '#8B5CF6', darkBg: 'rgba(139,92,246,0.2)', lightBg: '#F5F3FF' },
    { label: 'Available Rewards',     value: stats?.available_rewards ?? 0,         icon: Gift,         color: '#16A34A', darkBg: 'rgba(22,163,74,0.2)',  lightBg: '#F0FDF4' },
    { label: 'Total Rewards Earned',  value: stats?.total_rewards_earned ?? 0,      icon: CheckCircle,  color: '#F59E0B', darkBg: 'rgba(245,158,11,0.2)',  lightBg: '#FFFBEB' },
  ]

  const border = isDark ? 'rgba(255,255,255,0.07)' : '#E8F5ED'

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--text-muted)' }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Loading referrals…
      </div>
    )
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #063B2D, #16A34A)', borderRadius: 18, padding: '36px 32px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 80, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 16 }}>
            <Gift size={13} color="#4ADE80" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4ADE80', letterSpacing: '.06em' }}>REFERRAL PROGRAM</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-1px' }}>Invite. Earn. Verify.</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', maxWidth: 520, lineHeight: 1.6 }}>
            Share TurboStore with your network and earn free virtual numbers when your referrals make successful purchases.
          </p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[['10', 'purchases per reward'], ['1', 'free number per milestone'], ['No', 'expiry on rewards']].map(([n, t]) => (
              <div key={t}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#4ADE80' }}>{n}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginLeft: 6 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referral link */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>Your Referral Link</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px' }}>
          Your code: <strong style={{ color: 'var(--text)' }}>{referralCode}</strong>. Share this link with friends to start earning.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, padding: '11px 16px', background: 'var(--input-bg)', border: `1.5px solid ${border}`, borderRadius: 10, fontFamily: 'monospace', fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {referralLink}
          </div>
          <button onClick={copyLink} className="btn-primary" style={{ gap: 7, padding: '10px 20px', flexShrink: 0 }}>
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{s.label}</p>
              <div style={{ width: 34, height: 34, background: isDark ? s.darkBg : s.lightBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={16} color={s.color} />
              </div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-1px' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Available rewards */}
      {availableRewards.length > 0 && (
        <div className="card" style={{ padding: 20, marginBottom: 24, border: '1.5px solid #16A34A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Gift size={18} color="#16A34A" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {availableRewards.length} Free Number{availableRewards.length > 1 ? 's' : ''} Ready to Redeem
            </h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px' }}>
            Your referrals hit a milestone! Use your free number reward on any virtual number purchase.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {availableRewards.map(reward => (
              <button
                key={reward.id}
                onClick={() => navigate('/dashboard/buy-number', { state: { rewardId: reward.id } })}
                className="btn-primary"
                style={{ gap: 7, padding: '10px 20px' }}
              >
                <Gift size={14} /> Redeem Reward #{reward.id} (Milestone {reward.milestone})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress + Referral history */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 24 }}>
        {/* Next reward progress */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px' }}>Next Reward</h3>
            <p style={{ fontSize: 13, color: '#16A34A', fontWeight: 600, margin: 0 }}>1 Free Virtual Number</p>
          </div>

          {bestReferral ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Closest referral</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>{progressValue} / {progressTarget}</span>
              </div>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg,#16A34A,#4ADE80)', borderRadius: 999, transition: 'width .4s ease' }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0', textAlign: 'center' }}>
                {bestReferral.purchases_to_reward} purchase{bestReferral.purchases_to_reward !== 1 ? 's' : ''} remaining
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No referrals yet. Share your link to get started!</p>
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 7, padding: '10px 16px' }} onClick={copyLink}>
            <Copy size={14} /> Share Referral Link
          </button>
        </div>

        {/* Referral activity table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Referral Activity</h3>
          </div>
          {referrals.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              <Users size={32} style={{ marginBottom: 10, opacity: .4 }} />
              <p style={{ margin: 0 }}>No referrals yet. Share your link to earn free numbers!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--section-alt)' }}>
                    {['User', 'Purchases', 'Progress', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrals.map(r => (
                    <tr key={r.id} className="table-row">
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.masked_email}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{r.eligible_purchases}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', minWidth: 60 }}>
                            <div style={{ width: `${Math.round((r.progress / 10) * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#16A34A,#4ADE80)', borderRadius: 999 }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.progress}/10</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(r.joined_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rewards history */}
      {rewards.length > 0 && (
        <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Reward History</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--section-alt)' }}>
                  {['Milestone', 'Status', 'Earned', 'Redeemed'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rewards.map(r => (
                  <tr key={r.id} className="table-row">
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{r.milestone} purchases</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={r.status === 'available' ? 'badge badge-success' : r.status === 'redeemed' ? 'badge badge-default' : 'badge badge-warning'}>
                        {r.status === 'available' ? 'Available' : r.status === 'redeemed' ? 'Redeemed' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(r.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {r.redeemed_at ? new Date(r.redeemed_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

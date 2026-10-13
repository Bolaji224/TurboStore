import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Gift, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const AVAILABLE = [
  { id: 1, type: 'Free Virtual Number', desc: 'Use on any service in any supported country.', earned: 'Oct 1, 2026', expires: 'Jan 1, 2027' },
]

const HISTORY = [
  { icon: '🎁', title: 'Free number earned',    desc: 'Referral milestone — 10 purchases',   status: 'Available',  date: 'Oct 1, 2026' },
  { icon: '✅', title: 'Free number redeemed',  desc: 'Used for WhatsApp · United States',   status: 'Completed',  date: 'Sep 15, 2026' },
  { icon: '🎁', title: 'Free number earned',    desc: 'Referral milestone — 10 purchases',   status: 'Completed',  date: 'Sep 10, 2026' },
]

export default function Rewards() {
  const { isDark } = useTheme()
  const [redeeming, setRedeeming] = useState(false)
  const [redeemed, setRedeemed]   = useState(false)

  async function handleRedeem() {
    setRedeeming(true)
    await new Promise(r => setTimeout(r, 1200))
    setRedeeming(false)
    setRedeemed(true)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Rewards</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Redeem your earned free virtual numbers.</p>
      </div>

      {/* Available rewards */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>Available Rewards</h3>

        {redeemed ? (
          <div style={{ background: isDark ? 'rgba(22,163,74,0.1)' : '#F0FDF4', border: `1.5px solid ${isDark ? 'rgba(22,163,74,0.3)' : '#DCFCE7'}`, borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#16A34A', margin: '0 0 8px' }}>Reward Unlocked!</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>Your free virtual number is ready. Go to Buy Number to use it.</p>
            <Link to="/dashboard/buy-number" className="btn-primary" style={{ gap: 7 }}>
              <Gift size={15} /> Use Free Number <ArrowRight size={14} />
            </Link>
          </div>
        ) : AVAILABLE.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>No rewards yet</h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>Refer friends to earn your first free number after 10 successful referred purchases.</p>
            <Link to="/dashboard/referrals" className="btn-primary" style={{ gap: 7 }}>
              <Gift size={15} /> Start Earning
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {AVAILABLE.map(r => (
              <div key={r.id} className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, background: isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🎁</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{r.type}</h4>
                      <span className="badge badge-success">Available</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{r.desc}</p>
                    <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Earned: <strong style={{ color: 'var(--text)' }}>{r.earned}</strong></span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} color="#F59E0B" /> Expires: <strong style={{ color: '#F59E0B' }}>{r.expires}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={handleRedeem} disabled={redeeming} className="btn-primary" style={{ gap: 7, flexShrink: 0 }}>
                  <Gift size={14} /> {redeeming ? 'Redeeming…' : 'Redeem'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reward history */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 14px' }}>Reward History</h3>
        <div className="card" style={{ overflow: 'hidden' }}>
          {HISTORY.map((h, i) => (
            <div key={i} className="table-row" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, background: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {h.icon}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{h.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{h.desc}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span className={`badge ${h.status === 'Available' ? 'badge-success' : 'badge-info'}`}>{h.status}</span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>{h.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

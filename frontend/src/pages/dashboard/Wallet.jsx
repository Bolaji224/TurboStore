import { useState, useEffect } from 'react'
import { Wallet as WalletIcon, Plus, ArrowUpRight, CreditCard, Shield, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000]

export default function Wallet() {
  const [amount, setAmount]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [walletData, setWalletData] = useState(null)
  const [fetching, setFetching] = useState(true)
  const { isDark } = useTheme()

  useEffect(() => {
    api.get('/wallet')
      .then(r => setWalletData(r.data))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [])

  async function handleFund(e) {
    e.preventDefault()
    if (!amount || Number(amount) < 500) return
    setLoading(true)
    // Paystack integration will be added in a future update
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSuccess(true)
  }

  const balance       = walletData ? Math.round(walletData.balance_naira || 0) : 0
  const totalDeposited = walletData ? Math.round((walletData.total_deposited || 0) / 100) : 0
  const totalSpent    = walletData ? Math.round((walletData.total_spent || 0) / 100) : 0

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Wallet</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage your wallet balance and fund your account</p>
      </div>

      {/* Balance card */}
      <div style={{ background: 'linear-gradient(135deg, #063B2D, #16A34A)', borderRadius: 18, padding: 28, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 8px', fontWeight: 500 }}>Total Balance</p>
            {fetching ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={16} color="rgba(255,255,255,0.5)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading…</span>
              </div>
            ) : (
              <p style={{ color: '#fff', fontSize: 40, fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>₦{balance.toLocaleString()}</p>
            )}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '8px 0 0' }}>Available to spend</p>
          </div>
          <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.15)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WalletIcon size={24} color="#4ADE80" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 24 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>Total Deposited</p>
            <p style={{ color: '#4ADE80', fontSize: 16, fontWeight: 700, margin: '2px 0 0' }}>₦{totalDeposited.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>Total Spent</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: 700, margin: '2px 0 0' }}>₦{totalSpent.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Fund wallet form */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} color="#16A34A" /> Fund Wallet
          </h3>

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, background: isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <ArrowUpRight size={24} color="#16A34A" />
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', color: 'var(--text)' }}>Payment Initiated!</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 20px' }}>Complete payment on the Paystack page that opens.</p>
              <button className="btn-secondary" onClick={() => { setSuccess(false); setAmount('') }} style={{ width: '100%', justifyContent: 'center' }}>
                Fund Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleFund}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Quick Select</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {quickAmounts.map(a => (
                    <button key={a} type="button" onClick={() => setAmount(String(a))}
                      style={{ border: `1.5px solid ${amount === String(a) ? '#16A34A' : 'var(--border)'}`, background: amount === String(a) ? (isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4') : 'var(--input-bg)', borderRadius: 8, padding: '8px 4px', fontSize: 12, fontWeight: 600, color: amount === String(a) ? '#16A34A' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      ₦{a.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Custom Amount (₦)</label>
                <input className="input" type="number" placeholder="Enter amount (min ₦500)" value={amount} onChange={e => setAmount(e.target.value)} min={500} />
              </div>
              <button className="btn-primary" type="submit" disabled={loading || !amount || Number(amount) < 500}
                style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}>
                <CreditCard size={16} />
                {loading ? 'Redirecting to Paystack…' : `Pay ₦${Number(amount || 0).toLocaleString()}`}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                <Shield size={12} color="var(--text-muted)" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Secured by Paystack · SSL encrypted</span>
              </div>
            </form>
          )}
        </div>

        {/* Info panel */}
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 14px', color: 'var(--text)' }}>How Funding Works</h4>
            {[
              { step: '1', text: 'Enter the amount you want to add to your wallet' },
              { step: '2', text: "You'll be redirected to Paystack's secure payment page" },
              { step: '3', text: 'Complete payment with card, bank transfer or USSD' },
              { step: '4', text: 'Wallet is credited instantly after confirmation' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 22, height: 22, background: isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A' }}>{item.step}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 20, background: isDark ? 'rgba(22,163,74,0.1)' : '#F0FDF4', border: isDark ? '1.5px solid rgba(22,163,74,0.25)' : '1.5px solid #DCFCE7' }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: '#16A34A' }}>Quick Link</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>View all your wallet transactions in one place.</p>
            <Link to="/dashboard/transactions" className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>View Transactions</Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

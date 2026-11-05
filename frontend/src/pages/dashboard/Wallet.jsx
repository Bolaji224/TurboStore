import { useState, useEffect, useCallback } from 'react'
import { Wallet as WalletIcon, Plus, CreditCard, Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000]

export default function Wallet() {
  const [amount, setAmount]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [psStatus, setPsStatus]     = useState(null) // null | 'success' | 'failed'
  const [psAmount, setPsAmount]     = useState(0)
  const [walletData, setWalletData] = useState(null)
  const [fetching, setFetching]     = useState(true)
  const { isDark } = useTheme()
  const { user } = useAuth()

  const loadWallet = useCallback(() => {
    setFetching(true)
    api.get('/wallet')
      .then(r => setWalletData(r.data))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [])

  useEffect(() => { loadWallet() }, [loadWallet])

  async function handleFund(e) {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt < 500) return

    setError('')
    setLoading(true)
    setPsStatus(null)

    // Step 1: create pending payment record
    let initData
    try {
      const res = await api.post('/wallet/fund/initiate', { amount: amt })
      initData = res.data
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server. Check your connection.')
      setLoading(false)
      return
    }

    // Step 2: open Paystack popup
    if (!window.PaystackPop) {
      setError('Payment script not loaded — please refresh the page and try again.')
      setLoading(false)
      return
    }

    const { reference, amount_kobo, email } = initData

    const handler = window.PaystackPop.setup({
      key:      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email:    email || user?.email,
      amount:   amount_kobo,
      ref:      reference,
      currency: 'NGN',
      label:    'TurboStore Wallet',
      callback: (response) => {
        setLoading(true)
        // Step 3: backend verifies and credits wallet (no async — Paystack rejects AsyncFunction)
        api.post('/wallet/fund/verify-inline', { reference: response.reference })
          .then(() => {
            setPsStatus('success')
            setPsAmount(amt)
            setAmount('')
            loadWallet()
          })
          .catch(() => setPsStatus('failed'))
          .finally(() => setLoading(false))
      },
      onClose: () => {
        setLoading(false)
      },
    })

    handler.openIframe()
  }

  const balance        = walletData ? Math.round(walletData.balance_naira || 0) : 0
  const totalDeposited = walletData ? Math.round((walletData.total_deposited || 0) / 100) : 0
  const totalSpent     = walletData ? Math.round((walletData.total_spent    || 0) / 100) : 0

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Wallet</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage your wallet balance and fund your account</p>
      </div>

      {/* Payment result banners */}
      {psStatus === 'success' && (
        <div style={{ background: isDark ? 'rgba(22,163,74,0.15)' : '#F0FDF4', border: '1.5px solid #DCFCE7', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={16} color="#16A34A" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 14, color: '#15803D', fontWeight: 600 }}>
            ₦{Number(psAmount).toLocaleString()} added to your wallet!
          </p>
        </div>
      )}
      {psStatus === 'failed' && (
        <div style={{ background: isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 14, color: '#DC2626', fontWeight: 500 }}>Payment was not completed. Please try again.</p>
        </div>
      )}

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
              <p style={{ color: '#fff', fontSize: 40, fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
                ₦{balance.toLocaleString()}
              </p>
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

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
              <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

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
              <input className="input" type="number" placeholder="Enter amount (min ₦500)"
                value={amount} onChange={e => setAmount(e.target.value)} min={500} />
            </div>

            <button className="btn-primary" type="submit"
              disabled={loading || !amount || Number(amount) < 500}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 15 }}>
              <CreditCard size={16} />
              {loading ? 'Processing…' : `Pay ₦${Number(amount || 0).toLocaleString()}`}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
              <Shield size={12} color="var(--text-muted)" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Secured by Paystack · SSL encrypted</span>
            </div>
          </form>
        </div>

        {/* Info panel */}
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 14px', color: 'var(--text)' }}>How Funding Works</h4>
            {[
              { step: '1', text: 'Enter the amount you want to add to your wallet' },
              { step: '2', text: 'A secure Paystack checkout opens on this same page' },
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

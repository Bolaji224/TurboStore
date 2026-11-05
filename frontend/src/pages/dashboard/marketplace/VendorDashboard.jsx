import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, X, RefreshCw, CheckCircle, Truck, DollarSign, ShoppingBag, AlertCircle, ImagePlus } from 'lucide-react'
import api from '../../../services/api'

/* ─── helpers ─────────────────────────────────────────────── */
function formatNaira(kobo) {
  return '₦' + Math.round(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })
}
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

const SERVICE_STATUS = {
  draft:          { label: 'Draft',           cls: 'badge-info' },
  pending_review: { label: 'Pending Review',  cls: 'badge-warning' },
  approved:       { label: 'Approved',        cls: 'badge-success' },
  rejected:       { label: 'Rejected',        cls: 'badge-danger' },
  suspended:      { label: 'Suspended',       cls: 'badge-danger' },
}
const ORDER_STATUS = {
  paid:        { label: 'Paid',        cls: 'badge-info' },
  in_progress: { label: 'In Progress', cls: 'badge-warning' },
  delivered:   { label: 'Delivered',   cls: 'badge-warning' },
  completed:   { label: 'Completed',   cls: 'badge-success' },
  disputed:    { label: 'Disputed',    cls: 'badge-danger' },
  cancelled:   { label: 'Cancelled',   cls: 'badge-danger' },
  refunded:    { label: 'Refunded',    cls: 'badge-danger' },
}
const PLATFORMS = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'general']

/* ─── Modal wrapper ───────────────────────────────────────── */
function Modal({ title, onClose, width = 540, children }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }}>
      <div className="card" style={{ width: '100%', maxWidth: width, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,.35)', borderRadius: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─── Service Form (add / edit) ───────────────────────────── */
const EMPTY_SVC = { category_id: '', title: '', description: '', platform: 'general', what_you_get: '', requirements: '', starting_price: '', delivery_days: '', refund_policy: '' }

function ServiceForm({ initial, categories, onSave, onClose }) {
  const [form,      setForm]      = useState(initial || EMPTY_SVC)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(initial?.image_url || null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const fileRef = useRef()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function submit(asDraft) {
    if (!form.title.trim())   { setError('Title is required.'); return }
    if (!form.starting_price) { setError('Starting price is required.'); return }
    if (!form.delivery_days)  { setError('Delivery days is required.'); return }
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('category_id',         form.category_id)
      fd.append('title',               form.title)
      fd.append('description',         form.description)
      fd.append('platform',            form.platform)
      fd.append('what_you_get',        form.what_you_get)
      fd.append('requirements',        form.requirements || '')
      fd.append('refund_policy',       form.refund_policy || '')
      fd.append('starting_price_kobo', Math.round(Number(form.starting_price) * 100))
      fd.append('delivery_days',       Number(form.delivery_days))
      if (imageFile) fd.append('image', imageFile)

      let res
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (initial?.id) {
        res = await api.post(`/vendor/services/${initial.id}`, fd, cfg)
        if (!asDraft) await api.post(`/vendor/services/${initial.id}/submit`)
      } else {
        res = await api.post('/vendor/services', fd, cfg)
        if (!asDraft) await api.post(`/vendor/services/${res.data.data?.id || res.data.id}/submit`)
      }
      onSave()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save service.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'title',         label: 'Title',           type: 'input',    placeholder: 'e.g. 1000 Real Instagram Followers', required: true },
    { key: 'description',   label: 'Description',     type: 'textarea', placeholder: 'Describe your service…', rows: 3 },
    { key: 'what_you_get',  label: 'What You Get',    type: 'textarea', placeholder: 'List what customer receives, one per line…', rows: 3 },
    { key: 'requirements',  label: 'Requirements',    type: 'textarea', placeholder: 'What info do you need from the customer?', rows: 2 },
    { key: 'refund_policy', label: 'Refund Policy',   type: 'textarea', placeholder: 'Describe your refund policy…', rows: 2 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Category */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>Category</label>
        <select className="input" style={{ width: '100%' }} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
          <option value="">Select category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Platform */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>Platform</label>
        <select className="input" style={{ width: '100%' }} value={form.platform} onChange={e => set('platform', e.target.value)}>
          {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      {/* Service Image */}
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>
          Service Image <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(shown to buyers)</span>
        </label>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
        {imagePreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
            <button type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = '' }}
              style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={12} />
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ position: 'absolute', bottom: 6, right: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 11, fontFamily: 'inherit' }}>
              Change
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{ width: '100%', padding: '28px 20px', borderRadius: 10, border: '2px dashed var(--border)', background: 'var(--section-alt)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
            <ImagePlus size={24} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click to upload image</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG, PNG, WebP — max 2MB</span>
          </button>
        )}
      </div>

      {fields.map(f => (
        <div key={f.key}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>
            {f.label}{f.required && <span style={{ color: '#EF4444' }}> *</span>}
          </label>
          {f.type === 'input' ? (
            <input className="input" style={{ width: '100%' }} placeholder={f.placeholder} value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
          ) : (
            <textarea className="input" rows={f.rows || 3} style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} placeholder={f.placeholder} value={form[f.key]} onChange={e => set(f.key, e.target.value)} />
          )}
        </div>
      ))}

      {/* Price + Days */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>Starting Price (₦) <span style={{ color: '#EF4444' }}>*</span></label>
          <input className="input" type="number" min="0" style={{ width: '100%' }} placeholder="5000" value={form.starting_price} onChange={e => set('starting_price', e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>Delivery Days <span style={{ color: '#EF4444' }}>*</span></label>
          <input className="input" type="number" min="1" style={{ width: '100%' }} placeholder="3" value={form.delivery_days} onChange={e => set('delivery_days', e.target.value)} />
        </div>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}>
          <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-secondary" disabled={loading} onClick={() => submit(true)}>Save as Draft</button>
        <button className="btn-primary"   disabled={loading} onClick={() => submit(false)}>
          {loading ? 'Saving…' : 'Submit for Review'}
        </button>
      </div>
    </div>
  )
}

/* ─── Deliver Modal ───────────────────────────────────────── */
function DeliverModal({ orderRef, onDone, onClose }) {
  const [notes,   setNotes]   = useState('')
  const [proof,   setProof]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function submit() {
    if (!notes.trim()) { setError('Delivery notes are required.'); return }
    setLoading(true); setError('')
    try {
      await api.post(`/vendor/orders/${orderRef}/deliver`, { delivery_notes: notes, proof })
      onDone()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to mark as delivered.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>Delivery Notes <span style={{ color: '#EF4444' }}>*</span></label>
        <textarea className="input" rows={4} style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }} placeholder="Describe what was delivered…" value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>Proof URL (screenshot link, optional)</label>
        <input className="input" style={{ width: '100%' }} placeholder="https://…" value={proof} onChange={e => setProof(e.target.value)} />
      </div>
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}><p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p></div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={loading} onClick={submit}>
          {loading ? 'Submitting…' : 'Mark as Delivered'}
        </button>
      </div>
    </div>
  )
}

/* ─── Payout Modal ────────────────────────────────────────── */
function PayoutModal({ available, onDone, onClose }) {
  const [amount,       setAmount]       = useState('')
  const [bankName,     setBankName]     = useState('')
  const [accountNo,    setAccountNo]    = useState('')
  const [accountName,  setAccountName]  = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  async function submit() {
    const amtKobo = Math.round(Number(amount) * 100)
    if (!amount || amtKobo < 100) { setError('Enter a valid amount.'); return }
    if (amtKobo > available)      { setError('Amount exceeds available balance.'); return }
    if (!bankName || !accountNo || !accountName) { setError('All bank fields are required.'); return }
    setLoading(true); setError('')
    try {
      await api.post('/vendor/payouts', {
        amount_kobo: amtKobo,
        bank_name:   bankName,
        account_no:  accountNo,
        account_name: accountName,
      })
      onDone()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to request payout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
        Available: <strong style={{ color: '#16A34A' }}>{formatNaira(available)}</strong>
      </p>
      {[
        { label: 'Amount (₦)', val: amount,      set: setAmount,      type: 'number', placeholder: '5000' },
        { label: 'Bank Name',  val: bankName,    set: setBankName,    type: 'text',   placeholder: 'First Bank' },
        { label: 'Account No', val: accountNo,   set: setAccountNo,   type: 'text',   placeholder: '0123456789' },
        { label: 'Account Name', val: accountName, set: setAccountName, type: 'text', placeholder: 'John Doe' },
      ].map(f => (
        <div key={f.label}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 5 }}>{f.label}</label>
          <input className="input" type={f.type} style={{ width: '100%' }} placeholder={f.placeholder} value={f.val} onChange={e => f.set(e.target.value)} />
        </div>
      ))}
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}><p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>{error}</p></div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={loading} onClick={submit}>
          {loading ? 'Requesting…' : 'Request Payout'}
        </button>
      </div>
    </div>
  )
}

/* ─── My Services Tab ─────────────────────────────────────── */
function MyServicesTab({ categories }) {
  const [services,    setServices]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editService, setEditService] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/vendor/services')
      setServices(res.data.services || res.data.data || [])
    } catch { setServices([]) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function deleteService(id) {
    if (!window.confirm('Delete this service?')) return
    try {
      await api.delete(`/vendor/services/${id}`)
      fetch()
    } catch (e) {
      alert(e.response?.data?.message || 'Delete failed')
    }
  }

  async function submitReview(id) {
    try {
      await api.post(`/vendor/services/${id}/submit`)
      fetch()
    } catch (e) {
      alert(e.response?.data?.message || 'Submit failed')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => { setEditService(null); setShowForm(true) }}>
          <Plus size={14} /> Add New Service
        </button>
      </div>

      {showForm && (
        <Modal title={editService ? 'Edit Service' : 'Add Service'} onClose={() => { setShowForm(false); setEditService(null) }} width={600}>
          <ServiceForm
            initial={editService}
            categories={categories}
            onSave={() => { setShowForm(false); setEditService(null); fetch() }}
            onClose={() => { setShowForm(false); setEditService(null) }}
          />
        </Modal>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : services.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShoppingBag size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>No services yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Add your first service to start selling</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {services.map(svc => {
            const sc = SERVICE_STATUS[svc.status] || { label: svc.status, cls: 'badge-info' }
            return (
              <div key={svc.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.title}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(svc.platform || 'general').charAt(0).toUpperCase() + (svc.platform || 'general').slice(1)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>{formatNaira(svc.starting_price_kobo || 0)}</span>
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                  </div>
                  {svc.rejection_reason && <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0' }}>Rejection: {svc.rejection_reason}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => { setEditService({ ...svc, starting_price: (svc.starting_price_kobo || 0) / 100 }); setShowForm(true) }}>Edit</button>
                  {svc.status === 'draft' && (
                    <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => submitReview(svc.id)}>Submit for Review</button>
                  )}
                  {['draft', 'rejected'].includes(svc.status) && (
                    <button style={{ fontSize: 12, padding: '5px 12px', background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => deleteService(svc.id)}>Delete</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── My Orders Tab ───────────────────────────────────────── */
function VendorOrdersTab() {
  const [orders,      setOrders]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [delivering,  setDelivering]  = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/vendor/orders')
      setOrders(res.data.orders || res.data.data || [])
    } catch { setOrders([]) }
    finally  { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function markInProgress(ref) {
    try {
      await api.post(`/vendor/orders/${ref}/progress`)
      fetch()
    } catch (e) { alert(e.response?.data?.message || 'Failed') }
  }

  return (
    <div>
      {delivering && (
        <Modal title="Mark as Delivered" onClose={() => setDelivering(null)}>
          <DeliverModal orderRef={delivering} onDone={() => { setDelivering(null); fetch() }} onClose={() => setDelivering(null)} />
        </Modal>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={fetch}><RefreshCw size={14} /></button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShoppingBag size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px' }}>No orders yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Orders will appear here once customers purchase your services</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => {
            const sc = ORDER_STATUS[order.status] || { label: order.status, cls: 'badge-info' }
            return (
              <div key={order.id} className="card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px', fontFamily: 'monospace' }}>{order.reference || order.id}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{order.service_title || '—'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>{formatNaira(order.amount_kobo || 0)}</span>
                    <span className={`badge ${sc.cls}`}>{sc.label}</span>
                  </div>
                </div>
                {order.requirements && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    <strong>Requirements:</strong> {order.requirements}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {order.status === 'paid' && (
                    <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
                      onClick={() => markInProgress(order.reference || order.id)}>
                      <CheckCircle size={13} /> Mark In Progress
                    </button>
                  )}
                  {order.status === 'in_progress' && (
                    <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5 }}
                      onClick={() => setDelivering(order.reference || order.id)}>
                      <Truck size={13} /> Mark Delivered
                    </button>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>{formatDate(order.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Earnings Tab ────────────────────────────────────────── */
function EarningsTab() {
  const [earnings,  setEarnings]  = useState(null)
  const [payouts,   setPayouts]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showPayout, setShowPayout] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [earRes, payRes] = await Promise.all([
        api.get('/vendor/earnings'),
        api.get('/vendor/payouts'),
      ])
      setEarnings(earRes.data.earnings || earRes.data)
      setPayouts(payRes.data.payouts || payRes.data.data || [])
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const stats = [
    { label: 'Available to Withdraw', value: formatNaira(earnings?.available_kobo || 0), color: '#16A34A' },
    { label: 'Pending',               value: formatNaira(earnings?.pending_kobo || 0),   color: '#F59E0B' },
    { label: 'Total Earned',          value: formatNaira(earnings?.total_kobo || 0),      color: '#3B82F6' },
  ]

  return (
    <div>
      {showPayout && (
        <Modal title="Request Payout" onClose={() => setShowPayout(false)}>
          <PayoutModal available={earnings?.available_kobo || 0} onDone={() => { setShowPayout(false); fetch() }} onClose={() => setShowPayout(false)} />
        </Modal>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', margin: '0 0 6px' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          className="btn-primary"
          style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!earnings?.available_kobo}
          onClick={() => setShowPayout(true)}>
          <DollarSign size={14} /> Request Payout
        </button>
      </div>

      {/* Earnings history */}
      {earnings?.history && earnings.history.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--section-alt)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Earnings History</span>
          </div>
          {earnings.history.map((item, i) => (
            <div key={i} className="table-row" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{item.description || item.order_reference || '—'}</p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(item.created_at)}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>{formatNaira(item.amount_kobo || 0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Payout history */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>Payout History</h3>
        {payouts.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No payout requests yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {payouts.map((p, i) => (
              <div key={i} className="card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{p.bank_name} — {p.account_no}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(p.created_at)} · {p.status}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{formatNaira(p.amount_kobo || 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main VendorDashboard ────────────────────────────────── */
export default function VendorDashboard() {
  const navigate = useNavigate()

  const [vendor,     setVendor]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('services')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    Promise.allSettled([
      api.get('/vendor/profile'),
      api.get('/marketplace/categories'),
    ]).then(([vResult, cResult]) => {
      if (vResult.status === 'fulfilled') {
        const d = vResult.value.data
        setVendor(d.data || d.vendor || d)
      } else {
        setVendor(null)
      }
      if (cResult.status === 'fulfilled') {
        const d = cResult.value.data
        setCategories(d.categories || d.data || d || [])
      }
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 20px' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid #16A34A', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  /* ── State 1: No vendor profile ── */
  if (!vendor) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'rgba(22,163,74,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <ShoppingBag size={36} color="#16A34A" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>Sell Your Services</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
          Become a vendor and list your social media marketing services to thousands of users on TurboStore.
        </p>
        <Link to="/dashboard/marketplace/vendor/apply" className="btn-primary" style={{ textDecoration: 'none', fontSize: 15, padding: '12px 28px' }}>
          Become a Vendor
        </Link>
      </div>
    )
  }

  /* ── State 2: Pending approval ── */
  if (vendor.status === 'pending') {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'rgba(245,158,11,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertCircle size={36} color="#F59E0B" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>Application Under Review</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 6px' }}>
          <strong>{vendor.business_name}</strong>
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          Our team is reviewing your application. You'll be notified once approved.
        </p>
      </div>
    )
  }

  /* ── State 3: Suspended / Rejected ── */
  if (['rejected', 'suspended'].includes(vendor.status)) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, background: 'rgba(239,68,68,0.12)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertCircle size={36} color="#EF4444" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>
          Account {vendor.status === 'rejected' ? 'Rejected' : 'Suspended'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 10px' }}>
          <strong>{vendor.business_name}</strong>
        </p>
        {vendor.rejection_reason && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 18px', textAlign: 'left' }}>
            <p style={{ fontSize: 13, color: '#DC2626', margin: 0, lineHeight: 1.5 }}>
              <strong>Reason:</strong> {vendor.rejection_reason}
            </p>
          </div>
        )}
      </div>
    )
  }

  /* ── State 4: Approved — full dashboard ── */
  const TABS = [
    { key: 'services', label: 'My Services',  icon: ShoppingBag },
    { key: 'orders',   label: 'My Orders',    icon: CheckCircle },
    { key: 'earnings', label: 'Earnings',     icon: DollarSign  },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Vendor Dashboard</h2>
            <span className="badge badge-success">
              <CheckCircle size={10} style={{ marginRight: 3 }} />Approved
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{vendor.business_name}</p>
        </div>
        <Link to="/dashboard/marketplace" className="btn-secondary" style={{ textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShoppingBag size={13} /> Browse Marketplace
        </Link>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#16A34A' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid #16A34A' : '2px solid transparent',
              marginBottom: -1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            }}>
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'services'  && <MyServicesTab categories={categories} />}
      {activeTab === 'orders'    && <VendorOrdersTab />}
      {activeTab === 'earnings'  && <EarningsTab />}
    </div>
  )
}

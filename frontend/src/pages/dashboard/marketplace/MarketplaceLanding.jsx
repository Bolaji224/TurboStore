import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, CheckCircle, Star, ShoppingBag, Package } from 'lucide-react'
import api from '../../../services/api'

const PLATFORM_COLORS = {
  facebook:  '#1877F2',
  instagram: '#E1306C',
  twitter:   '#1DA1F2',
  tiktok:    '#000000',
  youtube:   '#FF0000',
  general:   '#16A34A',
}

function getPlatformColor(platform) {
  return PLATFORM_COLORS[(platform || '').toLowerCase()] || '#16A34A'
}

function formatNaira(kobo) {
  return '₦' + Math.round(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })
}

function StarRating({ rating }) {
  if (!rating) return null
  const full  = Math.floor(rating)
  const frac  = rating - full
  const empty = 5 - full - (frac > 0 ? 1 : 0)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={11} fill="#F59E0B" color="#F59E0B" />
      ))}
      {frac > 0 && <Star size={11} fill="#F59E0B" color="#F59E0B" style={{ opacity: 0.5 }} />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={11} fill="none" color="#D1D5DB" />
      ))}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>{Number(rating).toFixed(1)}</span>
    </div>
  )
}

function ServiceCard({ service, onView, onOrder }) {
  const color = getPlatformColor(service.platform)
  const isDarkPlatform = color === '#000000'

  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 0, transition: 'box-shadow .2s', cursor: 'default', overflow: 'hidden' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(22,163,74,0.13)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>

      {/* Service image */}
      {service.image_url ? (
        <div style={{ width: '100%', height: 160, overflow: 'hidden', flexShrink: 0 }}>
          <img src={service.image_url} alt={service.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ width: '100%', height: 100, background: `linear-gradient(135deg, ${color}22, ${color}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 32 }}>
            {service.platform === 'instagram' ? '📸' : service.platform === 'tiktok' ? '🎵' : service.platform === 'youtube' ? '▶️' : service.platform === 'twitter' ? '🐦' : service.platform === 'facebook' ? '👍' : '🛒'}
          </span>
        </div>
      )}

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {/* Platform badge */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
          background: isDarkPlatform ? '#1a1a1a' : color + '18',
          border: `1px solid ${color}44`,
          borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600,
          color: isDarkPlatform ? '#e5e5e5' : color,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
          {(service.platform || 'general').charAt(0).toUpperCase() + (service.platform || 'general').slice(1)}
        </span>

      {/* Title */}
      <h3 style={{
        fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        lineHeight: 1.4,
      }}>
        {service.title}
      </h3>

      {/* Vendor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          by <span style={{ color: 'var(--text)', fontWeight: 600 }}>{service.vendor_name || 'Unknown'}</span>
        </span>
        {service.vendor_approved && (
          <CheckCircle size={12} color="#16A34A" fill="#16A34A" />
        )}
      </div>

      {/* Description */}
      <p style={{
        fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {service.description}
      </p>

      {/* Delivery */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Delivered in <strong style={{ color: 'var(--text)' }}>{service.delivery_days} day{service.delivery_days !== 1 ? 's' : ''}</strong>
      </div>

      {/* Rating */}
      {service.avg_rating ? <StarRating rating={service.avg_rating} /> : null}

      {/* Price + Actions */}
      <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#16A34A', margin: '0 0 10px' }}>
          From {formatNaira(service.starting_price_kobo)}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ flex: 1, fontSize: 13, padding: '8px 0' }} onClick={() => onView(service.slug)}>
            View Details
          </button>
          <button className="btn-primary" style={{ flex: 1, fontSize: 13, padding: '8px 0' }} onClick={() => onOrder(service.slug)}>
            Order Now
          </button>
        </div>
      </div>
      </div>{/* end inner padding div */}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20 }}>
      {[60, 100, 40, 80, 30, 50].map((w, i) => (
        <div key={i} style={{ height: i === 1 ? 36 : 14, width: `${w}%`, background: 'var(--border)', borderRadius: 6, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  )
}

export default function MarketplaceLanding() {
  const navigate = useNavigate()

  const [categories, setCategories]       = useState([])
  const [services,   setServices]         = useState([])
  const [loading,    setLoading]          = useState(true)
  const [error,      setError]            = useState('')
  const [catFilter,  setCatFilter]        = useState('all')
  const [search,     setSearch]           = useState('')
  const [platform,   setPlatform]         = useState('')
  const [minPrice,   setMinPrice]         = useState('')
  const [maxPrice,   setMaxPrice]         = useState('')
  const [sort,       setSort]             = useState('newest')
  const [page,       setPage]             = useState(1)
  const [totalPages, setTotalPages]       = useState(1)
  const debounceRef                       = useRef(null)

  // Fetch categories once
  useEffect(() => {
    api.get('/marketplace/categories')
      .then(r => setCategories(r.data.data || r.data.categories || []))
      .catch(() => {})
  }, [])

  const fetchServices = useCallback(async (params) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/marketplace/services', { params })
      setServices(res.data.services || res.data.data || [])
      setTotalPages(res.data.last_page || res.data.meta?.last_page || 1)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load services')
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Build params and fetch on filter/page changes (with debounce on search)
  useEffect(() => {
    const params = {
      page,
      sort,
      ...(catFilter !== 'all' && { category_id: catFilter }),
      ...(platform   && { platform }),
      ...(minPrice   && { min_price: Number(minPrice) * 100 }),
      ...(maxPrice   && { max_price: Number(maxPrice) * 100 }),
      ...(search     && { search }),
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchServices(params), search ? 400 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [search, platform, catFilter, minPrice, maxPrice, sort, page, fetchServices])

  function handleSearch(v) {
    setSearch(v)
    setPage(1)
  }

  function handleCat(id) {
    setCatFilter(id)
    setPage(1)
  }

  const platforms = ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'general']

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px' }}>Social Media Services</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Grow your social media presence with trusted vendors</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/dashboard/marketplace/orders" className="btn-secondary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Package size={14} /> My Orders
          </Link>
          <Link to="/dashboard/marketplace/vendor" className="btn-primary" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <ShoppingBag size={14} /> Vendor Dashboard
          </Link>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          className={`filter-btn${catFilter === 'all' ? ' active' : ''}`}
          onClick={() => handleCat('all')}>
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`filter-btn${catFilter === cat.id ? ' active' : ''}`}
            onClick={() => handleCat(cat.id)}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 220px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              type="text"
              placeholder="Search services…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>

          {/* Platform */}
          <select
            className="input"
            style={{ flex: '0 1 150px' }}
            value={platform}
            onChange={e => { setPlatform(e.target.value); setPage(1) }}>
            <option value="">All Platforms</option>
            {platforms.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>

          {/* Min price */}
          <input
            className="input"
            type="number"
            placeholder="Min ₦"
            value={minPrice}
            onChange={e => { setMinPrice(e.target.value); setPage(1) }}
            style={{ flex: '0 1 100px' }}
          />

          {/* Max price */}
          <input
            className="input"
            type="number"
            placeholder="Max ₦"
            value={maxPrice}
            onChange={e => { setMaxPrice(e.target.value); setPage(1) }}
            style={{ flex: '0 1 100px' }}
          />

          {/* Sort */}
          <select
            className="input"
            style={{ flex: '0 1 190px' }}
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1) }}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#DC2626', fontSize: 14, margin: 0 }}>{error}</p>
          <button className="btn-secondary" style={{ fontSize: 13, padding: '6px 14px' }} onClick={() => setPage(p => p)}>Retry</button>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : services.map(s => (
              <ServiceCard
                key={s.id}
                service={s}
                onView={slug => navigate(`/dashboard/marketplace/services/${slug}`)}
                onOrder={slug => navigate(`/dashboard/marketplace/services/${slug}`)}
              />
            ))
        }
      </div>

      {/* Empty state */}
      {!loading && !error && services.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>No services found</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-secondary"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={14} /> Previous
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button
            className="btn-primary"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

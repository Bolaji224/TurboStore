import { Link } from 'react-router-dom'

export default function Logo({ size = 'md', to = '/' }) {
  const height = size === 'lg' ? 36 : 30
  return (
    <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
      <img src="/logo.png" alt="TurboStore" style={{ height, width: 'auto', objectFit: 'contain' }} />
    </Link>
  )
}

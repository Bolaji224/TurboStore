import { Link } from 'react-router-dom'

export default function Logo({ size = 'md', to = '/' }) {
  const sz = size === 'lg' ? { box: 36, font: 14, text: 18 } : { box: 30, font: 12, text: 16 }
  return (
    <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
      <div style={{
        width: sz.box, height: sz.box,
        background: 'linear-gradient(135deg,#16A34A,#063B2D)',
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#4ADE80', fontWeight: 900, fontSize: sz.font }}>T</span>
      </div>
      <span style={{ fontWeight: 700, fontSize: sz.text, color: 'var(--text)' }}>TurboStore</span>
    </Link>
  )
}

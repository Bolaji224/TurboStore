import { Construction } from 'lucide-react'

export default function AdminComingSoon({ title = 'Coming Soon' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400, gap: 16, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Construction size={28} color="#F59E0B" />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 13, color: '#475569', margin: 0, maxWidth: 300 }}>This section is under development and will be available in a future stage.</p>
    </div>
  )
}

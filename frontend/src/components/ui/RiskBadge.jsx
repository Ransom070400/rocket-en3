export default function RiskBadge({ level }) {
  const styles = {
    LOW:    'bg-emerald-100 text-emerald-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    HIGH:   'bg-rose-100 text-rose-700',
  }
  return (
    <span className={`badge ${styles[level] || styles.LOW}`}>
      {level === 'LOW' ? '✅' : level === 'MEDIUM' ? '⚠️' : '🚫'} {level} Risk
    </span>
  )
}

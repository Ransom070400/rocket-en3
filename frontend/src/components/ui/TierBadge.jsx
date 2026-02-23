// TierBadge.jsx
export function TierBadge({ tier }) {
  const tiers = [
    { name: 'Bronze',   className: 'badge-bronze' },
    { name: 'Silver',   className: 'badge-silver' },
    { name: 'Gold',     className: 'badge-gold' },
    { name: 'Platinum', className: 'badge-platinum' },
  ]
  const t = tiers[tier] || tiers[0]
  return <span className={`badge ${t.className}`}>{t.name}</span>
}

export default TierBadge

export default function Skeleton({ className = '' }) {
  return (
    <div
      className={`bg-gray-100 animate-pulse rounded-2xl ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s linear infinite',
      }}
    />
  )
}

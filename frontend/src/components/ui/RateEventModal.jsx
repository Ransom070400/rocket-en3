import React, { useState } from 'react'
import { Star, X, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWallet } from '../../context/WalletContext'

const AI_BACKEND = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000'

export default function RateEventModal({ ticket, onClose, onSuccess }) {
  const { contract, address } = useWallet()
  const [rating, setRating]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return toast.error('Select a rating')
    if (!contract) return toast.error('Wallet not connected')

    setSubmitting(true)
    const toastId = toast.loading('Submitting rating...')

    try {
      // Submit to blockchain
      const tx = await contract.submitRating(ticket.eventId, rating)
      toast.loading('Confirming...', { id: toastId })
      await tx.wait()

      // Also update AI backend preference model
      try {
        await fetch(`${AI_BACKEND}/submit-rating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: address,
            event_id: ticket.eventId,
            organizer: '0x0000000000000000000000000000000000000000', // would normally fetch from contract
            rating,
            category: 'music', // would come from event metadata
            loyalty_weight: ticket.tier + 1,
            timestamp: Math.floor(Date.now() / 1000),
          }),
        })
      } catch {}

      toast.success(`Rated ${rating} ⭐`, { id: toastId })
      onSuccess()
    } catch (err) {
      toast.error(err.reason || err.message?.slice(0, 60) || 'Rating failed', { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  const labels = ['', 'Awful', 'Poor', 'Okay', 'Good', 'Amazing']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-4xl shadow-2xl w-full max-w-sm p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-black text-xl text-gray-900">Rate Event</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={16} /></button>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          How was <span className="font-semibold text-gray-900">{ticket.eventName}</span>?
          Your rating helps improve organizer reputation.
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-4">
          {[1,2,3,4,5].map(s => (
            <button
              key={s}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
              className="transition-transform duration-150 hover:scale-125"
            >
              <Star
                size={36}
                className={`transition-colors duration-150 ${
                  s <= (hovered || rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200'
                }`}
              />
            </button>
          ))}
        </div>

        <p className="text-center text-sm font-semibold text-gray-600 mb-6 h-5">
          {labels[hovered || rating]}
        </p>

        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="btn-primary w-full"
        >
          {submitting ? <><Loader size={16} className="animate-spin" /> Submitting...</> : 'Submit Rating'}
        </button>
      </div>
    </div>
  )
}

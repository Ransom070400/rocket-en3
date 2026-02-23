import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Users, Star, ArrowLeft, Ticket, Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletContext'
import BuyTicketModal from '../components/ui/BuyTicketModal'
// import RiskBadge from '../components/ui/RiskBadge'
import TierBadge from '../components/ui/TierBadge'
import Skeleton from '../components/ui/Skeleton'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { contract, address, isCorrectChain, switchToOG } = useWallet()

  const [event, setEvent]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showBuy, setShowBuy]   = useState(false)
  const [userTicket, setUserTicket] = useState(null)

  const fetchEvent = useCallback(async () => {
  if (!contract) { setLoading(false); return }

  try {
    const evt = await contract.events(id)

    if (!evt.id || Number(evt.id) === 0) {
      setLoading(false)
      return
    }

    setEvent({
      id: Number(evt.id),
      organizer: evt.organizer,
      name: evt.name,
      metadataCid: evt.metadataCid,
      startTime: Number(evt.startTime),
      endTime: Number(evt.endTime),
      ticketPrice: evt.ticketPrice,
      maxTickets: Number(evt.maxTickets),
      soldTickets: Number(evt.soldTickets),
      active: evt.active,
      ratingAvg: 0,
      ratingCount: 0,
    })

    if (address) {
      const tId = await contract.userEventTicket(address, id)

      if (tId && Number(tId) !== 0) {
        const tkt = await contract.tickets(tId)

        setUserTicket({
          tokenId: Number(tId),
          ...tkt
        })
      }
    }

  } catch (err) {
    console.error('fetchEvent error:', err)
  } finally {
    setLoading(false)
  }
}, [contract, id, address])

  useEffect(() => { fetchEvent() }, [fetchEvent])

  if (loading) {
    return (
      <div className="min-h-screen pt-24 max-w-3xl mx-auto px-4">
        <Skeleton className="h-64 rounded-3xl mb-6" />
        <Skeleton className="h-8 w-64 rounded-2xl mb-3" />
        <Skeleton className="h-4 w-48 rounded-xl" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center">
        <p className="text-gray-500 text-lg mb-4">Event not found</p>
        <button onClick={() => navigate('/events')} className="btn-secondary">← Back to Events</button>
      </div>
    )
  }

  const startDate  = new Date(event.startTime * 1000)
  const endDate    = new Date(event.endTime * 1000)
  const priceEth   = ethers.formatEther(event.ticketPrice)
  const soldPct    = event.maxTickets > 0 ? (event.soldTickets / event.maxTickets) * 100 : 0
  const isSoldOut  = event.soldTickets >= event.maxTickets
  const isEnded    = Date.now() / 1000 > event.endTime
  const hasTicket  = !!userTicket
  const ratingDisp = event.ratingAvg > 0 ? (event.ratingAvg / 20).toFixed(1) : null
  const tierNames  = ['Bronze', 'Silver', 'Gold', 'Platinum']

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <button onClick={() => navigate('/events')} className="btn-ghost mt-6 mb-8 -ml-2">
          <ArrowLeft size={16} />
          All Events
        </button>

        {/* Hero image */}
        <div className="h-64 rounded-3xl bg-gradient-to-br from-brand-400 to-accent-purple mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-30" />
          <div className="absolute inset-0 flex items-end p-6">
            {hasTicket && (
              <span className="badge bg-emerald-500 text-white">
                <CheckCircle size={12} />
                Ticket owned
              </span>
            )}
          </div>
          {!event.active && (
            <div className="absolute top-4 right-4">
              <span className="badge bg-gray-800/80 text-white/80">Inactive</span>
            </div>
          )}
        </div>

        {/* Title + organizer */}
        <div className="mb-6">
          <h1 className="text-4xl font-black text-gray-900 mb-2">{event.name}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>by {event.organizer.slice(0, 8)}...{event.organizer.slice(-4)}</span>
            {false && ( // temporarily disable until you add orgScore logic
              <span className="flex items-center gap-1 text-amber-500">
                <Star size={12} fill="currentColor" />
                <span>{(0 / 20).toFixed(1)} organizer</span>
              </span>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Calendar size={16} />, label: 'Starts', value: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            { icon: <Clock size={16} />,    label: 'Time',   value: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
            { icon: <Users size={16} />,    label: 'Sold',   value: `${event.soldTickets} / ${event.maxTickets}` },
            { icon: <Star size={16} />,     label: 'Rating', value: ratingDisp ? `${ratingDisp} ⭐` : 'No ratings' },
          ].map(item => (
            <div key={item.label} className="card p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                {item.icon}
                {item.label}
              </div>
              <div className="font-bold text-gray-900 text-sm">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>{soldPct.toFixed(0)}% sold</span>
            <span>{event.maxTickets - event.soldTickets} remaining</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${soldPct >= 80 ? 'bg-rose-400' : 'bg-brand-400'}`}
              style={{ width: `${soldPct}%` }}
            />
          </div>
        </div>

        {/* AI Protection info */}
        <div className="card p-5 mb-6 bg-gradient-to-br from-brand-50 to-violet-50 border-brand-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-brand-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-0.5">AI Anti-Scalping Active</h3>
              <p className="text-xs text-gray-500">
                All ticket transfers are scored by our XGBoost risk engine. Suspicious activity is blocked on-chain before it happens.
              </p>
            </div>
          </div>
        </div>

        {/* Buy / owned ticket */}
        {hasTicket ? (
          <div className="card p-6 border-emerald-200 bg-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="font-bold text-gray-900">You own ticket #{userTicket.tokenId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TierBadge tier={Number(userTicket.tier)} />
                  {userTicket.attended && (
                    <span className="badge bg-emerald-100 text-emerald-700">Attended</span>
                  )}
                  {userTicket.checkedIn && (
                    <span className="badge bg-blue-100 text-blue-700">Checked in</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Loyalty</div>
                <div className="font-black text-lg gradient-text">{Number(userTicket.loyaltyPoints)} pts</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 card p-5">
              <div className="text-xs text-gray-400 mb-1">Ticket price</div>
              <div className="text-3xl font-black text-gray-900">
                {parseFloat(priceEth) === 0 ? 'Free' : `${priceEth} OG`}
              </div>
            </div>
            <button
              onClick={() => {
                if (!address) return toast.error('Connect your wallet first')
                if (!isCorrectChain) { switchToOG(); return }
                if (isSoldOut) return toast.error('Sold out')
                if (isEnded) return toast.error('Event has ended')
                setShowBuy(true)
              }}
              disabled={isSoldOut || isEnded || !event.active}
              className="btn-primary flex-1 text-base py-4"
            >
              <Ticket size={18} />
              {isSoldOut ? 'Sold Out' : isEnded ? 'Event Ended' : 'Buy Ticket'}
            </button>
          </div>
        )}
      </div>

      {showBuy && (
        <BuyTicketModal
          event={event}
          onClose={() => setShowBuy(false)}
          onSuccess={() => { setShowBuy(false); fetchEvent() }}
        />
      )}
    </div>
  )
}

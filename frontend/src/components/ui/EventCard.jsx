import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Star, ArrowRight, Clock } from 'lucide-react'
import { ethers } from 'ethers'

const TIER_COLORS = ['from-amber-400 to-orange-500', 'from-gray-300 to-gray-500', 'from-yellow-300 to-yellow-500', 'from-violet-400 to-violet-600']
const GRADIENT_SEEDS = [
  'from-blue-400 to-purple-600',
  'from-pink-400 to-rose-600',
  'from-cyan-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-cyan-600',
  'from-orange-400 to-red-500',
]

export default function EventCard({ event }) {
  const gradientClass = GRADIENT_SEEDS[event.id % GRADIENT_SEEDS.length]
  const startDate = new Date(event.startTime * 1000)
  const priceEth  = ethers.formatEther(event.ticketPrice)
  const soldPct   = event.maxTickets > 0 ? (event.soldTickets / event.maxTickets) * 100 : 0
  const isAlmostSoldOut = soldPct >= 80
  const isEnded   = Date.now() / 1000 > event.endTime
  const ratingDisplay = event.ratingAvg > 0 ? (event.ratingAvg / 20).toFixed(1) : null

  return (
    <Link to={`/events/${event.id}`} className="block group">
      <div className="card overflow-hidden hover:-translate-y-1 transition-all duration-300">
        {/* Cover */}
        <div className={`relative h-44 bg-gradient-to-br ${gradientClass} flex items-end p-4`}>
          {/* Status badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {isAlmostSoldOut && (
              <span className="badge bg-rose-500 text-white text-xs">🔥 Almost gone</span>
            )}
            {isEnded && (
              <span className="badge bg-black/50 text-white/80 text-xs">Ended</span>
            )}
          </div>

          {/* Date pill */}
          <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl px-3 py-1.5 text-xs font-semibold">
            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-brand-600 transition-colors line-clamp-1">
            {event.name}
          </h3>

          <p className="text-xs text-gray-400 mb-4 font-mono">
            {event.organizer.slice(0, 6)}...{event.organizer.slice(-4)}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {event.soldTickets}/{event.maxTickets}
            </span>
            
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                soldPct >= 80 ? 'bg-rose-400' : 'bg-brand-400'
              }`}
              style={{ width: `${soldPct}%` }}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400">from</span>
              <span className="ml-1 font-bold text-gray-900">
                {parseFloat(priceEth) === 0 ? 'Free' : `${priceEth} OG`}
              </span>
            </div>
            <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
              <ArrowRight size={14} className="text-brand-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

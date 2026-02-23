import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Search, Rocket, Calendar, Users, ArrowRight, Filter } from 'lucide-react'
import { useEvents } from '../context/EventsContext'
import { useWallet } from '../context/WalletContext'
import { ethers } from 'ethers'
import EventCard from '../components/ui/EventCard'
import ConnectPrompt from '../components/ui/ConnectPrompt'
import Skeleton from '../components/ui/Skeleton'

const CATEGORIES = ['All', 'Music', 'Tech', 'Sports', 'Arts', 'Gaming', 'Food', 'Film', 'Fashion']

export default function BrowseEvents() {
  const { events, loading, fetched, fetchEvents } = useEvents()
  const { address, contract } = useWallet()
  const [query, setQuery]     = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
  if (contract) {
    fetchEvents()
  }
}, [contract])

  const filtered = events.filter(e => {
    const matchQ = query === '' || e.name.toLowerCase().includes(query.toLowerCase())
    return matchQ
  })

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
              <Compass size={18} className="text-brand-600" />
            </div>
            <span className="text-sm font-medium text-brand-600">Discover</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Explore Events</h1>
          <p className="text-gray-500">Find your next unforgettable experience</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                  category === cat
                    ? 'bg-brand-600 text-white shadow-glow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-72 rounded-3xl" />)}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-gray-400 mb-4">{filtered.length} event{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          /* ── EMPTY STATE ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-accent-purple/20 rounded-3xl flex items-center justify-center">
                <Rocket size={40} className="text-brand-500 animate-float" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
                0
              </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              No events yet.
            </h2>
            <p className="text-gray-500 text-lg mb-8">
              Be the first to launch one 🚀
            </p>
            <Link
              to="/create"
              className="btn-primary"
            >
              Create Event
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

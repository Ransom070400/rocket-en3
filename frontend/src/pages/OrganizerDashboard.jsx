import React, { useEffect, useState, useCallback } from 'react'
import { LayoutDashboard, Users, Star, TrendingUp, Ticket, Shield, Loader, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWallet } from '../context/WalletContext'
import ConnectPrompt from '../components/ui/ConnectPrompt'

export default function OrganizerDashboard() {
  const { readContract, address } = useWallet()
  const [events, setEvents]   = useState([])
  const [repScore, setRepScore] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!readContract || !address) { setLoading(false); return }
    setLoading(true)
    try {
      const total = await readContract.totalEvents()
      const myEvents = []

      for (let id = 1; id <= Number(total); id++) {
        const evt = await readContract.events(id)
        if (evt.organizer.toLowerCase() === address.toLowerCase()) {
          myEvents.push({
            id:          Number(evt.id),
            name:        evt.name,
            startTime:   Number(evt.startTime),
            endTime:     Number(evt.endTime),
            soldTickets: Number(evt.soldTickets),
            maxTickets:  Number(evt.maxTickets),
            active:      evt.active,
            ratingAvg:   0,
            ratingCount: 0,
          })
        }
      }
      setEvents(myEvents)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [readContract, address])

  useEffect(() => { fetchData() }, [fetchData])

  const totalSold = events.reduce((a, e) => a + e.soldTickets, 0)
  const totalCap  = events.reduce((a, e) => a + e.maxTickets, 0)
  const avgRating = events.length > 0 && events.some(e => e.ratingCount > 0)
    ? events.filter(e => e.ratingCount > 0).reduce((a, e) => a + e.ratingAvg, 0) / events.filter(e => e.ratingCount > 0).length
    : 0

  if (!address) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <ConnectPrompt message="Connect your wallet to view your organizer dashboard" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="py-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
                <LayoutDashboard size={18} className="text-brand-600" />
              </div>
              <span className="text-sm font-medium text-brand-600">Organizer</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1 font-mono">{address.slice(0, 8)}...{address.slice(-6)}</p>
          </div>
          <button onClick={fetchData} className="btn-ghost mt-2">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader size={24} className="text-brand-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: <LayoutDashboard size={20} className="text-brand-500" />, label: 'Events', value: events.length },
                { icon: <Ticket size={20} className="text-accent-cyan" />, label: 'Tickets Sold', value: totalSold },
                { icon: <Star size={20} className="text-amber-400" />, label: 'Avg Rating', value: avgRating > 0 ? `${(avgRating / 20).toFixed(1)} ⭐` : 'N/A' },
                { icon: <Shield size={20} className="text-emerald-500" />, label: 'Rep Score', value: repScore !== null ? `${repScore}/100` : 'N/A' },
              ].map(stat => (
                <div key={stat.label} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 bg-gray-50 rounded-2xl flex items-center justify-center">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Reputation bar */}
            {repScore !== null && (
              <div className="card p-6 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">Organizer Reputation</h2>
                  <span className={`badge ${repScore >= 70 ? 'bg-emerald-100 text-emerald-700' : repScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {repScore >= 70 ? 'Trusted' : repScore >= 40 ? 'Building' : 'New'}
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${repScore >= 70 ? 'bg-emerald-400' : repScore >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${repScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">Score: {repScore}/100 · Based on verified attendee ratings weighted by loyalty tier</p>
              </div>
            )}

            {/* Events table */}
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Your Events</h2>
              </div>
              {events.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400">No events created yet</p>
                  <a href="/create" className="btn-primary mt-4 inline-flex">Create your first event</a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Event', 'Date', 'Sold', 'Fill %', 'Rating', 'Status'].map(h => (
                          <th key={h} className="text-left py-3 px-6 text-xs text-gray-400 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(evt => {
                        const fillPct = evt.maxTickets > 0 ? Math.round((evt.soldTickets / evt.maxTickets) * 100) : 0
                        const isEnded = Date.now() / 1000 > evt.endTime
                        const ratingDisplay = evt.ratingAvg > 0 ? (evt.ratingAvg / 20).toFixed(1) : '—'
                        return (
                          <tr key={evt.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-semibold text-gray-900">{evt.name}</div>
                              <div className="text-xs text-gray-400">#{evt.id}</div>
                            </td>
                            <td className="py-4 px-6 text-gray-500">
                              {new Date(evt.startTime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-4 px-6 text-gray-700">
                              {evt.soldTickets}/{evt.maxTickets}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${fillPct >= 80 ? 'bg-rose-400' : 'bg-brand-400'}`}
                                    style={{ width: `${fillPct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{fillPct}%</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-700">
                              {ratingDisplay !== '—' ? `${ratingDisplay} ⭐` : ratingDisplay}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`badge text-xs ${
                                isEnded ? 'bg-gray-100 text-gray-500'
                                : evt.active ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                              }`}>
                                {isEnded ? 'Ended' : evt.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

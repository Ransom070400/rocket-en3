import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, Users, Coins, FileText, Clock, Rocket } from 'lucide-react'
import toast from 'react-hot-toast'
import { ethers } from 'ethers'
import { useWallet } from '../context/WalletContext'
import { useEvents } from '../context/EventsContext'
import ConnectPrompt from '../components/ui/ConnectPrompt'

const DEFAULT_META_CID = 'bafkreidefaultmetacid'

export default function CreateEvent() {
  const { contract, address, isCorrectChain, switchToOG } = useWallet()
  const { fetchEvents } = useEvents()
  const navigate = useNavigate()

  const [form, setForm]     = useState({
    name:       '',
    description:'',
    category:   'music',
    startDate:  '',
    startTime:  '',
    endDate:    '',
    endTime:    '',
    ticketPrice:'0',
    maxTickets: '100',
    metadataCid: DEFAULT_META_CID,
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!address) return toast.error('Connect your wallet first')
    if (!contract) return toast.error('Contract not connected')
    if (!isCorrectChain) { await switchToOG(); return }

    if (!form.name.trim()) return toast.error('Event name required')
    if (!form.startDate || !form.startTime) return toast.error('Start date required')
    if (!form.endDate || !form.endTime) return toast.error('End date required')

    const startTs = Math.floor(new Date(`${form.startDate}T${form.startTime}`).getTime() / 1000)
    const endTs   = Math.floor(new Date(`${form.endDate}T${form.endTime}`).getTime() / 1000)
    const now     = Math.floor(Date.now() / 1000)

    if (startTs <= now) return toast.error('Start time must be in the future')
    if (endTs <= startTs) return toast.error('End time must be after start')

    const maxTix = parseInt(form.maxTickets)
    if (isNaN(maxTix) || maxTix <= 0 || maxTix > 10000) return toast.error('Max tickets: 1–10,000')

    const priceBn = ethers.parseEther(form.ticketPrice || '0')

    setSubmitting(true)
    const toastId = toast.loading('Creating event on 0G...')

    try {
      const tx = await contract.createEvent(
        form.name.trim(),
        form.metadataCid || DEFAULT_META_CID,
        startTs,
        endTs,
        priceBn,
        maxTix,
      )
      toast.loading('Waiting for confirmation...', { id: toastId })
      const receipt = await tx.wait()

      // Extract event ID from logs
      const eventId = receipt.logs?.[0]?.topics?.[1]
        ? parseInt(receipt.logs[0].topics[1], 16)
        : null

      toast.success('Event created! 🚀', { id: toastId })
      await fetchEvents()
      navigate(eventId ? `/events/${eventId}` : '/events')
    } catch (err) {
      toast.error(err.reason || err.message?.slice(0, 60) || 'Transaction failed', { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  if (!address) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <ConnectPrompt message="Connect your wallet to create an event" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
              <Plus size={18} className="text-brand-600" />
            </div>
            <span className="text-sm font-medium text-brand-600">Organizer</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900">Create Event</h1>
          <p className="text-gray-500 mt-1">Launch your AI-powered NFT event on 0G</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event basics */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <FileText size={16} className="text-brand-500" />
              Event Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Name *</label>
              <input
                className="input"
                placeholder="Neon Music Festival 2025"
                value={form.name}
                onChange={set('name')}
                maxLength={80}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Describe your event..."
                value={form.description}
                onChange={set('description')}
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {['music','tech','sports','arts','gaming','food','film','fashion'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Metadata CID (0G Storage)</label>
              <input
                className="input font-mono text-xs"
                placeholder="bafkrei... (0G storage CID for event metadata)"
                value={form.metadataCid}
                onChange={set('metadataCid')}
              />
              <p className="text-xs text-gray-400 mt-1">Upload JSON metadata to 0G storage and paste the CID here</p>
            </div>
          </div>

          {/* Dates */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-brand-500" />
              Schedule
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
                <input type="date" className="input" value={form.startDate} onChange={set('startDate')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                <input type="time" className="input" value={form.startTime} onChange={set('startTime')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date *</label>
                <input type="date" className="input" value={form.endDate} onChange={set('endDate')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                <input type="time" className="input" value={form.endTime} onChange={set('endTime')} required />
              </div>
            </div>
          </div>

          {/* Ticketing */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Coins size={16} className="text-brand-500" />
              Ticketing
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ticket Price (OG)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    className="input pr-12"
                    placeholder="0.01"
                    value={form.ticketPrice}
                    onChange={set('ticketPrice')}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">OG</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Set to 0 for free events</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Tickets</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  className="input"
                  value={form.maxTickets}
                  onChange={set('maxTickets')}
                />
              </div>
            </div>
          </div>

          {/* AI Note */}
          <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl text-sm text-brand-700">
            <div className="flex items-start gap-3">
              <Rocket size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">AI-Powered Protection</span>
                <p className="text-brand-600 mt-0.5 text-xs">
                  All ticket transfers will be scored by the AI risk engine. High-risk transfers (scalpers, bots) are automatically blocked on-chain.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-base py-4"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Rocket size={18} />
                Launch Event
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

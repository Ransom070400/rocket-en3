import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Star, QrCode, Share2, Award, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { ethers } from 'ethers'
import QRCode from 'qrcode'
import { useWallet } from '../context/WalletContext'
import ConnectPrompt from '../components/ui/ConnectPrompt'
import TierBadge from '../components/ui/TierBadge'
import RateEventModal from '../components/ui/RateEventModal'

export default function MyTickets() {
  const { contract, address, signer } = useWallet()
  const navigate = useNavigate()

  const [tickets, setTickets]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [qrModal, setQrModal]   = useState(null) // { tokenId, qrData }
  const [rateModal, setRateModal] = useState(null)
  const [userLoyalty, setUserLoyalty] = useState(0)

  const fetchTickets = useCallback(async () => {
  if (!contract || !address) { setLoading(false); return }
  setLoading(true)

  try {
    const loyalty = await contract.userLoyalty(address)
    setUserLoyalty(Number(loyalty))

    // Get only the event IDs the user has tickets for
    const userEventIds = await contract.getUserEventIds(address)
    const found = []

    for (let eventId of userEventIds) {
      const tokenId = await contract.userEventTicket(address, eventId)

      console.log("Event ID:", eventId.toString(), "Token ID:", tokenId.toString())

      // Convert to string to safely handle BigNumber
      const tokenIdStr = tokenId.toString()
      if (tokenIdStr === "0") continue // skip empty tickets

      const tkt = await contract.tickets(tokenId)
      const evt = await contract.events(eventId)

      found.push({
        tokenId:   Number(tokenId),
        eventId:   Number(eventId),
        eventName: evt.name,
        startTime: Number(evt.startTime),
        endTime:   Number(evt.endTime),
        tier:      Number(tkt.tier),
        loyalty:   Number(tkt.loyaltyPoints),
        attended:  tkt.attended,
        checkedIn: tkt.checkedIn,
        ratingSubmitted: tkt.ratingSubmitted,
        metadataCid: tkt.metadataCid,
      })
  }

    setTickets(found)
  } catch (err) {
    console.error('fetchTickets error:', err)
    toast.error('Failed to load tickets')
  } finally {
    setLoading(false)
  }
}, [contract, address])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const generateQR = async (tkt) => {
    if (!signer) return toast.error('Connect wallet')
    const nonce = ethers.randomBytes(32)
    const nonceHex = ethers.hexlify(nonce)
    const expiration = Math.floor(Date.now() / 1000) + 300 // 5 minutes

    try {
      const msgHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['uint256', 'address', 'uint256', 'bytes32', 'uint256'],
          [tkt.tokenId, address, tkt.eventId, nonceHex, expiration]
        )
      )
      const sig = await signer.signMessage(ethers.getBytes(msgHash))

      const payload = JSON.stringify({
        ticketId:   tkt.tokenId,
        owner:      address,
        eventId:    tkt.eventId,
        nonce:      nonceHex,
        expiration,
        signature:  sig,
      })

      const qrDataUrl = await QRCode.toDataURL(payload, {
        width: 280,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      })

      setQrModal({ tokenId: tkt.tokenId, eventName: tkt.eventName, qrDataUrl })
    } catch (err) {
      toast.error(err.message?.slice(0, 60) || 'QR generation failed')
    }
  }

  const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum']

  if (!address) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <ConnectPrompt message="Connect your wallet to view your tickets" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="py-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Ticket size={18} className="text-brand-600" />
                </div>
                <span className="text-sm font-medium text-brand-600">Collection</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900">My Tickets</h1>
            </div>
            {/* Loyalty badge */}
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">Total Loyalty</div>
              <div className="text-2xl font-black gradient-text">{userLoyalty} pts</div>
              <TierBadge tier={userLoyalty >= 100 ? 3 : userLoyalty >= 50 ? 2 : userLoyalty >= 20 ? 1 : 0} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader size={24} className="text-brand-500 animate-spin" />
              <p className="text-gray-400">Loading your tickets...</p>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
              <Ticket size={40} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">No tickets yet</h2>
            <p className="text-gray-500 mb-8">Browse events and grab your first NFT ticket</p>
            <button onClick={() => navigate('/events')} className="btn-primary">
              Explore Events
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {tickets.map(tkt => {
              const startDate = new Date(tkt.startTime * 1000)
              const isEnded   = Date.now() / 1000 > tkt.endTime
              const canRate   = tkt.attended && !tkt.ratingSubmitted && isEnded

              return (
                <div key={tkt.tokenId} className="card overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                  {/* Top banner */}
                  <div className="h-24 bg-gradient-to-br from-brand-500 to-accent-purple relative">
                    <div className="absolute inset-0 bg-noise opacity-30" />
                    <div className="absolute top-3 left-3">
                      <TierBadge tier={tkt.tier} />
                    </div>
                    {tkt.checkedIn && (
                      <div className="absolute top-3 right-3">
                        <span className="badge bg-emerald-500 text-white text-xs">✓ Checked In</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 text-white/60 text-xs font-mono">
                      #{tkt.tokenId}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 line-clamp-1">{tkt.eventName}</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-2xl p-3 text-center">
                        <div className="text-lg font-black gradient-text">{tkt.loyalty}</div>
                        <div className="text-xs text-gray-400">Loyalty pts</div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-3 text-center">
                        <div className="text-lg font-black text-gray-900">{tierNames[tkt.tier]}</div>
                        <div className="text-xs text-gray-400">Tier</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateQR(tkt)}
                        className="btn-secondary flex-1 text-sm py-2 gap-1.5"
                      >
                        <QrCode size={14} />
                        QR Code
                      </button>
                      {canRate && (
                        <button
                          onClick={() => setRateModal(tkt)}
                          className="btn-primary flex-1 text-sm py-2 gap-1.5"
                        >
                          <Star size={14} />
                          Rate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setQrModal(null)} />
          <div className="relative bg-white rounded-4xl p-8 max-w-sm w-full shadow-2xl animate-slide-up text-center">
            <h2 className="font-black text-xl text-gray-900 mb-1">{qrModal.eventName}</h2>
            <p className="text-sm text-gray-400 mb-6">Ticket #{qrModal.tokenId} · Valid 5 min</p>
            <img src={qrModal.qrDataUrl} alt="QR Code" className="mx-auto rounded-2xl shadow-card" />
            <p className="text-xs text-gray-400 mt-4">Show this at the venue entrance</p>
            <button onClick={() => setQrModal(null)} className="btn-secondary w-full mt-4">Close</button>
          </div>
        </div>
      )}

      {/* Rate modal */}
      {rateModal && (
        <RateEventModal
          ticket={rateModal}
          onClose={() => setRateModal(null)}
          onSuccess={() => { setRateModal(null); fetchTickets() }}
        />
      )}
    </div>
  )
}

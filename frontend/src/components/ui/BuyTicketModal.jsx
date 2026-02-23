import React, { useState } from 'react'
import { X, Ticket, Shield, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { ethers } from 'ethers'
import { useWallet } from '../../context/WalletContext'
import RiskBadge from './RiskBadge'

const AI_BACKEND = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000'
const DEFAULT_TICKET_CID = 'bafkreiticketmetacid'

export default function BuyTicketModal({ event, onClose, onSuccess }) {
  const { contract, address, signer } = useWallet()
  const [step, setStep]     = useState('confirm') // confirm | risk | buying | done
  const [riskData, setRiskData] = useState(null)
  const [buying, setBuying] = useState(false)

  const priceEth = ethers.formatEther(event.ticketPrice)

  const checkRisk = async () => {
    setStep('risk')
    try {
      const resp = await fetch(`${AI_BACKEND}/score-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_id: 0, // 0 for new ticket purchase
          from_address: address,
          to_address: address,
          purchase_velocity: 1,
          loyalty_points: 0,
        }),
      })
      const data = await resp.json()
      setRiskData(data)
    } catch {
      // If AI backend unreachable, proceed with default
      setRiskData({ risk_score: 10, risk_level: 'LOW', blocked: false })
    }
  }

  const buyTicket = async () => {
    if (!contract || !address) return
    setBuying(true)
    const toastId = toast.loading('Minting your ticket...')

    try {
      const tx = await contract.buyTicket(
        event.id,
        DEFAULT_TICKET_CID,
        { value: event.ticketPrice }
      )
      toast.loading('Confirming transaction...', { id: toastId })
      await tx.wait()
      toast.success('Ticket minted! 🎉', { id: toastId })
      onSuccess()
    } catch (err) {
      toast.error(err.reason || err.message?.slice(0, 80) || 'Transaction failed', { id: toastId })
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-4xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-50 rounded-2xl flex items-center justify-center">
              <Ticket size={18} className="text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Buy Ticket</h2>
              <p className="text-xs text-gray-400">{event.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {step === 'confirm' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Ticket price</span>
                  <span className="font-bold">{parseFloat(priceEth) === 0 ? 'Free' : `${priceEth} OG`}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Gas (est.)</span>
                  <span className="text-gray-700">~0.001 OG</span>
                </div>
                <div className="border-t border-gray-200 my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>{parseFloat(priceEth) === 0 ? 'Free + gas' : `~${(parseFloat(priceEth) + 0.001).toFixed(4)} OG`}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-brand-50 rounded-2xl text-xs text-brand-700">
                <Shield size={14} className="mt-0.5 flex-shrink-0" />
                AI risk check will run before confirming your purchase.
              </div>

              <button onClick={checkRisk} className="btn-primary w-full">
                Continue to Risk Check
              </button>
            </div>
          )}

          {step === 'risk' && !riskData && (
            <div className="flex flex-col items-center py-8 gap-4 animate-fade-in">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center">
                <Loader size={22} className="text-brand-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Running AI Risk Check</p>
                <p className="text-sm text-gray-400 mt-1">Analyzing wallet patterns...</p>
              </div>
            </div>
          )}

          {step === 'risk' && riskData && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-2xl border text-center" style={{
                background: riskData.risk_level === 'HIGH' ? '#fff1f2' : riskData.risk_level === 'MEDIUM' ? '#fffbeb' : '#f0fdf4',
                borderColor: riskData.risk_level === 'HIGH' ? '#fecdd3' : riskData.risk_level === 'MEDIUM' ? '#fde68a' : '#bbf7d0',
              }}>
                <p className="text-xs text-gray-500 mb-2">AI Risk Score</p>
                <div className="text-4xl font-black mb-2" style={{
                  color: riskData.risk_level === 'HIGH' ? '#e11d48' : riskData.risk_level === 'MEDIUM' ? '#d97706' : '#059669'
                }}>
                  {riskData.risk_score}
                  <span className="text-lg font-normal text-gray-400">/100</span>
                </div>
                <RiskBadge level={riskData.risk_level} />
              </div>

              {riskData.blocked ? (
                <div className="text-center">
                  <p className="text-rose-600 font-semibold mb-1">Transfer Blocked</p>
                  <p className="text-sm text-gray-500">Your wallet pattern matches known scalper behavior. This purchase cannot proceed.</p>
                  <button onClick={onClose} className="btn-secondary w-full mt-4">Close</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 text-center">
                    ✅ Wallet cleared. You can proceed with the purchase.
                  </p>
                  <button
                    onClick={buyTicket}
                    disabled={buying}
                    className="btn-primary w-full"
                  >
                    {buying ? (
                      <><Loader size={16} className="animate-spin" /> Minting...</>
                    ) : (
                      <><Ticket size={16} /> Confirm Purchase</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import jsQR from 'jsqr'
import { ethers } from 'ethers'
import {
  isNonceUsed, markNonceUsed, isCheckedIn, markCheckedIn,
  saveValidTickets, isValidTicket, getMerkleData, saveMerkleData,
  getPendingSync, clearPendingSync, getCheckedInCount
} from './db/indexedDB'
import { verifyMerkleProof, computeLeaf, verifyQRSignature } from './utils/merkle'

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''
const OG_RPC_URL       = import.meta.env.VITE_OG_RPC_URL || 'https://evmrpc-testnet.0g.ai'

const CONTRACT_ABI_MINIMAL = [
  "function getEvent(uint256 eventId) external view returns (tuple(uint256 id, address organizer, string name, string metadataCid, uint256 startTime, uint256 endTime, uint256 ticketPrice, uint256 maxTickets, uint256 soldTickets, bytes32 merkleRoot, bool active, uint256 totalRatings, uint256 ratingSum, uint256 ratingCount))",
  "function getEventTickets(uint256 eventId) external view returns (uint256[])",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function syncOfflineCheckIns(uint256 eventId, uint256[] tokenIds, bytes32[][] merkleProofs) external",
]

export default function ScannerApp() {
  const [eventId, setEventId]       = useState('')
  const [loaded, setLoaded]         = useState(false)
  const [scanning, setScanning]     = useState(false)
  const [result, setResult]         = useState(null)
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [online, setOnline]         = useState(navigator.onLine)
  const [syncing, setSyncing]       = useState(false)
  const [lastScan, setLastScan]     = useState(null)

  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animRef   = useRef(null)

  // Online/offline tracking
  useEffect(() => {
    const onOnline  = () => { setOnline(true); toast.success('Back online! Ready to sync.') }
    const onOffline = () => { setOnline(false); toast('Offline mode active', { icon: '📡' }) }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    getCheckedInCount().then(setCheckedInCount)
  }, [result])

  // ── Load event data for offline verification ──
  const loadEvent = async () => {
    const eid = parseInt(eventId)
    if (!eid || eid <= 0) return toast.error('Enter a valid event ID')

    const toastId = toast.loading('Loading event data...')
    try {
      const provider = new ethers.JsonRpcProvider(OG_RPC_URL)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI_MINIMAL, provider)

      const evt = await contract.getEvent(eid)
      if (!evt.active) throw new Error('Event is not active')

      const merkleRoot = evt.merkleRoot

      // Download ticket list for Merkle tree
      const tokenIds = await contract.getEventTickets(eid)
      const leaves = []
      const ticketData = []

      for (const tokenId of tokenIds) {
        const owner = await contract.ownerOf(tokenId)
        const leaf  = computeLeaf(Number(tokenId), owner, eid)
        leaves.push(leaf)
        ticketData.push({ tokenId: Number(tokenId), owner, leaf })
      }

      await saveValidTickets(eid, ticketData.map(t => ({
        tokenId: t.tokenId,
        owner:   t.owner,
        leaf:    t.leaf,
      })))

      await saveMerkleData(eid, merkleRoot, ticketData)

      toast.success(`Loaded ${tokenIds.length} tickets for offline use`, { id: toastId })
      setLoaded(true)
    } catch (err) {
      toast.error(err.message?.slice(0, 60) || 'Failed to load event', { id: toastId })
    }
  }

  // ── Camera ──
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanning(true)
      scanLoop()
    } catch (err) {
      toast.error('Camera access denied')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (animRef.current) cancelAnimationFrame(animRef.current)
    setScanning(false)
  }

  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code) {
          processQR(code.data)
          return // pause loop while processing
        }
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [])

  const processQR = async (raw) => {
    // Prevent duplicate fast scans
    if (lastScan && Date.now() - lastScan < 3000) return
    setLastScan(Date.now())

    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      setResult({ ok: false, msg: 'Invalid QR format' })
      return resumeScan()
    }

    const { ticketId, owner, eventId: qrEventId, nonce, expiration, signature } = payload

    // 1. Check expiration
    if (Math.floor(Date.now() / 1000) > expiration) {
      setResult({ ok: false, msg: 'QR code expired' })
      return resumeScan()
    }

    // 2. Replay protection
    const nonceUsed = await isNonceUsed(nonce)
    if (nonceUsed) {
      setResult({ ok: false, msg: 'QR already used' })
      return resumeScan()
    }

    // 3. Double check-in prevention
    const alreadyIn = await isCheckedIn(ticketId)
    if (alreadyIn) {
      setResult({ ok: false, msg: 'Already checked in!' })
      return resumeScan()
    }

    // 4. Verify signature
    const sigValid = verifyQRSignature(ticketId, owner, qrEventId, nonce, expiration, signature)
    if (!sigValid) {
      setResult({ ok: false, msg: 'Invalid signature' })
      return resumeScan()
    }

    // 5. Verify against local Merkle tree
    const merkleData = await getMerkleData(parseInt(qrEventId))
    if (merkleData) {
      const ticketEntry = merkleData.leaves.find(l => l.tokenId === parseInt(ticketId))
      if (!ticketEntry) {
        setResult({ ok: false, msg: 'Ticket not in this event' })
        return resumeScan()
      }
      // For a single-leaf scenario or pre-computed proof, verify directly
      const leaf = computeLeaf(parseInt(ticketId), owner, parseInt(qrEventId))
      if (leaf.toLowerCase() !== ticketEntry.leaf.toLowerCase()) {
        setResult({ ok: false, msg: 'Ticket data mismatch' })
        return resumeScan()
      }
    }

    // ✅ All checks passed
    await markNonceUsed(nonce)
    await markCheckedIn(parseInt(ticketId), parseInt(qrEventId), owner)

    setResult({ ok: true, msg: `Checked in! Ticket #${ticketId}`, owner, ticketId })
    toast.success(`✅ Check-in approved: #${ticketId}`)
    resumeScan(2000)
  }

  const resumeScan = (delay = 1500) => {
    setTimeout(() => {
      setResult(null)
      scanLoop()
    }, delay)
  }

  // ── Sync ──
  const syncOnline = async () => {
    if (!online) return toast.error('No internet connection')
    const eid = parseInt(eventId)
    if (!eid) return toast.error('Load an event first')

    setSyncing(true)
    const toastId = toast.loading('Syncing with blockchain...')
    try {
      const pending = await getPendingSync()
      if (pending.length === 0) {
        toast.success('Already synced!', { id: toastId })
        setSyncing(false)
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer   = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI_MINIMAL, signer)
      const merkleData = await getMerkleData(eid)

      // Build proofs for each pending check-in
      const tokenIds  = []
      const proofs    = []

      for (const p of pending) {
        const ticketEntry = merkleData?.leaves.find(l => l.tokenId === p.tokenId)
        if (!ticketEntry) continue

        tokenIds.push(p.tokenId)
        // Single-leaf proof = empty array (leaf IS the root)
        proofs.push([])
      }

      if (tokenIds.length > 0) {
        const tx = await contract.syncOfflineCheckIns(eid, tokenIds, proofs)
        await tx.wait()
        await clearPendingSync(pending.map(p => p.id))
      }

      toast.success(`Synced ${tokenIds.length} check-ins`, { id: toastId })
    } catch (err) {
      toast.error(err.message?.slice(0, 60) || 'Sync failed', { id: toastId })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg">🚀 RocketEN3 Scanner</h1>
          <p className="text-xs text-white/40">Offline-capable QR verification</p>
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
          <div className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          {online ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Event setup */}
        {!loaded && (
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-sm text-white/60 mb-3">Enter event ID to download ticket data for offline verification</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                placeholder="Event ID"
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-400"
              />
              <button onClick={loadEvent} className="px-5 py-2.5 bg-brand-600 rounded-xl text-sm font-semibold hover:bg-brand-500 transition-colors">
                Load
              </button>
            </div>
          </div>
        )}

        {loaded && (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-sm text-emerald-400">Event {eventId} loaded</span>
            </div>
            <button onClick={() => setLoaded(false)} className="text-xs text-white/30 hover:text-white/60">Reset</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-brand-400">{checkedInCount}</div>
            <div className="text-xs text-white/40 mt-1">Checked In</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-3xl font-black text-white">{online ? '🌐' : '📡'}</div>
            <div className="text-xs text-white/40 mt-1">{online ? 'Online' : 'Offline'}</div>
          </div>
        </div>

        {/* Scanner */}
        <div className="bg-white/5 rounded-2xl overflow-hidden">
          <div className="relative aspect-square bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-brand-400/60 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
                  {/* Scan line */}
                  <div className="absolute inset-x-0 h-0.5 bg-brand-400/60 animate-bounce" style={{ top: '50%' }} />
                </div>
              </div>
            )}

            {/* Result overlay */}
            {result && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center ${result.ok ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}>
                <div className="text-5xl mb-3">{result.ok ? '✅' : '❌'}</div>
                <div className="font-black text-xl text-white">{result.msg}</div>
                {result.owner && (
                  <div className="text-sm text-white/70 mt-1 font-mono">
                    {result.owner.slice(0, 8)}...{result.owner.slice(-6)}
                  </div>
                )}
              </div>
            )}

            {!scanning && !result && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/30 text-sm">Camera off</p>
              </div>
            )}
          </div>

          <div className="p-4 flex gap-2">
            {!scanning ? (
              <button
                onClick={startCamera}
                disabled={!loaded}
                className="flex-1 py-3 bg-brand-600 rounded-xl font-semibold text-sm hover:bg-brand-500 transition-colors disabled:opacity-40"
              >
                Start Scanning
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="flex-1 py-3 bg-white/10 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {/* Sync button */}
        {online && (
          <button
            onClick={syncOnline}
            disabled={syncing}
            className="w-full py-3 bg-emerald-600 rounded-2xl font-semibold text-sm hover:bg-emerald-500 transition-colors disabled:opacity-40"
          >
            {syncing ? '⏳ Syncing...' : '🔄 Sync Check-ins to Blockchain'}
          </button>
        )}
      </div>
    </div>
  )
}

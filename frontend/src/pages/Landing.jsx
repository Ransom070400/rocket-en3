import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Rocket, Zap, Shield, Star, ArrowRight, ChevronRight, Globe, Cpu, Lock } from 'lucide-react'
import { useWallet } from '../context/WalletContext'

const FEATURES = [
  {
    icon: <Cpu className="text-brand-500" size={22} />,
    title: 'AI Risk Engine',
    desc: 'XGBoost-powered anti-scalping detection with ECDSA-signed transfer gates.',
  },
  {
    icon: <Zap className="text-accent-amber" size={22} />,
    title: 'Dynamic NFTs',
    desc: 'Tickets evolve with loyalty, attendance, and participation — metadata stored on 0G.',
  },
  {
    icon: <Globe className="text-accent-cyan" size={22} />,
    title: 'Offline Verification',
    desc: 'Merkle-based QR scanning works without internet. Syncs when reconnected.',
  },
  {
    icon: <Shield className="text-accent-pink" size={22} />,
    title: 'Loyalty Tiers',
    desc: 'Bronze → Platinum. High loyalty unlocks discounts and lowers transfer restrictions.',
  },
]

const STATS = [
  { label: 'Risk accuracy', value: '97%' },
  { label: 'Gas optimized', value: '200↓' },
  { label: 'Offline capable', value: '100%' },
  { label: 'Built on 0G', value: '✓' },
]

export default function Landing() {
  const { connect, address, connecting } = useWallet()
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-brand-900 to-slate-950" />
        <div className="absolute inset-0 bg-noise opacity-40" />

        {/* Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-purple/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-pink/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Hero content */}
        <div className={`relative z-10 max-w-4xl mx-auto px-4 text-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white/80 text-sm mb-8">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Live on 0G Galileo Testnet
          </div>

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-purple rounded-3xl flex items-center justify-center shadow-glow-lg animate-float">
              <Rocket size={32} className="text-white" />
            </div>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-white leading-none tracking-tight mb-4">
            ROCKET
            <span className="block" style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #f43f5e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EN3
            </span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered Intelligent NFT Event Infrastructure.
            Dynamic tickets. Anti-scalping. Offline verification.
            <span className="text-white/90 font-medium"> All on 0G.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {address ? (
              <button
                onClick={() => navigate('/events')}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-200 shadow-glow text-lg"
              >
                Explore Events
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={connect}
                disabled={connecting}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-200 shadow-glow text-lg disabled:opacity-60"
              >
                {connecting ? (
                  <>Connecting...</>
                ) : (
                  <>
                    Connect & Launch
                    <Rocket size={20} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            )}
            <Link
              to="/create"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all duration-200 text-lg"
            >
              Create Event
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30 text-xs">
          <div className="w-6 h-10 border border-white/20 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Everything you need,
              <span className="gradient-text"> already built.</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Production-grade infrastructure for the next generation of event experiences.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 group hover:-translate-y-1 transition-transform duration-300">
                <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">How it works</h2>
          </div>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Organizer creates an event', desc: 'Metadata stored on 0G. Merkle tree generated for offline verification.' },
              { step: '02', title: 'Fan buys NFT ticket', desc: 'ERC721 minted. Dynamic metadata reflects loyalty tier. Anti-scalping protects fair access.' },
              { step: '03', title: 'Event day check-in', desc: 'QR verified online or offline with Merkle proofs. Double-scan prevented.' },
              { step: '04', title: 'Loyalty grows & NFT evolves', desc: 'Attendance rewards loyalty points. NFT upgrades tier. Organizer reputation updates.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start p-6 rounded-3xl hover:bg-gray-50 transition-colors duration-200 group">
                <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-brand-50 flex items-center justify-center font-black text-brand-600 text-sm group-hover:bg-brand-100 transition-colors">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-brand-600 to-accent-purple">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black text-white mb-6">Ready to launch? 🚀</h2>
          <p className="text-white/70 text-lg mb-10">
            The future of ticketing is intelligent, decentralized, and fair.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create" className="px-8 py-4 bg-white text-brand-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors text-lg">
              Create Event
            </Link>
            <Link to="/events" className="px-8 py-4 bg-white/20 border border-white/30 text-white font-bold rounded-2xl hover:bg-white/30 transition-colors text-lg">
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-950 text-center">
        <p className="text-gray-600 text-sm">
          Built with 🚀 on{' '}
          <a href="https://0g.ai" target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300 transition-colors">
            0G Network
          </a>
        </p>
      </footer>
    </div>
  )
}

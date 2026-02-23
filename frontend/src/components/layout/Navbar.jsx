import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Rocket, Wallet, X, ChevronDown, LayoutDashboard, Ticket, Plus, Compass } from 'lucide-react'
import { useWallet } from '../../context/WalletContext'
import { OG_CHAIN } from '../../utils/contract'

export default function Navbar() {
  const { address, connect, disconnect, connecting, isCorrectChain, switchToOG, balance, chainId } = useWallet()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const shortAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  const navLinks = [
    { to: '/events',    label: 'Explore',    icon: <Compass size={16} /> },
    { to: '/create',    label: 'Create',     icon: <Plus size={16} /> },
    { to: '/my-tickets',label: 'My Tickets', icon: <Ticket size={16} /> },
    { to: '/dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
  ]

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-purple rounded-xl flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-200">
              <Rocket size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="gradient-text">ROCKET</span>
              <span className="text-gray-900"> EN3</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(link.to)
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Wallet button */}
          <div className="flex items-center gap-3">
            {/* Chain warning */}
            {address && !isCorrectChain && (
              <button
                onClick={switchToOG}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors"
              >
                ⚠️ Switch to 0G
              </button>
            )}

            {address ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs text-gray-500 leading-none">{balance} OG</span>
                  <span className="text-sm font-semibold text-gray-900 leading-none mt-0.5">{shortAddr}</span>
                </div>
                <button
                  onClick={disconnect}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-sm font-medium transition-all duration-200"
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="hidden sm:inline">{shortAddr}</span>
                  <span className="sm:hidden">Wallet</span>
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={connecting}
                className="btn-primary text-sm py-2 px-5"
              >
                <Wallet size={16} />
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {menuOpen ? <X size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 animate-slide-down">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

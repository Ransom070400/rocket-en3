import { LogIn, ArrowRight } from 'lucide-react'
import { useWallet } from '../../context/WalletContext'

export default function ConnectPrompt({ message = 'Sign in to continue' }) {
  const { connect, connecting } = useWallet()
  return (
    <div className="flex flex-col items-center text-center p-8 max-w-sm">
      <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center mb-5">
        <LogIn size={28} className="text-brand-500" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">Sign In</h2>
      <p className="text-gray-500 text-sm mb-2">{message}</p>
      <p className="text-gray-400 text-xs mb-6">Use Google, Twitter, Discord, email, or any wallet</p>
      <button onClick={connect} disabled={connecting} className="btn-primary">
        {connecting ? 'Loading...' : 'Sign In'}
        <ArrowRight size={16} />
      </button>
    </div>
  )
}

import React from 'react'
import { Web3AuthProvider } from '@web3auth/modal/react'
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from '@web3auth/base'
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider'

const CLIENT_ID = import.meta.env.VITE_WEB3AUTH_CLIENT_ID
  || 'BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oj6_uKFRPSQBTgpKYb5PqbAR_sew2SjzMnQXLuMfBnBPg8Y'

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0x40DA',
  rpcTarget: 'https://evmrpc-testnet.0g.ai',
  displayName: '0G Galileo Testnet',
  blockExplorerUrl: 'https://chainscan-galileo.0g.ai',
  ticker: 'OG',
  tickerName: '0G',
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
})

const web3AuthOptions = {
  clientId: CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  privateKeyProvider,
  uiConfig: {
    appName: 'ROCKET EN3',
    mode: 'light',
    primaryButton: 'socialLogin',
    theme: { primary: '#7c3aed' },
  },
}

class Web3AuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('Web3Auth error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'Inter, sans-serif', textAlign: 'center', marginTop: 80 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>Web3Auth failed to load</h2>
          <p style={{ color: '#666', marginTop: 8, fontSize: 14 }}>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600 }}
          >
            Reload Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Web3AuthWrapper({ children }) {
  return (
    <Web3AuthErrorBoundary>
      <Web3AuthProvider config={{ web3AuthOptions }}>
        {children}
      </Web3AuthProvider>
    </Web3AuthErrorBoundary>
  )
}

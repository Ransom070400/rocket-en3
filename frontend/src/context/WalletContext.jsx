import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { CONTRACT_ADDRESS, CONTRACT_ABI, OG_CHAIN } from '../utils/contract'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [provider, setProvider]     = useState(null)
  const [signer, setSigner]         = useState(null)
  const [address, setAddress]       = useState(null)
  const [contract, setContract]     = useState(null)
  const [chainId, setChainId]       = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [balance, setBalance]       = useState('0')

  const isCorrectChain = chainId === OG_CHAIN.id

  const initContract = useCallback((signerOrProvider) => {
    if (!CONTRACT_ADDRESS || !CONTRACT_ADDRESS.startsWith('0x')) return null
    try {
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider)
    } catch {
      return null
    }
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not found. Please install it.')
      return
    }
    setConnecting(true)
    try {
      const prov = new ethers.BrowserProvider(window.ethereum)
      await prov.send('eth_requestAccounts', [])

      const sgn  = await prov.getSigner()
      const addr = await sgn.getAddress()
      const net  = await prov.getNetwork()
      const bal  = await prov.getBalance(addr)

      setProvider(prov)
      setSigner(sgn)
      setAddress(addr)
      setChainId(Number(net.chainId))
      setBalance(ethers.formatEther(bal).slice(0, 6))
      setContract(initContract(sgn))

      toast.success('Wallet connected 🚀')
    } catch (err) {
      toast.error(err.message?.slice(0, 60) || 'Connection failed')
    } finally {
      setConnecting(false)
    }
  }, [initContract])

  const switchToOG = useCallback(async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${OG_CHAIN.id.toString(16)}` }],
      })
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${OG_CHAIN.id.toString(16)}`,
            chainName: OG_CHAIN.name,
            rpcUrls: [OG_CHAIN.rpcUrl],
            blockExplorerUrls: [OG_CHAIN.explorer],
            nativeCurrency: OG_CHAIN.nativeCurrency,
          }],
        })
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setContract(null)
    setChainId(null)
    setBalance('0')
    toast('Disconnected', { icon: '👋' })
  }, [])

  // Auto-connect if previously connected
  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
      if (accounts.length > 0) connect()
    }).catch(() => {})
  }, [])

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return
    const onAccounts = (accounts) => {
      if (accounts.length === 0) disconnect()
      else connect()
    }
    const onChain = (cId) => setChainId(parseInt(cId, 16))
    window.ethereum.on('accountsChanged', onAccounts)
    window.ethereum.on('chainChanged', onChain)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts)
      window.ethereum.removeListener('chainChanged', onChain)
    }
  }, [connect, disconnect])

  return (
    <WalletContext.Provider value={{
      provider, signer, address, contract, chainId,
      connecting, balance, isCorrectChain,
      connect, disconnect, switchToOG,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}

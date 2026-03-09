import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from '@web3auth/modal/react'
import { CONTRACT_ADDRESS, CONTRACT_ABI, OG_CHAIN } from '../utils/contract'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const { isConnected, isInitialized, provider: web3AuthProvider } = useWeb3Auth()
  const { connect: web3AuthConnect, loading: connectLoading } = useWeb3AuthConnect()
  const { disconnect: web3AuthDisconnect } = useWeb3AuthDisconnect()
  const { userInfo } = useWeb3AuthUser()

  const [provider, setProvider]     = useState(null)
  const [signer, setSigner]         = useState(null)
  const [address, setAddress]       = useState(null)
  const [writeContract, setWriteContract] = useState(null)
  const [chainId, setChainId]       = useState(null)
  const [balance, setBalance]       = useState('0')

  const isCorrectChain = chainId === OG_CHAIN.id

  // Read-only provider & contract (always works, no wallet needed)
  const readProvider = useMemo(() => new ethers.JsonRpcProvider(OG_CHAIN.rpcUrl), [])
  const readContract = useMemo(() => {
    if (!CONTRACT_ADDRESS || !CONTRACT_ADDRESS.startsWith('0x')) return null
    try { return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider) }
    catch { return null }
  }, [readProvider])

  const contract = writeContract || readContract

  const clearState = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setWriteContract(null)
    setChainId(null)
    setBalance('0')
  }, [])

  // Setup ethers provider/signer when Web3Auth connects
  const setupWallet = useCallback(async () => {
    if (!web3AuthProvider) { clearState(); return }

    try {
      const prov = new ethers.BrowserProvider(web3AuthProvider)
      const sgn = await prov.getSigner()
      const addr = await sgn.getAddress()
      const net = await prov.getNetwork()

      let bal = '0'
      try {
        const rawBal = await readProvider.getBalance(addr)
        bal = ethers.formatEther(rawBal).slice(0, 6)
      } catch {}

      setProvider(prov)
      setSigner(sgn)
      setAddress(addr)
      setChainId(Number(net.chainId))
      setBalance(bal)

      if (CONTRACT_ADDRESS?.startsWith('0x')) {
        try { setWriteContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, sgn)) }
        catch { setWriteContract(null) }
      }
    } catch (err) {
      console.error('Wallet setup error:', err)
    }
  }, [web3AuthProvider, readProvider, clearState])

  // React to connection state changes
  useEffect(() => {
    if (isConnected && web3AuthProvider) {
      setupWallet()
    } else if (!isConnected) {
      clearState()
    }
  }, [isConnected, web3AuthProvider, setupWallet, clearState])

  const [manualConnecting, setManualConnecting] = useState(false)

  const connect = useCallback(async () => {
    if (!isInitialized) {
      toast.error('Still loading, please wait...')
      return
    }
    setManualConnecting(true)
    try {
      await web3AuthConnect()
    } catch (err) {
      if (err?.message?.includes('User closed')) return
      toast.error(err?.message?.slice(0, 60) || 'Login failed')
    } finally {
      setManualConnecting(false)
    }
  }, [web3AuthConnect, isInitialized])

  const disconnect = useCallback(async () => {
    try {
      await web3AuthDisconnect()
    } catch {}
    clearState()
    toast('Disconnected')
  }, [web3AuthDisconnect, clearState])

  const switchToOG = useCallback(async () => {
    if (!web3AuthProvider) return
    try {
      await web3AuthProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x40DA' }],
      })
      await setupWallet()
    } catch (err) {
      console.error('Chain switch error:', err)
    }
  }, [web3AuthProvider, setupWallet])

  // User display info from social login
  const user = userInfo || null
  const authenticated = isConnected

  return (
    <WalletContext.Provider value={{
      provider, signer, address, contract, readContract, chainId,
      connecting: manualConnecting || connectLoading,
      balance, isCorrectChain,
      connect, disconnect, switchToOG,
      authenticated, user,
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

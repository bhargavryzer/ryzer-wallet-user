"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FiatWallet } from "./features/wallet/FiatWallet"
import { CryptoWallet } from "./features/wallet/CryptoWallet"
import { TransactionHistory } from "./features/wallet/TransactionHistory"
import { WithdrawModal } from "./withdraw-modal"
import { CryptoDepositModal } from "./crypto-deposit-modal"
import { BankList } from "./bank-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWalletStore } from "@/lib/store/wallet-store"
import { QuickActions } from "./features/wallet/QuickActions"
import type { Transaction as TransactionType } from "./features/wallet/types"
import { NETWORK_ASSETS } from "@/lib/constants/network-assets"

// Network types
type Network = {
  id: string;
  name: string;
  chainId: string;
  icon: string;
  color: string;
}

// Available networks
const NETWORKS: Network[] = [
  {
    id: 'ripple',
    name: 'Ripple',
    chainId: '144',
    icon: '🔹',
    color: 'bg-blue-400'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    chainId: '137',
    icon: '🟣',
    color: 'bg-purple-500'
  },
  {
    id: 'xdc',
    name: 'XDC Network',
    chainId: '50',
    icon: '🔵',
    color: 'bg-blue-700'
  }
];

export function WalletDashboard() {
  const router = useRouter()
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isCryptoDepositModalOpen, setIsCryptoDepositModalOpen] = useState(false)
  const [activeNetwork, setActiveNetwork] = useState<Network>(NETWORKS[0])
  
  // Get wallet state from the store
  const {
    fiatBalance,
    cryptoHoldings,
    transactions,
    fiatTransactions,
    activeNetwork: storeActiveNetwork,
    setActiveNetwork: setStoreActiveNetwork,
    activeCurrencyTab,
    setCurrencyTab
  } = useWalletStore();
  
  // Debug wallet store state
  useEffect(() => {
    console.log('WalletDashboard - Active Network:', activeNetwork);
    console.log('WalletDashboard - Crypto Holdings from store:', cryptoHoldings);
    const networkHoldings = cryptoHoldings[activeNetwork.id as 'ripple' | 'polygon' | 'xdc'];
    console.log(`WalletDashboard - ${activeNetwork.id} holdings:`, networkHoldings);
    
    // Force a re-render when the active network changes
    const forceUpdate = setTimeout(() => {
      console.log('Forcing update to refresh UI with new network data');
    }, 100);
    
    return () => clearTimeout(forceUpdate);
  }, [activeNetwork, cryptoHoldings]);
  
  // Debug crypto holdings
  useEffect(() => {
    console.log('Current active network:', activeNetwork.id)
    console.log('Crypto holdings from store:', cryptoHoldings)
    console.log('Network-specific holdings:', cryptoHoldings[activeNetwork.id as 'ripple' | 'polygon' | 'xdc'])
  }, [activeNetwork.id, cryptoHoldings])

  const openWithdrawModal = () => setIsWithdrawModalOpen(true)
  const closeWithdrawModal = () => setIsWithdrawModalOpen(false)
  const openCryptoDepositModal = () => setIsCryptoDepositModalOpen(true)
  const closeCryptoDepositModal = () => setIsCryptoDepositModalOpen(false)

  // Handle network change
  const handleNetworkChange = (networkId: string) => {
    console.log('Changing network to:', networkId);
    const network = NETWORKS.find(n => n.id === networkId);
    if (network) {
      setActiveNetwork(network);
      // Also update the network in the store
      setStoreActiveNetwork(networkId as 'ripple' | 'polygon' | 'xdc');
    }
  };
  
  // Sync component state with store state on mount
  useEffect(() => {
    const network = NETWORKS.find(n => n.id === storeActiveNetwork);
    if (network) {
      setActiveNetwork(network);
    }
  }, [storeActiveNetwork]);

  // Convert wallet store transactions to the format expected by TransactionHistory component
  const formatTransactions = (): TransactionType[] => {
    // Get network-specific transactions
    const networkType = activeNetwork.id as 'ripple' | 'polygon' | 'xdc';
    const networkTransactions = transactions[networkType] || [];
    
    console.log(`Formatting transactions for ${networkType}:`, networkTransactions);
    
    // Get the supported assets for this network
    const supportedAssets = NETWORK_ASSETS[networkType] || [];
    console.log(`Supported assets for ${networkType}:`, supportedAssets);
    
    // Filter transactions to only include those with assets supported on this network
    const filteredNetworkTransactions = networkTransactions.filter(t => {
      // Include transactions where the primary asset is supported on this network
      const primaryAssetSupported = supportedAssets.includes(t.asset as string);
      
      // For swap transactions, also check if the target asset is supported
      if (t.type === 'swap' && t.toAsset) {
        const targetAssetSupported = supportedAssets.includes(t.toAsset as string);
        return primaryAssetSupported && targetAssetSupported;
      }
      
      return primaryAssetSupported;
    });
    
    console.log(`Filtered network transactions for ${networkType}:`, filteredNetworkTransactions);
    
    // Filter fiat transactions that are relevant to the current network
    // For example, if a fiat transaction is used to buy a crypto asset on the current network
    const relevantFiatTransactions = fiatTransactions.filter(t => {
      // Include fiat transactions that are related to the current network's assets
      if (t.toAsset) {
        return supportedAssets.includes(t.toAsset as string);
      }
      // Also include sell transactions where the asset being sold is supported on this network
      if (t.type === 'sell') {
        return supportedAssets.includes(t.asset as string);
      }
      return false;
    });
    
    console.log(`Relevant fiat transactions for ${networkType}:`, relevantFiatTransactions);
    
    // Combine network-specific transactions with relevant fiat transactions
    const allTransactions = [...filteredNetworkTransactions, ...relevantFiatTransactions];
    
    // Sort transactions by date (newest first)
    allTransactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    return allTransactions.map(t => {
      // Determine transaction type display
      let displayType: 'deposit' | 'withdrawal' | 'swap' = 'withdrawal';
      if (t.type === 'deposit' || t.type === 'buy') {
        displayType = 'deposit';
      } else if (t.type === 'swap') {
        displayType = 'swap';
      }
      
      // Format amount with appropriate details
      let amountDisplay = `${t.amount.toLocaleString()} ${t.asset}`;
      if (t.type === 'swap' && t.toAsset) {
        amountDisplay = `${t.amount.toLocaleString()} ${t.asset} → ${t.toAsset}`;
      } else if (t.type === 'buy' && t.toAsset) {
        amountDisplay = `${t.amount.toLocaleString()} ${t.asset} → ${t.toAsset}`;
      } else if (t.type === 'sell' && t.toAsset) {
        amountDisplay = `${t.amount.toLocaleString()} ${t.asset} → ${t.toAsset}`;
      }
      
      // Add network information for crypto transactions
      let details = t.details || t.id;
      if (t.chainId) {
        const network = NETWORKS.find(n => n.chainId === t.chainId);
        if (network) {
          details = `${network.name} - ${t.id}`;
        }
      }
      
      return {
        date: t.date,
        type: displayType,
        asset: t.asset as string,
        amount: amountDisplay,
        status: t.status,
        details: details
      };
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-purple-500">My Wallet</span>
        </div>
        
        {/* Network Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Network:</span>
          <Select value={activeNetwork.id} onValueChange={handleNetworkChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{activeNetwork.icon}</span>
                  <span>{activeNetwork.name}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {NETWORKS.map(network => (
                <SelectItem key={network.id} value={network.id}>
                  <div className="flex items-center gap-2">
                    <span>{network.icon}</span>
                    <span>{network.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-bold">My Wallet</h2>
            <p className="text-sm text-gray-500">Manage your currencies and assets</p>
          </div>

          <Tabs 
            defaultValue={activeCurrencyTab} 
            className="mb-6" 
            onValueChange={(value) => setCurrencyTab(value as "fiat" | "crypto")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="fiat" disabled className="text-gray-400 cursor-not-allowed">
                Fiat (Coming Soon)
              </TabsTrigger>
              <TabsTrigger value="crypto">Cryptocurrency</TabsTrigger>
            </TabsList>

            <TabsContent value="crypto">
              <CryptoWallet
                onDeposit={openCryptoDepositModal}
                onWithdraw={openWithdrawModal}
                activeNetwork={activeNetwork}
                networkHoldings={cryptoHoldings[activeNetwork.id as 'ripple' | 'polygon' | 'xdc'] || []}
              />
            </TabsContent>
          </Tabs>

          <TransactionHistory 
            transactions={formatTransactions()} 
            activeNetwork={activeNetwork}
          />
        </div>

        <div className="space-y-6">
          <QuickActions type="crypto" activeNetwork={activeNetwork} />
          {activeCurrencyTab === "fiat" && <BankList />}
        </div>
      </div>

      <WithdrawModal 
        isOpen={isWithdrawModalOpen} 
        onClose={closeWithdrawModal} 
        activeNetwork={activeNetwork}
      />
      <CryptoDepositModal 
        isOpen={isCryptoDepositModalOpen} 
        onClose={closeCryptoDepositModal}
        activeNetwork={activeNetwork}
      />
    </div>
  )
}

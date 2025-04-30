import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Currency = "USD" | "EUR" | "GBP"
export type CryptoAsset =  "XDC" | "MATIC" | "XRP" | "USDT"

export type Bank = {
  id: string
  name: string
  accountNumber: string
  routingNumber?: string
  isVerified: boolean
}

export type Transaction = {
  id: string
  type: "deposit" | "withdrawal" | "swap" | "buy" | "sell"
  amount: number
  fee: number
  asset: Currency | CryptoAsset
  date: string
  status: "completed" | "pending" | "failed" | "processing"
  details?: string
  bankId?: string
  toAsset?: Currency | CryptoAsset
  address?: string
  chainId?: string
}

export type CryptoHolding = {
  asset: CryptoAsset
  amount: number
  valueUSD: number
  change24h: number
}

export type NetworkType = 'ripple' | 'polygon' | 'xdc';

export type WalletState = {
  // User
  isAuthenticated: boolean
  user: {
    id: string
    name: string
    email: string
    avatar: string
  } | null

  // Balances
  fiatBalance: {
    [key in Currency]: number
  }
  
  // Wallet addresses for each network
  walletAddresses: {
    [key in NetworkType]: string
  }
  
  // Network-specific crypto holdings
  cryptoHoldings: {
    ripple: CryptoHolding[]
    polygon: CryptoHolding[]
    xdc: CryptoHolding[]
  }
  
  // Network-specific transactions
  transactions: {
    ripple: Transaction[]
    polygon: Transaction[]
    xdc: Transaction[]
  }
  
  // Fiat transactions (not network-specific)
  fiatTransactions: Transaction[]

  // Banks
  banks: Bank[]

  // UI State
  activeTab: "portfolio" | "wallet"
  activeCurrencyTab: "fiat" | "crypto"
  activeNetwork: NetworkType

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  deposit: (
    amount: number,
    asset: Currency | CryptoAsset,
    bankId?: string,
    address?: string,
    chainId?: string,
    network?: NetworkType
  ) => Promise<Transaction>
  withdraw: (amount: number, asset: Currency | CryptoAsset, bankId?: string, note?: string, network?: NetworkType) => Promise<Transaction>
  addBank: (bank: Omit<Bank, "id" | "isVerified">) => Promise<Bank>
  removeBank: (bankId: string) => Promise<boolean>
  setActiveTab: (tab: "portfolio" | "wallet") => void
  setCurrencyTab: (tab: "fiat" | "crypto") => void
  setActiveNetwork: (network: NetworkType) => void
}

export const useWalletStore = create(
  persist<WalletState>(
    (set) => ({
      // Initial State
      isAuthenticated: true,
      user: {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        avatar: "/images/avatar.jpg",
      },

      fiatBalance: {
        USD: 24578.93,
        EUR: 0,
        GBP: 0,
      },
      
      // Wallet addresses for each network
      walletAddresses: {
        ripple: "rGnBxmHKxymJbCVkeMbR6EF7QiCCBYxcuP",
        polygon: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        xdc: "xdc7d5f2f1bc47c4bcfd2480125f1cb5ddaca13c0cd"
      },
      
      // Default active network
      activeNetwork: "ripple",
      
      // Banks
      banks: [
        {
          id: "bank-1",
          name: "Chase Bank",
          accountNumber: "*****6789",
          routingNumber: "072000326",
          isVerified: true,
        },
      ],
      
      // Default tabs
      activeTab: "wallet",
      activeCurrencyTab: "crypto",

      cryptoHoldings: {
        // Ripple network holdings - only XRP and USDT are valid for this network
        ripple: [
          { asset: "XRP", amount: 8500, valueUSD: 6800, change24h: 1.5 },
          { asset: "USDT", amount: 2000, valueUSD: 2000, change24h: 0 },
          { asset: "XDC", amount: 0.25, valueUSD: 12500, change24h: 2.1 }
        ],
        // Polygon network holdings - only MATIC and USDT are valid for this network
        polygon: [
          { asset: "MATIC", amount: 5000, valueUSD: 4500, change24h: -0.8 },
          { asset: "USDT", amount: 1500, valueUSD: 1500, change24h: 0 },
          { asset: "XDC", amount: 0.15, valueUSD: 7500, change24h: 2.1 }
        ],
        // XDC network holdings - only XDC and USDT are valid for this network
        xdc: [
          { asset: "XDC", amount: 10000, valueUSD: 1500, change24h: 2.3 },
          { asset: "USDT", amount: 1500, valueUSD: 1500, change24h: 0 },
          { asset: "XRP", amount: 0.1, valueUSD: 5000, change24h: 2.1 }
        ]
      },

      transactions: {
        // Ripple network transactions
        ripple: [
          {
            id: "ripple-txn-1",
            type: "deposit",
            amount: 1000,
            fee: 0.0001,
            asset: "XRP",
            date: "2025-04-15",
            status: "completed",
            address: "rGnBxmHKxymJbCVkeMbR6EF7QiCCBYxcuP",
            chainId: "144",
          },
          {
            id: "ripple-txn-2",
            type: "withdrawal",
            amount: 250,
            fee: 0.0001,
            asset: "XRP",
            date: "2025-04-20",
            status: "completed",
            address: "rNvFCZXpDtGeQ3bVas95wGLN6N2stGmA9o",
            chainId: "144",
          },
          {
            id: "ripple-txn-3",
            type: "swap",
            amount: 500,
            fee: 0.1,
            asset: "XRP",
            toAsset: "USDT",
            date: "2025-04-25",
            status: "completed",
            chainId: "144",
          },
          {
            id: "ripple-txn-4",
            type: "deposit",
            amount: 500,
            fee: 0.1,
            asset: "USDT",
            date: "2025-04-28",
            status: "completed",
            address: "rBgGE7Lv5ZvQCdAJgcgP9DUbGJpzRPTSvw",
            chainId: "144",
          },
          {
            id: "ripple-txn-5",
            type: "deposit",
            amount: 2500,
            fee: 0.0002,
            asset: "XRP",
            date: "2025-04-29",
            status: "pending",
            address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            chainId: "144",
          },
          {
            id: "ripple-txn-6",
            type: "withdrawal",
            amount: 100,
            fee: 0.0001,
            asset: "XRP",
            date: "2025-04-30",
            status: "processing",
            address: "rDsbeomae4FXwgQTJp9Rs64Qg9vDiTCdBv",
            chainId: "144",
          },
          {
            id: "ripple-txn-7",
            type: "swap",
            amount: 1000,
            fee: 0.2,
            asset: "XRP",
            toAsset: "USDT",
            date: "2025-04-27",
            status: "completed",
            chainId: "144",
          },
          {
            id: "ripple-txn-8",
            type: "deposit",
            amount: 500,
            fee: 0.0001,
            asset: "USDT",
            date: "2025-04-26",
            status: "completed",
            address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
            chainId: "144",
          },
          {
            id: "ripple-txn-9",
            type: "withdrawal",
            amount: 500,
            fee: 0.1,
            asset: "USDT",
            date: "2025-04-24",
            status: "failed",
            address: "rUkMDzzHyP8buRrCNaWzLXAg1mdnNqjKbN",
            chainId: "144",
            details: "Insufficient funds",
          },
        ],
        // Polygon network transactions
        polygon: [
          {
            id: "polygon-txn-1",
            type: "deposit",
            amount: 2500,
            fee: 0.001,
            asset: "MATIC",
            date: "2025-04-10",
            status: "completed",
            address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            chainId: "137",
          },
          {
            id: "polygon-txn-2",
            type: "swap",
            amount: 500,
            fee: 0.001,
            asset: "MATIC",
            toAsset: "USDT",
            date: "2025-04-18",
            status: "completed",
            chainId: "137",
          },
          {
            id: "polygon-txn-3",
            type: "withdrawal",
            amount: 200,
            fee: 0.001,
            asset: "MATIC",
            date: "2025-04-22",
            status: "completed",
            address: "0x8A6f7834A9d58Ab2b4B19F4A7BDf231c7E7B874c",
            chainId: "137",
          },
          {
            id: "polygon-txn-4",
            type: "deposit",
            amount: 1000,
            fee: 0.001,
            asset: "USDT",
            date: "2025-04-29",
            status: "pending",
            address: "0x9B8f7834A9d58Ab2b4B19F4A7BDf231c7E7B123d",
            chainId: "137",
          },
          {
            id: "polygon-txn-5",
            type: "deposit",
            amount: 1500,
            fee: 0.002,
            asset: "MATIC",
            date: "2025-04-30",
            status: "processing",
            address: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
            chainId: "137",
          },
          {
            id: "polygon-txn-6",
            type: "swap",
            amount: 750,
            fee: 0.002,
            asset: "MATIC",
            toAsset: "USDT",
            date: "2025-04-28",
            status: "completed",
            chainId: "137",
          },
          {
            id: "polygon-txn-7",
            type: "withdrawal",
            amount: 100,
            fee: 0.001,
            asset: "USDT",
            date: "2025-04-27",
            status: "failed",
            address: "0x1f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
            chainId: "137",
            details: "Network congestion",
          },
          {
            id: "polygon-txn-8",
            type: "deposit",
            amount: 500,
            fee: 0.001,
            asset: "USDT",
            date: "2025-04-25",
            status: "completed",
            address: "0x2f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
            chainId: "137",
          },
        ],
        // XDC network transactions
        xdc: [
          {
            id: "xdc-txn-1",
            type: "deposit",
            amount: 5000,
            fee: 0.0001,
            asset: "XDC",
            date: "2025-04-05",
            status: "completed",
            address: "xdc7d5f2f1bc47c4bcfd2480125f1cb5ddaca13c0cd",
            chainId: "50",
          },
          {
            id: "xdc-txn-2",
            type: "withdrawal",
            amount: 1000,
            fee: 0.0001,
            asset: "XDC",
            date: "2025-04-12",
            status: "completed",
            address: "xdcf0a456cba01f57503e5df1f5c1e553d3fa5493b7",
            chainId: "50",
          },
          {
            id: "xdc-txn-3",
            type: "swap",
            amount: 2000,
            fee: 0.05,
            asset: "XDC",
            toAsset: "USDT",
            date: "2025-04-19",
            status: "completed",
            chainId: "50",
          },
          {
            id: "xdc-txn-4",
            type: "deposit",
            amount: 1500,
            fee: 0.01,
            asset: "USDT",
            date: "2025-04-26",
            status: "completed",
            address: "xdce1a456cba01f57503e5df1f5c1e553d3fa5493c8",
            chainId: "50",
          },
          {
            id: "xdc-txn-5",
            type: "deposit",
            amount: 3000,
            fee: 0.0002,
            asset: "XDC",
            date: "2025-04-29",
            status: "pending",
            address: "xdc9d5f2f1bc47c4bcfd2480125f1cb5ddaca13c0ef",
            chainId: "50",
          },
          {
            id: "xdc-txn-6",
            type: "withdrawal",
            amount: 500,
            fee: 0.0001,
            asset: "XDC",
            date: "2025-04-30",
            status: "processing",
            address: "xdcf1a456cba01f57503e5df1f5c1e553d3fa5493d9",
            chainId: "50",
          },
          {
            id: "xdc-txn-7",
            type: "swap",
            amount: 1500,
            fee: 0.03,
            asset: "XDC",
            toAsset: "USDT",
            date: "2025-04-28",
            status: "completed",
            chainId: "50",
          },
          {
            id: "xdc-txn-8",
            type: "deposit",
            amount: 2000,
            fee: 0.0001,
            asset: "USDT",
            date: "2025-04-27",
            status: "completed",
            address: "xdce2a456cba01f57503e5df1f5c1e553d3fa5493f1",
            chainId: "50",
          },
          {
            id: "xdc-txn-9",
            type: "withdrawal",
            amount: 500,
            fee: 0.0001,
            asset: "USDT",
            date: "2025-04-24",
            status: "failed",
            address: "xdce3a456cba01f57503e5df1f5c1e553d3fa5493g2",
            chainId: "50",
            details: "Invalid address format",
          },
        ],
      },

      // Fiat transactions (not network-specific)
      fiatTransactions: [
        {
          id: "fiat-txn-1",
          type: "deposit",
          amount: 10000,
          fee: 0,
          asset: "USD",
          date: "2025-04-01",
          status: "completed",
        },
        {
          id: "fiat-txn-2",
          type: "withdrawal",
          amount: 2500,
          fee: 0,
          asset: "USD",
          date: "2025-04-08",
          status: "completed",
          bankId: "bank-1",
        },
        {
          id: "fiat-txn-3",
          type: "deposit",
          amount: 5000,
          fee: 0,
          asset: "USD",
          date: "2025-04-15",
          status: "completed",
        },
        {
          id: "fiat-txn-4",
          type: "withdrawal",
          amount: 1000,
          fee: 0,
          asset: "USD",
          date: "2025-04-22",
          status: "completed",
          bankId: "bank-1",
        },
        {
          id: "fiat-txn-5",
          type: "deposit",
          amount: 3000,
          fee: 0,
          asset: "EUR",
          date: "2025-04-27",
          status: "pending",
        },
        {
          id: "fiat-txn-6",
          type: "buy",
          amount: 2000,
          fee: 10,
          asset: "USD",
          toAsset: "XRP",
          date: "2025-04-29",
          status: "completed",
        },
        {
          id: "fiat-txn-7",
          type: "sell",
          amount: 500,
          fee: 5,
          asset: "XRP",
          toAsset: "USD",
          date: "2025-04-26",
          status: "completed",
        },
        {
          id: "fiat-txn-8",
          type: "buy",
          amount: 1500,
          fee: 7.5,
          asset: "USD",
          toAsset: "MATIC",
          date: "2025-04-24",
          status: "completed",
        },
        {
          id: "fiat-txn-9",
          type: "buy",
          amount: 3000,
          fee: 15,
          asset: "USD",
          toAsset: "XDC",
          date: "2025-04-20",
          status: "completed",
        },
        {
          id: "fiat-txn-10",
          type: "sell",
          amount: 1000,
          fee: 5,
          asset: "XDC",
          toAsset: "USD",
          date: "2025-04-18",
          status: "completed",
        },
        {
          id: "fiat-txn-11",
          type: "buy",
          amount: 5000,
          fee: 25,
          asset: "USD",
          toAsset: "XDC",
          date: "2025-04-15",
          status: "completed",
        },
        {
          id: "fiat-txn-12",
          type: "withdrawal",
          amount: 1500,
          fee: 0,
          asset: "EUR",
          date: "2025-04-30",
          status: "processing",
          bankId: "bank-1",
        },
        {
          id: "fiat-txn-13",
          type: "deposit",
          amount: 2000,
          fee: 0,
          asset: "GBP",
          date: "2025-04-28",
          status: "pending",
        },
        {
          id: "fiat-txn-14",
          type: "buy",
          amount: 1000,
          fee: 5,
          asset: "GBP",
          toAsset: "XRP",
          date: "2025-04-25",
          status: "failed",
          details: "Payment verification failed",
        },
      ],

      // Actions
      login: async (email, password) => {
        // In a real app, this would make an API call
        set({
          isAuthenticated: true,
          user: {
            id: "user-1",
            name: "John Doe",
            email,
            avatar: "/mystical-forest-spirit.png",
          },
        })
        return true
      },

      logout: () => {
        set({ isAuthenticated: false, user: null })
      },

      deposit: async (amount, asset, bankId, address, chainId, network = "ripple") => {
        const newTransaction: Transaction = {
          id: `txn-${Date.now()}`,
          type: "deposit",
          amount,
          fee: 0,
          asset,
          date: new Date().toISOString().split("T")[0],
          status: "pending",
          bankId,
          address,
          chainId,
        }

        set((state) => {
          // For fiat assets, add to fiatTransactions
          if (asset === "USD" || asset === "EUR" || asset === "GBP") {
            return { 
              fiatTransactions: [newTransaction, ...state.fiatTransactions] 
            }
          }
          
          // For crypto assets, add to network-specific transactions
          const updatedTransactions = { ...state.transactions }
          updatedTransactions[network] = [newTransaction, ...updatedTransactions[network]]
          
          return { transactions: updatedTransactions }
        })

        // In a real app, this would be updated after API confirmation
        setTimeout(() => {
          set((state) => {
            // For fiat assets
            if (asset === "USD" || asset === "EUR" || asset === "GBP") {
              const updatedFiatTransactions = state.fiatTransactions.map((t) =>
                t.id === newTransaction.id ? { ...t, status: "completed" as const } : t
              )
              return { fiatTransactions: updatedFiatTransactions }
            } 
            // For crypto assets
            else {
              const updatedTransactions = { ...state.transactions }
              updatedTransactions[network] = updatedTransactions[network].map((t) =>
                t.id === newTransaction.id ? { ...t, status: "completed" as const } : t
              )
              return { transactions: updatedTransactions }
            }
          })
        }, 2000)

        return newTransaction
      },

      withdraw: async (amount, asset, bankId, note, network = "ripple") => {
        if (!bankId && (asset === "USD" || asset === "EUR" || asset === "GBP")) {
          throw new Error("Bank account is required for fiat withdrawals")
        }

        const newTransaction: Transaction = {
          id: `txn-${Date.now()}`,
          type: "withdrawal",
          amount,
          fee: 0,
          asset,
          date: new Date().toISOString().split("T")[0],
          status: "pending",
          bankId,
          details: note,
        }

        set((state) => {
          // For fiat assets
          if (asset === "USD" || asset === "EUR" || asset === "GBP") {
            // Update fiat balance immediately
            const updatedFiatBalance = { ...state.fiatBalance }
            updatedFiatBalance[asset as Currency] -= amount
            
            return {
              fiatTransactions: [newTransaction, ...state.fiatTransactions],
              fiatBalance: updatedFiatBalance
            }
          } 
          // For crypto assets
          else {
            // Update crypto holdings for the specific network
            const updatedCryptoHoldings = { ...state.cryptoHoldings }
            const networkHoldings = [...updatedCryptoHoldings[network]]
            
            // Find and update the holding
            const updatedNetworkHoldings = networkHoldings.map((holding) =>
              holding.asset === asset
                ? {
                    ...holding,
                    amount: holding.amount - amount,
                    valueUSD: holding.valueUSD - amount * (holding.valueUSD / holding.amount),
                  }
                : holding
            )
            
            updatedCryptoHoldings[network] = updatedNetworkHoldings
            
            // Update transactions for the specific network
            const updatedTransactions = { ...state.transactions }
            updatedTransactions[network] = [newTransaction, ...updatedTransactions[network]]
            
            return {
              transactions: updatedTransactions,
              cryptoHoldings: updatedCryptoHoldings
            }
          }
        })

        // In a real app, this would be updated after API confirmation
        setTimeout(() => {
          set((state) => {
            // For fiat assets
            if (asset === "USD" || asset === "EUR" || asset === "GBP") {
              const updatedFiatTransactions = state.fiatTransactions.map((t) =>
                t.id === newTransaction.id ? { ...t, status: "completed" as const } : t
              )
              return { fiatTransactions: updatedFiatTransactions }
            } 
            // For crypto assets
            else {
              const updatedTransactions = { ...state.transactions }
              updatedTransactions[network] = updatedTransactions[network].map((t) =>
                t.id === newTransaction.id ? { ...t, status: "completed" as const } : t
              )
              return { transactions: updatedTransactions }
            }
          })
        }, 2000)

        return newTransaction
      },

      addBank: async (bank) => {
        const newBank: Bank = {
          ...bank,
          id: `bank-${Date.now()}`,
          isVerified: false,
        }
        set((state) => ({
          banks: [...state.banks, newBank],
        }))
        return newBank
      },

      removeBank: (bankId) => {
        set((state) => {
          const updatedBanks = state.banks.filter((bank) => bank.id !== bankId)
          return { banks: updatedBanks }
        })
        return Promise.resolve(true)
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab })
      },

      setCurrencyTab: (tab) => {
        set({ activeCurrencyTab: tab })
      },

      setActiveNetwork: (network) => {
        set({ activeNetwork: network })
      },
    }),
    {
      name: "ryzer-wallet-storage",
    }
  )
)

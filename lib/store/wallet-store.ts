import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Currency = "USD" | "EUR" | "GBP"
export type CryptoAsset = "BTC" | "ETH" | "USDT" | "USDC"

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
  cryptoHoldings: CryptoHolding[]

  // Banks
  banks: Bank[]

  // Transactions
  transactions: Transaction[]

  // UI State
  activeTab: "portfolio" | "wallet"
  activeCurrencyTab: "fiat" | "crypto"

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  deposit: (
    amount: number,
    asset: Currency | CryptoAsset,
    bankId?: string,
    address?: string,
    chainId?: string
  ) => Promise<Transaction>
  withdraw: (amount: number, asset: Currency | CryptoAsset, bankId?: string, note?: string) => Promise<Transaction>
  addBank: (bank: Omit<Bank, "id" | "isVerified">) => Promise<Bank>
  removeBank: (bankId: string) => Promise<boolean>
  setActiveTab: (tab: "portfolio" | "wallet") => void
  setCurrencyTab: (tab: "fiat" | "crypto") => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: true, // Default to true for demo purposes
      user: {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        avatar: "/mystical-forest-spirit.png",
      },

      fiatBalance: {
        USD: 24578.93,
        EUR: 0,
        GBP: 0,
      },

      cryptoHoldings: [
        { asset: "BTC", amount: 1.24, valueUSD: 44235.67, change24h: 3.5 },
        { asset: "ETH", amount: 15.8, valueUSD: 31600, change24h: -1.2 },
        { asset: "USDT", amount: 5000, valueUSD: 5000, change24h: 0 },
        { asset: "USDC", amount: 2500, valueUSD: 2500, change24h: 0 },
      ],

      banks: [
        { id: "bank-1", name: "Bank of America", accountNumber: "****4567", isVerified: true },
        { id: "bank-2", name: "Chase", accountNumber: "****8901", isVerified: true },
      ],

      transactions: [
        {
          id: "txn-1",
          type: "deposit",
          amount: 5000,
          fee: 0,
          asset: "USD",
          date: "2023-04-10",
          status: "completed",
        },
        {
          id: "txn-2",
          type: "withdrawal",
          amount: 0.25,
          fee: 0,
          asset: "BTC",
          date: "2023-04-08",
          status: "completed",
          bankId: "bank-1",
        },
        {
          id: "txn-3",
          type: "deposit",
          amount: 5.0,
          fee: 0,
          asset: "ETH",
          date: "2023-04-05",
          status: "completed",
        },
        {
          id: "txn-4",
          type: "withdrawal",
          amount: 2500,
          fee: 0,
          asset: "USD",
          date: "2023-04-01",
          status: "processing",
          bankId: "bank-2",
        },
        {
          id: "txn-5",
          type: "deposit",
          amount: 10000,
          fee: 0,
          asset: "USDT",
          date: "2023-03-28",
          status: "completed",
        },
      ],

      activeTab: "wallet",
      activeCurrencyTab: "fiat",

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

      deposit: async (amount, asset, bankId, address, chainId) => {
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

        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }))

        // In a real app, this would be updated after API confirmation
        setTimeout(() => {
          set((state) => {
            // Update transaction status
            const updatedTransactions = state.transactions.map((t) =>
              t.id === newTransaction.id ? { ...t, status: "completed" } : t,
            )

            // Update balance
            const updatedFiatBalance = { ...state.fiatBalance }
            let updatedCryptoHoldings = [...state.cryptoHoldings]

            if (asset === "USD" || asset === "EUR" || asset === "GBP") {
              updatedFiatBalance[asset] += amount
            } else {
              const existingHolding = updatedCryptoHoldings.find((h) => h.asset === asset)
              if (existingHolding) {
                updatedCryptoHoldings = updatedCryptoHoldings.map((holding) =>
                  holding.asset === asset
                    ? {
                        ...holding,
                        amount: holding.amount + amount,
                        valueUSD: holding.valueUSD + amount * (holding.valueUSD / holding.amount),
                      }
                    : holding,
                )
              } else {
                // Add new crypto holding
                updatedCryptoHoldings.push({
                  asset: asset as CryptoAsset,
                  amount: amount,
                  valueUSD: amount * 1, // In a real app, this would use current market price
                  change24h: 0,
                })
              }
            }

            return {
              transactions: updatedTransactions,
              fiatBalance: updatedFiatBalance,
              cryptoHoldings: updatedCryptoHoldings,
            }
          })
        }, 2000)

        return newTransaction
      },

      withdraw: async (amount, asset, bankId, note) => {
        if (!bankId) throw new Error("Bank account is required")

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
          // Update balance immediately
          const updatedFiatBalance = { ...state.fiatBalance }
          let updatedCryptoHoldings = [...state.cryptoHoldings]

          if (asset === "USD" || asset === "EUR" || asset === "GBP") {
            updatedFiatBalance[asset] -= amount
          } else {
            updatedCryptoHoldings = updatedCryptoHoldings.map((holding) =>
              holding.asset === asset
                ? {
                    ...holding,
                    amount: holding.amount - amount,
                    valueUSD: holding.valueUSD - amount * (holding.valueUSD / holding.amount),
                  }
                : holding,
            )
          }

          return {
            transactions: [newTransaction, ...state.transactions],
            fiatBalance: updatedFiatBalance,
            cryptoHoldings: updatedCryptoHoldings,
          }
        })

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

      removeBank: async (bankId) => {
        set((state) => ({
          banks: state.banks.filter((bank) => bank.id !== bankId),
        }))

        return true
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setCurrencyTab: (tab) => set({ activeCurrencyTab: tab }),
    }),
    {
      name: "ryzer-wallet-storage",
    },
  ),
)

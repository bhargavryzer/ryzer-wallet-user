"use client"

import Link from "next/link"
import { useState } from "react"
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
import type { Transaction } from "./features/wallet/types"
import { QuickActions } from "./features/wallet/QuickActions"

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    date: "Apr 10, 2023",
    type: "deposit",
    asset: "USD",
    amount: "5,000.00 USD",
    status: "completed"
  },
  {
    date: "Apr 08, 2023",
    type: "withdrawal",
    asset: "BTC",
    amount: "0.25 BTC",
    status: "completed",
    details: "view"
  },
  {
    date: "Apr 08, 2023",
    type: "withdrawal",
    asset: "BTC",
    amount: "0.25 BTC",
    status: "completed",
    details: "view"
  },
  {
    date: "Apr 08, 2023",
    type: "withdrawal",
    asset: "ETH",
    amount: "0.25 ETH",
    status: "completed",
    details: "view"
  },
  {
    date: "Apr 08, 2023",
    type: "withdrawal",
    asset: "POl",
    amount: "0.25 POL",
    status: "completed",
    details: "view"
  },
  // Add more sample transactions...
]

export function WalletDashboard() {
  const router = useRouter()
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isCryptoDepositModalOpen, setIsCryptoDepositModalOpen] = useState(false)
  const [currentBalance, setCurrentBalance] = useState(24578.93)
  const [activeCurrencyTab, setActiveCurrencyTab] = useState("crypto")

  const openWithdrawModal = () => setIsWithdrawModalOpen(true)
  const closeWithdrawModal = () => setIsWithdrawModalOpen(false)
  const openCryptoDepositModal = () => setIsCryptoDepositModalOpen(true)
  const closeCryptoDepositModal = () => setIsCryptoDepositModalOpen(false)

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          Home
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-purple-500">My Wallet</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-4">
            <h2 className="text-xl font-bold">My Wallet</h2>
            <p className="text-sm text-gray-500">Manage your currencies and assets</p>
          </div>

          <Tabs defaultValue="crypto" className="mb-6" onValueChange={(value) => setActiveCurrencyTab(value)}>
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
              />
            </TabsContent>
          </Tabs>

          <TransactionHistory transactions={SAMPLE_TRANSACTIONS.filter(t => t.asset !== 'USD')} />
        </div>

        <div className="space-y-6">
          <QuickActions type="crypto" />
          {activeCurrencyTab === "fiat" && <BankList />}
        </div>
      </div>

      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={closeWithdrawModal} />
      <CryptoDepositModal isOpen={isCryptoDepositModalOpen} onClose={closeCryptoDepositModal} />
    </div>
  )
}

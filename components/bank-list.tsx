"use client"

import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWalletStore } from "@/lib/store/wallet-store"

export function BankList() {
  const { banks } = useWalletStore()

  return (
    <Card className="w-full max-w-md mx-auto bg-white rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Your Banks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {banks.map((bank) => (
          <div
            key={bank.id}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full text-gray-400"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{bank.name}</span>
                <span className="text-sm text-gray-500">{bank.accountNumber}</span>
              </div>
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          className="w-full flex items-center gap-2 justify-start px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
            <Plus className="w-3 h-3 text-blue-600" />
          </div>
          Add New Bank
        </Button>
      </CardContent>
    </Card>
  )
} 
"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

interface WithdrawalSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
}

export function WithdrawalSuccessModal({ isOpen, onClose, amount }: WithdrawalSuccessModalProps) {
  // Generate a random transaction ID
  const transactionId = `TXN-${Array.from({ length: 8 }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36)),
  ).join("")}`

  const handleNewWithdrawal = () => {
    // Close this modal and open a new withdrawal modal
    onClose()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-2">Withdrawal Initiated</h2>
        <p className="text-gray-600 mb-6">
          Your withdrawal of {formatCurrency(amount)} has been initiated and will be processed shortly.
        </p>

        <div className="space-y-4 rounded-md border p-4 text-left mb-6">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-gray-500">Transaction ID</span>
            <span className="font-medium">{transactionId}</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm text-gray-500">Status</span>
            <span className="font-medium text-amber-500">Pending</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-500">Estimated Completion</span>
            <span className="font-medium">1-3 business days</span>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={handleNewWithdrawal}>
            New Withdrawal
          </Button>
          <Button onClick={onClose} className="bg-black text-white hover:bg-gray-800">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, X } from "lucide-react"
import { WithdrawalSuccessModal } from "./withdrawal-success-modal"

interface ReviewWithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  amount: number
  bankName: string
  note?: string
  bankId?: string
}

export function ReviewWithdrawalModal({ isOpen, onClose, onBack, amount, bankName, note, bankId }: ReviewWithdrawalModalProps) {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

  const handleConfirm = () => {
    setIsSuccessModalOpen(true)
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
    <>
      <Dialog open={isOpen && !isSuccessModalOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle>Review Withdrawal</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <p className="text-sm text-gray-500">Please review your withdrawal details before confirming.</p>

          <div className="space-y-4 py-4">
            <div className="space-y-4 rounded-md border p-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-gray-500">To</span>
                <span className="font-medium">{bankName}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm text-gray-500">Fee</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-medium">Total</span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">Bank transfers typically take 1-3 business days to complete.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={handleConfirm} className="bg-black text-white hover:bg-gray-800">
              Confirm Withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isSuccessModalOpen && <WithdrawalSuccessModal isOpen={isSuccessModalOpen} onClose={onClose} amount={amount} />}
    </>
  )
}

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, X, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReviewDepositModal } from "./review-deposit-modal"
import { useWalletStore } from "@/lib/store/wallet-store"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const { banks, fiatBalance } = useWalletStore()
  const [amount, setAmount] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("existing")
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const handleContinue = () => {
    // Validate form before proceeding
    if (activeTab === "existing" && !selectedBank) {
      setError("Please select a bank account")
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    // If validation passes, clear error and proceed to review
    setError(null)
    setIsReviewModalOpen(true)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setError(null)
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
      <Dialog open={isOpen && !isReviewModalOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-green-500">↓</span>
              <DialogTitle>Deposit Funds</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <DialogDescription>Transfer money from your bank account to your wallet.</DialogDescription>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount</Label>
                <span className="text-sm text-gray-500">Current Balance: {formatCurrency(fiatBalance.USD)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deposit from</Label>
              <Tabs defaultValue="existing" className="w-full" onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing">Existing Bank</TabsTrigger>
                  <TabsTrigger value="new">New Bank</TabsTrigger>
                </TabsList>
                <TabsContent value="existing" className="mt-4">
                  <RadioGroup value={selectedBank} onValueChange={setSelectedBank} className="space-y-3">
                    {banks.map((bank) => (
                      <div
                        key={bank.id}
                        className={cn(
                          "flex items-center justify-between rounded-md border p-4",
                          selectedBank === bank.id && "border-blue-500",
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={bank.id} id={bank.id} />
                          <Label htmlFor={bank.id} className="flex flex-col">
                            <span>{bank.name}</span>
                            <span className="text-sm text-gray-500">{bank.accountNumber}</span>
                          </Label>
                        </div>
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                    ))}
                  </RadioGroup>
                </TabsContent>
                <TabsContent value="new" className="mt-4">
                  <div className="rounded-md border p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">
                        To add a new bank account, please complete the verification process.
                      </p>
                    </div>
                  </div>
                  <Button className="w-full bg-black text-white hover:bg-gray-800">Add New Bank Account</Button>
                </TabsContent>
              </Tabs>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for this transaction"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleContinue} className="bg-black text-white hover:bg-gray-800">
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isReviewModalOpen && (
        <ReviewDepositModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false)
            onClose()
          }}
          onBack={() => setIsReviewModalOpen(false)}
          amount={Number.parseFloat(amount)}
          bankName={banks.find((bank) => bank.id === selectedBank)?.name || ""}
          note={note}
          bankId={selectedBank}
        />
      )}
    </>
  )
}

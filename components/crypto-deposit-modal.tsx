"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { X, Info } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWalletStore } from "@/lib/store/wallet-store"
import type { CryptoAsset } from "@/lib/store/wallet-store"

export function CryptoDepositModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    amount: "",
    address: "",
    currency: "ETH" as CryptoAsset,
    chainId: "2"
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const deposit = useWalletStore((state) => state.deposit)
  
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      setError("")
      setIsLoading(true)
      const { amount, address, currency, chainId } = formData
      
      // Quick validation
      if (!amount || !address || parseFloat(amount) <= 0 || address.length < 26) {
        setError(!amount || parseFloat(amount) <= 0 ? "Enter valid amount" : "Enter valid address")
        setIsLoading(false)
        return
      }

      const transaction = await deposit(parseFloat(amount), currency, undefined, address, chainId)
      
      if (transaction.status === "pending" || transaction.status === "completed") {
        setFormData({ amount: "", address: "", currency: "ETH", chainId: "2" })
        onClose()
      } else {
        setError("Failed to process deposit")
      }
    } catch (err) {
      setError("Failed to process deposit")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-4">
        {/* Header with integrated close button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span className="text-green-500 text-lg">↓</span>
            <h3 className="font-semibold text-lg">Deposit Crypto</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Compact Form */}
        <div className="space-y-2">
          {/* Currency and Amount in same row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="currency" className="text-xs">Currency</Label>
              <Select value={formData.currency} onValueChange={(v) => updateField("currency", v as string)}>
                <SelectTrigger id="currency" className="h-8 text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="pol">POL</SelectItem>
                  <SelectItem value="xdc">XDC</SelectItem>
                  <SelectItem value="rpl">RPL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount" className="text-xs">Amount</Label>
              <Input
                id="amount"
                value={formData.amount}
                onChange={(e) => updateField("amount", e.target.value)}
                placeholder="0.00"
                type="number"
                disabled={isLoading}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Address field */}
          <div>
            <Label htmlFor="address" className="text-xs">Wallet Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Enter wallet address"
              disabled={isLoading}
              className="h-8 text-sm"
            />
          </div>

          {/* Network selection */}
          <div>
            <Label htmlFor="chainId" className="text-xs">Network</Label>
            <Select value={formData.chainId} onValueChange={(v) => updateField("chainId", v)}>
              <SelectTrigger id="chainId" className="h-8 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Ethereum</SelectItem>
                <SelectItem value="56">XDC</SelectItem>
                <SelectItem value="137">Polygon</SelectItem>
                <SelectItem value="144">XRPL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warning note */}
          {!error && (
            <div className="bg-blue-50 border border-blue-100 p-1.5 rounded text-xs flex items-start gap-1">
              <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700">Ensure you're using the correct network to avoid loss.</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-100 p-1.5 rounded text-xs flex items-center gap-1">
              <Info className="h-3 w-3 text-red-500" />
              <span className="text-red-600">{error}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="h-8">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            size="sm"
            className="bg-black text-white hover:bg-gray-800 h-8"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Deposit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
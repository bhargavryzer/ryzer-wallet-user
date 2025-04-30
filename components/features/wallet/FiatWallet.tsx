import { ArrowDown, ArrowUp, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface FiatWalletProps {
  currentBalance: number;
  onWithdraw: () => void;
}

export function FiatWallet({ currentBalance, onWithdraw }: FiatWalletProps) {
  return (
    <>
      <Card className="mb-6 border-0 bg-emerald-500 text-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-emerald-100 mb-1">Available Balance</p>
              <h3 className="text-3xl font-semibold flex items-center">
                <span className="text-2xl mr-1">$</span>
                {currentBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-400/20 hover:bg-emerald-400/30 text-white border-0 flex items-center gap-2 px-4 py-2"
              >
                <ArrowDown className="h-4 w-4" />
                Deposit
              </Button>
              <Button
                size="sm"
                className="bg-emerald-400/20 hover:bg-emerald-400/30 text-white border-0 flex items-center gap-2 px-4 py-2"
                onClick={onWithdraw}
              >
                <ArrowUp className="h-4 w-4" />
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-emerald-500" />
                Monthly Income
              </span>
              <span className="text-xl font-bold">$12,450.00</span>
              <span className="text-xs text-gray-500">+2.5% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-red-500" />
                Monthly Expenses
              </span>
              <span className="text-xl font-bold">$8,275.50</span>
              <span className="text-xs text-gray-500">-3.2% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-blue-500" />
                Net Change
              </span>
              <span className="text-xl font-bold text-emerald-500">+$4,174.50</span>
              <span className="text-xs text-gray-500">+2.5% vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 
import { ArrowDown, ArrowUp, ArrowRight, Clock, Filter, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Transaction } from "./types"
import { NETWORK_EXPLORERS } from "@/lib/constants/network-explorers"

// Define Network type locally to avoid import issues
type Network = {
  id: string;
  name: string;
  chainId: string;
  icon: string;
  color: string;
};

interface TransactionHistoryProps {
  transactions: Transaction[]
  activeNetwork?: Network
}

export function TransactionHistory({ transactions, activeNetwork }: TransactionHistoryProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            Transaction History
          </div>
        </CardTitle>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <Filter className="h-3 w-3" />
          All Types
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input placeholder="Search transactions..." className="text-sm" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium text-gray-500">Date</th>
                <th className="pb-2 font-medium text-gray-500">Type</th>
                <th className="pb-2 font-medium text-gray-500">Asset</th>
                <th className="pb-2 font-medium text-gray-500">Amount</th>
                <th className="pb-2 font-medium text-gray-500">Status</th>
                <th className="pb-2 font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{transaction.date}</td>
                  <td className="py-3">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        transaction.type === "deposit"
                          ? "bg-emerald-100 text-emerald-600"
                          : transaction.type === "swap"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="py-3">{transaction.asset}</td>
                  <td className={`py-3 ${
                    transaction.type === "deposit" 
                      ? "text-emerald-500" 
                      : transaction.type === "swap" 
                      ? "text-purple-500" 
                      : "text-red-500"
                  }`}>
                    {transaction.type === "deposit" ? "+" : transaction.type === "swap" ? "⇄" : "-"}
                    {transaction.amount}
                  </td>
                  <td className="py-3">{transaction.status}</td>
                  <td className="py-3">
                    {transaction.details ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 p-0 text-blue-500"
                        onClick={() => {
                          // Make sure details exist
                          if (!transaction.details) return;
                          
                          // Extract transaction ID from details
                          const txId = transaction.details.includes(' - ') 
                            ? transaction.details.split(' - ')[1] 
                            : transaction.details;
                          
                          // Determine the explorer URL based on the network
                          let explorerUrl = '';
                          
                          if (activeNetwork) {
                            // Use the network-specific explorer
                            explorerUrl = NETWORK_EXPLORERS[activeNetwork.id] + txId;
                          } else if (transaction.details.includes('Ripple')) {
                            explorerUrl = NETWORK_EXPLORERS['ripple'] + txId;
                          } else if (transaction.details.includes('Polygon')) {
                            explorerUrl = NETWORK_EXPLORERS['polygon'] + txId;
                          } else if (transaction.details.includes('XDC')) {
                            explorerUrl = NETWORK_EXPLORERS['xdc'] + txId;
                          }
                          
                          // Open the explorer URL in a new tab
                          if (explorerUrl) {
                            window.open(explorerUrl, '_blank');
                          }
                        }}
                      >
                        View <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="text-gray-500">Showing 1-5 of 24 transactions</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
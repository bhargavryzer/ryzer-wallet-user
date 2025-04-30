import { ArrowRight, Clock, CreditCard, Filter } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DepositFundsModal } from "./BuyCryptoModal"

interface QuickActionsProps {
  type: 'fiat' | 'crypto';
}

export function QuickActions({ type }: QuickActionsProps) {
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)

  const handleBuyCrypto = async (walletAddress: string) => {
    try {
      // Here you would implement the actual wallet transfer logic
      console.log('Processing transfer to wallet:', walletAddress)
      // Add your API call or blockchain transaction here
    } catch (error) {
      console.error('Error processing crypto purchase:', error)
      throw error
    }
  }

  return (
    <>
      <Card className="shadow-sm mt-14">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {type === 'crypto' ? (
              <>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M15 5L10 10" stroke="#12B76A" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="truncate">Swap Crypto</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                  onClick={() => setIsBuyModalOpen(true)}
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 5.83333L10 2.5L17.5 5.83333M2.5 5.83333L10 9.16667M2.5 5.83333V14.1667L10 17.5M17.5 5.83333L10 9.16667M17.5 5.83333V14.1667L10 17.5M10 9.16667V17.5" stroke="#2E90FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="truncate">Deposit</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 17.5L10 2.5M10 2.5L5 7.5M10 2.5L15 7.5" stroke="#F04438" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="truncate">Sell Crypto</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 10.8333V15.8333C15 16.2754 14.6421 16.6333 14.2 16.6333H4.8C4.35786 16.6333 4 16.2754 4 15.8333V6.43333C4 5.99119 4.35786 5.63333 4.8 5.63333H9.8M11.6667 3.36667H16.6667M16.6667 3.36667V8.36667M16.6667 3.36667L8.33333 11.7" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="truncate">View on Explorer</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center text-emerald-500">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                  <span className="truncate">Convert to Crypto</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center text-blue-500">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="truncate">Schedule Transfer</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center text-purple-500">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="truncate">Link New Bank</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center text-gray-500">
                    <Filter className="h-5 w-5" />
                  </div>
                  <span className="truncate">View Statements</span>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <DepositFundsModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        depositAddress="0x53ae02C14aa48cd3131F81Dc9fE0C5b923b64Ce"
        onTransactionComplete={async (result) => {
          console.log('Transaction completed:', result);
          await handleBuyCrypto(result.transactionHash);
        }}
      />
    </>
  )
} 
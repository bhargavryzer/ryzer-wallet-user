import { ArrowRight, Clock, CreditCard, Filter, ExternalLink, Repeat, ShoppingCart, TrendingDown } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BuyCryptoModal } from "./BuyCryptoModal"
import { useWalletStore } from "@/lib/store/wallet-store"

interface QuickActionsProps {
  type: 'fiat' | 'crypto';
  activeNetwork?: {
    id: string;
    name: string;
    chainId: string;
    icon: string;
    color: string;
  };
}

export function QuickActions({ type, activeNetwork }: QuickActionsProps) {
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const { deposit } = useWalletStore()

  const handleBuyCrypto = async (transactionHash: string) => {
    try {
      // Use the wallet store to record the deposit
      // Use the appropriate crypto asset based on the active network
      const networkAsset = activeNetwork?.id === 'ripple' ? 'XRP' as const :
                        activeNetwork?.id === 'polygon' ? 'MATIC' as const :
                        activeNetwork?.id === 'xdc' ? 'XDC' as const : 'USDT' as const;
      
      // Create a deposit transaction using the wallet store
      await deposit(
        1.0, // Example amount
        networkAsset,
        undefined, // bankId
        "0x53ae02C14aa48cd3131F81Dc9fE0C5b923b64Ce", // Example address
        activeNetwork?.chainId // chainId
      );
      
      console.log('Processed crypto purchase on', activeNetwork?.name, 'network, tx:', transactionHash);
    } catch (error) {
      console.error('Error processing crypto purchase:', error);
      throw error;
    }
  }

  // Get explorer URL based on active network
  const getExplorerUrl = () => {
    if (!activeNetwork) return "https://xrpscan.com";
    
    switch(activeNetwork.id) {
      case 'ripple':
        return "https://xrpscan.com";
      case 'polygon':
        return "https://polygonscan.com";
      case 'xdc':
        return "https://explorer.xinfin.network";
      default:
        return "https://xrpscan.com";
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
                  <div className="w-5 h-5 mr-3 flex items-center justify-center text-emerald-500">
                    <Repeat className="h-4 w-4" />
                  </div>
                  <span className="truncate">Swap Crypto</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                  onClick={() => setIsBuyModalOpen(true)}
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center text-blue-500">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <span className="truncate">Buy {activeNetwork ? activeNetwork.id === 'ripple' ? 'XRP' : activeNetwork.id === 'polygon' ? 'MATIC' : 'XDC' : 'Crypto'}</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center text-red-500">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <span className="truncate">Sell {activeNetwork ? activeNetwork.id === 'ripple' ? 'XRP' : activeNetwork.id === 'polygon' ? 'MATIC' : 'XDC' : 'Crypto'}</span>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
                  onClick={() => window.open(getExplorerUrl(), '_blank')}
                >
                  <div className="w-5 h-5 mr-3 flex items-center justify-center text-gray-500">
                    <ExternalLink className="h-4 w-4" />
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

      <BuyCryptoModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        defaultCrypto={activeNetwork?.id === 'ripple' ? 'XRP' : activeNetwork?.id === 'polygon' ? 'MATIC' : 'XDC'}
        onTransactionComplete={async (result: { transactionHash: string; status: string; receipt: any }) => {
          console.log('Transaction completed:', result);
          await handleBuyCrypto(result.transactionHash);
        }}
      />
    </>
  )
}
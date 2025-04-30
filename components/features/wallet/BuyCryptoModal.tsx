import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ethers } from 'ethers'
import { Check, Copy, AlertCircle, ArrowRight, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useWalletStore, type CryptoAsset } from "@/lib/store/wallet-store"
import { SUPPORTED_CRYPTOCURRENCIES } from "@/lib/services/crypto-service"

// Extend Window interface to include ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Interface for transaction parameters
interface TransactionParams {
  toAddress: string;
  amount: string; // Amount in ETH or token units
  chainId?: number; // Optional chain ID for network verification
  tokenAddress?: string; // For ERC20 tokens
}

// Interface for transaction result
interface TransactionResult {
  transactionHash: string;
  status: string;
  receipt: any; // Using any for now since TransactionReceipt type varies between ethers versions
}

// Supported Ethereum networks (mainnet, sepolia, etc.)
const SUPPORTED_CHAINS: { [key: number]: string } = {
  1: 'Mainnet',
  11155111: 'Sepolia',
  137: 'Polygon',
  80001: 'Polygon Mumbai',
};

// Minimal ERC20 ABI for transfer function
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)"
];

/**
 * Sends an Ethereum transaction via MetaMask
 * @param params Transaction parameters (toAddress, amount, optional chainId)
 * @returns Transaction result with hash, status, and receipt
 * @throws Error if MetaMask is not installed, invalid inputs, or transaction fails
 */
async function sendETHTransaction(params: TransactionParams): Promise<TransactionResult> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to proceed.');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();

    const amountInWei = ethers.utils.parseEther(params.amount);
    const balance = await provider.getBalance(signerAddress);
    if (balance.lt(amountInWei)) {
      throw new Error('Insufficient balance for this transaction');
    }

    const feeData = await provider.getFeeData();
    const gasLimit = ethers.BigNumber.from(21000);
    const gasPrice = feeData.gasPrice || ethers.BigNumber.from(0);
    const gasCost = gasPrice.mul(gasLimit);
    if (balance.lt(amountInWei.add(gasCost))) {
      throw new Error('Insufficient balance to cover gas fees');
    }

    const tx = {
      to: params.toAddress,
      value: amountInWei,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
    };

    const txResponse = await signer.sendTransaction(tx);
    console.log('Transaction sent:', txResponse.hash);
    const receipt = await txResponse.wait();
    if (!receipt) {
      throw new Error('Transaction was not mined');
    }

    const status = receipt.status === 1 ? 'success' : 'failed';
    if (status === 'failed') {
      throw new Error('Transaction failed during execution');
    }

    console.log('Transaction successful:', receipt);
    return {
      transactionHash: txResponse.hash,
      status: status,
      receipt: receipt,
    };
  } catch (error: any) {
    console.error('Transaction failed:', error.message || error);
    throw new Error(error.message || 'Transaction failed. Please try again');
  }
}

/**
 * Sends an ERC20 token transaction via MetaMask
 * @param params Transaction parameters (tokenAddress, toAddress, amount, optional chainId)
 * @returns Transaction result with hash, status, and receipt
 * @throws Error if MetaMask is not installed, invalid inputs, or transaction fails
 */
async function sendERC20Transaction(params: TransactionParams): Promise<TransactionResult> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to proceed.');
    }

    if (!params.tokenAddress) {
      throw new Error('Token address is required for ERC20 transactions');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const signer = provider.getSigner();

    const tokenContract = new ethers.Contract(params.tokenAddress, ERC20_ABI, signer);
    const decimals = 18; // Note: Ideally, fetch this dynamically
    const amountInUnits = ethers.utils.parseUnits(params.amount, decimals);

    const txResponse = await tokenContract.transfer(params.toAddress, amountInUnits);
    console.log('Transaction sent:', txResponse.hash);
    const receipt = await txResponse.wait();
    if (!receipt) {
      throw new Error('Transaction was not mined');
    }

    const status = receipt.status === 1 ? 'success' : 'failed';
    if (status === 'failed') {
      throw new Error('Transaction failed during execution');
    }

    console.log('Transaction successful:', receipt);
    return {
      transactionHash: txResponse.hash,
      status: status,
      receipt: receipt,
    };
  } catch (error: any) {
    console.error('Transaction failed:', error.message || error);
    throw new Error(error.message || 'Transaction failed. Please try again');
  }
}

interface BuyCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCrypto?: CryptoAsset;
  onTransactionComplete?: (result: TransactionResult) => Promise<void>;
}

export function BuyCryptoModal({ isOpen, onClose, defaultCrypto = 'XDC', onTransactionComplete }: BuyCryptoModalProps) {
  const { activeNetwork, walletAddresses } = useWalletStore();
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset>(defaultCrypto as CryptoAsset);
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [estimatedFees, setEstimatedFees] = useState<string>('0.001');
  const [exchangeRate, setExchangeRate] = useState<number>(0.35); // Mock exchange rate for XDC
  
  // Get deposit address for the current network
  const depositAddress = walletAddresses[activeNetwork] || '';
  
  // Define which cryptocurrencies are supported on each network
  const networkCryptoMap = {
    'ripple': ['XRP', 'USDT', 'XDC'],
    'polygon': ['MATIC', 'USDT', 'XDC'],
    'xdc': ['XDC', 'USDT', 'XRP']
  };
  
  // Network display names mapping
  const networkDisplayNames = {
    'ripple': 'Ripple',
    'polygon': 'Polygon',
    'xdc': 'XDC Network'
  };
  
  // Get supported cryptocurrencies for the current network
  const networkCryptos = Object.entries(SUPPORTED_CRYPTOCURRENCIES)
    .filter(([_, crypto]) => networkCryptoMap[activeNetwork]?.includes(crypto.symbol))
    .map(([_, crypto]) => crypto);
  
  // Update exchange rate when selected crypto changes
  useEffect(() => {
    // In a real implementation, this would fetch the current exchange rate from an API
    const rates: Record<string, number> = {
      'XDC': 0.35,
      'XRP': 0.52,
      'MATIC': 0.58,
      'USDT': 1.0
    };
    setExchangeRate(rates[selectedCrypto] || 0.5);
  }, [selectedCrypto]);
  
  // Get crypto info
  const getCryptoInfo = (symbol: CryptoAsset) => {
    // Convert CryptoAsset to lowercase to match SUPPORTED_CRYPTOCURRENCIES keys
    const key = symbol.toLowerCase() as keyof typeof SUPPORTED_CRYPTOCURRENCIES;
    return SUPPORTED_CRYPTOCURRENCIES[key] || {
      name: symbol,
      symbol,
      color: 'bg-gray-500'
    };
  };
  
  const cryptoInfo = getCryptoInfo(selectedCrypto);
  
  // Calculate USD value based on amount and exchange rate
  const calculateUsdValue = (cryptoAmount: string): string => {
    if (!cryptoAmount) return '0.00';
    const value = parseFloat(cryptoAmount) * exchangeRate;
    return value.toFixed(2);
  };

  // Handle form validation and proceed to review
  const handleContinue = () => {
    // Validate form
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // If validation passes, proceed to review
    setError(null);
    setIsReviewMode(true);
  };

  // Handle final submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call an API to process the payment
      const mockResult: TransactionResult = {
        transactionHash: '0x' + Math.random().toString(16).substring(2, 42),
        status: 'success',
        receipt: {
          blockNumber: 12345678,
          confirmations: 1,
          status: 1
        }
      };
      
      if (onTransactionComplete) {
        await onTransactionComplete(mockResult);
      }
      
      setAmount('');
      setNote('');
      setIsReviewMode(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transaction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded-full ${cryptoInfo.color} flex items-center justify-center text-white`}>
              {cryptoInfo.symbol.substring(0, 1)}
            </div>
            <DialogTitle>Buy {cryptoInfo.name}</DialogTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <DialogDescription>
          Purchase {cryptoInfo.name} ({cryptoInfo.symbol}) quickly and securely.
        </DialogDescription>

        {!isReviewMode ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Cryptocurrency</Label>
              <Select
                value={selectedCrypto}
                onValueChange={(value) => setSelectedCrypto(value as CryptoAsset)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Crypto" />
                </SelectTrigger>
                <SelectContent>
                  {networkCryptos.map((crypto) => (
                    <SelectItem key={crypto.symbol} value={crypto.symbol}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${crypto.color}`}></div>
                        <span>{crypto.name} ({crypto.symbol})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount</Label>
                <span className="text-sm text-gray-500">1 {selectedCrypto} ≈ ${exchangeRate}</span>
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {selectedCrypto}
                </span>
              </div>
              <p className="text-sm text-gray-500 text-right">
                ≈ ${calculateUsdValue(amount)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Deposit Address</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-transparent"
                        onClick={() => {
                          navigator.clipboard.writeText(depositAddress);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? 'Copied!' : 'Copy address'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm font-mono break-all">{depositAddress}</p>
              </div>
              <div className="flex items-center gap-1 text-amber-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>Only send {selectedCrypto} to this address on the {networkDisplayNames[activeNetwork]} network</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for this transaction"
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Network Fee</span>
                <span className="font-medium">{estimatedFees} {selectedCrypto}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-600">Estimated Total</span>
                <span className="font-medium">
                  {amount ? (parseFloat(amount) + parseFloat(estimatedFees)).toFixed(6) : '0.00'} {selectedCrypto}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
              <h3 className="font-medium text-blue-800 mb-2">Transaction Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{amount} {selectedCrypto}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Value:</span>
                  <span className="font-medium">${calculateUsdValue(amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Fee:</span>
                  <span className="font-medium">{estimatedFees} {selectedCrypto}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{(parseFloat(amount) + parseFloat(estimatedFees)).toFixed(6)} {selectedCrypto}</span>
                </div>
                {note && (
                  <div className="pt-2 border-t border-blue-100 mt-2">
                    <span className="text-gray-600">Note:</span>
                    <p className="mt-1">{note}</p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <div className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          {isReviewMode ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsReviewMode(false)}
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="bg-black text-white hover:bg-gray-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Confirm Purchase'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleContinue} 
                className="bg-black text-white hover:bg-gray-800"
                disabled={!amount.trim() || parseFloat(amount) <= 0}
              >
                Continue
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
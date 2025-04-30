import { useState } from "react"
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

interface DepositFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositAddress: string;
  onTransactionComplete: (result: TransactionResult) => Promise<void>;
  chainId?: number;
}

export function DepositFundsModal({ isOpen, onClose, depositAddress, onTransactionComplete, chainId }: DepositFundsModalProps) {
  const [depositType, setDepositType] = useState<'ETH' | 'ERC20'>('ETH');
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositType === 'ETH' && !amount.trim()) return;
    if (depositType === 'ERC20' && (!tokenAddress.trim() || !amount.trim())) return;

    setIsLoading(true);
    setError(null);
    try {
      let result: TransactionResult;
      if (depositType === 'ETH') {
        result = await sendETHTransaction({ toAddress: depositAddress, amount, chainId });
      } else {
        result = await sendERC20Transaction({ tokenAddress, toAddress: depositAddress, amount, chainId });
      }
      await onTransactionComplete(result);
      setTokenAddress("");
      setAmount("");
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transaction failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">Deposit Funds</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            Choose the type of deposit and enter the required details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex space-x-2 border-b">
            <button
              type="button"
              className={`px-4 py-2 font-medium ${depositType === 'ETH' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}
              onClick={() => setDepositType('ETH')}
            >
              ETH
            </button>
            <button
              type="button"
              className={`px-4 py-2 font-medium ${depositType === 'ERC20' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}
              onClick={() => setDepositType('ERC20')}
            >
              ERC20 Token
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {depositType === 'ERC20' && (
              <div className="space-y-2">
                <Label htmlFor="tokenAddress" className="text-sm font-medium text-gray-700">
                  Token Contract Address
                </Label>
                <Input
                  id="tokenAddress"
                  placeholder="0x..."
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500"
                  required={depositType === 'ERC20'}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Deposit Address</Label>
              <Input
                value={depositAddress}
                disabled
                className="w-full bg-gray-100 border-gray-300 rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                {depositType === 'ETH' ? 'Amount (ETH)' : 'Token Amount'}
              </Label>
              <Input
                id="amount"
                type="text"
                placeholder={depositType === 'ETH' ? '0.1' : '100'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter className="flex justify-between mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-1/2 mr-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-1/2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={isLoading || (depositType === 'ETH' && !amount.trim()) || (depositType === 'ERC20' && (!tokenAddress.trim() || !amount.trim()))}
              >
                {isLoading ? "Processing..." : "Deposit Now"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
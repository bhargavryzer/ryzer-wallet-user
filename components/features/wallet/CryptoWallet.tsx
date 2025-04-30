"use client"

import { Plus, ArrowUp } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCryptoPrices, SUPPORTED_CRYPTOCURRENCIES, type CryptoPrice, type WalletBalances } from "@/lib/services/crypto-service"

interface CryptoWalletProps {
  onDeposit: () => void;
  onWithdraw: () => void;
}

// Simulated wallet balances - in a real app, these would come from your backend
const WALLET_BALANCES: WalletBalances = {
  'xdc': 100,
  'usdt': 5000,
  'xrp': 2500
};

export function CryptoWallet({ onDeposit, onWithdraw }: CryptoWalletProps) {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const prices = await getCryptoPrices();
        console.log('Received prices:', prices);
        setCryptoPrices(prices);
      } catch (err) {
        console.error('Error in fetchPrices:', err);
        setError('Failed to fetch cryptocurrency prices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    // Refresh prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate total balance in XRP
  const calculateTotalInXRP = () => {
    // Get XRP price in USD
    const xrpPrice = cryptoPrices.find(p => p.symbol === 'XRP')?.rate || 0;
    console.log('XRP price:', xrpPrice);
    if (xrpPrice === 0) return 0;

    // Calculate total USD value first
    const totalUSD = Object.entries(WALLET_BALANCES).reduce((total, [key, balance]) => {
      const priceData = cryptoPrices.find(p => p.id === key);
      return total + (priceData ? balance * priceData.rate : 0);
    }, 0);

    // Convert total USD to XRP
    return totalUSD / xrpPrice;
  };

  const totalBalanceXRP = calculateTotalInXRP();
  const xrpPrice = cryptoPrices.find(p => p.symbol === 'XRP')?.rate || 0;
  const totalBalanceUSD = totalBalanceXRP * xrpPrice;

  // Create an array of all cryptocurrencies to display
  const cryptoList = Object.entries(SUPPORTED_CRYPTOCURRENCIES).map(([key, info]) => {
    const priceData = cryptoPrices.find(p => p.symbol === info.symbol);
    return {
      key,
      info,
      balance: WALLET_BALANCES[key as keyof WalletBalances],
      price: priceData?.rate || 0,
      change: priceData?.delta.day || 0,
      image: priceData?.png64
    };
  });

  if (error) {
    return (
      <Card className="mb-6 border-0 bg-red-100 text-red-800">
        <CardContent className="p-6">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-6 border-0 bg-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-100 mb-1">Overview Balance</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                  {cryptoList.find(c => c.info.symbol === 'XRP')?.image && (
                    <Image
                      src={cryptoList.find(c => c.info.symbol === 'XRP')?.image || ''}
                      alt="XRP"
                      width={16}
                      height={16}
                      className="object-contain"
                      priority
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-3xl font-semibold">
                    {totalBalanceXRP.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP
                  </h3>
                  <p className="text-sm text-blue-200">
                    ≈ ${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-blue-500/20 hover:bg-blue-500/30 text-white border-0 flex items-center gap-2 px-4 py-2"
                onClick={onDeposit}
              >
                <Plus className="h-4 w-4" />
                Deposit
              </Button>
              <Button
                size="sm"
                className="bg-blue-500/20 hover:bg-blue-500/30 text-white border-0 flex items-center gap-2 px-4 py-2"
                onClick={onWithdraw}
              >
                <ArrowUp className="h-4 w-4" />
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {isLoading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-5 rounded-full bg-gray-200" />
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                  </div>
                  <div className="h-6 w-32 bg-gray-200 rounded mb-2" />
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                    <div className="h-4 w-12 bg-gray-200 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          cryptoList.map(({ key, info, balance, price, change, image }) => (
            <CryptoCard
              key={key}
              name={info.name}
              symbol={info.symbol}
              amount={balance?.toString()}
              currency={info.symbol}
              value={balance * price}
              change={change * 100}
              bgColor={info.color}
              imageUrl={image || ''}
            />
          ))
        )}
      </div>
    </>
  )
}

interface CryptoCardProps {
  name: string
  symbol: string
  amount: string
  currency: string
  value: number
  change: number
  bgColor: string
  imageUrl: string
}

function CryptoCard({ name, symbol, amount, currency, value, change, bgColor, imageUrl }: CryptoCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-5 w-5 rounded-full ${bgColor} flex items-center justify-center`}>
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={symbol}
                width={16}
                height={16}
                className="object-contain"
              />
            )}
          </div>
          <span className="text-sm font-medium">{name}</span>
        </div>
        <div className="text-xl font-bold">{parseFloat(amount || '0').toFixed(2)} {currency}</div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className={`text-xs ${change === 0 ? 'text-gray-500' : change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
} 
"use client"

import { Plus, ArrowUp, Copy, Check, ExternalLink } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import { getCryptoPrices, SUPPORTED_CRYPTOCURRENCIES, type CryptoPrice } from "@/lib/services/crypto-service"
import { useWalletStore, type CryptoHolding, type CryptoAsset } from "@/lib/store/wallet-store"
import { NETWORK_ASSETS } from "@/lib/constants/network-assets"

interface CryptoWalletProps {
  onDeposit?: () => void;
  onWithdraw?: () => void;
  activeNetwork: {
    id: string;
    name: string;
    chainId: string;
    icon: string;
    color: string;
  };
  networkHoldings?: CryptoHolding[];
}

// Network assets are now imported from the shared constants file

export function CryptoWallet({ onDeposit, onWithdraw, activeNetwork, networkHoldings }: CryptoWalletProps) {
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get wallet state from the store if networkHoldings is not provided
  const { cryptoHoldings, walletAddresses } = useWalletStore();
  
  // State for copy button
  const [copied, setCopied] = useState(false);
  
  // Debug the wallet store state
  useEffect(() => {
    console.log('CryptoWallet - Active Network:', activeNetwork);
    console.log('CryptoWallet - Network Holdings prop:', networkHoldings);
    console.log('CryptoWallet - All Crypto Holdings from store:', cryptoHoldings);
  }, [activeNetwork, networkHoldings, cryptoHoldings]);

  // Use provided networkHoldings or filter from store
  const filteredHoldings = useMemo(() => {
    // If networkHoldings is provided, use it directly
    if (networkHoldings && networkHoldings.length > 0) {
      console.log(`Network holdings for ${activeNetwork.id}:`, networkHoldings);
      return networkHoldings;
    }
    
    // Otherwise get network-specific holdings from the store
    const networkType = activeNetwork.id as 'ripple' | 'polygon' | 'xdc';
    console.log(`Getting holdings for ${networkType} from store:`, cryptoHoldings[networkType]);
    
    // Get the supported assets for this network
    const supportedAssets = NETWORK_ASSETS[networkType] || [];
    console.log(`Supported assets for ${networkType}:`, supportedAssets);
    
    // If we have holdings, filter them to only include supported assets for this network
    if (cryptoHoldings[networkType] && cryptoHoldings[networkType].length > 0) {
      const holdings = cryptoHoldings[networkType];
      console.log(`Filtering holdings for ${networkType} to include only supported assets:`, supportedAssets);
      
      // Return only holdings that are supported on this network
      return holdings.filter(holding => supportedAssets.includes(holding.asset));
    }
    
    // If we still don't have holdings, create default ones based on network assets
    console.log(`No holdings found for ${networkType}, creating default ones`);
    return supportedAssets.map(asset => ({
      asset: asset as CryptoAsset,
      amount: 0,
      valueUSD: 0,
      change24h: 0
    }));
  }, [cryptoHoldings, activeNetwork.id, networkHoldings]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const prices = await getCryptoPrices();
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

  // Calculate total balance in USD
  const totalBalanceUSD = useMemo(() => {
    return filteredHoldings.reduce((total: number, holding: CryptoHolding) => total + holding.valueUSD, 0);
  }, [filteredHoldings]);

  // Get primary network asset (for display purposes)
  const primaryAsset = useMemo(() => {
    const networkAssets = NETWORK_ASSETS[activeNetwork.id] || [];
    // Use the first asset in the array (usually the network's native token)
    const primaryAssetSymbol = networkAssets[0] || 'BTC';
    console.log(`Looking for primary asset ${primaryAssetSymbol} in`, filteredHoldings);
    
    // First try to find the network's native token
    const nativeAsset = filteredHoldings.find((h: CryptoHolding) => h.asset === primaryAssetSymbol);
    if (nativeAsset) return nativeAsset;
    
    // If not found, return the first holding or create a default one
    if (filteredHoldings.length > 0) return filteredHoldings[0];
    
    // If no holdings at all, return a default holding for display purposes
    return {
      asset: primaryAssetSymbol as CryptoAsset,
      amount: 0,
      valueUSD: 0,
      change24h: 0
    };
  }, [filteredHoldings, activeNetwork.id]);

  // Create an array of all cryptocurrencies to display
  const cryptoCards = useMemo(() => {
    console.log('CryptoWallet - Filtered Holdings:', filteredHoldings);
    
    // If no filtered holdings, create default cards based on network assets
    if (!filteredHoldings || filteredHoldings.length === 0) {
      const networkAssets = NETWORK_ASSETS[activeNetwork.id] || [];
      console.log(`No holdings found, creating default cards for ${networkAssets.join(', ')}`);
      
      return networkAssets.map(asset => {
        const assetSymbol = asset as CryptoAsset;
        const priceData = cryptoPrices.find(p => p.symbol === assetSymbol);
        const assetInfo = Object.values(SUPPORTED_CRYPTOCURRENCIES).find(c => c.symbol === assetSymbol) || {
          name: assetSymbol,
          symbol: assetSymbol,
          color: 'bg-gray-500'
        };
        
        console.log(`Creating default card for ${assetSymbol}:`, assetInfo);
        
        return {
          name: assetInfo.name,
          symbol: assetSymbol,
          amount: '0',
          currency: assetSymbol,
          value: 0,
          change: 0,
          bgColor: assetInfo.color,
          imageUrl: priceData?.png64 || ''
        };
      });
    }
    
    // Map existing holdings to cards
    return filteredHoldings.map((holding: CryptoHolding) => {
      const priceData = cryptoPrices.find(p => p.symbol === holding.asset);
      const assetInfo = Object.values(SUPPORTED_CRYPTOCURRENCIES).find(c => c.symbol === holding.asset) || {
        name: holding.asset,
        symbol: holding.asset,
        color: 'bg-gray-500'
      };

      console.log(`Creating card for ${holding.asset} with amount ${holding.amount}:`, holding);

      return {
        name: assetInfo.name,
        symbol: holding.asset,
        amount: holding.amount.toString(),
        currency: holding.asset,
        value: holding.valueUSD,
        change: holding.change24h,
        bgColor: assetInfo.color,
        imageUrl: priceData?.png64 || ''
      };
    });
  }, [filteredHoldings, cryptoPrices, activeNetwork.id]);

  if (error) {
    return (
      <Card className="mb-6 border-0 bg-red-100 text-red-800">
        <CardContent className="p-6">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Get network-specific styling
  const networkStyles = {
    'ripple': { bgColor: 'bg-blue-600', symbol: 'XRP', icon: '🌊' },
    'polygon': { bgColor: 'bg-purple-600', symbol: 'MATIC', icon: '⬡' },
    'xdc': { bgColor: 'bg-blue-700', symbol: 'XDC', icon: '✖' },
  };
  
  const networkStyle = networkStyles[activeNetwork.id as keyof typeof networkStyles] || 
    { bgColor: 'bg-blue-600', symbol: 'CRYPTO', icon: '💰' };
  
  const cardBgColor = networkStyle.bgColor;

  return (
    <>
      <Card className={`mb-6 border-0 ${cardBgColor} text-white`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-blue-100 mb-1">Overview Balance ({activeNetwork.name})</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-lg">
                  <span>{networkStyle.icon || activeNetwork.icon}</span>
                </div>
                <div>
                  <h3 className="text-3xl font-semibold">
                    {primaryAsset ? (
                      <>
                        <span className="flex items-center gap-1">
                          <span>{Number(primaryAsset.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</span>
                          <span className="text-white/80 font-medium">{primaryAsset.asset}</span>
                        </span>
                      </>
                    ) : (
                      <span>0.00 {networkStyle.symbol}</span>
                    )}
                  </h3>
                  <p className="text-sm text-blue-200">
                    ≈ ${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <p className="text-xs text-blue-100">Wallet Address:</p>
                    <div className="flex items-center gap-1">
                      <p className="text-xs text-white/80 font-mono">
                        {walletAddresses[activeNetwork.id as 'ripple' | 'polygon' | 'xdc']?.substring(0, 8)}...
                        {walletAddresses[activeNetwork.id as 'ripple' | 'polygon' | 'xdc']?.substring(walletAddresses[activeNetwork.id as 'ripple' | 'polygon' | 'xdc'].length - 6)}
                      </p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 p-0 text-blue-100 hover:text-white hover:bg-transparent"
                              onClick={() => {
                                navigator.clipboard.writeText(walletAddresses[activeNetwork.id as 'ripple' | 'polygon' | 'xdc']);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                            >
                              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{copied ? 'Copied!' : 'Copy address'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 flex items-center gap-2 px-4 py-2"
                onClick={onDeposit}
              >
                <Plus className="h-4 w-4" />
                Deposit
              </Button>
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0 flex items-center gap-2 px-4 py-2"
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
        ) : cryptoCards.length > 0 ? (
          cryptoCards.map((cardProps: CryptoCardProps) => (
            <CryptoCard
              key={cardProps.symbol}
              {...cardProps}
            />
          ))
        ) : (
          <Card className="md:col-span-3 p-6 text-center">
            <p className="text-gray-500">No assets found for {activeNetwork.name} network.</p>
          </Card>
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
        <div className="text-xl font-bold flex items-center gap-1">
          <span>{parseFloat(amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          <span className="text-gray-600 font-medium">{currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          <span className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

export async function getCryptoPrices(cryptoIds: string[]): Promise<CryptoPrice[]> {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&ids=${cryptoIds.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return [];
  }
}

export const SUPPORTED_CRYPTOCURRENCIES = {
  polygon: {
    id: 'matic-network',
    symbol: 'POL',
    name: 'Polygon',
    color: 'bg-purple-500'
  },
  ethereum: {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    color: 'bg-blue-400'
  },
  tether: {
    id: 'tether',
    symbol: 'USDT',
    name: 'Tether',
    color: 'bg-green-400'
  },
  ripple: {
    id: 'ripple',
    symbol: 'XRP',
    name: 'Ripple',
    color: 'bg-blue-300'
  }
} as const; 
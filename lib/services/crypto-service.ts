const LIVECOINWATCH_API_URL = 'https://api.livecoinwatch.com';
const LIVECOINWATCH_API_KEY = process.env.NEXT_PUBLIC_LIVECOINWATCH_API_KEY;

export interface CryptoPrice {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  age: number;
  color: string;
  png32: string;
  png64: string;
  rate: number;
  volume: number;
  cap: number;
  delta: {
    hour: number;
    day: number;
    week: number;
    month: number;
  };
  circulatingSupply: number;
}

// Define supported cryptocurrencies with their LiveCoinWatch codes
export const SUPPORTED_CRYPTOCURRENCIES = {
  'xdc': {
    code: 'XDC',
    symbol: 'XDC',
    name: 'XDC Network',
    color: 'bg-blue-700'
  },
  'usdt': {
    code: 'USDT',
    symbol: 'USDT',
    name: 'Tether',
    color: 'bg-green-400'
  },
  'xrp': {
    code: 'XRP',
    symbol: 'XRP',
    name: 'Ripple',
    color: 'bg-blue-300'
  }
} as const;

// Create a mapping from LiveCoinWatch codes to our internal keys
const CODE_TO_KEY = Object.entries(SUPPORTED_CRYPTOCURRENCIES).reduce((acc, [key, value]) => {
  acc[value.code] = key;
  return acc;
}, {} as { [key: string]: string });

export async function getCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    const response = await fetch(`${LIVECOINWATCH_API_URL}/coins/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': LIVECOINWATCH_API_KEY || '',
      },
      body: JSON.stringify({
        currency: 'USD',
        sort: 'rank',
        order: 'ascending',
        offset: 0,
        limit: 60,
        meta: true
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch crypto data');
    }

    const data = await response.json();
    console.log("LiveCoinWatch response:", data);
    
    // Filter and transform the data to match our supported cryptocurrencies
    return data
      .filter((coin: any) => 
        Object.values(SUPPORTED_CRYPTOCURRENCIES).some(supported => supported.code === coin.code)
      )
      .map((coin: any) => {
        const key = CODE_TO_KEY[coin.code];
        const supportedCrypto = SUPPORTED_CRYPTOCURRENCIES[key as keyof typeof SUPPORTED_CRYPTOCURRENCIES];
        
        return {
          id: key,
          name: supportedCrypto.name,
          symbol: supportedCrypto.symbol,
          rank: coin.rank,
          age: coin.age,
          color: coin.color,
          png32: coin.png32,
          png64: coin.png64,
          rate: coin.rate,
          volume: coin.volume,
          cap: coin.cap,
          delta: {
            hour: coin.delta.hour - 1,
            day: coin.delta.day - 1,
            week: coin.delta.week - 1,
            month: coin.delta.month - 1
          },
          circulatingSupply: coin.circulatingSupply
        };
      });
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return [];
  }
}

// Type for wallet balances to match our supported cryptocurrencies
export type WalletBalances = {
  [K in keyof typeof SUPPORTED_CRYPTOCURRENCIES]: number;
}; 
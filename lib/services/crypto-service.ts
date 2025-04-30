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
  },
  'matic': {
    code: 'MATIC',
    symbol: 'MATIC',
    name: 'Polygon',
    color: 'bg-purple-500'
  }
} as const;

// Create a mapping from LiveCoinWatch codes to our internal keys
const CODE_TO_KEY = Object.entries(SUPPORTED_CRYPTOCURRENCIES).reduce((acc, [key, value]) => {
  acc[value.code] = key;
  return acc;
}, {} as { [key: string]: string });

// Mock data for when the API call fails
const MOCK_CRYPTO_PRICES: CryptoPrice[] = [
  {
    id: 'xdc',
    name: 'XDC Network',
    symbol: 'XDC',
    rank: 56,
    age: 1825,
    color: '#25b0e8',
    png32: 'https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/32/xdc.png',
    png64: 'https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/xdc.png',
    rate: 0.15,
    volume: 12500000,
    cap: 2100000000,
    delta: {
      hour: 0.023,
      day: 0.015,
      week: 0.045,
      month: 0.12
    },
    circulatingSupply: 14000000000
  },
  {
    id: 'usdt',
    name: 'Tether',
    symbol: 'USDT',
    rank: 3,
    age: 2920,
    color: '#26a17b',
    png32: 'https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/32/usdt.png',
    png64: 'https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/usdt.png',
    rate: 1.0,
    volume: 85000000000,
    cap: 96000000000,
    delta: {
      hour: 0.0001,
      day: 0.0005,
      week: 0.001,
      month: 0.002
    },
    circulatingSupply: 96000000000
  },
  {
    id: 'xrp',
    name: 'Ripple',
    symbol: 'XRP',
    rank: 7,
    age: 3650,
    color: '#23292f',
    png32: 'https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/32/xrp.png',
    png64: 'https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/xrp.png',
    rate: 0.80,
    volume: 3500000000,
    cap: 38000000000,
    delta: {
      hour: 0.015,
      day: 0.025,
      week: 0.05,
      month: 0.08
    },
    circulatingSupply: 47500000000
  },
  {
    id: 'matic',
    name: 'Polygon',
    symbol: 'MATIC',
    rank: 15,
    age: 1460,
    color: '#8247e5',
    png32: 'https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/32/matic.png',
    png64: 'https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/matic.png',
    rate: 0.90,
    volume: 750000000,
    cap: 9000000000,
    delta: {
      hour: -0.01,
      day: 0.03,
      week: -0.02,
      month: 0.15
    },
    circulatingSupply: 10000000000
  }
];

export async function getCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    // Check if API key is available
    if (!LIVECOINWATCH_API_KEY) {
      console.log('LiveCoinWatch API key not found, using mock data');
      return MOCK_CRYPTO_PRICES;
    }
    
    const response = await fetch(`${LIVECOINWATCH_API_URL}/coins/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': LIVECOINWATCH_API_KEY,
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
      console.warn('Failed to fetch crypto data from API, using mock data');
      return MOCK_CRYPTO_PRICES;
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
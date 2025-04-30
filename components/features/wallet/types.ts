export interface Transaction {
  date: string;
  type: 'deposit' | 'withdrawal';
  asset: string;
  amount: string;
  status: 'completed' | 'processing';
  details?: string;
}

export interface CryptoAsset {
  name: string;
  symbol: string;
  amount: string;
  currency: string;
  value: number;
  change: number;
}

export interface WalletStats {
  monthlyIncome: number;
  monthlyExpenses: number;
  netChange: number;
} 
export interface AssetManager {
  id: string
  name: string
  title: string
  role: string
  experience: number
  rating: number
  reviewCount: number
  location: string
  languages: string[]
  specializations: string[]
  performance: {
    overall: number
    communication: number
    propertyManagement: number
    financialReporting: number
    issueResolution: number
  }
  reviews: Array<{
    id: string
    author: string
    rating: number
    comment: string
    date: string
  }>
}

export interface Location {
  city: string
  state: string
  country: string
  address?: string
}

export interface LockInPeriod {
  duration: number
  unit: string // e.g., "months", "years"
}

export interface Tokens {
  owned: number
  total: number
}

export interface InvestmentAsset {
  id: string
  name: string
  type: 'RealEstate' | 'Fund' | 'ETF' | string
  status: string
  location: Location
  invested: number
  currentValue: number
  change: number
  lockInPeriod: LockInPeriod
  tokens: Tokens
  assetManager?: AssetManager
}

// Update the portfolio store state interface
export interface PortfolioState {
  assets: InvestmentAsset[]
  totalInvested: number
  totalValue: number
  totalEarned: number
  totalTokens: number
  totalAssets: number
  averageGrowth: number
} 
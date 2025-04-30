import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AssetType = "RealEstate" | "Fund" | "ETF" | "Stock" | "Bond" | "Crypto"

export type AssetStatus = "Active" | "Pre-Leased" | "Under Construction" | "Holiday Homes"

export type ActivityType =
  | "RentalIncome"
  | "VoteRequired"
  | "NewTenant"
  | "ValuationUpdate"
  | "DividendDistribution"
  | "Dividend"
  | "Market"
  | "Report"
  | "Tenant"
  | "Governance"
  | "Management"

export type InvestmentAsset = {
  id: string
  name: string
  type: AssetType
  status: AssetStatus
  location: {
    city: string
    state: string
    country: string
  }
  invested: number
  currentValue: number
  change: number
  lockInPeriod: {
    duration: number
    unit: "days" | "months" | "years"
  }
  tokens: {
    total: number
    owned: number
  }
  tokenPrice: number
  earnings: number
  roi: number
  details?: {
    propertyType?: string
    builtUpArea?: string
    occupancy?: string
    annualYield?: string
    spvModel?: boolean
    issueType?: string
    votingRights?: boolean
    sharesIssued?: "In-Progress" | "Completed"
  }
  tenants?: {
    name: string
    spacePercentage: number
  }[]
  assetManager?: {
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
    reviews: {
      id: string
      author: string
      rating: number
      comment: string
      date: string
    }[]
  }
  activities: {
    id: string
    type: ActivityType
    title: string
    description: string
    amount?: number
    date: string
    isNew?: boolean
    details?: Record<string, any>
  }[]
  upcomingEvents: {
    id: string
    type: "Meeting" | "Distribution"
    title: string
    date: string
  }[]
  documents?: {
    id: string
    name: string
    type: string
    url: string
    date: string
    verified?: boolean
    verificationDate?: string
  }[]
  additionalInfo: {
    escrowAccount?: {
      name: string
      website?: string
    }
    legalAdvisor?: {
      name: string
      website?: string
    }
    assetManagement?: {
      name: string
      website?: string
    }
    brokerage?: {
      status: boolean
    }
  }
  risks?: {
    id: string
    title: string
    description: string
    severity: "low" | "medium" | "high"
  }[]
  exitOpportunities?: {
    id: string
    title: string
    description: string
    timeline?: string
    expectedReturn?: string
  }[]
}

export type PortfolioState = {
  assets: InvestmentAsset[]
  totalInvested: number
  totalValue: number
  totalEarned: number
  totalTokens: number
  totalAssets: number
  averageGrowth: number

  // Actions
  getAssetById: (id: string) => InvestmentAsset | undefined
  markActivityAsSeen: (assetId: string, activityId: string) => void
  castVote: (assetId: string, activityId: string, vote: boolean) => void
  addAsset: (asset: InvestmentAsset) => void
  updateAssetValue: (assetId: string, newValue: number) => void
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      assets: [
        {
          id: "lakeview-park",
          name: "The Lakeview Park",
          type: "RealEstate",
          status: "Pre-Leased",
          location: {
            city: "Rajamundry",
            state: "Andhra Pradesh",
            country: "India",
          },
          invested: 145000,
          currentValue: 260000,
          change: 15.1,
          lockInPeriod: {
            duration: 12,
            unit: "months",
          },
          tokens: {
            total: 10000,
            owned: 450,
          },
          tokenPrice: 578,
          earnings: 25000,
          roi: 17.24,
          details: {
            propertyType: "Commercial",
            builtUpArea: "25,000 sq.ft",
            occupancy: "95%",
            annualYield: "8.5%",
            spvModel: true,
            issueType: "Equity shares/CCDs",
            votingRights: true,
            sharesIssued: "In-Progress",
          },
          tenants: [
            {
              name: "ABC Technologies",
              spacePercentage: 45,
            },
            {
              name: "XYZ Corporation",
              spacePercentage: 30,
            },
            {
              name: "Others",
              spacePercentage: 25,
            },
          ],
          assetManager: {
            id: "mani-suresh",
            name: "Mani Suresh Narayana",
            title: "Senior Asset Manager",
            role: "Senior",
            experience: 8,
            rating: 4.6,
            reviewCount: 23,
            location: "Hyderabad, India",
            languages: ["Telugu", "Hindi", "English"],
            specializations: [
              "Commercial Real Estate",
              "Rental Properties",
              "Asset Tokenization",
              "Property Valuation",
              "Tenant Management",
            ],
            performance: {
              overall: 4.6,
              communication: 4.8,
              propertyManagement: 4.7,
              financialReporting: 4.5,
              issueResolution: 4.4,
            },
            reviews: [
              {
                id: "review-1",
                author: "Rakesh Kumar",
                rating: 5,
                comment:
                  "Mani has been exceptional in managing our commercial property. His attention to detail and proactive approach has increased our returns significantly.",
                date: "Jun 15, 2024",
              },
              {
                id: "review-2",
                author: "Priya Sharma",
                rating: 4,
                comment:
                  "Great communication and excellent tenant management. Would recommend for any commercial property investment.",
                date: "Jun 22, 2024",
              },
            ],
          },
          activities: [
            {
              id: "activity-1",
              type: "Dividend",
              title: "Quarterly Dividend Distributed",
              description:
                "A quarterly dividend of ₹12 per token (₹5,400 total) has been distributed to all token holders.",
              date: "July 1, 2024",
              isNew: true,
              details: {
                transactionId: "TXN-78945612",
              },
            },
            {
              id: "activity-2",
              type: "Market",
              title: "Token Price Increased",
              description:
                "Token price has increased by 5.2% from ₹550 to ₹578 based on recent market activity and property valuation.",
              date: "June 28, 2024",
              isNew: true,
              details: {
                change: 5.2,
                changeAmount: "₹28",
              },
            },
            {
              id: "activity-3",
              type: "Report",
              title: "Valuation Report Updated",
              description:
                "The quarterly valuation report has been updated, showing an 8.3% increase in property value since the last assessment.",
              date: "June 25, 2024",
              isNew: true,
            },
            {
              id: "activity-4",
              type: "Tenant",
              title: "New Tenant Acceptance",
              description:
                "Global Tech Inc. has been approved as a new tenant for the 3rd floor, signing a 5-year lease agreement with annual escalation of 5%.",
              date: "June 15, 2024",
              isNew: true,
              details: {
                leaseDetails: {
                  term: "5 years",
                  rent: 350000,
                  area: 5000,
                },
              },
            },
            {
              id: "activity-5",
              type: "Governance",
              title: "SPV Directors Updated",
              description:
                "The board of directors for the Special Purpose Vehicle (SPV) has been updated with two new appointments.",
              date: "June 10, 2024",
              isNew: false,
              details: {
                directors: [
                  {
                    name: "Anita Sharma",
                    title: "Financial Director",
                  },
                  {
                    name: "Rajiv Mehta",
                    title: "Operations Director",
                  },
                ],
              },
            },
            {
              id: "activity-6",
              type: "Management",
              title: "Treasury Manager Assigned",
              description:
                "ICICI Treasury Services has been appointed as the official treasury manager for the property's financial operations.",
              date: "June 5, 2024",
              isNew: false,
              details: {
                manager: {
                  name: "ICICI Treasury Services",
                  contractPeriod: "3 years",
                },
              },
            },
          ],
          upcomingEvents: [
            {
              id: "event-1",
              type: "Meeting",
              title: "Annual Investor Meeting",
              date: "Aug 15",
            },
            {
              id: "event-2",
              type: "Distribution",
              title: "Q3 Dividend Distribution",
              date: "Sep 20",
            },
          ],
          documents: [
            {
              id: "doc-1",
              name: "RERA Approval",
              type: "PDF",
              url: "/documents/rera-approval.pdf",
              date: "2022-09-29",
              verified: true,
              verificationDate: "29th Sep 2022",
            },
            {
              id: "doc-2",
              name: "HDMA Approval",
              type: "PDF",
              url: "/documents/hdma-approval.pdf",
              date: "2022-09-29",
              verified: true,
              verificationDate: "29th Sep 2022",
            },
            {
              id: "doc-3",
              name: "Link Documents",
              type: "PDF",
              url: "/documents/link-documents.pdf",
              date: "2022-09-29",
              verified: true,
              verificationDate: "29th Sep 2022",
            },
            {
              id: "doc-4",
              name: "Municipal Taxes",
              type: "PDF",
              url: "/documents/municipal-taxes.pdf",
              date: "2022-09-29",
              verified: true,
              verificationDate: "29th Sep 2022",
            },
          ],
          additionalInfo: {
            escrowAccount: {
              name: "ICICI Bank Pvt.Ltd",
              website: "https://www.icicibank.com",
            },
            legalAdvisor: {
              name: "Ramakrishana Firm",
              website: "https://www.ramakrishanafirm.com",
            },
            assetManagement: {
              name: "XYZ Holdings LLP",
              website: "https://www.xyzholdings.com",
            },
            brokerage: {
              status: false,
            },
          },
          risks: [
            {
              id: "risk-1",
              title: "Rental Yield Risk",
              description:
                "In finance, risk factors are the building blocks of investing that help explain the systematic returns in the market, and the possibility of losing money in investments. Disclosure to the exposures of risk factors and extent of the risks are the best way to evaluate your investment.",
              severity: "medium"
            },
            {
              id: "risk-2",
              title: "Liquidity Risk",
              description:
                "In finance, risk factors are the building blocks of investing that help explain the systematic returns in the market, and the possibility of losing money in investments. Disclosure to the exposures of risk factors and extent of the risks are the best way to evaluate your investment.",
              severity: "high"
            },
            {
              id: "risk-3",
              title: "Project Management Risk",
              description:
                "In finance, risk factors are the building blocks of investing that help explain the systematic returns in the market, and the possibility of losing money in investments. Disclosure to the exposures of risk factors and extent of the risks are the best way to evaluate your investment.",
              severity: "low"
            },
          ],
          exitOpportunities: [
            {
              id: "exit-1",
              title: "Secondary Market Sale",
              description:
                "Sell your tokens on the secondary market to other investors looking to enter the property investment.",
              timeline: "Immediate",
              expectedReturn: "Market value",
            },
            {
              id: "exit-2",
              title: "Property Sale",
              description:
                "Full sale of the property to a third party, with proceeds distributed to token holders proportionally.",
              timeline: "3-5 years",
              expectedReturn: "Estimated 15-20% ROI",
            },
            {
              id: "exit-3",
              title: "REIT Conversion",
              description:
                "Conversion of the property into a Real Estate Investment Trust with potential public listing.",
              timeline: "5+ years",
              expectedReturn: "Estimated 25-30% ROI",
            },
          ],
        },
        {
          id: "tech-growth-fund",
          name: "Tech Growth Fund",
          type: "Fund",
          status: "Under Construction",
          location: {
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
          },
          invested: 10000,
          currentValue: 12400,
          change: 24.0,
          lockInPeriod: {
            duration: 1,
            unit: "years",
          },
          tokens: {
            total: 1000,
            owned: 120,
          },
          tokenPrice: 103.33,
          earnings: 2400,
          roi: 24.0,
          activities: [
            {
              id: "activity-1",
              type: "ValuationUpdate",
              title: "Valuation Update",
              description: "Fund valuation increased by 8.2% based on recent portfolio performance.",
              date: "May 15, 2024",
              isNew: true,
            },
          ],
          upcomingEvents: [
            {
              id: "event-1",
              type: "Meeting",
              title: "Quarterly Investor Call",
              date: "Jul 25",
            },
          ],
          documents: [
            {
              id: "doc-1",
              name: "Fund Prospectus",
              type: "PDF",
              url: "/documents/fund-prospectus.pdf",
              date: "2023-06-10",
            },
          ],
          additionalInfo: {},
        },
        {
          id: "green-energy-etf",
          name: "Green Energy ETF",
          type: "ETF",
          status: "Holiday Homes",
          location: {
            city: "Bangalore",
            state: "Karnataka",
            country: "India",
          },
          invested: 7500,
          currentValue: 8250,
          change: 10.0,
          lockInPeriod: {
            duration: 6,
            unit: "months",
          },
          tokens: {
            total: 500,
            owned: 75,
          },
          tokenPrice: 110,
          earnings: 750,
          roi: 10.0,
          activities: [
            {
              id: "activity-1",
              type: "DividendDistribution",
              title: "Dividend Distribution",
              description: "Quarterly dividend of ₹225 has been credited to your wallet.",
              amount: 225,
              date: "June 5, 2024",
              isNew: true,
            },
          ],
          upcomingEvents: [
            {
              id: "event-1",
              type: "Distribution",
              title: "Q3 Dividend Distribution",
              date: "Sep 5",
            },
          ],
          documents: [
            {
              id: "doc-1",
              name: "ETF Factsheet",
              type: "PDF",
              url: "/documents/etf-factsheet.pdf",
              date: "2024-01-05",
            },
          ],
          additionalInfo: {},
        },
      ],
      totalInvested: 145000,
      totalValue: 260000,
      totalEarned: 25000,
      totalTokens: 450,
      totalAssets: 12,
      averageGrowth: 36.4,

      getAssetById: (id) => {
        return get().assets.find((asset) => asset.id === id)
      },

      markActivityAsSeen: (assetId, activityId) => {
        set((state) => ({
          assets: state.assets.map((asset) => {
            if (asset.id === assetId) {
              return {
                ...asset,
                activities: asset.activities.map((activity) => {
                  if (activity.id === activityId) {
                    return { ...activity, isNew: false }
                  }
                  return activity
                }),
              }
            }
            return asset
          }),
        }))
      },

      castVote: (assetId, activityId, vote) => {
        set((state) => ({
          assets: state.assets.map((asset) => {
            if (asset.id === assetId) {
              return {
                ...asset,
                activities: asset.activities.map((activity) => {
                  if (activity.id === activityId && activity.type === "VoteRequired") {
                    return { ...activity, isNew: false }
                  }
                  return activity
                }),
              }
            }
            return asset
          }),
        }))
      },

      addAsset: (asset) => {
        set((state) => ({
          assets: [...state.assets, asset],
          totalAssets: state.totalAssets + 1,
          totalInvested: state.totalInvested + asset.invested,
          totalValue: state.totalValue + asset.currentValue,
          totalTokens: state.totalTokens + asset.tokens.owned,
        }))
      },

      updateAssetValue: (assetId, newValue) => {
        set((state) => {
          const asset = state.assets.find((a) => a.id === assetId)
          if (!asset) return state

          const valueDiff = newValue - asset.currentValue

          return {
            assets: state.assets.map((a) => {
              if (a.id === assetId) {
                return {
                  ...a,
                  currentValue: newValue,
                  change: ((newValue - a.invested) / a.invested) * 100,
                }
              }
              return a
            }),
            totalValue: state.totalValue + valueDiff,
          }
        })
      },
    }),
    {
      name: "ryzer-portfolio-storage",
    },
  ),
)

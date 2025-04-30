"use client"

import { Calendar } from "@/components/ui/calendar"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { usePortfolioStore } from "@/lib/store/portfolio-store"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Building2, CheckCircle2, Clock, ChevronRight, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { PropertyDetails } from "@/components/property-details"
import { AdditionalInformation } from "@/components/additional-information"
import { AssetManager } from "../../components/AssetManager"
import { AssetActivityFeed } from "@/components/asset-activity-feed"
import { RiskFactors } from "@/components/risk-factors"
import { ExitOpportunities } from "@/components/exit-opportunities"
import { DocumentsChecklistTab } from "@/components/documents-checklist-tab"
import UpcomingEvents from "../../components/UpcomingEvents"

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getAssetById } = usePortfolioStore()

  const assetId = params.id as string
  const asset = getAssetById(assetId)

  if (!asset) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-semibold mb-2">Asset Not Found</h2>
              <p className="text-gray-500 mb-6">The asset you're looking for doesn't exist or has been removed.</p>
              <Button asChild>
                <Link href="/portfolio">Return to Portfolio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Sample documents for the checklist
  const documents = [
    {
      id: "doc-1",
      name: "RERA Approval",
      verified: true,
      verificationDate: "29th Sep 2022",
    },
    {
      id: "doc-2",
      name: "HDMA Approval",
      verified: true,
      verificationDate: "29th Sep 2022",
    },
    {
      id: "doc-3",
      name: "Link Documents",
      verified: true,
      verificationDate: "29th Sep 2022",
    },
    {
      id: "doc-4",
      name: "Municipal Taxes",
      verified: true,
      verificationDate: "29th Sep 2022",
    },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/portfolio" className="text-gray-600 hover:text-gray-900">
            My Portfolio
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-purple-500 font-medium">{asset.name}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-1 text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <h1 className="text-xl font-bold">{asset.name}</h1>
          </div>
          <Button variant="outline" size="sm">
            Actions
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <Building2 className="h-4 w-4" />
          <span>
            {asset.location.city}, {asset.location.state}
          </span>
        </div>

        <Card className="bg-[#1a1f36] text-white mb-6 overflow-hidden rounded-xl border-0 shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-300">Current value</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-bold">{formatCurrency(asset.currentValue)}</h3>
                  <span
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium",
                      asset.change >= 0 ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400",
                    )}
                  >
                    {asset.change >= 0 ? "+" : ""}
                    {asset.change.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">Invested value</p>
                <h3 className="text-3xl font-bold">{formatCurrency(asset.invested)}</h3>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-md bg-[#252b43] p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100/10 text-amber-500">
                    $
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Earned</p>
                    <p className="font-medium">₹{asset.earnings.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-[#252b43] p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100/10 text-blue-500">
                    %
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Avg Growth</p>
                    <p className="font-medium">{asset.change.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-[#252b43] p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100/10 text-purple-500">
                    #
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Tokens</p>
                    <p className="font-medium">{asset.tokens.owned}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-[#252b43] p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100/10 text-green-500">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Lock-in</p>
                    <p className="font-medium">
                      {asset.lockInPeriod.duration} {asset.lockInPeriod.unit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="tokens" className="w-full">
              <TabsList className="w-full max-w-md">
                <TabsTrigger value="tokens">My Tokens</TabsTrigger>
                <TabsTrigger value="orders">My Orders</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="tokens" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Investment Summary</CardTitle>
                    <p className="text-sm text-gray-500">Overview of your tokens and earnings for this asset</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-500">Tokens owned</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold">{asset.tokens.owned}</p>
                          <p className="text-sm text-gray-500">/ {asset.tokens.total}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {((asset.tokens.owned / asset.tokens.total) * 100).toFixed(1)}% of total supply
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Token price</p>
                        <p className="text-2xl font-bold">₹{asset.tokenPrice}</p>
                        <p className={cn("text-xs", asset.change >= 0 ? "text-green-500" : "text-red-500")}>
                          {asset.change >= 0 ? "+" : ""}
                          {asset.change.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Last updated 2 hours ago</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Earnings to date</p>
                        <p className="text-2xl font-bold">₹{asset.earnings.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{asset.roi.toFixed(1)}% return on investment</p>
                      </div>
                    </div>

                    {asset.type === "RealEstate" && (
                      <div className="mt-8 rounded-md border border-green-100 bg-green-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-green-100 p-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-green-800">Investment Insight</p>
                            <p className="text-sm text-green-700">
                              Your investment in {asset.name} is performing 23% better than similar assets in your
                              portfolio. Consider increasing your position during the next funding round in August 2025.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {asset.type === "RealEstate" && (
                      <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-amber-100 p-1">
                            <Clock className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium text-amber-800">Token Certificate Pending</p>
                            <p className="text-sm text-amber-700">
                              Your token certificate is being processed and will be available within 5-7 business days.
                              You'll be notified once it's ready for download.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex justify-between">
                      <Button variant="outline">Buy more tokens</Button>
                      <Button variant="outline">Sell tokens</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border p-8 text-center">
                      <p className="text-gray-500">No orders found for this asset</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <DocumentsChecklistTab documents={documents} />
                <div className="mt-6">
                  <RiskFactors risks={asset.risks || []} />
                </div>
                <div className="mt-6">
                  <ExitOpportunities opportunities={asset.exitOpportunities || []} />
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <AssetActivityFeed activities={asset.activities || []} />
              </TabsContent>
            </Tabs>

            <PropertyDetails asset={asset} />
            <AdditionalInformation asset={asset} />
            <AssetManager asset={asset} />
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-base">Asset Activities</CardTitle>
                <p className="text-sm text-gray-500">Recent updates for this property</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {asset.activities && asset.activities.length > 0 ? (
                  asset.activities.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            "mt-1 rounded-full p-1",
                            activity.type === "Dividend"
                              ? "bg-green-100 text-green-600"
                              : activity.type === "VoteRequired"
                                ? "bg-amber-100 text-amber-600"
                                : activity.type === "NewTenant"
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-purple-100 text-purple-600",
                          )}
                        >
                          <Info className="h-3 w-3" />
                        </div>
                        <div>
                          <h4 className="font-medium flex items-center gap-1">
                            {activity.title}
                            {activity.isNew && <span className="inline-flex h-2 w-2 rounded-full bg-blue-500"></span>}
                          </h4>
                          <p className="text-xs text-gray-500">{activity.date}</p>

                          <div className="mt-2">
                            <p className="text-sm">{activity.description}</p>

                            {activity.amount && (
                              <p className="mt-1 text-sm font-medium text-green-600">
                                +₹{activity.amount.toLocaleString()}
                              </p>
                            )}

                            {activity.type === "VoteRequired" && (
                              <div className="mt-3">
                                <Button size="sm" className="w-full">
                                  Cast your vote
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No recent activities</p>
                  </div>
                )}

                {asset.upcomingEvents && asset.upcomingEvents.length > 0 && (
                  <UpcomingEvents />
                )}

                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1">
                  <span>View All Activities</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

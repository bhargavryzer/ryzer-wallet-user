"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortfolioStore } from "@/lib/store/portfolio-store";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Bell,
  ArrowUpRight,
  BarChart3,
  Building2,
  LineChart,
  Filter,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvestmentAsset } from "@/lib/types";

export function PortfolioDashboard() {
  const router = useRouter();
  const {
    assets,
    totalInvested,
    totalValue,
    totalEarned,
    totalTokens,
    totalAssets,
    averageGrowth,
  } = usePortfolioStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"highest" | "lowest">("highest");
  const [filterType, setFilterType] = useState<
    "all" | "realestate" | "fund" | "etf"
  >("all");

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      (filterType === "realestate" && asset.type === "RealEstate") ||
      (filterType === "fund" && asset.type === "Fund") ||
      (filterType === "etf" && asset.type === "ETF");

    return matchesSearch && matchesFilter;
  });

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (sortBy === "highest") {
      return b.change - a.change;
    } else {
      return a.change - b.change;
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "RealEstate":
        return <Building2 className="h-6 w-6 text-blue-500" />;
      case "Fund":
        return <LineChart className="h-6 w-6 text-purple-500" />;
      case "ETF":
        return <BarChart3 className="h-6 w-6 text-green-500" />;
      default:
        return <Building2 className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pre-Leased":
        return (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            Pre Leased
          </span>
        );
      case "Under Construction":
        return (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            Under Construction
          </span>
        );
      case "Holiday Homes":
        return (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Holiday Homes
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
            Active
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Home</span>
          <span className="text-sm text-gray-500">/</span>
          <span className="text-sm font-medium">My Portfolio</span>
        </div>
      </div>

     

       
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              My Portfolio
            </h2>
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              Alerts
            </Button>
          </div>

          <Card className="bg-[#1C2444] text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Current value</p>
                    <div className="flex items-center gap-2">
                      <h3 className="text-3xl font-semibold">
                        ₹{totalValue.toLocaleString()}
                      </h3>
                      <span className="rounded bg-[#15803D33] px-2 py-0.5 text-sm font-medium text-[#15803D]">
                        +79.3%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Invested value</p>
                    <h3 className="text-3xl font-semibold">
                      ₹{totalInvested.toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-xl bg-[#C2410C33] p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C2410C]">
                          <span className="text-white">$</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Total Earned</p>
                          <p className="text-lg font-medium">
                            ₹{totalEarned.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#0066FF33] p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0066FF]">
                          <span className="text-white">%</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Avg Growth</p>
                          <p className="text-lg font-medium">
                            {averageGrowth.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#7C3AED33] p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C3AED]">
                          <span className="text-white">#</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Total Tokens</p>
                          <p className="text-lg font-medium">{totalTokens}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#15803D33] p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#15803D]">
                          <span className="text-white">#</span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Total Assets</p>
                          <p className="text-lg font-medium">{totalAssets}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-[1fr,300px] gap-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search investments..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "highest" | "lowest")
                    }
                  >
                    <option value="highest">Highest Growth</option>
                    <option value="lowest">Lowest Growth</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-4">
                    <span className="font-medium text-gray-900 border-b-2 border-gray-900 pb-2">
                      Current Invested Assets
                    </span>
                    <span className="text-gray-400">Total Invest Assets</span>
                  </div>
                </div>
                <hr className="border-t border-gray-200" />

                <div className="space-y-3">
                  {sortedAssets.map((asset) => (
                    <Link
                      key={asset.id}
                      href={`/portfolio/${asset.id}`}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <div className="flex">
                          <div
                            className={cn(
                              "w-[180px] flex items-center justify-center py-8",
                              {
                                "bg-blue-50": asset.type === "RealEstate",
                                "bg-purple-50": asset.type === "Fund",
                                "bg-green-50": asset.type === "ETF",
                              }
                            )}
                          >
                            <div className="flex h-16 w-16 items-center justify-center">
                              {getAssetIcon(asset.type)}
                            </div>
                          </div>

                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-gray-900">
                                    {asset.name}
                                  </h3>
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                                      {
                                        "bg-blue-100 text-blue-700":
                                          asset.status === "Pre-Leased",
                                        "bg-amber-100 text-amber-700":
                                          asset.status === "Under Construction",
                                        "bg-green-100 text-green-700":
                                          asset.status === "Holiday Homes",
                                      }
                                    )}
                                  >
                                    {asset.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                  <span className="inline-block w-1 h-1 rounded-full bg-gray-400" />
                                  {asset.location.city}, {asset.location.state}
                                </p>
                              </div>

                              <Button
                                variant="link"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 font-medium p-0 h-auto flex items-center gap-1"
                                onClick={() => router.push(`/portfolio/${asset.id}`)}
                              >
                                View Details
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="mt-4 grid grid-cols-4 gap-8">
                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  You Invested
                                </p>
                                <p className="font-medium">
                                  ₹{asset.invested.toLocaleString()}
                                </p>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Current Value
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    ₹{asset.currentValue.toLocaleString()}
                                  </p>
                                  <p className="text-sm text-green-600">
                                    +{asset.change.toFixed(1)}%
                                  </p>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Lock-in
                                </p>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>
                                    {asset.lockInPeriod.duration}{" "}
                                    {asset.lockInPeriod.unit}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-gray-500 mb-1">
                                  Total Token
                                </p>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>{asset.tokens.owned}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
  <Card className="overflow-hidden">
    <CardContent className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <h3 className="font-medium">Recent Activities</h3>
        </div>
        <Button
          variant="link"
          className="h-auto p-0 text-blue-600 hover:text-blue-700"
        >
          View All
        </Button>
      </div>
      <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-full before:bg-purple-500">
        <div className="space-y-1">
          <h4 className="font-medium">The Lakeview Park</h4>
          <p className="text-sm font-medium text-purple-600">₹5,000</p>
          <p className="text-xs text-gray-400">2 hours ago</p>
        </div>
      </div>
      <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-full before:bg-blue-500">
        <div className="space-y-1">
          <h4 className="font-medium">Tech Growth Fund</h4>
          <p className="text-sm font-medium text-blue-600">₹1,200</p>
          <p className="text-xs text-gray-400">Yesterday</p>
        </div>
      </div>
      <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-full before:bg-green-500">
        <div className="space-y-1">
          <h4 className="font-medium">Green Energy ETF</h4>
          <p className="text-sm font-medium text-green-600">+5.2%</p>
          <p className="text-xs text-gray-400">2 days ago</p>
        </div>
      </div>
      <div className="relative pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-full before:bg-violet-500">
        <div className="space-y-1">
          <h4 className="font-medium">Wallet</h4>
          <p className="text-sm font-medium text-violet-600">₹10,000</p>
          <p className="text-xs text-gray-400">1 week ago</p>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
            
          </div>
       
   
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              My Network
            </h2>
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Connected Wallets</h3>
                    <p className="text-sm text-gray-500">3 Active Connections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <LineChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Active Networks</h3>
                    <p className="text-sm text-gray-500">2 Networks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Transaction History</h3>
                    <p className="text-sm text-gray-500">View All Activities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Connected Networks</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Ethereum Mainnet</h4>
                      <p className="text-sm text-gray-500">Connected</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Disconnect</Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <LineChart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Polygon Network</h4>
                      <p className="text-sm text-gray-500">Connected</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Disconnect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
      
    </div>
  );
}

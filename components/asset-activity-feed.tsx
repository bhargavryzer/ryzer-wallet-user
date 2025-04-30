"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { ActivityType as StoreActivityType } from "@/lib/store/portfolio-store"

type ActivityType = StoreActivityType

interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  description: string
  date: string
  details?: Record<string, any>
}

interface AssetActivityFeedProps {
  activities: ActivityItem[]
}

export function AssetActivityFeed({ activities }: AssetActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Financial" | "Governance" | "Property" | "Legal">("All")

  const filteredActivities = activities.filter((activity) => {
    if (activeTab === "All") return true
    if (activeTab === "Financial") return activity.type === "Dividend" || activity.type === "Market"
    if (activeTab === "Governance") return activity.type === "Governance"
    if (activeTab === "Property") return activity.type === "Tenant" || activity.type === "Report"
    if (activeTab === "Legal") return activity.type === "Management"
    return true
  })

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "Dividend":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <span className="text-lg font-bold text-green-600">$</span>
          </div>
        )
      case "Market":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M23 6L13.5 15.5L8.5 10.5L1 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 6H23V12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )
      case "Report":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )
      case "Tenant":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 22V12H15V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )
      case "Governance":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )
      case "Management":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100">
            <svg className="h-5 w-5 text-teal-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 8V12L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M12 8H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )
    }
  }

  const renderActivityContent = (activity: ActivityItem) => {
    switch (activity.type) {
      case "Dividend":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{activity.description}</p>
            {activity.details?.transactionId && (
              <p className="text-xs text-gray-500">Transaction ID: {activity.details.transactionId}</p>
            )}
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                <span>View Details</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      case "Market":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{activity.description}</p>
            {activity.details?.change && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    activity.details.change > 0 ? "text-green-600" : "text-red-600",
                  )}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d={activity.details.change > 0 ? "M7 13L12 8L17 13" : "M7 10L12 15L17 10"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>
                    {activity.details.change > 0 ? "+" : ""}
                    {activity.details.change}% ({activity.details.changeAmount})
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                <span>View Chart</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      case "Report":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{activity.description}</p>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-blue-600 gap-1">
                <Download className="h-4 w-4 mr-1" />
                <span>Download Valuation Report</span>
              </Button>
            </div>
          </div>
        )
      case "Tenant":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{activity.description}</p>
            {activity.details?.leaseDetails && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <p className="text-xs text-gray-500">Lease Term:</p>
                  <p className="text-sm font-medium">{activity.details.leaseDetails.term}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Monthly Rent:</p>
                  <p className="text-sm font-medium">₹{activity.details.leaseDetails.rent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Area Leased:</p>
                  <p className="text-sm font-medium">{activity.details.leaseDetails.area.toLocaleString()} sq.ft</p>
                </div>
              </div>
            )}
          </div>
        )
      case "Governance":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{activity.description}</p>
            {activity.details?.directors && (
              <div className="flex flex-wrap gap-3 mt-3">
                {activity.details.directors.map((director: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                    <div className="h-6 w-6 rounded-full bg-gray-200"></div>
                    <div>
                      <p className="text-sm font-medium">{director.name}</p>
                      <p className="text-xs text-gray-500">{director.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case "Management":
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">{activity.description}</p>
            {activity.details?.manager && (
              <div className="bg-gray-50 rounded-md p-3 mt-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-gray-200"></div>
                  <div>
                    <p className="font-medium">{activity.details.manager.name}</p>
                    <p className="text-xs text-gray-500">Contract Period: {activity.details.manager.contractPeriod}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      default:
        return <p className="text-sm text-gray-700">{activity.description}</p>
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle>Asset Activity</CardTitle>
        <p className="text-sm text-gray-500">Recent transactions and market activity</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b">
          <Tabs
            defaultValue="All"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="px-6 pt-4"
          >
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="All" className="text-sm">
                All
              </TabsTrigger>
              <TabsTrigger value="Financial" className="text-sm">
                Financial
              </TabsTrigger>
              <TabsTrigger value="Governance" className="text-sm">
                Governance
              </TabsTrigger>
              <TabsTrigger value="Property" className="text-sm">
                Property
              </TabsTrigger>
              <TabsTrigger value="Legal" className="text-sm">
                Legal
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-6 space-y-6">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="border-b pb-6 last:border-0">
                <div className="flex gap-4">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {activity.type}
                        </span>
                        <h4 className="font-medium">{activity.title}</h4>
                      </div>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                    {renderActivityContent(activity)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No activities found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

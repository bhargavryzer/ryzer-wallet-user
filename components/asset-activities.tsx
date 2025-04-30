"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { InvestmentAsset } from "@/lib/store/portfolio-store"
import { Calendar, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssetActivitiesProps {
  asset: InvestmentAsset
}

export function AssetActivities({ asset }: AssetActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Asset Activities</CardTitle>
        <p className="text-sm text-gray-500">Recent updates for this property</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {asset.activities && asset.activities.length > 0 ? (
          asset.activities.map((activity) => (
            <div key={activity.id} className="border-b pb-4 last:border-0">
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    "mt-1 rounded-full p-1",
                    activity.type === "RentalIncome"
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
                      <p className="mt-1 text-sm font-medium text-green-600">+₹{activity.amount.toLocaleString()}</p>
                    )}

                    {activity.type === "VoteRequired" && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="w-full">
                            Yes
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">
                            No
                          </Button>
                        </div>
                        <Button size="sm" variant="ghost" className="w-full text-xs">
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
          <>
            <h3 className="font-medium">Upcoming Events</h3>
            <div className="space-y-4">
              {asset.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {event.type === "Meeting" ? "Meeting" : "Distribution"} • {event.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Button variant="outline" size="sm" className="w-full">
          View All Activities
        </Button>
      </CardContent>
    </Card>
  )
}

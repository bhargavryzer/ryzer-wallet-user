"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExitOpportunity {
  id: string
  title: string
  description: string
  timeline?: string
  expectedReturn?: string
}

interface ExitOpportunitiesProps {
  opportunities: ExitOpportunity[]
}

export function ExitOpportunities({ opportunities }: ExitOpportunitiesProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <CardTitle>Exit Opportunities</CardTitle>
          <Info className="h-4 w-4 text-gray-400" />
        </div>
        <ChevronDown className={cn("h-5 w-5 transition-transform", isExpanded ? "transform rotate-180" : "")} />
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-6">
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="border-b pb-4 last:border-0">
              <h3 className="font-medium mb-2">{opportunity.title}</h3>
              <p className="text-sm text-gray-700 mb-3">{opportunity.description}</p>
              <div className="grid grid-cols-2 gap-4">
                {opportunity.timeline && (
                  <div>
                    <p className="text-xs text-gray-500">Timeline</p>
                    <p className="text-sm font-medium">{opportunity.timeline}</p>
                  </div>
                )}
                {opportunity.expectedReturn && (
                  <div>
                    <p className="text-xs text-gray-500">Expected Return</p>
                    <p className="text-sm font-medium">{opportunity.expectedReturn}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

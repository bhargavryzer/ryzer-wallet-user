"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface RiskFactor {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high"
}

interface RiskFactorsProps {
  risks: RiskFactor[]
}

export function RiskFactors({ risks }: RiskFactorsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card className="shadow-sm">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer border-b"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base">Risk Factors</CardTitle>
        <ChevronDown
          className={cn("h-4 w-4 text-gray-500 transition-transform", {
            "transform rotate-180": isExpanded,
          })}
        />
      </CardHeader>
      <CardContent className={cn("space-y-4", { hidden: !isExpanded })}>
        {risks.map((risk) => (
          <div key={risk.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{risk.title}</h4>
              <span
                className={cn("px-2 py-1 rounded-full text-xs font-medium", {
                  "bg-red-100 text-red-600": risk.severity === "high",
                  "bg-yellow-100 text-yellow-600": risk.severity === "medium",
                  "bg-green-100 text-green-600": risk.severity === "low",
                })}
              >
                {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500">{risk.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

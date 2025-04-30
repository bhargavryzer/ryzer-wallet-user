"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { InvestmentAsset } from "@/lib/store/portfolio-store"
import { Building, Building2, ChevronDown, Users2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface PropertyDetailsProps {
  asset: InvestmentAsset
}

export function PropertyDetails({ asset }: PropertyDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (asset.type !== "RealEstate" || !asset.details) {
    return null
  }

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle>Property Details</CardTitle>
        <ChevronDown className={cn("h-5 w-5 transition-transform", isExpanded ? "transform rotate-180" : "")} />
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <h3 className="text-lg font-semibold">XYZ Holdings LLP</h3>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs">
                    Verified
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm">Hyderabad, Telangana, India</p>
              </div>

              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SPV model</span>
                  <span className="font-medium">{asset.details.spvModel ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Issue type</span>
                  <span className="font-medium">{asset.details.issueType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Voting rights</span>
                  <span className="font-medium">{asset.details.votingRights ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shares issued</span>
                  <span className="font-medium text-amber-500">{asset.details.sharesIssued}</span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-gray-500" />
                  <h3 className="font-medium">Property Specifications</h3>
                </div>

                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Property Type</span>
                    <span className="font-medium">{asset.details.propertyType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Built-up Area</span>
                    <span className="font-medium">{asset.details.builtUpArea}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Occupancy</span>
                    <span className="font-medium">{asset.details.occupancy}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Annual Yield</span>
                    <span className="font-medium">{asset.details.annualYield}</span>
                  </div>
                </div>
              </div>

              {asset.tenants && asset.tenants.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Users2 className="h-5 w-5 text-gray-500" />
                    <h3 className="font-medium">Key Tenants</h3>
                  </div>
                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                    {asset.tenants.map((tenant, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600">{tenant.name}</span>
                        <span className="font-medium">{tenant.spacePercentage}% space</span>
                      </div>
                    ))}
                    {asset.tenants.reduce((acc, tenant) => acc + tenant.spacePercentage, 0) < 100 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Others</span>
                        <span className="font-medium">
                          {100 - asset.tenants.reduce((acc, tenant) => acc + tenant.spacePercentage, 0)}% space
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
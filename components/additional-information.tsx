"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { InvestmentAsset } from "@/lib/store/portfolio-store"
import { ChevronDown, ExternalLink, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface AdditionalInformationProps {
  asset: InvestmentAsset
}

export function AdditionalInformation({ asset }: AdditionalInformationProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!asset.additionalInfo) {
    return null
  }

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle>Additional Information hii heloo</CardTitle>
        <ChevronDown className={cn("h-5 w-5 transition-transform", isExpanded ? "transform rotate-180" : "")} />
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {asset.additionalInfo.escrowAccount && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 7L12 13L21 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Escrow account </p>
                    <p className="font-medium">{asset.additionalInfo.escrowAccount.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <Info className="h-4 w-4 text-violet-500" />
                  </button>
                  {asset.additionalInfo.escrowAccount.website && (
                    <a 
                      href={asset.additionalInfo.escrowAccount.website}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-white hover:bg-gray-50 rounded-lg shadow-sm border border-gray-100"
                    >
                      <span>Visit Website</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            

            {asset.additionalInfo.legalAdvisor && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Legal advisor</p>
                    <p className="font-medium">{asset.additionalInfo.legalAdvisor.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <Info className="h-4 w-4 text-violet-500" />
                  </button>
                  {asset.additionalInfo.legalAdvisor.website && (
                    <a 
                      href={asset.additionalInfo.legalAdvisor.website}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-white hover:bg-gray-50 rounded-lg shadow-sm border border-gray-100"
                    >
                      <span>Visit Website</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {asset.additionalInfo.assetManagement && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 9H21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 21V9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Asset management</p>
                    <p className="font-medium">{asset.additionalInfo.assetManagement.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <Info className="h-4 w-4 text-violet-500" />
                  </button>
                  {asset.additionalInfo.assetManagement.website && (
                    <a 
                      href={asset.additionalInfo.assetManagement.website}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-white hover:bg-gray-50 rounded-lg shadow-sm border border-gray-100"
                    >
                      <span>Visit Website</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {asset.additionalInfo.brokerage && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12C13.6569 12 15 13.3431 15 15C15 16.6569 13.6569 18 12 18C10.3431 18 9 16.6569 9 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Brokerage</p>
                    <p className="font-medium">{asset.additionalInfo.brokerage.status ? "Yes" : "No"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <Info className="h-4 w-4 text-violet-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

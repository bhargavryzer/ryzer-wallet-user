"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ExternalLink, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Document {
  id: string
  name: string
  verified: boolean
  date: string
}

interface DocumentsChecklistProps {
  documents: Document[]
}

export function DocumentsChecklist({ documents }: DocumentsChecklistProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle>Documents Checklist</CardTitle>
        <ChevronDown className={cn("h-5 w-5 transition-transform", isExpanded ? "transform rotate-180" : "")} />
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">Essential documentation for your investment</p>

          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-xs text-gray-500">Verified on {doc.date}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-blue-500">
                  <span>View</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" className="mt-4 w-full">
            Send All Docs to Email
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, ChevronRight } from "lucide-react"

interface Document {
  id: string
  name: string
  verified: boolean
  verificationDate: string
}

interface DocumentsChecklistTabProps {
  documents: Document[]
}

export function DocumentsChecklistTab({ documents }: DocumentsChecklistTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Documents Checklist</CardTitle>
          <p className="text-sm text-gray-500">Essential documentation for your investment</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <span>Send All Docs to Email</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">{doc.name}</p>
                <p className="text-xs text-gray-500">Verified on {doc.verificationDate}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-blue-500">
              <span>View</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

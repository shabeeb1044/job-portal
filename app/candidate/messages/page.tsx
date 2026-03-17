"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import Link from "next/link"

export default function CandidateMessagesPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Messaging with companies and agencies is{" "}
            <span className="font-semibold">coming soon</span>.
            You&apos;ll be able to view and manage conversations here.
          </p>
          <Button asChild variant="outline">
            <Link href="/candidate/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

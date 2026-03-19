"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

export default function CandidateMessagesPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">Chat with companies and agencies.</p>
        </div>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/candidate/dashboard">Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Inbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium text-foreground">No messages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When a recruiter reaches out, your conversations will show up here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

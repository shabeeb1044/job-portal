"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { PageLoader } from "@/components/page-loader"

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

function formatTime(createdAt: string): string {
  const d = new Date(createdAt)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export default function CandidateNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [entityId, setEntityId] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) return
    const u = JSON.parse(stored)
    const id = u.candidateId ?? u.id
    if (!id) return
    setEntityId(id)
    fetch(`/api/notifications?role=candidate&entityId=${encodeURIComponent(id)}&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.notifications) {
          setNotifications(data.notifications)
        }
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    if (!entityId) return
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, role: "candidate", entityId }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // ignore
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) return <PageLoader />

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Job alerts and application updates appear here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark all read
            </Button>
          )}
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/candidate/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium text-foreground">No notifications yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                When your application status changes, we&apos;ll notify you here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n.id}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      className={`block px-4 py-3 transition-colors hover:bg-muted/50 ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <span className="text-sm font-medium text-foreground">{n.title}</span>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatTime(n.createdAt)}
                      </span>
                    </Link>
                  ) : (
                    <div
                      className={`block px-4 py-3 ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      <span className="text-sm font-medium text-foreground">{n.title}</span>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

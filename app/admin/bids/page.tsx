"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ArrowLeft } from "lucide-react"

export default function AdminBidsPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/admin/login")
      return
    }
    const userData = JSON.parse(user)
    if (userData.role !== "super_admin" && userData.role !== "admin") {
      router.push("/")
      return
    }
    setUserRole(userData.role)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <AdminNav role={userRole ?? undefined} />
          <div className="mb-8">
            <Link href="/admin/dashboard" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Active Bids</h1>
            <p className="mt-2 text-muted-foreground">Monitor and manage bids across the platform</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Bids
              </CardTitle>
              <CardDescription>Bid list and actions will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/admin/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

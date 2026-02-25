"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Building2,
  Briefcase,
  DollarSign,
  TrendingUp,
  FileText,
  Video,
  Settings,
  Clock,
  LayoutDashboard,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalCandidates: number
  totalAgencies: number
  totalCompanies: number
  totalBids: number
  totalRevenue: number
  pendingApprovals: number
  activeSubscriptions: number
  interviewsScheduled: number
  newCandidatesToday?: number
  newBidsToday?: number
  revenueToday?: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    totalAgencies: 0,
    totalCompanies: 0,
    totalBids: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeSubscriptions: 0,
    interviewsScheduled: 0,
  })
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Check auth
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/admin/login')
      return
    }

    const userData = JSON.parse(user)
    if (userData.role !== 'super_admin' && userData.role !== 'admin') {
      router.push('/')
      return
    }
    setUserRole(userData.role)

    // Load stats
    loadStats()
  }, [router])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Candidates",
      value: stats.totalCandidates,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      link: "/admin/candidates",
    },
    {
      title: "Agencies",
      value: stats.totalAgencies,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      link: "/admin/agencies",
    },
    {
      title: "Companies",
      value: stats.totalCompanies,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      link: "/admin/companies",
    },
    {
      title: "Active Bids",
      value: stats.totalBids,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      link: "/admin/bids",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
      link: "/admin/revenue",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      link: "/admin/approvals",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
      link: "/admin/subscriptions",
    },
    {
      title: "Interviews Scheduled",
      value: stats.interviewsScheduled,
      icon: Video,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
      link: "/admin/interviews",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Admin nav */}
          <AdminNav role={userRole ?? undefined} />

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {userRole === "super_admin" ? "Super Admin Dashboard" : "Admin Dashboard"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Overview and management for your recruitment platform
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                  </CardContent>
                </Card>
              ))
            ) : (
              statCards.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Link key={index} href={stat.link}>
                    <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </CardTitle>
                        <div className={`rounded-full p-2 ${stat.bgColor}`}>
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {stat.value}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>

          {!loading && stats.pendingApprovals > 0 && (
            <Link href="/admin/approvals">
              <Card className="mb-8 cursor-pointer border-yellow-500/50 bg-yellow-500/5 transition-colors hover:bg-yellow-500/10">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="rounded-full bg-yellow-500/20 p-3">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {stats.pendingApprovals} pending approval{stats.pendingApprovals !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Review and approve agencies and companies
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Review</Button>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Quick Actions */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="management">Management</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link href="/admin/plans">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Subscription Plans
                      </Button>
                    </Link>
                    <Link href="/admin/agencies">
                      <Button variant="outline" className="w-full justify-start">
                        <Building2 className="mr-2 h-4 w-4" />
                        Approve Agencies
                      </Button>
                    </Link>
                    <Link href="/admin/companies">
                      <Button variant="outline" className="w-full justify-start">
                        <Briefcase className="mr-2 h-4 w-4" />
                        Approve Companies
                      </Button>
                    </Link>
                    <Link href="/admin/settings">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        System Settings
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Today&apos;s Activity</CardTitle>
                    <CardDescription>Summary for the current day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <span className="text-muted-foreground">New candidates</span>
                        <span className="font-semibold">{stats.newCandidatesToday ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <span className="text-muted-foreground">New bids</span>
                        <span className="font-semibold">{stats.newBidsToday ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                        <span className="text-muted-foreground">Revenue today</span>
                        <span className="font-semibold">${(stats.revenueToday ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="management" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage users, agencies, and companies</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <Link href="/admin/candidates">
                    <Button variant="outline" className="w-full">
                      <Users className="mr-2 h-4 w-4" />
                      Candidates
                    </Button>
                  </Link>
                  <Link href="/admin/agencies">
                    <Button variant="outline" className="w-full">
                      <Building2 className="mr-2 h-4 w-4" />
                      Agencies
                    </Button>
                  </Link>
                  <Link href="/admin/companies">
                    <Button variant="outline" className="w-full">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Companies
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure platform settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Video Profile Required</p>
                      <p className="text-sm text-muted-foreground">
                        Make video profile mandatory for candidates
                      </p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Commission Rate</p>
                      <p className="text-sm text-muted-foreground">
                        Default commission percentage for agencies
                      </p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

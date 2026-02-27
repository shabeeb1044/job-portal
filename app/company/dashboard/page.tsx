"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Briefcase,
  Users,
  FileText,
  TrendingUp,
  MapPin,
  Clock,
  Plus,
  Search,
  UserCheck,
  FileCheck,
} from "lucide-react"
import { PageLoader } from "@/components/page-loader"

interface Stats {
  activeDemands: number
  totalDemands: number
  totalSubmissions: number
  submitted: number
  shortlisted: number
  interview: number
  hired: number
  hiredThisMonth: number
  companyName: string
}

interface RecentDemand {
  id: string
  jobTitle: string
  location: string
  positions: number
  filledPositions: number
  status: string
  createdAt: string
  submissionCount: number
}

interface RecentSubmission {
  id: string
  candidateName: string
  demandTitle: string
  demandId: string
  status: string
  submittedAt: string
  candidateRole: string
}

export default function CompanyDashboard() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [companyId, setCompanyId] = useState("")
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentDemands, setRecentDemands] = useState<RecentDemand[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) return
    try {
      const u = JSON.parse(stored)
      const cid = u.companyId ?? u.id ?? ""
      setCompanyId(cid)
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    if (!companyId) return
    fetch(`/api/company/stats?companyId=${encodeURIComponent(companyId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats)
          setRecentDemands(data.recentDemands ?? [])
          setRecentSubmissions(data.recentSubmissions ?? [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  const q = searchQuery.trim().toLowerCase()
  const filteredDemands = q
    ? recentDemands.filter(
        (d) =>
          d.jobTitle.toLowerCase().includes(q) ||
          (d.location && d.location.toLowerCase().includes(q))
      )
    : recentDemands
  const filteredSubmissions = q
    ? recentSubmissions.filter(
        (s) =>
          s.candidateName.toLowerCase().includes(q) ||
          s.demandTitle.toLowerCase().includes(q) ||
          (s.candidateRole && s.candidateRole.toLowerCase().includes(q))
      )
    : recentSubmissions

  if (loading && !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <PageLoader />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search demands and candidates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button asChild className="gap-2">
          <Link href="/company/demands/new">
            <Plus className="h-4 w-4" />
            Create Demand
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/company/demands">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.activeDemands ?? 0}</p>
                <p className="text-sm text-muted-foreground">Active Demands</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/company/demands">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <FileCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats?.totalSubmissions ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <UserCheck className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.interview ?? 0}</p>
              <p className="text-sm text-muted-foreground">In Interview</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.hired ?? 0}</p>
              <p className="text-sm text-muted-foreground">
                Hired {stats?.hiredThisMonth ? `(${stats.hiredThisMonth} this month)` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Demands</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/company/demands">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {filteredDemands.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                <Briefcase className="mx-auto mb-2 h-10 w-10 opacity-50" />
                <p>No demands yet</p>
                <Button variant="link" className="mt-2" asChild>
                  <Link href="/company/demands/new">Create your first demand</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDemands.map((d) => (
                  <Link
                    key={d.id}
                    href={`/company/demands/${d.id}`}
                    className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{d.jobTitle}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {d.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {d.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {d.submissionCount} submissions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {d.filledPositions}/{d.positions} filled
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={d.status === "open" ? "default" : "secondary"}
                        className="shrink-0 capitalize"
                      >
                        {d.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Submissions</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/company/demands">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                <Users className="mx-auto mb-2 h-10 w-10 opacity-50" />
                <p>No submissions yet</p>
                <p className="mt-1 text-xs">
                  Submissions will appear when agencies send candidates for your demands.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/company/demands/${s.demandId}`}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                        {s.candidateName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{s.candidateName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {s.candidateRole || s.demandTitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          s.status === "hired" || s.status === "selected"
                            ? "default"
                            : s.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                        className="capitalize"
                      >
                        {s.status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        Review
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

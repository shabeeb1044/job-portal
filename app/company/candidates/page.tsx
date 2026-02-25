"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageLoader } from "@/components/page-loader"
import { Mail, Phone, Play, Download, Search, Filter } from "lucide-react"
import { toast } from "sonner"

interface SubmissionRow {
  id: string
  candidateId: string
  candidateName: string
  demandTitle: string
  status: string
  submittedAt: string
  agentName: string | null
  agencyName: string | null
  candidate: {
    id: string
    name: string
    email: string
    phone: string
    skills: string[]
    cvUrl?: string
    videoUrl?: string
  } | null
}

interface PlanInfo {
  isFree: boolean
  isCorporate: boolean
  cvDownloadLimit: number | null
  totalCVDownloads: number
  freeCandidateLimit: number
  level: string | null
  status: string | null
}

export default function CompanyCandidatesPage() {
  const [companyId, setCompanyId] = useState("")
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) {
      return
    }
    try {
      const u = JSON.parse(stored)
      const cid = u.companyId ?? u.id ?? ""
      setCompanyId(cid)
      if (!cid) {
        setLoading(false)
        return
      }
      Promise.all([
        fetch(`/api/company/submissions?companyId=${encodeURIComponent(cid)}`).then((r) => r.json()),
        fetch(`/api/company/stats?companyId=${encodeURIComponent(cid)}`).then((r) => r.json()),
      ])
        .then(([subsRes, statsRes]) => {
          if (subsRes.success && subsRes.submissions) {
            setSubmissions(subsRes.submissions)
          }
          if (statsRes?.plan) {
            setPlanInfo({
              isFree: !!statsRes.plan.isFree,
              isCorporate: !!statsRes.plan.isCorporate,
              cvDownloadLimit:
                typeof statsRes.plan.cvDownloadLimit === "number" ? statsRes.plan.cvDownloadLimit : null,
              totalCVDownloads: statsRes.plan.totalCVDownloads ?? 0,
              freeCandidateLimit: statsRes.plan.freeCandidateLimit ?? 4,
              level: statsRes.plan.level ?? null,
              status: statsRes.plan.status ?? null,
            })
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } catch {
      setLoading(false)
    }
  }, [])

  const isFreePlan = planInfo?.isFree && !planInfo.isCorporate
  const freeLimit = planInfo?.freeCandidateLimit ?? 4

  const filtered = submissions.filter((s) => {
    const q = search.trim().toLowerCase()
    const matchSearch =
      !q ||
      s.candidateName.toLowerCase().includes(q) ||
      s.demandTitle.toLowerCase().includes(q) ||
      (s.candidate?.email && s.candidate.email.toLowerCase().includes(q)) ||
      (s.candidate?.phone && s.candidate.phone.toLowerCase().includes(q))
    const matchStatus = statusFilter === "all" || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const visibleRows = isFreePlan ? filtered.slice(0, freeLimit) : filtered

  const handleCvDownload = (candidateId: string | undefined, candidateName: string) => {
    if (!companyId || !candidateId) return
    const info = planInfo

    if (info?.isFree && !info.isCorporate) {
      toast.error("CV download is available on paid company plans. Please upgrade your plan.")
      return
    }

    if (info && typeof info.cvDownloadLimit === "number" && info.cvDownloadLimit >= 0) {
      if (info.totalCVDownloads >= info.cvDownloadLimit) {
        toast.error("You have reached your CV download limit for the current plan.")
        return
      }
    }

    const url = `/api/company/download-cv?companyId=${encodeURIComponent(
      companyId
    )}&candidateId=${encodeURIComponent(candidateId)}`
    window.open(url, "_blank")

    setPlanInfo((prev) =>
      prev
        ? {
            ...prev,
            totalCVDownloads: prev.totalCVDownloads + 1,
          }
        : prev
    )

    toast.success(`Starting CV download for ${candidateName}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <PageLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Candidates</h1>
          <p className="text-sm text-muted-foreground">
            View candidates submitted to your demands. Access level depends on your subscription plan.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/company/demands">
            Go to Demands
          </Link>
        </Button>
      </div>

      {planInfo && (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                Plan: {planInfo.isCorporate ? "Corporate (unlimited access)" : planInfo.level || "Free"}
              </span>
              {planInfo.status && !planInfo.isCorporate && planInfo.level && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                  {planInfo.status}
                </span>
              )}
            </div>
            {!planInfo.isCorporate && (
              <div className="text-muted-foreground">
                {isFreePlan ? (
                  <>
                    Free companies can see up to {freeLimit} candidate names and play their videos.
                    Upgrade to a paid plan to unlock full profiles and CV downloads.
                  </>
                ) : typeof planInfo.cvDownloadLimit === "number" && planInfo.cvDownloadLimit >= 0 ? (
                  <>
                    CV downloads used: <span className="font-medium">{planInfo.totalCVDownloads}</span> /{" "}
                    <span className="font-medium">{planInfo.cvDownloadLimit}</span>
                  </>
                ) : (
                  <>CV downloads: Unlimited</>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search candidate, role, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          {visibleRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
              <p>No candidates found for your current filters.</p>
              <p className="mt-1">
                Candidates will appear here when agencies submit them against your demands.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Role / Demand</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead>Agent / Agency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.candidate?.name ?? s.candidateName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{s.demandTitle}</span>
                          <span className="text-xs text-muted-foreground">
                            Submitted {new Date(s.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isFreePlan ? (
                          <span className="text-xs text-muted-foreground">Upgrade plan to view email</span>
                        ) : s.candidate?.email ? (
                          <a
                            href={`mailto:${s.candidate.email}`}
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Mail className="h-3 w-3" />
                            {s.candidate.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {isFreePlan ? (
                          <span className="text-xs text-muted-foreground">Upgrade plan to view phone</span>
                        ) : s.candidate?.phone ? (
                          <a href={`tel:${s.candidate.phone}`} className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {s.candidate.phone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {s.candidate?.videoUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            asChild
                          >
                            <a
                              href={s.candidate.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Play className="h-3 w-3" />
                              Play
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No video</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>{s.agentName ?? "—"}</span>
                          <span>{s.agencyName ?? ""}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.status === "hired"
                              ? "default"
                              : s.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {s.candidate?.cvUrl && !isFreePlan && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                handleCvDownload(
                                  s.candidate?.id,
                                  s.candidate?.name ?? s.candidateName
                                )
                              }
                            >
                              <Download className="h-3 w-3" />
                              CV
                            </Button>
                          )}
                          {isFreePlan && (
                            <span className="text-xs text-muted-foreground">
                              CV download available on paid plans
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {isFreePlan && filtered.length > visibleRows.length && (
            <div className="border-t px-4 py-3 text-xs text-muted-foreground">
              Showing the first {freeLimit} candidates on the free plan. Upgrade to see all candidates and unlock full
              profiles.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

}
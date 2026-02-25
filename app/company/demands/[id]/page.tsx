"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Download,
  Play,
  Loader2,
  Briefcase,
  User,
  Mail,
  Phone,
  Building2,
} from "lucide-react"
import { toast } from "sonner"
import { PageLoader } from "@/components/page-loader"

interface Submission {
  id: string
  candidateId: string
  candidateName: string
  demandId: string
  demandTitle: string
  status: string
  agentId?: string
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

export default function CompanyDemandSubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const demandId = params?.id as string
  const [companyId, setCompanyId] = useState("")
  const [demand, setDemand] = useState<{ jobTitle: string; companyName: string } | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [planInfo, setPlanInfo] = useState<{
    isFree: boolean
    isCorporate: boolean
    cvDownloadLimit: number | null
    totalCVDownloads: number
    freeCandidateLimit: number
    level: string | null
    status: string | null
  } | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/login/company")
      return
    }
    const u = JSON.parse(user)
    const cid = u.companyId ?? u.id ?? ""
    setCompanyId(cid)
    if (!cid || !demandId) {
      setLoading(false)
      return
    }
    Promise.all([
      fetch(`/api/company/demands?companyId=${cid}`).then((r) => r.json()),
      fetch(`/api/company/submissions?companyId=${cid}&demandId=${demandId}`).then((r) => r.json()),
      fetch(`/api/company/stats?companyId=${cid}`).then((r) => r.json()),
    ])
      .then(([demandsRes, subRes, statsRes]) => {
        if (demandsRes.success && demandsRes.demands) {
          const d = demandsRes.demands.find((x: { id: string }) => x.id === demandId)
          if (d) setDemand({ jobTitle: d.jobTitle, companyName: d.companyName })
        }
        if (subRes.success && subRes.submissions) setSubmissions(subRes.submissions)
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
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [demandId, router])

  const updateStatus = async (submissionId: string, status: string) => {
    if (!companyId) return
    setUpdatingId(submissionId)
    try {
      const res = await fetch(`/api/company/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, status }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === submissionId ? { ...s, status } : s))
        )
        toast.success("Status updated")
      } else {
        toast.error(data.error || "Update failed")
      }
    } catch {
      toast.error("Update failed")
    } finally {
      setUpdatingId(null)
    }
  }

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

    // Trigger browser download via redirect
    window.open(url, "_blank")

    // Optimistically update local counter so admin stats stay in sync without reload
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

  if (loading) return <PageLoader />

  const isFreePlan = planInfo?.isFree && !planInfo.isCorporate
  const freeLimit = planInfo?.freeCandidateLimit ?? 4
  const visibleSubmissions = isFreePlan ? submissions.slice(0, freeLimit) : submissions

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/company/demands">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            {demand?.jobTitle ?? "Demand"} — Submissions
          </h1>
          <p className="text-muted-foreground">{demand?.companyName}</p>
        </div>
      </div>

      {planInfo && (
        <Card>
          <CardContent className="flex flex-col gap-2 py-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                Plan: {planInfo.isCorporate ? "Corporate (unlimited access)" : planInfo.level || "Free"}
              </span>
              {planInfo.status && !planInfo.isCorporate && (
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

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No submissions yet</p>
            <p className="text-sm text-muted-foreground">Candidates will appear here when agencies submit CVs.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Name, Contact, Video, Agent, Agency, Status, CV</CardTitle>
            <p className="text-sm text-muted-foreground">
              Shortlist, Interview, Hire, or Reject candidates. Access to contact details and CV depends on your
              subscription plan.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleSubmissions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.candidate?.name ?? s.candidateName}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        {isFreePlan ? (
                          <span className="text-xs text-muted-foreground">Upgrade plan to view email</span>
                        ) : s.candidate?.email ? (
                          <a
                            href={`mailto:${s.candidate.email}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            {s.candidate.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
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
                      <TableCell>{s.agentName ?? "—"}</TableCell>
                      <TableCell>{s.agencyName ?? "—"}</TableCell>
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
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          <Select
                            value={s.status}
                            onValueChange={(v) => updateStatus(s.id, v)}
                            disabled={updatingId === s.id}
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              {updatingId === s.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="shortlisted">Shortlist</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="hired">Hire</SelectItem>
                              <SelectItem value="rejected">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                          {s.candidate?.cvUrl && !isFreePlan && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleCvDownload(s.candidate?.id, s.candidate?.name ?? s.candidateName)}
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
            {isFreePlan && submissions.length > visibleSubmissions.length && (
              <p className="mt-3 text-xs text-muted-foreground">
                Showing the first {freeLimit} candidates on the free plan. Upgrade to see all submissions and unlock
                full profiles.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

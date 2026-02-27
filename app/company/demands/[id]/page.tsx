"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft, Play, Loader2, Briefcase, Mail, Phone,
  Lock, Crown, CheckCircle2, XCircle, Clock, Star,
  MessageSquare, ChevronRight, Building2, FileText, Users,
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

const STATUS_CFG = {
  submitted:   { label: "Submitted",   Icon: Clock,         color: "#0ea5e9", text: "text-sky-600 dark:text-sky-400",     ring: "ring-sky-500/30",     bg: "bg-sky-500/8 border-sky-500/20"     },
  shortlisted: { label: "Shortlisted", Icon: Star,          color: "#8b5cf6", text: "text-violet-600 dark:text-violet-400", ring: "ring-violet-500/30", bg: "bg-violet-500/8 border-violet-500/20" },
  interview:   { label: "Interview",   Icon: MessageSquare, color: "#f59e0b", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/30",   bg: "bg-amber-500/8 border-amber-500/20"   },
  hired:       { label: "Hired",       Icon: CheckCircle2,  color: "#10b981", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/30", bg: "bg-emerald-500/8 border-emerald-500/20" },
  rejected:    { label: "Rejected",    Icon: XCircle,       color: "#f43f5e", text: "text-rose-600 dark:text-rose-400",   ring: "ring-rose-500/30",    bg: "bg-rose-500/8 border-rose-500/20"   },
} as const
type SK = keyof typeof STATUS_CFG
const STATUS_KEYS: SK[] = ["submitted", "shortlisted", "interview", "hired", "rejected"]

/* ─── tiny helpers ─────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status as SK] ?? STATUS_CFG.submitted
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11px] font-semibold tracking-wide ${c.text} ${c.bg}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  )
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
  const gradients = [
    ["#7c3aed","#4f46e5"], ["#0284c7","#0891b2"], ["#059669","#0d9488"],
    ["#d97706","#ea580c"], ["#db2777","#e11d48"], ["#7c3aed","#db2777"],
  ]
  const [a, b] = gradients[name.charCodeAt(0) % gradients.length]
  const sz = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"
  return (
    <div className={`${sz} shrink-0 rounded-2xl font-bold text-white shadow-md flex items-center justify-center`}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
      {initials}
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────── */
export default function CompanyDemandSubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const demandId = params?.id as string

  const [companyId, setCompanyId]   = useState("")
  const [demand, setDemand]         = useState<{ jobTitle: string; companyName: string } | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]       = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [planInfo, setPlanInfo]     = useState<{
    isFree: boolean; isCorporate: boolean; cvDownloadLimit: number | null
    totalCVDownloads: number; freeCandidateLimit: number; level: string | null; status: string | null
  } | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) { router.push("/login/company"); return }
    const u = JSON.parse(user)
    const cid = u.companyId ?? u.id ?? ""
    setCompanyId(cid)
    if (!cid || !demandId) { setLoading(false); return }
    Promise.all([
      fetch(`/api/company/demands?companyId=${cid}`).then(r => r.json()),
      fetch(`/api/company/submissions?companyId=${cid}&demandId=${demandId}`).then(r => r.json()),
      fetch(`/api/company/stats?companyId=${cid}`).then(r => r.json()),
    ]).then(([dRes, sRes, stRes]) => {
      if (dRes.success && dRes.demands) {
        const d = dRes.demands.find((x: { id: string }) => x.id === demandId)
        if (d) setDemand({ jobTitle: d.jobTitle, companyName: d.companyName })
      }
      if (sRes.success && sRes.submissions) setSubmissions(sRes.submissions)
      if (stRes?.plan) setPlanInfo({
        isFree: !!stRes.plan.isFree, isCorporate: !!stRes.plan.isCorporate,
        cvDownloadLimit: typeof stRes.plan.cvDownloadLimit === "number" ? stRes.plan.cvDownloadLimit : null,
        totalCVDownloads: stRes.plan.totalCVDownloads ?? 0,
        freeCandidateLimit: stRes.plan.freeCandidateLimit ?? 4,
        level: stRes.plan.level ?? null, status: stRes.plan.status ?? null,
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [demandId, router])

  const updateStatus = async (id: string, status: string) => {
    if (!companyId) return
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/company/submissions/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, status }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmissions(p => p.map(s => s.id === id ? { ...s, status } : s))
        toast.success("Status updated")
      } else toast.error(data.error || "Update failed")
    } catch { toast.error("Update failed") }
    finally { setUpdatingId(null) }
  }

  const handleCvDownload = (candidateId: string | undefined, candidateName: string) => {
    if (!companyId || !candidateId) return
    if (planInfo?.isFree && !planInfo.isCorporate) { toast.error("Upgrade to download CVs."); return }
    if (planInfo && typeof planInfo.cvDownloadLimit === "number" && planInfo.totalCVDownloads >= planInfo.cvDownloadLimit) {
      toast.error("CV download limit reached."); return
    }
    window.open(`/api/company/download-cv?companyId=${encodeURIComponent(companyId)}&candidateId=${encodeURIComponent(candidateId)}`, "_blank")
    setPlanInfo(p => p ? { ...p, totalCVDownloads: p.totalCVDownloads + 1 } : p)
    toast.success(`Downloading CV for ${candidateName}`)
  }

  if (loading) return <PageLoader />

  const isFreePlan = planInfo?.isFree && !planInfo.isCorporate
  const freeLimit  = planInfo?.freeCandidateLimit ?? 4
  const visible    = isFreePlan ? submissions.slice(0, freeLimit) : submissions
  const counts     = submissions.reduce((a, s) => { a[s.status] = (a[s.status] ?? 0) + 1; return a }, {} as Record<string, number>)
  const hired      = counts["hired"] ?? 0
  const hireRate   = submissions.length ? Math.round((hired / submissions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-background">

      {/* ══ sticky header ══ */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-15 max-w-6xl items-center gap-3 px-4 py-3 lg:px-8">
          <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-xl">
            <Link href="/company/demands"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground leading-tight">
                {demand?.jobTitle ?? "Demand"} <span className="text-muted-foreground font-normal">— Submissions</span>
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{demand?.companyName}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{submissions.length}</span>
            <span className="text-muted-foreground">total</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 lg:px-8">

        {/* ══ hero stats row ══ */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            {/* hire-rate card */}
            <div className="col-span-2 sm:col-span-1 flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Hire rate</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{hireRate}<span className="text-lg text-muted-foreground">%</span></p>
            </div>
            {/* pipeline tiles */}
            {STATUS_KEYS.map(key => {
              const c = STATUS_CFG[key]; const n = counts[key] ?? 0
              return (
                <div key={key}
                  className={`flex flex-col justify-between rounded-2xl border p-3.5 transition-shadow hover:shadow-sm ${n > 0 ? c.bg : "border-border bg-muted/10"}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-[11px] font-semibold uppercase tracking-wider ${n > 0 ? c.text : "text-muted-foreground/50"}`}>
                      {c.label}
                    </p>
                    <c.Icon className={`h-3.5 w-3.5 ${n > 0 ? c.text : "text-muted-foreground/20"}`} />
                  </div>
                  <p className={`mt-1 text-2xl font-bold ${n > 0 ? c.text : "text-muted-foreground/25"}`}>{n}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* ══ plan banner ══ */}
        {planInfo && !planInfo.isCorporate && (
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
            isFreePlan ? "border-amber-500/25 bg-amber-500/5" : "border-primary/15 bg-primary/5"
          }`}>
            <div className="flex items-center gap-2">
              {isFreePlan
                ? <Lock className="h-4 w-4 text-amber-500" />
                : <Building2 className="h-4 w-4 text-primary/70" />}
              <span className="font-medium">{planInfo.level ?? "Free plan"}</span>
              {planInfo.status && (
                <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground ring-1 ring-border">
                  {planInfo.status}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isFreePlan
                ? <><span className="font-semibold text-foreground">{freeLimit}</span> of <span className="font-semibold text-foreground">{submissions.length}</span> candidates shown.{" "}
                    <span className="cursor-pointer font-semibold text-amber-600 underline underline-offset-2 dark:text-amber-400">Upgrade to unlock all →</span></>
                : typeof planInfo.cvDownloadLimit === "number"
                  ? <>CV downloads: <span className="font-semibold text-foreground">{planInfo.totalCVDownloads}</span> / {planInfo.cvDownloadLimit}</>
                  : "Unlimited CV downloads"}
            </p>
          </div>
        )}

        {planInfo?.isCorporate && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm">
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-amber-600 dark:text-amber-400">Corporate plan</span>
            <span className="text-muted-foreground">— full access, unlimited downloads</span>
          </div>
        )}

        {/* ══ empty state ══ */}
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-24 text-center">
            <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-3xl bg-muted">
              <Users className="h-9 w-9 text-muted-foreground/30" />
            </div>
            <p className="text-lg font-semibold text-foreground">No submissions yet</p>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground leading-relaxed">
              Candidates will appear here once agencies start submitting CVs for this demand.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visible.map((s, i) => {
              const name = s.candidate?.name ?? s.candidateName
              const busy = updatingId === s.id
              const cfg  = STATUS_CFG[s.status as SK] ?? STATUS_CFG.submitted

              return (
                <div key={s.id}
                  className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-all duration-200 hover:border-border hover:shadow-md"
                  style={{ animationDelay: `${i * 35}ms` }}>

                  {/* coloured left rail */}
                  <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl transition-all group-hover:w-1"
                    style={{ background: cfg.color }} />

                  {/* ── desktop row ── */}
                  <div className="flex flex-col gap-4 py-4 pl-5 pr-4 sm:flex-row sm:items-center sm:gap-3">

                    {/* avatar + identity */}
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Avatar name={name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground text-[15px] leading-tight">{name}</span>
                          <StatusPill status={s.status} />
                        </div>

                        {/* contact row */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          {isFreePlan ? (
                            <span className="flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Contact locked
                            </span>
                          ) : (
                            <>
                              {s.candidate?.email && (
                                <a href={`mailto:${s.candidate.email}`}
                                  className="flex items-center gap-1 transition-colors hover:text-foreground">
                                  <Mail className="h-3 w-3" />{s.candidate.email}
                                </a>
                              )}
                              {s.candidate?.phone && (
                                <a href={`tel:${s.candidate.phone}`}
                                  className="flex items-center gap-1 transition-colors hover:text-foreground">
                                  <Phone className="h-3 w-3" />{s.candidate.phone}
                                </a>
                              )}
                            </>
                          )}
                        </div>

                        {/* skills */}
                        {!isFreePlan && s.candidate?.skills?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {s.candidate.skills.slice(0, 5).map(sk => (
                              <span key={sk} className="rounded-lg bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                {sk}
                              </span>
                            ))}
                            {s.candidate.skills.length > 5 && (
                              <span className="rounded-lg bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                +{s.candidate.skills.length - 5}
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* agent / agency */}
                    <div className="hidden min-w-[130px] flex-col gap-0.5 sm:flex">
                      <p className="text-xs font-medium text-foreground truncate">{s.agentName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.agencyName ?? ""}</p>
                    </div>

                    {/* action cluster */}
                    <div className="flex flex-wrap items-center gap-2">
                      {s.candidate?.videoUrl && (
                        <Button variant="outline" size="sm" asChild
                          className="h-8 gap-1.5 rounded-xl border-border/70 text-xs hover:border-border">
                          <a href={s.candidate.videoUrl} target="_blank" rel="noopener noreferrer">
                            <Play className="h-3 w-3" /> Video
                          </a>
                        </Button>
                      )}

                      {isFreePlan ? (
                        <span className="flex items-center gap-1.5 rounded-xl border border-dashed border-border/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                          <Lock className="h-3 w-3" /> CV locked
                        </span>
                      ) : s.candidate?.cvUrl ? (
                        <Button variant="outline" size="sm"
                          className="h-8 gap-1.5 rounded-xl border-border/70 text-xs hover:border-border"
                          onClick={() => handleCvDownload(s.candidate?.id, name)}>
                          <FileText className="h-3 w-3" /> CV
                        </Button>
                      ) : null}

                      {/* status selector */}
                      <Select value={s.status} onValueChange={v => updateStatus(s.id, v)} disabled={busy}>
                        <SelectTrigger className="h-8 w-[132px] rounded-xl border-border/70 text-xs">
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_KEYS.map(k => (
                            <SelectItem key={k} value={k}>{STATUS_CFG[k].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* mobile footer */}
                  <div className="flex items-center justify-between border-t border-border/50 px-5 py-2 sm:hidden">
                    <span className="text-[11px] text-muted-foreground">
                      {[s.agentName, s.agencyName].filter(Boolean).join(" · ") || "—"}
                    </span>
                    <StatusPill status={s.status} />
                  </div>
                </div>
              )
            })}

            {/* ══ upgrade wall ══ */}
            {isFreePlan && submissions.length > visible.length && (
              <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/60">
                {Array.from({ length: Math.min(3, submissions.length - visible.length) }).map((_, i) => (
                  <div key={i} className="flex select-none items-center gap-3 border-b border-border/40 px-5 py-4 blur-[2px] last:border-0">
                    <div className="h-11 w-11 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-36 rounded-lg bg-muted" />
                      <div className="h-2.5 w-52 rounded-lg bg-muted/60" />
                    </div>
                    <div className="h-6 w-24 rounded-full bg-muted" />
                  </div>
                ))}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-background/60 to-background/90 backdrop-blur-[3px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">
                      {submissions.length - visible.length} candidate{submissions.length - visible.length > 1 ? "s" : ""} hidden
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Upgrade your plan to see all submissions</p>
                  </div>
                  <Button size="sm" className="rounded-full gap-1.5 px-5 shadow-md">
                    <Crown className="h-3.5 w-3.5" />
                    Upgrade plan
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
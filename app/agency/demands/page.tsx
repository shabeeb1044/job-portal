"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Search, Eye, Send, Briefcase, MapPin, DollarSign, Users,
  Loader2, Building2, LayoutGrid, LayoutList, Table2,
  Calendar, ChevronRight, TrendingUp, Clock, UserCheck,
} from "lucide-react"
import { toast } from "sonner"
import { PageLoader } from "@/components/page-loader"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "grid" | "float" | "table"

interface Demand {
  id: string
  companyName: string
  jobTitle: string
  description: string
  requirements: string[]
  skills: string[]
  salary?: { min?: number; max?: number; amount?: number; currency: string }
  gender: string
  location: string
  positions: number
  filledPositions: number
  status: string
  deadline: string
}

interface Candidate {
  id: string
  firstName: string
  lastName: string
  skills: string[]
  status: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSalary(salary: Demand["salary"]): string {
  if (!salary?.currency) return "—"
  const cur = salary.currency
  if (typeof salary.min === "number" && typeof salary.max === "number")
    return `${cur} ${salary.min.toLocaleString()} – ${salary.max.toLocaleString()}`
  if (typeof salary.amount === "number")
    return `${cur} ${salary.amount.toLocaleString()}`
  return cur
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; dot: string; cls: string }> = {
  open:   { label: "Open",   dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" },
  closed: { label: "Closed", dot: "bg-rose-500",    cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800" },
  paused: { label: "Paused", dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, dot: "bg-muted-foreground", cls: "bg-muted text-muted-foreground border-border" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", cfg.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  )
}

// ─── Fill bar ─────────────────────────────────────────────────────────────────

function FillBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  const color = pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : "bg-indigo-500"
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{filled}/{total} filled</span>
        <span className="text-xs font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Deadline chip ────────────────────────────────────────────────────────────

function DeadlineChip({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr)
  const urgent = days <= 7
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs",
      urgent ? "text-rose-600 dark:text-rose-400 font-medium" : "text-muted-foreground",
    )}>
      <Calendar className="h-3 w-3 shrink-0" />
      {urgent ? `${days}d left` : new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
    </span>
  )
}

// ─── Truncated text with tooltip ──────────────────────────────────────────────

function TruncatedText({ text, lines = 2, className }: { text: string; lines?: number; className?: string }) {
  const style: React.CSSProperties = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as any,
    WebkitLineClamp: lines,
    overflow: "hidden",
  }
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <p style={style} className={cn("cursor-default text-sm leading-relaxed text-muted-foreground", className)}>
            {text}
          </p>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed whitespace-pre-wrap">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ─── Skill chip row with +N overflow ─────────────────────────────────────────

function SkillChips({ skills, max = 3 }: { skills: string[]; max?: number }) {
  const shown = skills.slice(0, max)
  const extra = skills.length - max
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(s => (
        <Badge key={s} variant="secondary" className="rounded-full text-xs px-2 py-0 font-normal">{s}</Badge>
      ))}
      {extra > 0 && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="rounded-full text-xs px-2 py-0 cursor-default">+{extra}</Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="flex flex-wrap gap-1 max-w-[200px]">
              {skills.slice(max).map(s => (
                <span key={s} className="inline-block rounded-full bg-secondary text-secondary-foreground text-xs px-2 py-0.5">{s}</span>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, colorClass, bgClass }: {
  icon: React.ElementType; label: string; value: number; colorClass: string; bgClass: string
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", bgClass)}>
          <Icon className={cn("h-5 w-5", colorClass)} />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Shared: detail dialog ────────────────────────────────────────────────────

function DetailDialog({
  demand,
  open,
  onOpenChange,
}: {
  demand: Demand;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0 rounded-xl shadow-xl">
        {/* Accessible dialog title for screen readers */}
        <DialogTitle className="sr-only">
          {demand.jobTitle} at {demand.companyName}
        </DialogTitle>

        {/* ===== PREMIUM HEADER ===== */}
        <div className="flex-shrink-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white px-8 py-6 space-y-4">
          {/* Top row: Title and Status */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight line-clamp-2 leading-tight">
                {demand.jobTitle}
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                {demand.companyName}
              </p>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={demand.status} />
            </div>
          </div>

          {/* Location and Gender Row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-slate-200">
              <MapPin className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">{demand.location}</span>
            </div>
            {demand.gender && (
              <>
                <div className="h-1 w-1 rounded-full bg-slate-500" />
                <div className="flex items-center gap-2 text-slate-200">
                  <UserCheck className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">{demand.gender}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== SCROLLABLE CONTENT ===== */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <div className="px-8 py-7 space-y-7">
            
            {/* ===== KEY METRICS GRID ===== */}
            <div className="grid grid-cols-2 gap-4">
              {/* Salary Card */}
              <div className="group">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg border border-blue-200/50 hover:border-blue-300 transition-all">
                  <div className="flex-shrink-0 p-2.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Salary
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1 truncate">
                      {formatSalary(demand.salary)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deadline Card */}
              <div className="group">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-lg border border-amber-200/50 hover:border-amber-300 transition-all">
                  <div className="flex-shrink-0 p-2.5 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Deadline
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {new Date(demand.deadline).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Positions Card */}
              <div className="group">
                <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-lg border border-emerald-200/50 hover:border-emerald-300 transition-all">
                  <div className="flex-shrink-0 p-2.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <Users className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Positions
                    </p>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {demand.filledPositions} / {demand.positions}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gender Card */}
              {demand.gender && (
                <div className="group">
                  <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-lg border border-purple-200/50 hover:border-purple-300 transition-all">
                    <div className="flex-shrink-0 p-2.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <UserCheck className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Gender
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {demand.gender}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ===== DESCRIPTION SECTION ===== */}
            {demand.description && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="inline-block w-1 h-1 rounded-full bg-blue-600"></span>
                  Description
                </h2>
                <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap break-words">
                  {demand.description}
                </p>
              </div>
            )}

            {/* ===== REQUIREMENTS SECTION ===== */}
            {demand.requirements && demand.requirements.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="inline-block w-1 h-1 rounded-full bg-blue-600"></span>
                  Key Requirements
                </h2>
                <ul className="space-y-2">
                  {demand.requirements.map((requirement, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 group/item"
                    >
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 group-hover/item:scale-125 transition-transform" />
                      <span className="text-sm text-slate-600 group-hover/item:text-slate-900 transition-colors">
                        {requirement}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ===== SKILLS SECTION ===== */}
            {demand.skills && demand.skills.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="inline-block w-1 h-1 rounded-full bg-blue-600"></span>
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {demand.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200 hover:border-blue-300 hover:from-blue-50 hover:to-slate-50 hover:text-blue-700 transition-all cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom padding for scrolling */}
            <div className="h-2" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shared: submit dialog ────────────────────────────────────────────────────

function SubmitDialog({
  demand, candidates, open, onOpenChange, onSubmit, submitting,
  selected, setSelected,
}: {
  demand: Demand; candidates: Candidate[]; open: boolean
  onOpenChange: (o: boolean) => void; onSubmit: () => void
  submitting: boolean; selected: string[]; setSelected: (ids: string[]) => void
}) {
  const available = candidates.filter(c => c.status === "available")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[82vh] overflow-y-auto p-0">
        <div className="border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Submit Candidates</DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              for <span className="font-medium text-foreground">{demand.jobTitle}</span> at {demand.companyName}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-2">
          {available.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Users className="h-8 w-8 opacity-30" />
              <p className="text-sm">No available candidates</p>
            </div>
          ) : (
            available.map(candidate => {
              const checked = selected.includes(candidate.id)
              return (
                <label
                  key={candidate.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                    checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={v =>
                      setSelected(v ? [...selected, candidate.id] : selected.filter(id => id !== candidate.id))
                    }
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{candidate.firstName} {candidate.lastName}</p>
                    <div className="mt-1">
                      <SkillChips skills={candidate.skills ?? []} max={3} />
                    </div>
                  </div>
                </label>
              )
            })
          )}
        </div>

        <div className="border-t px-6 py-4">
          <Button
            onClick={onSubmit}
            disabled={selected.length === 0 || submitting}
            className="w-full h-9 gap-2"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
              : <><Send className="h-4 w-4" /> Submit {selected.length} Candidate{selected.length !== 1 ? "s" : ""}</>
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DemandsPage() {
  const [demands, setDemands]     = useState<Demand[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [viewMode, setViewMode]   = useState<ViewMode>("grid")
  const [agencyId, setAgencyId]   = useState("")

  // Dialog state
  const [detailTarget, setDetailTarget]   = useState<string | null>(null)
  const [submitTarget, setSubmitTarget]   = useState<string | null>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [submitting, setSubmitting]       = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) return
    const { agencyId: aid } = JSON.parse(user)
    setAgencyId(aid)

    Promise.all([
      fetch("/api/agency/demands").then(r => r.json()),
      fetch(`/api/agency/candidates?agencyId=${aid}`).then(r => r.json()),
    ])
      .then(([dd, cd]) => {
        if (dd.success) setDemands(dd.demands)
        if (cd.success) setCandidates(cd.candidates)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = demands.filter(d => {
    const q = search.toLowerCase()
    const matchSearch =
      d.jobTitle.toLowerCase().includes(q) ||
      d.companyName.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q)
    const matchGender =
      genderFilter === "all" ||
      d.gender.toLowerCase() === genderFilter.toLowerCase() ||
      d.gender === "any"
    return matchSearch && matchGender
  })

  const openCount      = demands.filter(d => d.status === "open").length
  const totalPositions = demands.reduce((a, d) => a + (d.positions ?? 0), 0)
  const totalFilled    = demands.reduce((a, d) => a + (d.filledPositions ?? 0), 0)

  async function handleSubmit() {
    const demand = demands.find(d => d.id === submitTarget)
    if (!demand || selectedCandidates.length === 0) return
    setSubmitting(true)
    try {
      const res  = await fetch("/api/agency/apply-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demandId: demand.id, candidateIds: selectedCandidates, agencyId }),
      })
      const data = await res.json()
      if (data.success) {
        const submitted  = data.results.filter((r: any) => r.status === "submitted").length
        const duplicates = data.results.filter((r: any) => r.status === "duplicate").length
        toast.success(`${submitted} submitted${duplicates ? `, ${duplicates} duplicate(s) skipped` : ""}`)
        setSubmitTarget(null); setSelectedCandidates([])
      } else { toast.error(data.error || "Failed to submit") }
    } catch { toast.error("Failed to submit candidates") }
    finally   { setSubmitting(false) }
  }

  if (loading) return <PageLoader />

  // ─── Shared action buttons per demand ──────────────────────────────────────
  function ActionButtons({ demand }: { demand: Demand }) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline" size="sm" className="h-8 gap-1.5 text-xs px-3"
          onClick={() => setDetailTarget(demand.id)}
        >
          <Eye className="h-3.5 w-3.5" /> Details
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs px-3"
          disabled={demand.status !== "open"}
          onClick={() => { setSubmitTarget(demand.id); setSelectedCandidates([]) }}
        >
          <Send className="h-3.5 w-3.5" /> Submit
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Briefcase}   label="Active Demands"   value={openCount}       colorClass="text-primary"        bgClass="bg-primary/10" />
          <StatCard icon={TrendingUp}  label="Total Positions"  value={totalPositions}  colorClass="text-violet-600"     bgClass="bg-violet-50 dark:bg-violet-900/20" />
          <StatCard icon={Users}       label="Positions Filled" value={totalFilled}     colorClass="text-emerald-600"    bgClass="bg-emerald-50 dark:bg-emerald-900/20" />
        </div>
        {/* Filters + view toggle */}
        <Card className="shadow-none">
          <CardContent className="py-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search title, company, location…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
              {/* View toggle */}
              <div className="ml-auto flex items-center gap-0.5 rounded-lg border bg-muted/40 p-1">
                {([
                  { mode: "grid"  as ViewMode, Icon: LayoutGrid,  label: "Grid"  },
                  { mode: "float" as ViewMode, Icon: LayoutList,  label: "List"  },
                  { mode: "table" as ViewMode, Icon: Table2,      label: "Table" },
                ] as const).map(({ mode, Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    title={label}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      viewMode === mode
                        ? "bg-background text-foreground shadow-sm border"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty state */}
        {filtered.length === 0 && (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="rounded-2xl bg-muted p-5">
                <Briefcase className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">No demands found</p>
              <p className="text-xs opacity-60">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}

        {/* ══ GRID VIEW ══════════════════════════════════════════════════════ */}
        {viewMode === "grid" && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(demand => (
              <Card
                key={demand.id}
                className={cn(
                  "group flex flex-col overflow-hidden shadow-none transition-shadow hover:shadow-md",
                  demand.status !== "open" && "opacity-60",
                )}
              >
                {/* Top accent line */}
                <div className={cn(
                  "h-0.5 w-full",
                  demand.status === "open" ? "bg-primary" : demand.status === "paused" ? "bg-amber-400" : "bg-rose-400",
                )} />

                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm font-semibold leading-snug line-clamp-1">
                        {demand.jobTitle}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-0.5 text-xs">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{demand.companyName}</span>
                      </CardDescription>
                    </div>
                    <StatusBadge status={demand.status} />
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 flex-1">
                  {/* Description – 2-line clamp with tooltip */}
                  <TruncatedText text={demand.description} lines={2} />

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[100px]">{demand.location}</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3 shrink-0" />{formatSalary(demand.salary)}
                    </span>
                    <DeadlineChip dateStr={demand.deadline} />
                  </div>

                  <FillBar filled={demand.filledPositions} total={demand.positions} />

                  <SkillChips skills={demand.skills} max={3} />

                  {/* Push actions to bottom */}
                  <div className="mt-auto pt-1">
                    <ActionButtons demand={demand} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ══ FLOAT (LIST) VIEW ══════════════════════════════════════════════ */}
        {viewMode === "float" && filtered.length > 0 && (
          <div className="space-y-2.5">
            {filtered.map(demand => (
              <Card
                key={demand.id}
                className={cn(
                  "shadow-none overflow-hidden transition-shadow hover:shadow-md",
                  demand.status !== "open" && "opacity-60",
                )}
              >
                {/* Left accent bar */}
                <div className="flex">
                  <div className={cn(
                    "w-0.5 shrink-0",
                    demand.status === "open" ? "bg-primary" : demand.status === "paused" ? "bg-amber-400" : "bg-rose-400",
                  )} />
                  <CardContent className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 flex-1">
                    {/* Icon */}
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Briefcase className="h-4.5 w-4.5" />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-sm leading-tight">{demand.jobTitle}</p>
                        <StatusBadge status={demand.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3 shrink-0" />{demand.companyName}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />{demand.location}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3 shrink-0" />{formatSalary(demand.salary)}
                        </span>
                        <DeadlineChip dateStr={demand.deadline} />
                      </div>

                      {/* Description – 1 line */}
                      <TruncatedText text={demand.description} lines={1} />

                      <SkillChips skills={demand.skills} max={4} />
                    </div>

                    {/* Right: fill + actions */}
                    <div className="flex flex-col gap-3 shrink-0 sm:min-w-[180px] sm:items-end">
                      <FillBar filled={demand.filledPositions} total={demand.positions} />
                      <ActionButtons demand={demand} />
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ══ TABLE VIEW ═════════════════════════════════════════════════════ */}
        {viewMode === "table" && filtered.length > 0 && (
          <Card className="shadow-none overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {["Job Title","Company","Location","Salary","Positions","Deadline","Status","Actions"].map(h => (
                    <TableHead
                      key={h}
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground h-9",
                        h === "Actions" && "text-right",
                      )}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(demand => (
                  <TableRow
                    key={demand.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      demand.status !== "open" && "opacity-60",
                    )}
                  >
                    <TableCell className="py-3 max-w-[180px]">
                      <p className="font-medium text-sm truncate" title={demand.jobTitle}>{demand.jobTitle}</p>
                      <SkillChips skills={demand.skills} max={2} />
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate max-w-[120px]">{demand.companyName}</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate max-w-[100px]">{demand.location}</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {formatSalary(demand.salary)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="w-24">
                        <FillBar filled={demand.filledPositions} total={demand.positions} />
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <DeadlineChip dateStr={demand.deadline} />
                    </TableCell>
                    <TableCell className="py-3">
                      <StatusBadge status={demand.status} />
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex justify-end">
                        <ActionButtons demand={demand} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Dialogs rendered outside card loops — no duplicate mounts */}
        {demands.map(demand => (
          <span key={demand.id}>
            <DetailDialog
              demand={demand}
              open={detailTarget === demand.id}
              onOpenChange={o => setDetailTarget(o ? demand.id : null)}
            />
            <SubmitDialog
              demand={demand}
              candidates={candidates}
              open={submitTarget === demand.id}
              onOpenChange={o => { setSubmitTarget(o ? demand.id : null); if (!o) setSelectedCandidates([]) }}
              onSubmit={handleSubmit}
              submitting={submitting}
              selected={selectedCandidates}
              setSelected={setSelectedCandidates}
            />
          </span>
        ))}
      </div>
    </TooltipProvider>
  )
}
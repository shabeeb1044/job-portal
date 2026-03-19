"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Search,
  Eye,
  Briefcase,
  MapPin,
  DollarSign,
  Users,
  Building2,
  LayoutGrid,
  List,
  Table2,
  Calendar,
  ChevronRight,
  Filter,
  TrendingUp,
} from "lucide-react"
import { PageLoader } from "@/components/page-loader"

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

type ViewMode = "grid" | "list" | "table"

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

function FillBar({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  const color = pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">{filled}/{total}</span>
    </div>
  )
}

function DemandDetailContent({ demand }: { demand: Demand }) {
  return (
    <div className="space-y-6">
      {/* ===== STATUS BADGES ===== */}
      <div className="flex flex-wrap gap-2">
        {/* Status Badge */}
        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
          demand.status === "open"
            ? "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300"
            : "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300"
        }`}>
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
            demand.status === "open" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          }`} />
          {demand.status.charAt(0).toUpperCase() + demand.status.slice(1)}
        </div>

        {/* Gender Badge */}
        {demand.gender && (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 transition-all">
            <span className="inline-block w-2 h-2 rounded-full mr-2 bg-blue-500" />
            {demand.gender}
          </div>
        )}
      </div>

      {/* ===== INFO CARDS GRID ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Location Card */}
        {demand.location && (
          <div className="group">
            <div className="flex gap-3 p-4 rounded-lg border border-slate-200/60 bg-gradient-to-br from-slate-50/80 to-slate-50/40 hover:border-blue-300 hover:from-blue-50/60 hover:to-slate-50/40 transition-all">
              {/* Icon with background */}
              <div className="flex-shrink-0 p-2.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 group-hover:scale-110 transition-all">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              
              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Location
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {demand.location}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Salary Card */}
        <div className="group">
          <div className="flex gap-3 p-4 rounded-lg border border-slate-200/60 bg-gradient-to-br from-emerald-50/80 to-slate-50/40 hover:border-emerald-300 hover:from-emerald-50/60 hover:to-slate-50/40 transition-all">
            {/* Icon with background */}
            <div className="flex-shrink-0 p-2.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 group-hover:scale-110 transition-all">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            
            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Salary Range
              </p>
              <p className="text-sm font-bold text-slate-900">
                {formatSalary(demand.salary)}
              </p>
            </div>
          </div>
        </div>

        {/* Positions Card */}
        <div className="group">
          <div className="flex gap-3 p-4 rounded-lg border border-slate-200/60 bg-gradient-to-br from-amber-50/80 to-slate-50/40 hover:border-amber-300 hover:from-amber-50/60 hover:to-slate-50/40 transition-all">
            {/* Icon with background */}
            <div className="flex-shrink-0 p-2.5 bg-amber-100 rounded-lg group-hover:bg-amber-200 group-hover:scale-110 transition-all">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
            
            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Positions
              </p>
              <p className="text-sm font-bold text-slate-900">
                <span className="text-amber-600">{demand.filledPositions}</span> / <span className="text-slate-500">{demand.positions}</span> filled
              </p>
            </div>
          </div>
        </div>

        {/* Deadline Card */}
        <div className="group">
          <div className="flex gap-3 p-4 rounded-lg border border-slate-200/60 bg-gradient-to-br from-rose-50/80 to-slate-50/40 hover:border-rose-300 hover:from-rose-50/60 hover:to-slate-50/40 transition-all">
            {/* Icon with background */}
            <div className="flex-shrink-0 p-2.5 bg-rose-100 rounded-lg group-hover:bg-rose-200 group-hover:scale-110 transition-all">
              <Calendar className="h-4 w-4 text-rose-600" />
            </div>
            
            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Deadline
              </p>
              <p className="text-sm font-bold text-slate-900">
                {demand.deadline 
                  ? new Date(demand.deadline).toLocaleDateString("en-GB", { 
                      day: "numeric", 
                      month: "short", 
                      year: "numeric" 
                    })
                  : "—"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== DESCRIPTION SECTION ===== */}
      {demand.description && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-blue-600" />
            Description
          </h3>
          <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap break-words">
            {demand.description}
          </p>
        </div>
      )}

      {/* ===== REQUIREMENTS SECTION ===== */}
      {demand.requirements?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-blue-600" />
            Key Requirements
          </h3>
          <ul className="space-y-2">
            {demand.requirements.map((requirement, idx) => (
              <li 
                key={idx} 
                className="flex items-start gap-3 group/item"
              >
                {/* Animated bullet */}
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 group-hover/item:scale-125 group-hover/item:bg-blue-600 transition-all" />
                
                {/* Text with hover effect */}
                <span className="text-sm text-slate-600 group-hover/item:text-slate-900 transition-colors">
                  {requirement}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== SKILLS SECTION ===== */}
      {demand.skills?.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-blue-600" />
            Required Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {demand.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200 hover:border-blue-300 hover:from-blue-50 hover:to-slate-50 hover:text-blue-700 hover:shadow-sm transition-all cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ===== CTA BUTTON ===== */}
      <div className="pt-2 border-t border-slate-200">
        <Link href={`/agent/bulk-upload?demandId=${demand.id}`}>
          <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg gap-2 flex items-center justify-center transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transform">
            <Users className="h-4 w-4" />
            <span>Submit Candidates for this Role</span>
          </button>
        </Link>
      </div>
    </div>
  )
}


// ─── GRID CARD ────────────────────────────────────────────────────────────────
function GridCard({ d, onSelect, onClose, selected, detailOpen }: {
  d: Demand
  onSelect: (d: Demand) => void
  onClose: () => void
  selected: Demand | null
  detailOpen: boolean
}) {
  return (
    <Card className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 border-border/60 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-snug truncate group-hover:text-primary transition-colors">
              {d.jobTitle}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1 text-xs">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{d.companyName}</span>
            </CardDescription>
          </div>
          <Badge
            variant={d.status === "open" ? "default" : "secondary"}
            className="capitalize shrink-0 text-xs"
          >
            {d.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {/* Location + Salary row */}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          {d.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              {d.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 shrink-0" />
            {formatSalary(d.salary)}
          </span>
        </div>

        {/* Fill progress */}
        <FillBar filled={d.filledPositions} total={d.positions} />

        {/* Skills */}
        {d.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {d.skills.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">
                {s}
              </Badge>
            ))}
            {d.skills.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{d.skills.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Deadline */}
        {d.deadline && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Due {new Date(d.deadline).toLocaleDateString()}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1">
          <Dialog
            open={detailOpen && selected?.id === d.id}
            onOpenChange={(o) => { if (o) onSelect(d); else onClose(); }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 flex-1 h-8 text-xs">
                <Eye className="h-3 w-3" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{d.jobTitle}</DialogTitle>
                <DialogDescription>{d.companyName} · {d.location}</DialogDescription>
              </DialogHeader>
              {selected && <DemandDetailContent demand={selected} />}
            </DialogContent>
          </Dialog>
            <Button size="sm" asChild className="gap-1 flex-1 h-8 text-xs">
            <Link href={`/agent/bulk-upload?demandId=${d.id}`}>
              <Users className="h-3 w-3" />
              Submit
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── LIST ROW ─────────────────────────────────────────────────────────────────
function ListRow({ d, onSelect, onClose, selected, detailOpen }: {
  d: Demand
  onSelect: (d: Demand) => void
  onClose: () => void
  selected: Demand | null
  detailOpen: boolean
}) {
  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30 group">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Left: title + company */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm group-hover:text-primary transition-colors">
                {d.jobTitle}
              </span>
              <Badge variant={d.status === "open" ? "default" : "secondary"} className="capitalize text-xs">
                {d.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{d.companyName}</span>
              {d.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.location}</span>}
              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatSalary(d.salary)}</span>
            </div>
          </div>

          {/* Middle: fill + skills */}
          <div className="flex flex-col gap-1.5 sm:w-44 shrink-0">
            <FillBar filled={d.filledPositions} total={d.positions} />
            {d.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {d.skills.slice(0, 2).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
                ))}
                {d.skills.length > 2 && <Badge variant="outline" className="text-xs px-1.5 py-0">+{d.skills.length - 2}</Badge>}
              </div>
            )}
          </div>

          {/* Right: deadline + actions */}
          <div className="flex items-center gap-2 shrink-0">
            {d.deadline && (
              <span className="text-xs text-muted-foreground hidden lg:flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(d.deadline).toLocaleDateString()}
              </span>
            )}
            <Dialog
              open={detailOpen && selected?.id === d.id}
              onOpenChange={(o) => { if (o) onSelect(d); else onClose(); }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                  <Eye className="h-3 w-3" />
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{d.jobTitle}</DialogTitle>
                  <DialogDescription>{d.companyName} · {d.location}</DialogDescription>
                </DialogHeader>
                {selected && <DemandDetailContent demand={selected} />}
              </DialogContent>
            </Dialog>
            <Button size="sm" asChild className="gap-1 h-8 text-xs">
              <Link href={`/agent/bulk-upload?demandId=${d.id}`}>
                <Users className="h-3 w-3" />
                Submit
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── TABLE ROW ────────────────────────────────────────────────────────────────
function TableView({ demands, onSelect, onClose, selected, detailOpen }: {
  demands: Demand[]
  onSelect: (d: Demand) => void
  onClose: () => void
  selected: Demand | null
  detailOpen: boolean
}) {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border/60">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Job Title</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Company</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">Location</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">Salary</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Filled</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap hidden xl:table-cell">Deadline</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demands.map((d, i) => (
              <tr
                key={d.id}
                className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
              >
                <td className="px-4 py-3">
                  <span className="font-medium hover:text-primary transition-colors cursor-default">{d.jobTitle}</span>
                  {d.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {d.skills.slice(0, 2).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs px-1 py-0">{s}</Badge>
                      ))}
                      {d.skills.length > 2 && <Badge variant="outline" className="text-xs px-1 py-0">+{d.skills.length - 2}</Badge>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {d.companyName}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {d.location || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap text-muted-foreground">
                  {formatSalary(d.salary)}
                </td>
                <td className="px-4 py-3">
                  <div className="min-w-[80px]">
                    <FillBar filled={d.filledPositions} total={d.positions} />
                  </div>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground whitespace-nowrap">
                  {d.deadline ? new Date(d.deadline).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={d.status === "open" ? "default" : "secondary"} className="capitalize text-xs">
                    {d.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Dialog
                      open={detailOpen && selected?.id === d.id}
                      onOpenChange={(o) => { if (o) onSelect(d); else onClose(); }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{d.jobTitle}</DialogTitle>
                          <DialogDescription>{d.companyName} · {d.location}</DialogDescription>
                        </DialogHeader>
                        {selected && <DemandDetailContent demand={selected} />}
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" asChild className="gap-1 h-7 text-xs px-2">
                      <Link href={`/agent/bulk-upload?demandId=${d.id}`}>
                        <Users className="h-3 w-3" />
                        Submit
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AgentDemandsPage() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  useEffect(() => {
    fetch("/api/agency/demands")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.demands) setDemands(data.demands)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const openDemands = demands.filter((d) => d.status === "open")
  const filtered = openDemands.filter(
    (d) =>
      d.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      d.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (d.location && d.location.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSelect = (d: Demand) => {
    setSelectedDemand(d)
    setDetailOpen(true)
  }

  const handleClose = () => {
    setDetailOpen(false)
    setSelectedDemand(null)
  }

  // Stats
  const totalPositions = openDemands.reduce((sum, d) => sum + d.positions, 0)
  const totalFilled = openDemands.reduce((sum, d) => sum + d.filledPositions, 0)
  const totalOpen = openDemands.length

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Company Demands</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View open demands and upload CVs for any role
          </p>
        </div>
        <Button asChild className="gap-2 shrink-0 self-start">
          <Link href="/agent/bulk-upload">
            <Users className="h-4 w-4" />
            Submit Candidates
          </Link>
        </Button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Open Demands", value: totalOpen, icon: Briefcase, color: "text-blue-500" },
          { label: "Total Positions", value: totalPositions, icon: Users, color: "text-violet-500" },
          { label: "Filled", value: totalFilled, icon: TrendingUp, color: "text-emerald-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title, company, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Result count */}
          <span className="text-sm text-muted-foreground hidden sm:block">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border/60 p-1 gap-0.5 bg-muted/30">
            {([
              { mode: "grid" as ViewMode, icon: LayoutGrid, label: "Grid" },
              { mode: "list" as ViewMode, icon: List, label: "List" },
              { mode: "table" as ViewMode, icon: Table2, label: "Table" },
            ]).map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode(mode)}
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium">No open demands found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Try a different search term" : "Check back later for new roles"}
            </p>
            {search && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch("")}>
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Grid View ── */}
          {viewMode === "grid" && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((d) => (
                <GridCard
                  key={d.id}
                  d={d}
                  onSelect={handleSelect}
                  onClose={handleClose}
                  selected={selectedDemand}
                  detailOpen={detailOpen}
                />
              ))}
            </div>
          )}

          {/* ── List View ── */}
          {viewMode === "list" && (
            <div className="flex flex-col gap-2">
              {filtered.map((d) => (
                <ListRow
                  key={d.id}
                  d={d}
                  onSelect={handleSelect}
                  onClose={handleClose}
                  selected={selectedDemand}
                  detailOpen={detailOpen}
                />
              ))}
            </div>
          )}

          {/* ── Table View ── */}
          {viewMode === "table" && (
            <TableView
              demands={filtered}
              onSelect={handleSelect}
              onClose={handleClose}
              selected={selectedDemand}
              detailOpen={detailOpen}
            />
          )}
        </>
      )}
    </div>
  )
}
"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { MessageBanner } from "@/components/ui/message-banner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Search,
  Edit,
  Trash2,
  Loader2,
  Users,
  Plus,
  X,
  Upload,
  ChevronDown,
  Eye,
} from "lucide-react"
import { PageLoader } from "@/components/page-loader"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidateRow {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  skills: string[]
  status: string
  source: string
  agentId?: string
  currentJobTitle?: string
  currentLocation: string
  createdAt: string
  // Optional extra fields for detail view
  dateOfBirth?: string
  gender?: string
  nationality?: string
  maritalStatus?: string
  currentSalary?: string
  salaryExpectation?: string
  visaValidity?: string
  languages?: string[]
  remarks?: string
}

interface JobCategoryOption { id: string; name: string }
interface AgentOption       { id: string; name: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "",
  dateOfBirth: "", gender: "", nationality: "",
  jobCategoryId: "", currentSalary: "", salaryExpectation: "",
  currentLocation: "", maritalStatus: "", visaValidity: "", remarks: "",
  skills: [] as string[],
  languages: [] as string[],
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  available:     { label: "Available",     className: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" },
  under_bidding: { label: "Under Bidding", className: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  interviewed:   { label: "Interviewed",   className: "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800" },
  selected:      { label: "Selected",      className: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800" },
  on_hold:       { label: "On Hold",       className: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
}

const SOURCE_MAP: Record<string, string> = {
  referral:    "Referral",
  bulk_upload: "Bulk Upload",
  manual:      "Manual",
  link:        "Link",
}

const SKILL_SUGGESTIONS = [
  "React","Node.js","Python","TypeScript","AWS","DevOps","Docker",
  "Machine Learning","SQL","MongoDB","Java","PHP","Flutter","iOS","Android",
  "Project Management","Sales","Marketing","Finance","HR","Logistics",
]

const LANGUAGE_OPTIONS = [
  "English","Arabic","French","Spanish","Hindi","Urdu",
  "Malayalam","Tamil","Tagalog","Bengali","Sinhala","Nepali",
]

const GENDER_OPTIONS   = ["Male", "Female", "Prefer not to say"]
const MARITAL_OPTIONS  = ["Single", "Married", "Divorced", "Widowed"]

// ─── Reusable form primitives ─────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function Field({
  label, required, hint, children, className,
}: {
  label: string; required?: boolean; hint?: string
  children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground leading-none">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function NativeSelect({
  value, onChange, required, placeholder, children, className,
}: {
  value: string; onChange: (v: string) => void
  required?: boolean; placeholder?: string
  children: React.ReactNode; className?: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className={cn(
          "appearance-none w-full h-9 rounded-md border border-input bg-background px-3 pr-8 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          !value ? "text-muted-foreground" : "text-foreground",
          className,
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  )
}

function TagInput({
  tags, onChange, suggestions = [], placeholder = "Type and press Enter…",
}: {
  tags: string[]; onChange: (t: string[]) => void
  suggestions?: string[]; placeholder?: string
}) {
  const [input, setInput]   = useState("")
  const [open, setOpen]     = useState(false)
  const inputRef            = useRef<HTMLInputElement>(null)
  const containerRef        = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
  )

  function add(tag: string) {
    const t = tag.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput(""); setOpen(false)
  }
  function remove(tag: string) { onChange(tags.filter(t => t !== tag)) }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter")     { e.preventDefault(); if (input.trim()) add(input) }
    if (e.key === "Backspace" && !input && tags.length) remove(tags[tags.length - 1])
    if (e.key === "Escape")    setOpen(false)
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "min-h-9 w-full rounded-md border border-input bg-background px-2.5 py-1.5",
          "flex flex-wrap gap-1.5 cursor-text focus-within:ring-2 focus-within:ring-ring",
        )}
      >
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs font-medium">
            {tag}
            <button type="button" onClick={e => { e.stopPropagation(); remove(tag) }}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-border bg-popover shadow-md py-1 max-h-44 overflow-y-auto">
          {filtered.map(s => (
            <button key={s} type="button"
              onMouseDown={e => { e.preventDefault(); add(s) }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Avatar({ firstName = "", lastName = "" }: { firstName?: string; lastName?: string }) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold select-none">
      {initials}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [agencyId, setAgencyId]     = useState("")
  const [message, setMessage]       = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Add dialog
  const [addOpen, setAddOpen]       = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [selectedAgentId, setSelectedAgentId] = useState("")
  const [cvFile, setCvFile]         = useState<File | null>(null)
  const [creating, setCreating]     = useState(false)
  const [jobCategories, setJobCategories] = useState<JobCategoryOption[]>([])
  const [agents, setAgents]         = useState<AgentOption[]>([])

  // Edit dialog
  const [editCandidate, setEditCandidate] = useState<CandidateRow | null>(null)
  const [editOpen, setEditOpen]     = useState(false)
  const [editSkillTags, setEditSkillTags] = useState<string[]>([])
  const [saving, setSaving]         = useState(false)

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" })

  // Details side panel
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<CandidateRow | null>(null)

  // helpers
  const setField = (key: keyof typeof EMPTY_FORM) =>
    (value: string | string[]) => setForm(prev => ({ ...prev, [key]: value }))
  const setStr = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setField(key)(e.target.value)

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) return
    const { agencyId: aid } = JSON.parse(user)
    setAgencyId(aid)
    loadCandidates(aid)

    fetch("/api/admin/job-categories").then(r => r.json()).then(d => {
      if (d.categories) setJobCategories(d.categories.map((c: any) => ({ id: c.id, name: c.name })))
    }).catch(console.error)

    fetch(`/api/agency/agents?agencyId=${aid}`).then(r => r.json()).then(d => {
      if (d.success && d.agents) setAgents(d.agents.map((a: any) => ({ id: a.id, name: a.name })))
    }).catch(console.error)
  }, [])

  async function loadCandidates(aid: string) {
    try {
      const res  = await fetch(`/api/agency/candidates?agencyId=${aid}`)
      const data = await res.json()
      if (data.success) setCandidates(data.candidates)
    } catch { setMessage({ type: "error", text: "Failed to load candidates" }) }
    finally  { setLoading(false) }
  }

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    const matchSearch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.skills.some(s => s.toLowerCase().includes(q))
    return (
      matchSearch &&
      (statusFilter === "all" || c.status === statusFilter) &&
      (sourceFilter === "all" || c.source === sourceFilter)
    )
  })

  // ── Create ──────────────────────────────────────────────────────────────────
  async function handleCreateCandidate(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!form.jobCategoryId) { setMessage({ type: "error", text: "Select a job category" }); return }
    if (!selectedAgentId)    { setMessage({ type: "error", text: "Select an agent" }); return }
    if (!cvFile)             { setMessage({ type: "error", text: "Upload a CV" }); return }

    setCreating(true)
    try {
      const fd = new FormData()
      const textFields = [
        "firstName","lastName","email","phone","dateOfBirth","gender","nationality",
        "currentLocation","maritalStatus","currentSalary","salaryExpectation","visaValidity","remarks",
      ] as const
      textFields.forEach(k => { if (form[k]) fd.append(k, form[k] as string) })
      if (form.languages.length) fd.append("languages", form.languages.join(", "))
      if (form.skills.length)    fd.append("skill", form.skills.join(", "))
      fd.append("jobCategories", JSON.stringify([form.jobCategoryId]))
      fd.append("agencyId", agencyId)
      fd.append("agentId", selectedAgentId)
      fd.append("cvUpload", cvFile)

      const res  = await fetch("/api/agency/manual-candidates", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error || "Failed to create candidate" }); return
      }
      setMessage({ type: "success", text: "Candidate created" })
      setAddOpen(false); setForm(EMPTY_FORM); setCvFile(null); setSelectedAgentId("")
      loadCandidates(agencyId)
    } catch { setMessage({ type: "error", text: "Failed to create candidate" }) }
    finally   { setCreating(false) }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  function openEdit(c: CandidateRow) {
    setEditCandidate({ ...c })
    setEditSkillTags([...(c.skills ?? [])])
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!editCandidate) return
    setMessage(null); setSaving(true)
    try {
      const res  = await fetch(`/api/agency/candidate/${editCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName:       editCandidate.firstName,
          lastName:        editCandidate.lastName,
          phone:           editCandidate.phone,
          skills:          editSkillTags,
          currentLocation: editCandidate.currentLocation,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Candidate updated" })
        setEditOpen(false); loadCandidates(agencyId)
      } else {
        setMessage({ type: "error", text: data.error || "Update failed" })
      }
    } catch { setMessage({ type: "error", text: "Update failed" }) }
    finally  { setSaving(false) }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function confirmDelete() {
    const id = deleteConfirm.id
    try {
      const res  = await fetch(`/api/agency/candidate/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Candidate deleted" })
        setCandidates(prev => prev.filter(c => c.id !== id))
      } else { setMessage({ type: "error", text: data.error || "Delete failed" }) }
    } catch { setMessage({ type: "error", text: "Delete failed" }) }
  }

  if (loading) return <PageLoader />

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <MessageBanner message={message} onDismiss={() => setMessage(null)} className="mb-1" />

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Candidates{" "}
            <span className="font-normal text-muted-foreground text-lg">({candidates.length})</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your agency candidate database</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2 h-9">
          <Plus className="h-4 w-4" /> Add Candidate
        </Button>
      </div>

      {/* Filters bar */}
      <Card className="shadow-none">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search name, email, skills…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="under_bidding">Under Bidding</SelectItem>
                <SelectItem value="interviewed">Interviewed</SelectItem>
                <SelectItem value="selected">Selected</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="bulk_upload">Bulk Upload</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-none overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Users className="h-10 w-10 opacity-25" />
              <p className="text-sm font-medium">No candidates found</p>
              <p className="text-xs opacity-60">
                {search || statusFilter !== "all" || sourceFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first candidate to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {["Name","Email","Location","Skills","Status","Source","Actions"].map(h => (
                      <TableHead key={h}
                        className={cn(
                          "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground h-9",
                          h === "Actions" && "text-right",
                        )}>
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const status = STATUS_MAP[c.status]
                    return (
                      <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar firstName={c.firstName} lastName={c.lastName} />
                            <span className="font-medium text-sm">{c.firstName} {c.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground py-3">{c.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground py-3">{c.currentLocation || "—"}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {c.skills?.slice(0, 2).map(s => (
                              <Badge key={s} variant="secondary" className="text-xs px-2 py-0 font-normal">{s}</Badge>
                            ))}
                            {(c.skills?.length ?? 0) > 2 && (
                              <Badge variant="secondary" className="text-xs px-2 py-0 font-normal">+{c.skills.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {status ? (
                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
                              {status.label}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground capitalize">{c.status?.replace(/_/g, " ")}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-xs font-normal capitalize">
                            {SOURCE_MAP[c.source] ?? c.source?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="View details"
                              onClick={() => {
                                setSelected(c)
                                setDetailOpen(true)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title="Edit"
                              onClick={() => openEdit(c)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Delete"
                              onClick={() => setDeleteConfirm({ open: true, id: c.id })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add Candidate Modal ─────────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Add Candidate</DialogTitle>
              <DialogDescription className="text-xs">Fill in the candidate details and upload their CV.</DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleCreateCandidate} className="px-6 py-5 space-y-7">

            {/* Personal */}
            <section>
              <SectionHeading>Personal details</SectionHeading>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Field label="First name" required>
                  <Input value={form.firstName} onChange={setStr("firstName")} placeholder="e.g. James" required />
                </Field>
                <Field label="Last name" required>
                  <Input value={form.lastName} onChange={setStr("lastName")} placeholder="e.g. Adeyemi" required />
                </Field>
                <Field label="Date of birth">
                  <Input type="date" value={form.dateOfBirth} onChange={setStr("dateOfBirth")} />
                </Field>
                <Field label="Gender">
                  <NativeSelect value={form.gender} onChange={setField("gender")} placeholder="Select gender">
                    {GENDER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </NativeSelect>
                </Field>
                <Field label="Nationality">
                  <Input value={form.nationality} onChange={setStr("nationality")} placeholder="e.g. Indian" />
                </Field>
                <Field label="Marital status">
                  <NativeSelect value={form.maritalStatus} onChange={setField("maritalStatus")} placeholder="Select status">
                    {MARITAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </NativeSelect>
                </Field>
              </div>
            </section>

            {/* Contact */}
            <section>
              <SectionHeading>Contact</SectionHeading>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Field label="Email" required>
                  <Input type="email" value={form.email} onChange={setStr("email")} placeholder="name@example.com" required />
                </Field>
                <Field label="Phone" required>
                  <Input value={form.phone} onChange={setStr("phone")} placeholder="+44 7700 000000" required />
                </Field>
                <Field label="Current location" className="col-span-2">
                  <Input value={form.currentLocation} onChange={setStr("currentLocation")} placeholder="City, Country" />
                </Field>
              </div>
            </section>

            {/* Role */}
            <section>
              <SectionHeading>Role & compensation</SectionHeading>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Field label="Job category" required>
                  <NativeSelect value={form.jobCategoryId} onChange={setField("jobCategoryId")} placeholder="Select category" required>
                    {jobCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </NativeSelect>
                </Field>
                <Field label="Assign agent" required>
                  <NativeSelect value={selectedAgentId} onChange={setSelectedAgentId} placeholder="Select agent" required>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </NativeSelect>
                </Field>
                <Field label="Current salary">
                  <Input value={form.currentSalary} onChange={setStr("currentSalary")} placeholder="e.g. 60,000" />
                </Field>
                <Field label="Salary expectation">
                  <Input value={form.salaryExpectation} onChange={setStr("salaryExpectation")} placeholder="e.g. 75,000" />
                </Field>
                <Field label="Visa validity" className="col-span-2">
                  <Input value={form.visaValidity} onChange={setStr("visaValidity")} placeholder="e.g. Dec 2027 or N/A" />
                </Field>
              </div>
            </section>

            {/* Skills */}
            <section>
              <SectionHeading>Skills & languages</SectionHeading>
              <div className="grid gap-y-4">
                <Field label="Skills" hint="Type a skill and press Enter, or pick from suggestions">
                  <TagInput tags={form.skills} onChange={setField("skills")} suggestions={SKILL_SUGGESTIONS} placeholder="e.g. React, Node.js…" />
                </Field>
                <Field label="Languages" hint="Select or type spoken languages">
                  <TagInput tags={form.languages} onChange={setField("languages")} suggestions={LANGUAGE_OPTIONS} placeholder="e.g. English, Arabic…" />
                </Field>
              </div>
            </section>

            {/* Documents */}
            <section>
              <SectionHeading>Documents & notes</SectionHeading>
              <div className="grid gap-y-4">
                <Field label="CV upload" required hint="PDF, DOC or DOCX · max 10 MB">
                  <label className={cn(
                    "flex items-center gap-3 h-10 w-full rounded-md border border-dashed border-input",
                    "bg-muted/40 hover:bg-muted/70 px-3 cursor-pointer transition-colors text-sm text-muted-foreground",
                  )}>
                    <Upload className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{cvFile ? cvFile.name : "Click to upload CV…"}</span>
                    <input type="file" accept=".pdf,.doc,.docx" required className="sr-only"
                      onChange={e => setCvFile(e.target.files?.[0] ?? null)} />
                  </label>
                </Field>
                <Field label="Remarks">
                  <Input value={form.remarks} onChange={setStr("remarks")} placeholder="Any additional notes…" />
                </Field>
              </div>
            </section>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" className="h-9" disabled={creating} onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating} className="h-9 min-w-[150px] gap-2">
                {creating
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : <><Upload className="h-4 w-4" /> Create Candidate</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md p-0">
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Edit Candidate</DialogTitle>
              <DialogDescription className="text-xs">Update candidate information</DialogDescription>
            </DialogHeader>
          </div>

          {editCandidate && (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Field label="First name">
                  <Input value={editCandidate.firstName}
                    onChange={e => setEditCandidate({ ...editCandidate, firstName: e.target.value })} />
                </Field>
                <Field label="Last name">
                  <Input value={editCandidate.lastName}
                    onChange={e => setEditCandidate({ ...editCandidate, lastName: e.target.value })} />
                </Field>
              </div>
              <Field label="Phone">
                <Input value={editCandidate.phone}
                  onChange={e => setEditCandidate({ ...editCandidate, phone: e.target.value })} />
              </Field>
              <Field label="Location">
                <Input value={editCandidate.currentLocation}
                  onChange={e => setEditCandidate({ ...editCandidate, currentLocation: e.target.value })} />
              </Field>
              <Field label="Skills" hint="Type a skill and press Enter, or pick from suggestions">
                <TagInput tags={editSkillTags} onChange={setEditSkillTags} suggestions={SKILL_SUGGESTIONS} />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="outline" className="h-9" disabled={saving} onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={saving} className="h-9 min-w-[130px] gap-2">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={open => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Delete candidate?"
        description="This will permanently remove this candidate from your database. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {/* ── Details Side Panel ────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={(open) => {
        setDetailOpen(open)
        if (!open) setSelected(null)
      }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Candidate details
              </DialogTitle>
              <DialogDescription className="text-xs">
                Full profile information for this candidate.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selected && (
            <div className="px-6 py-5 space-y-6 text-sm">
              {/* Header summary */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar firstName={selected.firstName} lastName={selected.lastName} />
                  <div>
                    <p className="text-base font-semibold">
                      {selected.firstName} {selected.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selected.email}
                    </p>
                    {selected.currentLocation && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selected.currentLocation}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div>
                    {STATUS_MAP[selected.status] ? (
                      <span className={cn(
                        "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium",
                        STATUS_MAP[selected.status].className,
                      )}>
                        {STATUS_MAP[selected.status].label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground capitalize">
                        {selected.status?.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs font-normal capitalize">
                      {SOURCE_MAP[selected.source] ?? selected.source?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Added {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>

              {/* Personal / contact */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Personal
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <p className="text-muted-foreground">Date of birth</p>
                      <p className="font-medium">{selected.dateOfBirth || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium">{selected.gender || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nationality</p>
                      <p className="font-medium">{selected.nationality || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Marital status</p>
                      <p className="font-medium">{selected.maritalStatus || "—"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Contact
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium break-all">{selected.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{selected.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{selected.currentLocation || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role & compensation */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Role & compensation
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <p className="text-muted-foreground">Current salary</p>
                      <p className="font-medium">{selected.currentSalary || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Salary expectation</p>
                      <p className="font-medium">{selected.salaryExpectation || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Visa validity</p>
                      <p className="font-medium">{selected.visaValidity || "—"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Languages
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selected.languages && selected.languages.length > 0 ? (
                      selected.languages.map(lang => (
                        <Badge key={lang} variant="secondary" className="text-xs px-2 py-0 font-normal">
                          {lang}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">—</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.skills && selected.skills.length > 0 ? (
                    selected.skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs px-2 py-0 font-normal">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No skills added</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Notes
                </p>
                <p className="text-xs">
                  {selected.remarks || <span className="text-muted-foreground">No additional notes</span>}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
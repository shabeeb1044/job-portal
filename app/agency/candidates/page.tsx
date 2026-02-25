"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { MessageBanner } from "@/components/ui/message-banner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Search,
  Edit,
  Trash2,
  Eye,
  Upload,
  Loader2,
  Users,
  Tag,
} from "lucide-react"
import Link from "next/link"
import { PageLoader } from "@/components/page-loader"

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
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [editCandidate, setEditCandidate] = useState<CandidateRow | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [agencyId, setAgencyId] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" })

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) return
    const { agencyId: aid } = JSON.parse(user)
    setAgencyId(aid)
    loadCandidates(aid)
  }, [])

  const loadCandidates = async (aid: string) => {
    try {
      const res = await fetch(`/api/agency/candidates?agencyId=${aid}`)
      const data = await res.json()
      if (data.success) setCandidates(data.candidates)
    } catch {
      setMessage({ type: "error", text: "Failed to load candidates" })
    } finally {
      setLoading(false)
    }
  }

  const filtered = candidates.filter(c => {
    const matchSearch =
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    const matchSource = sourceFilter === "all" || c.source === sourceFilter
    return matchSearch && matchStatus && matchSource
  })

  const handleSaveEdit = async () => {
    if (!editCandidate) return
    setMessage(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/agency/candidate/${editCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editCandidate.firstName,
          lastName: editCandidate.lastName,
          phone: editCandidate.phone,
          skills: editCandidate.skills,
          currentLocation: editCandidate.currentLocation,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Candidate updated" })
        setEditOpen(false)
        loadCandidates(agencyId)
      } else {
        setMessage({ type: "error", text: data.error || "Update failed" })
      }
    } catch {
      setMessage({ type: "error", text: "Update failed" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ open: true, id })
  }

  const confirmDelete = async () => {
    const id = deleteConfirm.id
    try {
      const res = await fetch(`/api/agency/candidate/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Candidate deleted" })
        setCandidates(prev => prev.filter(c => c.id !== id))
      } else {
        setMessage({ type: "error", text: data.error || "Delete failed" })
      }
    } catch {
      setMessage({ type: "error", text: "Delete failed" })
    }
  }

  const statusColors: Record<string, string> = {
    available: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    under_bidding: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    interviewed: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    selected: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
    on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <MessageBanner message={message} onDismiss={() => setMessage(null)} className="mb-2" />
      {/* Header with actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Candidates ({candidates.length})</h1>
          <p className="text-sm text-muted-foreground">Manage your agency candidate database</p>
        </div>
        <Link href="/agency/bulk-upload">
          <Button><Upload className="mr-2 h-4 w-4" />Bulk Upload</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, email, skills..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
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
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="bulk_upload">Bulk Upload</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">No candidates found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell>{c.currentLocation || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.skills?.slice(0, 2).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                          {(c.skills?.length || 0) > 2 && <Badge variant="secondary" className="text-xs">+{c.skills.length - 2}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status] || ""}`}>
                          {c.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{c.source.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditCandidate({ ...c }); setEditOpen(true) }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>Update candidate information</DialogDescription>
          </DialogHeader>
          {editCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={editCandidate.firstName} onChange={e => setEditCandidate({ ...editCandidate, firstName: e.target.value })} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={editCandidate.lastName} onChange={e => setEditCandidate({ ...editCandidate, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editCandidate.phone} onChange={e => setEditCandidate({ ...editCandidate, phone: e.target.value })} />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={editCandidate.currentLocation} onChange={e => setEditCandidate({ ...editCandidate, currentLocation: e.target.value })} />
              </div>
              <div>
                <Label>Skills (comma separated)</Label>
                <Input
                  value={editCandidate.skills?.join(", ") || ""}
                  onChange={e => setEditCandidate({ ...editCandidate, skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                />
              </div>
              <Button onClick={handleSaveEdit} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        title="Delete candidate?"
        description="This will permanently remove this candidate from your database. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  FileCheck,
  XCircle,
  ArrowRight,
} from "lucide-react"
import { PageLoader } from "@/components/page-loader"
import { MessageBanner } from "@/components/ui/message-banner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface ApplicationRow {
  id: string
  candidateName: string
  demandTitle: string
  companyName: string
  status: string
  commission: number
  submittedAt: string
  agentId?: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [agencyId, setAgencyId] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [withdrawConfirm, setWithdrawConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" })

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) return
    const { agencyId: aid } = JSON.parse(user)
    setAgencyId(aid)

    fetch(`/api/agency/applications?agencyId=${aid}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setApplications(data.applications)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = applications.filter(a => {
    const matchSearch =
      a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      a.demandTitle.toLowerCase().includes(search.toLowerCase()) ||
      a.companyName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleWithdraw = (id: string) => {
    setWithdrawConfirm({ open: true, id })
  }

  const confirmWithdraw = async () => {
    const id = withdrawConfirm.id
    try {
      const res = await fetch("/api/agency/submit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id, status: "withdrawn", agencyId }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: "success", text: "Application withdrawn" })
        setApplications(prev => prev.map(a => a.id === id ? { ...a, status: "withdrawn" } : a))
      } else {
        setMessage({ type: "error", text: data.error || "Failed to withdraw" })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to withdraw" })
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    shortlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    selected: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    withdrawn: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  }

  const statusCounts = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    shortlisted: applications.filter(a => a.status === "shortlisted").length,
    selected: applications.filter(a => a.status === "selected").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <MessageBanner message={message} onDismiss={() => setMessage(null)} className="mb-2" />
      <div>
        <h1 className="text-2xl font-bold">Applications Tracking</h1>
        <p className="text-sm text-muted-foreground">Track your submissions to companies</p>
      </div>

      {/* Status Flow */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-4 py-2 dark:border-yellow-900 dark:bg-yellow-900/20">
              <span className="font-medium text-yellow-700 dark:text-yellow-400">Pending</span>
              <Badge variant="secondary">{statusCounts.pending}</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-2 dark:border-blue-900 dark:bg-blue-900/20">
              <span className="font-medium text-blue-700 dark:text-blue-400">Shortlisted</span>
              <Badge variant="secondary">{statusCounts.shortlisted}</Badge>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-4 py-2 dark:border-green-900 dark:bg-green-900/20">
              <span className="font-medium text-green-700 dark:text-green-400">Selected</span>
              <Badge variant="secondary">{statusCounts.selected}</Badge>
            </div>
            <span className="text-muted-foreground mx-2">|</span>
            <div className="flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-4 py-2 dark:border-red-900 dark:bg-red-900/20">
              <span className="font-medium text-red-700 dark:text-red-400">Rejected</span>
              <Badge variant="secondary">{statusCounts.rejected}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search candidate, demand, company..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="selected">Selected</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium text-muted-foreground">No applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(app => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.candidateName}</TableCell>
                      <TableCell>{app.demandTitle}</TableCell>
                      <TableCell className="text-muted-foreground">{app.companyName}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[app.status] || ""}`}>
                          {app.status}
                        </span>
                      </TableCell>
                      <TableCell>{app.commission > 0 ? `$${app.commission.toLocaleString()}` : "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(app.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {(app.status === "pending" || app.status === "shortlisted") && (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleWithdraw(app.id)}>
                            <XCircle className="mr-1 h-3 w-3" />Withdraw
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={withdrawConfirm.open}
        onOpenChange={(open) => setWithdrawConfirm(prev => ({ ...prev, open }))}
        title="Withdraw application?"
        description="Are you sure you want to withdraw this application? The company will no longer consider this submission."
        confirmLabel="Withdraw"
        variant="destructive"
        onConfirm={confirmWithdraw}
      />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageLoader } from "@/components/page-loader"
import {
  Building2,
  Briefcase,
  Check,
  X,
  Clock,
  ArrowLeft,
  Loader2,
  Inbox,
} from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type PendingItem = {
  type: "agency" | "company"
  id: string
  name: string
  email: string
  phone: string
  subscriptionPlan?: string
  subscriptionStatus?: string
  createdAt: string
  userActive: boolean
  userId: string
}

type DemandEditApprovalItem = {
  id: string
  demandId: string
  companyId: string
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  requestedByEmployeeName?: string
  requestedByUserId?: string
  changes: Record<string, unknown>
  demand: {
    id: string
    jobTitle?: string
    companyName?: string
    location?: string
    quantity?: number
    status?: string
    deadline?: string
  } | null
}

function formatValue(v: unknown) {
  if (v === undefined) return "—"
  if (v === null) return "null"
  if (typeof v === "string") return v || "—"
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

export default function AdminApprovalsPage() {
  const router = useRouter()
  const [pending, setPending] = useState<PendingItem[]>([])
  const [pendingDemandEdits, setPendingDemandEdits] = useState<DemandEditApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [counts, setCounts] = useState({ agencies: 0, companies: 0 })
  const [userRole, setUserRole] = useState<string | null>(null)
  const [jobCategories, setJobCategories] = useState<{ id: string; name: string }[]>([])
  const [jobSubCategories, setJobSubCategories] = useState<{ id: string; name: string }[]>([])
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean
    title: string
    description: string
    variant?: "default" | "destructive"
    action: "approve" | "reject"
    type: "agency" | "company"
    id: string
  } | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/admin/login")
      return
    }
    const userData = JSON.parse(user)
    if (userData.role !== "super_admin" && userData.role !== "admin") {
      router.push("/")
      return
    }
    setUserRole(userData.role)
    loadPending()
    loadPendingDemandEdits()
    loadJobCategories()
    loadJobSubCategories()
  }, [router])

  const loadPending = async () => {
    try {
      const response = await fetch("/api/admin/approvals")
      if (response.ok) {
        const data = await response.json()
        setPending(data.pending || [])
        setCounts(data.counts || { agencies: 0, companies: 0 })
      }
    } catch (error) {
      console.error("Failed to load pending approvals:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPendingDemandEdits = async () => {
    try {
      const response = await fetch("/api/admin/demand-approvals")
      if (response.ok) {
        const data = await response.json()
        setPendingDemandEdits(data.pending || [])
      }
    } catch (error) {
      console.error("Failed to load pending demand edits:", error)
    }
  }

  const loadJobCategories = async () => {
    try {
      const res = await fetch("/api/job-categories")
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.categories)) {
        setJobCategories(
          data.categories.map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          }))
        )
      }
    } catch {
      // ignore
    }
  }

  const loadJobSubCategories = async () => {
    try {
      const res = await fetch("/api/admin/job-sub-categories")
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.subCategories)) {
        setJobSubCategories(
          data.subCategories.map((s: { id: string; name: string }) => ({
            id: s.id,
            name: s.name,
          }))
        )
      }
    } catch {
      // ignore
    }
  }

  const getCategoryName = (id: unknown) => {
    const str = typeof id === "string" ? id : ""
    if (!str) return formatValue(id)
    const found = jobCategories.find((c) => c.id === str)
    return found ? `${found.name}` : str
  }

  const getSubCategoryName = (id: unknown) => {
    const str = typeof id === "string" ? id : ""
    if (!str) return formatValue(id)
    const found = jobSubCategories.find((s) => s.id === str)
    return found ? `${found.name}` : str
  }

  const handleAction = async (action: "approve" | "reject", type: "agency" | "company", id: string) => {
    setActingId(id)
    try {
      const response = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type, id }),
      })
      if (response.ok) {
        await loadPending()
      } else {
        const data = await response.json()
        console.error(data.error || "Action failed")
      }
    } catch (error) {
      console.error("Action failed:", error)
    } finally {
      setActingId(null)
    }
  }

  const runConfirmedAction = async () => {
    if (!confirmAction) return
    await handleAction(confirmAction.action, confirmAction.type, confirmAction.id)
    setConfirmAction(null)
  }

  const handleDemandEditAction = async (action: "approve" | "reject", requestId: string) => {
    const target = pendingDemandEdits.find((r) => r.id === requestId)
    const isDelete = target && (target.changes as any)?.markForDelete
    const label =
      action === "approve"
        ? isDelete
          ? "Approve delete demand request?"
          : "Approve demand edit request?"
        : "Reject demand request?"
    const ok = window.confirm(label)
    if (!ok) return

    const user = localStorage.getItem("user")
    const adminUserId = user ? (JSON.parse(user).id ?? undefined) : undefined
    setActingId(requestId)
    try {
      const response = await fetch("/api/admin/demand-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, requestId, adminUserId }),
      })
      if (response.ok) {
        await loadPendingDemandEdits()
      } else {
        const data = await response.json()
        console.error(data.error || "Action failed")
      }
    } catch (error) {
      console.error("Demand edit action failed:", error)
    } finally {
      setActingId(null)
    }
  }

  const pendingAgencies = pending.filter((p) => p.type === "agency")
  const pendingCompanies = pending.filter((p) => p.type === "company")

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <AdminNav role={userRole ?? undefined} />
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/admin/dashboard"
                className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
              <p className="mt-2 text-muted-foreground">
                Review and approve agencies and companies
              </p>
            </div>
            <Badge variant="secondary" className="w-fit text-base px-3 py-1">
              <Clock className="mr-1 h-4 w-4" />
              {pending.length} pending
            </Badge>
          </div>

          {loading ? (
            <PageLoader />
          ) : pending.length === 0 && pendingDemandEdits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No pending approvals</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  All agencies and companies are approved.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/admin/dashboard">Back to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full max-w-2xl grid-cols-4">
                <TabsTrigger value="all">
                  All ({pending.length + pendingDemandEdits.length})
                </TabsTrigger>
                <TabsTrigger value="agencies">
                  Agencies ({counts.agencies})
                </TabsTrigger>
                <TabsTrigger value="companies">
                  Companies ({counts.companies})
                </TabsTrigger>
                <TabsTrigger value="demand-edits">
                  Demand edits ({pendingDemandEdits.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>All Pending</CardTitle>
                    <CardDescription>
                      Approve or reject registration requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pending.map((item) => (
                          <TableRow key={`${item.type}-${item.id}`}>
                            <TableCell>
                              {item.type === "agency" ? (
                                <Badge variant="outline" className="gap-1">
                                  <Building2 className="h-3 w-3" />
                                  Agency
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  Company
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {item.subscriptionPlan || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  disabled={actingId === item.id}
                                  onClick={() => setConfirmAction({
                                    open: true,
                                    title: "Approve this " + item.type + "?",
                                    description: item.type === "agency" ? "This agency will be approved and can access the platform." : "This company will be approved and can access the platform.",
                                    action: "approve",
                                    type: item.type,
                                    id: item.id,
                                  })}
                                >
                                  {actingId === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actingId === item.id}
                                  onClick={() => setConfirmAction({
                                    open: true,
                                    title: "Reject this " + item.type + "?",
                                    description: item.type === "agency" ? "This agency will be rejected and will not be able to access the platform." : "This company will be rejected.",
                                    variant: "destructive",
                                    action: "reject",
                                    type: item.type,
                                    id: item.id,
                                  })}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {pendingDemandEdits.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Demand edit requests</CardTitle>
                      <CardDescription>Approve or reject company demand changes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Demand</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Requested</TableHead>
                            <TableHead>Changes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingDemandEdits.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">
                                {r.demand?.jobTitle || r.demandId}
                              </TableCell>
                              <TableCell>{r.demand?.companyName || r.companyId}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(r.requestedAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {r.changes && (r.changes as any).markForDelete ? (
                                  <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600">
                                    Delete demand (requires approval)
                                  </span>
                                ) : (
                                  <details className="group">
                                    <summary className="cursor-pointer select-none hover:text-foreground">
                                      {Object.keys(r.changes || {}).length} field(s)
                                    </summary>
                                    <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/20 p-3 text-xs text-foreground">
                                      {Object.entries(r.changes || {}).map(([key, nextVal]) => {
                                        let prevVal: unknown = (r.demand as any)?.[key]
                                        let shownNext: unknown = nextVal
                                        if (key === "jobCategoryId") {
                                          prevVal = getCategoryName(prevVal)
                                          shownNext = getCategoryName(nextVal)
                                        } else if (key === "jobSubCategoryId") {
                                          prevVal = getSubCategoryName(prevVal)
                                          shownNext = getSubCategoryName(nextVal)
                                        }
                                        const label =
                                          key === "jobCategoryId"
                                            ? "jobCategory"
                                            : key === "jobSubCategoryId"
                                              ? "jobSubCategory"
                                              : key
                                        return (
                                          <div key={key} className="space-y-1">
                                            <div className="font-semibold">{label}</div>
                                            <div className="grid gap-2 md:grid-cols-2">
                                              <div className="rounded-md bg-background/60 p-2">
                                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                  Old
                                                </div>
                                                <pre className="whitespace-pre-wrap break-words font-mono">{formatValue(prevVal)}</pre>
                                              </div>
                                              <div className="rounded-md bg-background/60 p-2">
                                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                  New
                                                </div>
                                                <pre className="whitespace-pre-wrap break-words font-mono">{formatValue(shownNext)}</pre>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </details>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={actingId === r.id}
                                    onClick={() => handleDemandEditAction("approve", r.id)}
                                  >
                                    {actingId === r.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actingId === r.id}
                                    onClick={() => handleDemandEditAction("reject", r.id)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="agencies" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Pending Agencies
                    </CardTitle>
                    <CardDescription>
                      {pendingAgencies.length} agencies awaiting approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingAgencies.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">
                        No pending agencies.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingAgencies.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.email}</TableCell>
                              <TableCell>{item.phone || "—"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{item.subscriptionPlan}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={actingId === item.id}
                                    onClick={() => setConfirmAction({
                                      open: true,
                                      title: "Approve agency?",
                                      description: "This agency will be approved and can access the platform.",
                                      action: "approve",
                                      type: "agency",
                                      id: item.id,
                                    })}
                                  >
                                    {actingId === item.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actingId === item.id}
                                    onClick={() => setConfirmAction({
                                      open: true,
                                      title: "Reject agency?",
                                      description: "This agency will be rejected and will not be able to access the platform.",
                                      variant: "destructive",
                                      action: "reject",
                                      type: "agency",
                                      id: item.id,
                                    })}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="companies" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Pending Companies
                    </CardTitle>
                    <CardDescription>
                      {pendingCompanies.length} companies awaiting approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingCompanies.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">
                        No pending companies.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingCompanies.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.email}</TableCell>
                              <TableCell>{item.phone || "—"}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {item.subscriptionPlan || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={actingId === item.id}
                                    onClick={() => setConfirmAction({
                                      open: true,
                                      title: "Approve company?",
                                      description: "This company will be approved and can access the platform.",
                                      action: "approve",
                                      type: "company",
                                      id: item.id,
                                    })}
                                  >
                                    {actingId === item.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actingId === item.id}
                                    onClick={() => setConfirmAction({
                                      open: true,
                                      title: "Reject company?",
                                      description: "This company will be rejected.",
                                      variant: "destructive",
                                      action: "reject",
                                      type: "company",
                                      id: item.id,
                                    })}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="demand-edits" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Demand edit requests</CardTitle>
                    <CardDescription>
                      {pendingDemandEdits.length} request(s) awaiting approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingDemandEdits.length === 0 ? (
                      <p className="py-8 text-center text-muted-foreground">No pending demand edit requests.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Demand</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Requested</TableHead>
                            <TableHead>Changes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingDemandEdits.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">
                                {r.demand?.jobTitle || r.demandId}
                              </TableCell>
                              <TableCell>{r.demand?.companyName || r.companyId}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(r.requestedAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {r.changes && (r.changes as any).markForDelete ? (
                                  <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600">
                                    Delete demand (requires approval)
                                  </span>
                                ) : (
                                  <details className="group">
                                    <summary className="cursor-pointer select-none hover:text-foreground">
                                      {Object.keys(r.changes || {}).length} field(s)
                                    </summary>
                                    <div className="mt-2 space-y-2 rounded-lg border border-border bg-muted/20 p-3 text-xs text-foreground">
                                      {Object.entries(r.changes || {}).map(([key, nextVal]) => {
                                        let prevVal: unknown = (r.demand as any)?.[key]
                                        let shownNext: unknown = nextVal
                                        if (key === "jobCategoryId") {
                                          prevVal = getCategoryName(prevVal)
                                          shownNext = getCategoryName(nextVal)
                                        } else if (key === "jobSubCategoryId") {
                                          prevVal = getSubCategoryName(prevVal)
                                          shownNext = getSubCategoryName(nextVal)
                                        }
                                        const label =
                                          key === "jobCategoryId"
                                            ? "jobCategory"
                                            : key === "jobSubCategoryId"
                                              ? "jobSubCategory"
                                              : key
                                        return (
                                          <div key={key} className="space-y-1">
                                            <div className="font-semibold">{label}</div>
                                            <div className="grid gap-2 md:grid-cols-2">
                                              <div className="rounded-md bg-background/60 p-2">
                                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                  Old
                                                </div>
                                                <pre className="whitespace-pre-wrap break-words font-mono">{formatValue(prevVal)}</pre>
                                              </div>
                                              <div className="rounded-md bg-background/60 p-2">
                                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                                  New
                                                </div>
                                                <pre className="whitespace-pre-wrap break-words font-mono">{formatValue(shownNext)}</pre>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </details>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={actingId === r.id}
                                    onClick={() => handleDemandEditAction("approve", r.id)}
                                  >
                                    {actingId === r.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={actingId === r.id}
                                    onClick={() => handleDemandEditAction("reject", r.id)}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {confirmAction && (
        <ConfirmDialog
          open={confirmAction.open}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmAction.title}
          description={confirmAction.description}
          variant={confirmAction.variant}
          confirmLabel="Confirm"
          onConfirm={runConfirmedAction}
          loading={!!actingId}
        />
      )}
    </div>
  )
}

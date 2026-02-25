"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Check,
  X,
  Search,
  Eye,
  FileText,
  Download,
  Ban,
  Loader2,
  Trash2,
  Archive,
  UserCheck,
  UserX,
} from "lucide-react"
import Link from "next/link"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface AgencyRow {
  id: string
  name: string
  email: string
  phone: string
  isActive: boolean
  approvalStatus?: string
  subscriptionPlan: string
  subscriptionStatus: string
  proofDocumentUrl?: string
  totalCandidates: number
  createdAt: string
}

export default function AgenciesManagementPage() {
  const router = useRouter()
  const [agencies, setAgencies] = useState<AgencyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAgency, setSelectedAgency] = useState<AgencyRow | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean
    title: string
    description: string
    variant?: "default" | "destructive"
    agencyId: string
    action:
      | "approve"
      | "reject"
      | "deactivate"
      | "moveToSpam"
      | "setActive"
      | "setInactive"
      | "delete"
      | "updateStatus"
    approvalStatus?: string
    isActive?: boolean
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
    loadAgencies()
  }, [router])

  const loadAgencies = async () => {
    try {
      const response = await fetch("/api/admin/agencies")
      if (response.ok) {
        const data = await response.json()
        setAgencies(data.agencies || [])
      }
    } catch (error) {
      console.error("Failed to load agencies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (
    agencyId: string,
    action:
      | "approve"
      | "reject"
      | "deactivate"
      | "moveToSpam"
      | "setActive"
      | "setInactive"
      | "delete"
  ) => {
    setActionLoading(agencyId + action)
    try {
      const response = await fetch("/api/admin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, agencyId }),
      })
      if (response.ok) {
        await loadAgencies()
        setSelectedAgency(null)
      }
    } catch (error) {
      console.error(`Failed to ${action} agency:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusUpdate = async (
    agencyId: string,
    approvalStatus: string,
    isActive?: boolean
  ) => {
    const key = agencyId + "updateStatus"
    setActionLoading(key)
    try {
      const response = await fetch("/api/admin/agencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStatus",
          agencyId,
          approvalStatus,
          ...(typeof isActive === "boolean" && { isActive }),
        }),
      })
      if (response.ok) {
        const data = await response.json()
        await loadAgencies()
        if (selectedAgency?.id === agencyId && data.agency) {
          setSelectedAgency(data.agency as AgencyRow)
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const runConfirmedAction = async () => {
    if (!confirmAction) return
    const { agencyId, action, approvalStatus, isActive } = confirmAction
    if (action === "updateStatus") {
      await handleStatusUpdate(agencyId, approvalStatus ?? "pending", isActive)
    } else {
      await handleAction(agencyId, action)
    }
    setConfirmAction(null)
  }

  const getStatus = (agency: AgencyRow) =>
    agency.approvalStatus || (agency.isActive ? "approved" : "pending")

  const getStatusTriggerClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/40 hover:bg-green-500/25"
      case "rejected":
        return "bg-destructive/15 text-destructive border-destructive/40 hover:bg-destructive/25"
      case "spam":
        return "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/40 hover:bg-zinc-500/25"
      default:
        return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/25"
    }
  }

  const getApprovalBadge = (agency: AgencyRow) => {
    const status = getStatus(agency)
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "spam":
        return <Badge className="bg-zinc-600 hover:bg-zinc-700">Spam</Badge>
      default:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending</Badge>
    }
  }

  const getActiveBadge = (agency: AgencyRow) =>
    agency.isActive ? (
      <Badge variant="secondary" className="bg-green-500/15 text-green-700 dark:text-green-400">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-muted text-muted-foreground">Inactive</Badge>
    )

  const mainList = agencies.filter((a) => getStatus(a) !== "spam")
  const spamList = agencies.filter((a) => getStatus(a) === "spam")

  const filterAndSort = (list: AgencyRow[]) => {
    return list
      .filter(
        (agency) =>
          agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agency.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
  }

  const filteredMain = filterAndSort(mainList)
  const filteredSpam = filterAndSort(spamList)

  const pendingCount = mainList.filter((a) => getStatus(a) === "pending").length

  const renderActions = (agency: AgencyRow) => {
    const status = getStatus(agency)
    const key = (act: string) => agency.id + act

    return (
      <div className="flex flex-wrap gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedAgency(agency)}
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </Button>

        {status === "pending" && (
          <>
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={!!actionLoading}
              onClick={() => setConfirmAction({
                open: true,
                title: "Approve agency?",
                description: "This agency will be approved and can access the platform.",
                agencyId: agency.id,
                action: "approve",
              })}
              title="Approve"
            >
              {actionLoading === key("approve") ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!!actionLoading}
              onClick={() => setConfirmAction({
                open: true,
                title: "Reject agency?",
                description: "This agency will be rejected and will not be able to access the platform.",
                variant: "destructive",
                agencyId: agency.id,
                action: "reject",
              })}
              title="Reject"
            >
              {actionLoading === key("reject") ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </>
        )}

        {(status === "approved" || status === "rejected") && (
          <>
            {status === "approved" && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                disabled={!!actionLoading}
                onClick={() => setConfirmAction({
                  open: true,
                  title: "Reject agency?",
                  description: "This agency will be rejected (after approval).",
                  variant: "destructive",
                  agencyId: agency.id,
                  action: "reject",
                })}
                title="Reject (after approval)"
              >
                {actionLoading === key("reject") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            )}
            {agency.isActive ? (
              <Button
                variant="outline"
                size="sm"
                disabled={!!actionLoading}
                onClick={() => setConfirmAction({
                  open: true,
                  title: "Set inactive?",
                  description: "This agency will be set to inactive and will not be able to access the platform until reactivated.",
                  agencyId: agency.id,
                  action: "setInactive",
                })}
                title="Set Inactive"
              >
                {actionLoading === key("setInactive") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 hover:bg-green-500/10"
                disabled={!!actionLoading}
                onClick={() => setConfirmAction({
                  open: true,
                  title: "Set active?",
                  description: "This agency will be activated and can access the platform again.",
                  agencyId: agency.id,
                  action: "setActive",
                })}
                title="Set Active"
              >
                {actionLoading === key("setActive") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
              </Button>
            )}
          </>
        )}

        {status !== "spam" && (
          <Button
            variant="outline"
            size="sm"
            className="text-amber-600 hover:bg-amber-500/10"
            disabled={!!actionLoading}
            onClick={() => setConfirmAction({
              open: true,
              title: "Move to spam?",
              description: "This agency will be moved to spam. You can delete it permanently from the Spam tab.",
              variant: "destructive",
              agencyId: agency.id,
              action: "moveToSpam",
            })}
            title="Move to spam"
          >
            {actionLoading === key("moveToSpam") ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </Button>
        )}

        {status === "spam" && (
          <Button
            variant="destructive"
            size="sm"
            disabled={!!actionLoading}
            onClick={() => setConfirmAction({
              open: true,
              title: "Delete permanently?",
              description: "This agency will be permanently deleted. This action cannot be undone.",
              variant: "destructive",
              agencyId: agency.id,
              action: "delete",
            })}
            title="Delete permanently"
          >
            {actionLoading === key("delete") ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    )
  }

  const renderTable = (list: AgencyRow[], showActive = true) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          {showActive && <TableHead>Active</TableHead>}
          <TableHead>Document</TableHead>
          <TableHead>Candidates</TableHead>
          <TableHead>Registered</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.map((agency) => (
          <TableRow key={agency.id}>
            <TableCell className="font-medium">{agency.name}</TableCell>
            <TableCell>{agency.email}</TableCell>
            <TableCell>{agency.phone}</TableCell>
            <TableCell>
              <Select
                value={getStatus(agency)}
                onValueChange={(v) => handleStatusUpdate(agency.id, v)}
                disabled={!!actionLoading}
              >
                <SelectTrigger
                  size="sm"
                  className={`w-[120px] h-8 font-medium ${getStatusTriggerClass(getStatus(agency))}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            {showActive && (
              <TableCell>{getStatus(agency) !== "spam" ? getActiveBadge(agency) : "—"}</TableCell>
            )}
            <TableCell>
              {agency.proofDocumentUrl ? (
                <a
                  href={agency.proofDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  View
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </TableCell>
            <TableCell>{agency.totalCandidates}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {agency.createdAt
                ? new Date(agency.createdAt).toLocaleDateString()
                : "—"}
            </TableCell>
            <TableCell className="text-right">{renderActions(agency)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <AdminNav role={userRole ?? undefined} />

          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Agencies Management</h1>
              <p className="mt-2 text-muted-foreground">
                Manage, approve, and moderate recruitment agencies (newest first)
              </p>
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1">
                {pendingCount} Pending Approval{pendingCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full max-w-sm grid-cols-2">
              <TabsTrigger value="all">
                All Agencies ({mainList.length})
              </TabsTrigger>
              <TabsTrigger value="spam">
                Spam ({spamList.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle>All Agencies</CardTitle>
                      <CardDescription>
                        Sorted by registration date (newest first). {filteredMain.length} shown.
                      </CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search agencies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredMain.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No agencies found</p>
                    </div>
                  ) : (
                    renderTable(filteredMain)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spam" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle>Spam</CardTitle>
                      <CardDescription>
                        Agencies moved to spam. You can delete them permanently here.
                      </CardDescription>
                    </div>
                    {spamList.length > 0 && (
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search spam..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-64"
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredSpam.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Archive className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No spam agencies</p>
                    </div>
                  ) : (
                    renderTable(filteredSpam, false)
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={!!selectedAgency} onOpenChange={() => setSelectedAgency(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agency Details</DialogTitle>
            <DialogDescription>Review agency information and proof document</DialogDescription>
          </DialogHeader>
          {selectedAgency && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Agency Name</p>
                  <p className="font-medium">{selectedAgency.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getApprovalBadge(selectedAgency)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  {getStatus(selectedAgency) !== "spam" ? getActiveBadge(selectedAgency) : "—"}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedAgency.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{selectedAgency.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Candidates</p>
                  <p className="text-sm font-medium">{selectedAgency.totalCandidates}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registered</p>
                  <p className="text-sm">
                    {selectedAgency.createdAt
                      ? new Date(selectedAgency.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-4">
                <p className="text-sm font-medium">Update status (Super Admin)</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Status</label>
                    <Select
                      value={getStatus(selectedAgency)}
                      onValueChange={(v) => setConfirmAction({
                        open: true,
                        title: "Update status?",
                        description: `Change agency status to "${v}"? This will update the agency's approval status.`,
                        agencyId: selectedAgency.id,
                        action: "updateStatus",
                        approvalStatus: v,
                      })}
                      disabled={!!actionLoading}
                    >
                      <SelectTrigger
                        className={`w-[140px] font-medium ${getStatusTriggerClass(getStatus(selectedAgency))}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="spam">Spam</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {getStatus(selectedAgency) !== "spam" && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Active</label>
                      <Select
                        value={selectedAgency.isActive ? "active" : "inactive"}
                        onValueChange={(v) => setConfirmAction({
                          open: true,
                          title: "Update active status?",
                          description: `Set agency to ${v}?`,
                          agencyId: selectedAgency.id,
                          action: "updateStatus",
                          approvalStatus: getStatus(selectedAgency),
                          isActive: v === "active",
                        })}
                        disabled={!!actionLoading}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium mb-2">Proof Document</p>
                {selectedAgency.proofDocumentUrl ? (
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {selectedAgency.proofDocumentUrl.split("/").pop()}
                      </p>
                    </div>
                    <a
                      href={selectedAgency.proofDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No document uploaded</p>
                )}
              </div>

              {getStatus(selectedAgency) === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={!!actionLoading}
                    onClick={() => setConfirmAction({
                      open: true,
                      title: "Approve agency?",
                      description: "This agency will be approved and can access the platform.",
                      agencyId: selectedAgency.id,
                      action: "approve",
                    })}
                  >
                    {actionLoading === selectedAgency.id + "approve" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Approve Agency
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={!!actionLoading}
                    onClick={() => setConfirmAction({
                      open: true,
                      title: "Reject agency?",
                      description: "This agency will be rejected and will not be able to access the platform.",
                      variant: "destructive",
                      agencyId: selectedAgency.id,
                      action: "reject",
                    })}
                  >
                    {actionLoading === selectedAgency.id + "reject" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Reject Agency
                  </Button>
                </div>
              )}

              {(getStatus(selectedAgency) === "approved" || getStatus(selectedAgency) === "rejected") && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {getStatus(selectedAgency) === "approved" && (
                    <Button
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={!!actionLoading}
                      onClick={() => setConfirmAction({
                        open: true,
                        title: "Reject agency?",
                        description: "This agency will be rejected (after approval).",
                        variant: "destructive",
                        agencyId: selectedAgency.id,
                        action: "reject",
                      })}
                    >
                      Reject (after approval)
                    </Button>
                  )}
                  {selectedAgency.isActive ? (
                    <Button
                      variant="outline"
                      disabled={!!actionLoading}
                      onClick={() => setConfirmAction({
                        open: true,
                        title: "Set inactive?",
                        description: "This agency will be set to inactive.",
                        agencyId: selectedAgency.id,
                        action: "setInactive",
                      })}
                    >
                      Set Inactive
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="text-green-600 hover:bg-green-500/10"
                      disabled={!!actionLoading}
                      onClick={() => setConfirmAction({
                        open: true,
                        title: "Set active?",
                        description: "This agency will be activated.",
                        agencyId: selectedAgency.id,
                        action: "setActive",
                      })}
                    >
                      Set Active
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="text-amber-600 hover:bg-amber-500/10"
                    disabled={!!actionLoading}
                    onClick={() => setConfirmAction({
                      open: true,
                      title: "Move to spam?",
                      description: "This agency will be moved to spam. You can delete it permanently from the Spam tab.",
                      variant: "destructive",
                      agencyId: selectedAgency.id,
                      action: "moveToSpam",
                    })}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Move to Spam
                  </Button>
                </div>
              )}

              {getStatus(selectedAgency) === "spam" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={!!actionLoading}
                    onClick={() => setConfirmAction({
                      open: true,
                      title: "Delete permanently?",
                      description: "This agency will be permanently deleted. This action cannot be undone.",
                      variant: "destructive",
                      agencyId: selectedAgency.id,
                      action: "delete",
                    })}
                  >
                    {actionLoading === selectedAgency.id + "delete" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete Permanently
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {confirmAction && (
        <ConfirmDialog
          open={confirmAction.open}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmAction.title}
          description={confirmAction.description}
          variant={confirmAction.variant}
          confirmLabel="Confirm"
          onConfirm={runConfirmedAction}
          loading={!!actionLoading}
        />
      )}
    </div>
  )
}

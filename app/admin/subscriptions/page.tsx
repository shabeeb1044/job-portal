"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  DialogFooter,
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
  FileText,
  ArrowLeft,
  Loader2,
  Building2,
  Briefcase,
  CreditCard,
  Pencil,
  Search,
  Calendar,
  History,
} from "lucide-react"
import { MessageBanner } from "@/components/ui/message-banner"

type AgencyRow = {
  id: string
  name: string
  email: string
  subscriptionPlan: string
  subscriptionStatus: string
  subscriptionExpiresAt?: string
  createdAt: string
}

type CompanyRow = {
  id: string
  name: string
  contactName: string
  contactEmail: string
  subscriptionPlan?: string
  subscriptionStatus?: string
  subscriptionExpiresAt?: string
  createdAt: string
}

type SubscriptionRecord = {
  id: string
  entityType: string
  entityId: string
  entityName: string
  plan: string
  amount: number
  status: string
  startDate: string
  endDate: string
  createdAt: string
}

type Stats = {
  activeAgencies: number
  expiredAgencies: number
  activeCompanies: number
  expiredCompanies: number
  totalActive: number
  totalExpired: number
  subscriptionRecords: number
}

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [agencies, setAgencies] = useState<AgencyRow[]>([])
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchAgency, setSearchAgency] = useState("")
  const [searchCompany, setSearchCompany] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editEntity, setEditEntity] = useState<{ type: "agency" | "company"; id: string; name: string } | null>(null)
  const [editForm, setEditForm] = useState({
    subscriptionPlan: "",
    subscriptionStatus: "",
    subscriptionExpiresAt: "",
  })
  const [saving, setSaving] = useState(false)

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
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions")
      if (res.ok) {
        const data = await res.json()
        setAgencies(data.agencies || [])
        setCompanies(data.companies || [])
        setSubscriptions(data.subscriptions || [])
        setStats(data.stats || null)
      }
    } catch (e) {
      console.error(e)
      setMessage({ type: "error", text: "Failed to load subscriptions" })
    } finally {
      setLoading(false)
    }
  }

  const openEditAgency = (a: AgencyRow) => {
    setEditEntity({ type: "agency", id: a.id, name: a.name })
    setEditForm({
      subscriptionPlan: a.subscriptionPlan || "basic",
      subscriptionStatus: a.subscriptionStatus || "expired",
      subscriptionExpiresAt: a.subscriptionExpiresAt
        ? a.subscriptionExpiresAt.slice(0, 10)
        : "",
    })
    setEditOpen(true)
  }

  const openEditCompany = (c: CompanyRow) => {
    setEditEntity({ type: "company", id: c.id, name: c.name })
    setEditForm({
      subscriptionPlan: c.subscriptionPlan || "bronze",
      subscriptionStatus: c.subscriptionStatus || "expired",
      subscriptionExpiresAt: c.subscriptionExpiresAt
        ? c.subscriptionExpiresAt.slice(0, 10)
        : "",
    })
    setEditOpen(true)
  }

  const saveSubscription = async () => {
    if (!editEntity) return
    setMessage(null)
    setSaving(true)
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: editEntity.type,
          entityId: editEntity.id,
          subscriptionPlan: editForm.subscriptionPlan,
          subscriptionStatus: editForm.subscriptionStatus,
          subscriptionExpiresAt: editForm.subscriptionExpiresAt || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Update failed" })
        setSaving(false)
        return
      }
      setMessage({ type: "success", text: "Subscription updated" })
      await loadData()
      setEditOpen(false)
      setEditEntity(null)
    } catch (e) {
      console.error(e)
      setMessage({ type: "error", text: "Request failed" })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (iso?: string) => {
    if (!iso) return "—"
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return iso
    }
  }

  const statusVariant = (s: string) => {
    if (s === "active") return "default"
    if (s === "expired") return "secondary"
    return "outline"
  }

  const filteredAgencies = agencies.filter(
    (a) =>
      !searchAgency ||
      a.name?.toLowerCase().includes(searchAgency.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchAgency.toLowerCase())
  )
  const filteredCompanies = companies.filter(
    (c) =>
      !searchCompany ||
      c.name?.toLowerCase().includes(searchCompany.toLowerCase()) ||
      c.contactEmail?.toLowerCase().includes(searchCompany.toLowerCase()) ||
      c.contactName?.toLowerCase().includes(searchCompany.toLowerCase())
  )

  if (userRole === null) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <AdminNav role={userRole} />
          <div className="mb-8">
            <Link
              href="/admin/dashboard"
              className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
            <p className="mt-2 text-muted-foreground">Active subscriptions and renewals</p>
          </div>

          {message && !editOpen && (
            <div className="mb-4">
              <MessageBanner message={message} onDismiss={() => setMessage(null)} />
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary cards */}
              {stats && (
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalActive}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.activeAgencies} agencies, {stats.activeCompanies} companies
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Expired / Cancelled</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalExpired}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.expiredAgencies} agencies, {stats.expiredCompanies} companies
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Agencies</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeAgencies + stats.expiredAgencies}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.activeAgencies} active
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Companies</CardTitle>
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeCompanies + stats.expiredCompanies}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.activeCompanies} active
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Tabs defaultValue="agencies" className="space-y-4">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="agencies">Agencies</TabsTrigger>
                  <TabsTrigger value="companies">Companies</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="agencies" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Agency subscriptions
                      </CardTitle>
                      <CardDescription>Manage plan and status per agency</CardDescription>
                      <div className="pt-2">
                        <div className="relative max-w-sm">
                          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search by name or email..."
                            value={searchAgency}
                            onChange={(e) => setSearchAgency(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredAgencies.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">No agencies found.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Expires</TableHead>
                              <TableHead className="w-[80px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAgencies.map((a) => (
                              <TableRow key={a.id}>
                                <TableCell className="font-medium">{a.name}</TableCell>
                                <TableCell>{a.email}</TableCell>
                                <TableCell className="capitalize">{a.subscriptionPlan || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant(a.subscriptionStatus)}>
                                    {a.subscriptionStatus || "—"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(a.subscriptionExpiresAt)}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => openEditAgency(a)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
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
                        Company subscriptions
                      </CardTitle>
                      <CardDescription>Manage plan and status per company</CardDescription>
                      <div className="pt-2">
                        <div className="relative max-w-sm">
                          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search by name or contact..."
                            value={searchCompany}
                            onChange={(e) => setSearchCompany(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {filteredCompanies.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">No companies found.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Company</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Expires</TableHead>
                              <TableHead className="w-[80px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCompanies.map((c) => (
                              <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.name}</TableCell>
                                <TableCell>{c.contactName || c.contactEmail}</TableCell>
                                <TableCell className="capitalize">{c.subscriptionPlan || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={statusVariant(c.subscriptionStatus || "")}>
                                    {c.subscriptionStatus || "—"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(c.subscriptionExpiresAt)}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => openEditCompany(c)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Subscription records
                      </CardTitle>
                      <CardDescription>History of subscription periods</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {subscriptions.length === 0 ? (
                        <p className="py-8 text-center text-muted-foreground">No subscription records yet.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Entity</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Start</TableHead>
                              <TableHead>End</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subscriptions
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((s) => (
                                <TableRow key={s.id}>
                                  <TableCell className="font-medium">{s.entityName}</TableCell>
                                  <TableCell className="capitalize">{s.entityType}</TableCell>
                                  <TableCell>{s.plan}</TableCell>
                                  <TableCell>${s.amount}</TableCell>
                                  <TableCell>
                                    <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                                  </TableCell>
                                  <TableCell>{formatDate(s.startDate)}</TableCell>
                                  <TableCell>{formatDate(s.endDate)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit subscription</DialogTitle>
            <DialogDescription>
              {editEntity?.name} — update plan and status below.
            </DialogDescription>
          </DialogHeader>
          {editEntity && (
            <div className="space-y-4 py-2">
              {message && editOpen && (
                <MessageBanner message={message} onDismiss={() => setMessage(null)} />
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Plan</label>
                <Select
                  value={editForm.subscriptionPlan}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, subscriptionPlan: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editEntity.type === "agency"
                      ? ["basic", "silver", "gold", "platinum"].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </SelectItem>
                        ))
                      : ["bronze", "silver", "gold"].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editForm.subscriptionStatus}
                  onValueChange={(v) => setEditForm((f) => ({ ...f, subscriptionStatus: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Expires (optional)
                </label>
                <Input
                  type="date"
                  value={editForm.subscriptionExpiresAt}
                  onChange={(e) => setEditForm((f) => ({ ...f, subscriptionExpiresAt: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSubscription} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

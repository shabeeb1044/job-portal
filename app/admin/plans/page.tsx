"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { CreditCard, ArrowLeft, Loader2, Plus, Pencil, Building2, Briefcase } from "lucide-react"
import { MessageBanner } from "@/components/ui/message-banner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type PlanRow = {
  id: string
  name: string
  type: "agency" | "company"
  level: string
  price: number
  features: { cvUploads?: number; biddingLimit?: number; jobOffers?: number; cvDownloads?: number; unlimitedDownloads?: boolean }
  isActive: boolean
  createdAt: string
}

export default function AdminPlansPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    type: "agency" as "agency" | "company",
    level: "",
    price: "",
    cvUploads: "",
    biddingLimit: "",
    jobOffers: "",
    cvDownloads: "",
    isActive: true,
  })

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
    loadPlans()
  }, [router])

  const loadPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans")
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: "",
      type: "agency",
      level: "basic",
      price: "",
      cvUploads: "",
      biddingLimit: "",
      jobOffers: "",
      cvDownloads: "",
      isActive: true,
    })
    setDialogOpen(true)
  }

  const openEdit = (p: PlanRow) => {
    setEditingId(p.id)
    const f = p.features || {}
    setForm({
      name: p.name,
      type: p.type,
      level: p.level,
      price: String(p.price),
      cvUploads: p.type === "agency" ? String(f.cvUploads ?? "") : "",
      biddingLimit: p.type === "agency" ? String(f.biddingLimit ?? "") : "",
      jobOffers: p.type === "agency" ? String(f.jobOffers ?? "") : "",
      cvDownloads: p.type === "company" ? String(f.cvDownloads ?? "") : "",
      isActive: p.isActive,
    })
    setDialogOpen(true)
  }

  const doSubmit = async () => {
    setMessage(null)
    setSaving(true)
    try {
      const price = parseFloat(form.price)
      if (isNaN(price) || price < 0) {
        setMessage({ type: "error", text: "Price must be a positive number" })
        setSaving(false)
        return
      }
      const features =
        form.type === "agency"
          ? {
              cvUploads: form.cvUploads ? (form.cvUploads === "-1" ? -1 : parseInt(form.cvUploads, 10)) : undefined,
              biddingLimit: form.biddingLimit ? (form.biddingLimit === "-1" ? -1 : parseInt(form.biddingLimit, 10)) : undefined,
              jobOffers: form.jobOffers ? (form.jobOffers === "-1" ? -1 : parseInt(form.jobOffers, 10)) : undefined,
            }
          : { cvDownloads: form.cvDownloads ? (form.cvDownloads === "-1" ? -1 : parseInt(form.cvDownloads, 10)) : undefined }

      if (editingId) {
        const res = await fetch("/api/admin/plans", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name: form.name,
            type: form.type,
            level: form.level,
            price,
            features,
            isActive: form.isActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Update failed" })
          setSaving(false)
          return
        }
        setMessage({ type: "success", text: "Plan updated" })
      } else {
        const res = await fetch("/api/admin/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            type: form.type,
            level: form.level,
            price,
            features,
            isActive: form.isActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Create failed" })
          setSaving(false)
          return
        }
        setMessage({ type: "success", text: "Plan created" })
      }
      await loadPlans()
      setDialogOpen(false)
      setSubmitConfirmOpen(false)
    } catch (e) {
      console.error(e)
      setMessage({ type: "error", text: "Request failed" })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(form.price)
    if (isNaN(price) || price < 0) {
      setMessage({ type: "error", text: "Price must be a positive number" })
      return
    }
    setSubmitConfirmOpen(true)
  }

  const agencyPlans = plans.filter((p) => p.type === "agency")
  const companyPlans = plans.filter((p) => p.type === "company")
  const agencyLevels = ["basic", "silver", "gold", "platinum"]
  const companyLevels = ["bronze", "silver", "gold"]

  if (userRole === null) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <AdminNav role={userRole} />
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/admin/dashboard" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-foreground">Subscription Plans</h1>
              <p className="mt-2 text-muted-foreground">Manage agency and company plans</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add plan
            </Button>
          </div>

          {message && !dialogOpen && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                message.type === "success" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Agency plans
                  </CardTitle>
                  <CardDescription>Plans for recruitment agencies</CardDescription>
                </CardHeader>
                <CardContent>
                  {agencyPlans.length === 0 ? (
                    <p className="text-muted-foreground py-4">No agency plans. Create one above.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>CV uploads</TableHead>
                          <TableHead>Bidding limit</TableHead>
                          <TableHead>Job offers</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agencyPlans.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>{p.level}</TableCell>
                            <TableCell>${p.price}</TableCell>
                            <TableCell>{p.features?.cvUploads === -1 ? "Unlimited" : p.features?.cvUploads ?? "-"}</TableCell>
                            <TableCell>{p.features?.biddingLimit === -1 ? "Unlimited" : p.features?.biddingLimit ?? "-"}</TableCell>
                            <TableCell>{p.features?.jobOffers === -1 ? "Unlimited" : p.features?.jobOffers ?? "-"}</TableCell>
                            <TableCell>
                              <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Company plans
                  </CardTitle>
                  <CardDescription>Plans for companies hiring talent</CardDescription>
                </CardHeader>
                <CardContent>
                  {companyPlans.length === 0 ? (
                    <p className="text-muted-foreground py-4">No company plans. Create one above.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>CV downloads</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companyPlans.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>{p.level}</TableCell>
                            <TableCell>${p.price}</TableCell>
                            <TableCell>{p.features?.cvDownloads === -1 ? "Unlimited" : p.features?.cvDownloads ?? "-"}</TableCell>
                            <TableCell>
                              <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
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
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit plan" : "Create plan"}</DialogTitle>
            <DialogDescription>Set name, type, level, price and feature limits. Use -1 for unlimited.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && dialogOpen && (
              <MessageBanner message={message} onDismiss={() => setMessage(null)} />
            )}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Silver"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v: "agency" | "company") => setForm((f) => ({ ...f, type: v, level: v === "agency" ? "basic" : "bronze" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select
                value={form.level}
                onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {form.type === "agency"
                    ? agencyLevels.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))
                    : companyLevels.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="99"
                required
              />
            </div>
            {form.type === "agency" && (
              <>
                <div className="space-y-2">
                  <Label>CV uploads (-1 = unlimited)</Label>
                  <Input
                    value={form.cvUploads}
                    onChange={(e) => setForm((f) => ({ ...f, cvUploads: e.target.value }))}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bidding limit (-1 = unlimited)</Label>
                  <Input
                    value={form.biddingLimit}
                    onChange={(e) => setForm((f) => ({ ...f, biddingLimit: e.target.value }))}
                    placeholder="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job offers (-1 = unlimited)</Label>
                  <Input
                    value={form.jobOffers}
                    onChange={(e) => setForm((f) => ({ ...f, jobOffers: e.target.value }))}
                    placeholder="10"
                  />
                </div>
              </>
            )}
            {form.type === "company" && (
              <div className="space-y-2">
                <Label>CV downloads (-1 = unlimited)</Label>
                <Input
                  value={form.cvDownloads}
                  onChange={(e) => setForm((f) => ({ ...f, cvDownloads: e.target.value }))}
                  placeholder="25"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label>Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        title={editingId ? "Update plan?" : "Create plan?"}
        description={
          editingId
            ? "Are you sure you want to update this plan? Changes will apply to this subscription plan and may affect existing subscribers."
            : "Are you sure you want to create this plan? It will be available for new subscriptions."
        }
        confirmLabel={editingId ? "Update" : "Create"}
        onConfirm={doSubmit}
        loading={saving}
      />
    </div>
  )
}

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
import { Badge } from "@/components/ui/badge"
import { Briefcase, ArrowLeft, Loader2, Plus, Pencil, Trash2, Tags } from "lucide-react"
import { MessageBanner } from "@/components/ui/message-banner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type JobCategoryRow = {
  id: string
  slug: string
  name: string
  emoji: string
  description: string
  sortOrder: number
  isActive: boolean
  group?: "white_collar" | "blue_collar" | "other"
  createdAt: string
  updatedAt: string
}

const GROUP_LABELS: Record<string, string> = {
  white_collar: "White Collar",
  blue_collar: "Blue Collar",
  other: "Other",
}

type JobSubCategoryRow = {
  id: string
  categoryId: string
  slug: string
  name: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminJobCategoriesPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [categories, setCategories] = useState<JobCategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<JobCategoryRow | null>(null)
  const [subCategoryDialogOpen, setSubCategoryDialogOpen] = useState(false)
  const [subCategoryFor, setSubCategoryFor] = useState<JobCategoryRow | null>(null)
  const [subCategories, setSubCategories] = useState<JobSubCategoryRow[]>([])
  const [subCategoryLoading, setSubCategoryLoading] = useState(false)
  const [subCategoryForm, setSubCategoryForm] = useState({ name: "", slug: "", sortOrder: "0", isActive: true })
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [subSaving, setSubSaving] = useState(false)
  const [subDeleteConfirmOpen, setSubDeleteConfirmOpen] = useState(false)
  const [subToDelete, setSubToDelete] = useState<JobSubCategoryRow | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    slug: "",
    emoji: "📋",
    description: "",
    sortOrder: "0",
    isActive: true,
    group: "" as "" | "white_collar" | "blue_collar" | "other",
  })

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/admin/login")
      return
    }
    const userData = JSON.parse(user)
    if (userData.role !== "super_admin" && userData.role !== "admin") {
      router.push("/admin/dashboard")
      return
    }
    setUserRole(userData.role)
    loadCategories()
  }, [router])

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/admin/job-categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (e) {
      console.error(e)
      setMessage({ type: "error", text: "Failed to load job categories" })
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sortOrder), 0) + 1 : 1
    setForm({
      name: "",
      slug: "",
      emoji: "📋",
      description: "",
      sortOrder: String(nextOrder),
      isActive: true,
      group: "",
    })
    setDialogOpen(true)
  }

  const openEdit = (cat: JobCategoryRow) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      emoji: cat.emoji || "📋",
      description: cat.description || "",
      sortOrder: String(cat.sortOrder),
      isActive: cat.isActive,
      group: cat.group || "",
    })
    setDialogOpen(true)
  }

  const openDeleteConfirm = (cat: JobCategoryRow) => {
    setCategoryToDelete(cat)
    setDeleteConfirmOpen(true)
  }

  const doSave = async () => {
    setMessage(null)
    setSaving(true)
    try {
      const sortOrder = parseInt(form.sortOrder, 10)
      if (editingId) {
        const res = await fetch("/api/admin/job-categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name: form.name,
            slug: form.slug || undefined,
            emoji: form.emoji,
            description: form.description,
            sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
            isActive: form.isActive,
            group: form.group || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Update failed" })
          setSaving(false)
          return
        }
        setMessage({ type: "success", text: "Job category updated" })
      } else {
        const res = await fetch("/api/admin/job-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug || undefined,
            emoji: form.emoji,
            description: form.description,
            sortOrder: isNaN(sortOrder) ? undefined : sortOrder,
            isActive: form.isActive,
            group: form.group || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Create failed" })
          setSaving(false)
          return
        }
        setMessage({ type: "success", text: "Job category created" })
      }
      await loadCategories()
      setDialogOpen(false)
    } catch (e) {
      console.error(e)
      setMessage({ type: "error", text: "Request failed" })
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    if (!categoryToDelete) return
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/job-categories?id=${encodeURIComponent(categoryToDelete.id)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Delete failed" })
        setDeleteConfirmOpen(false)
        setCategoryToDelete(null)
        return
      }
      setMessage({ type: "success", text: "Job category deleted" })
      await loadCategories()
      setDeleteConfirmOpen(false)
      setCategoryToDelete(null)
    } catch (e) {
      console.error(e)
      setMessage({ type: "error", text: "Delete failed" })
    }
  }

  const openSubCategoryDialog = async (cat: JobCategoryRow) => {
    setSubCategoryFor(cat)
    setSubCategoryDialogOpen(true)
    setEditingSubId(null)
    setSubCategoryForm({ name: "", slug: "", sortOrder: "0", isActive: true })
    setSubCategoryLoading(true)
    try {
      const res = await fetch(`/api/admin/job-sub-categories?categoryId=${encodeURIComponent(cat.id)}`)
      const data = await res.json()
      setSubCategories(data.subCategories || [])
    } catch (e) {
      setSubCategories([])
    } finally {
      setSubCategoryLoading(false)
    }
  }

  const loadSubCategories = async () => {
    if (!subCategoryFor) return
    setSubCategoryLoading(true)
    try {
      const res = await fetch(`/api/admin/job-sub-categories?categoryId=${encodeURIComponent(subCategoryFor.id)}`)
      const data = await res.json()
      setSubCategories(data.subCategories || [])
    } catch (e) {
      setSubCategories([])
    } finally {
      setSubCategoryLoading(false)
    }
  }

  const openAddSub = () => {
    setEditingSubId(null)
    const nextOrder = subCategories.length > 0 ? Math.max(...subCategories.map((s) => s.sortOrder), 0) + 1 : 1
    setSubCategoryForm({ name: "", slug: "", sortOrder: String(nextOrder), isActive: true })
  }

  const openEditSub = (sub: JobSubCategoryRow) => {
    setEditingSubId(sub.id)
    setSubCategoryForm({
      name: sub.name,
      slug: sub.slug,
      sortOrder: String(sub.sortOrder),
      isActive: sub.isActive,
    })
  }

  const doSaveSub = async () => {
    if (!subCategoryFor) return
    setSubSaving(true)
    setMessage(null)
    try {
      const sortOrder = parseInt(subCategoryForm.sortOrder, 10)
      if (editingSubId) {
        const res = await fetch("/api/admin/job-sub-categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingSubId,
            name: subCategoryForm.name,
            slug: subCategoryForm.slug || undefined,
            sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
            isActive: subCategoryForm.isActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Update failed" })
          setSubSaving(false)
          return
        }
        setMessage({ type: "success", text: "Sub-category updated" })
      } else {
        const res = await fetch("/api/admin/job-sub-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: subCategoryFor.id,
            name: subCategoryForm.name,
            slug: subCategoryForm.slug || undefined,
            sortOrder: isNaN(sortOrder) ? undefined : sortOrder,
            isActive: subCategoryForm.isActive,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setMessage({ type: "error", text: data.error || "Create failed" })
          setSubSaving(false)
          return
        }
        setMessage({ type: "success", text: "Sub-category created" })
      }
      await loadSubCategories()
      setEditingSubId(null)
      setSubCategoryForm({ name: "", slug: "", sortOrder: "0", isActive: true })
    } catch (e) {
      setMessage({ type: "error", text: "Request failed" })
    } finally {
      setSubSaving(false)
    }
  }

  const openSubDeleteConfirm = (sub: JobSubCategoryRow) => {
    setSubToDelete(sub)
    setSubDeleteConfirmOpen(true)
  }

  const doSeedDefaults = async () => {
    setSeeding(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/job-categories/seed?force=true", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Seed failed" })
      } else {
        setMessage({ type: "success", text: data.message || "Defaults seeded" })
        await loadCategories()
      }
      setSeedConfirmOpen(false)
    } catch (e) {
      setMessage({ type: "error", text: "Seed failed" })
      setSeedConfirmOpen(false)
    } finally {
      setSeeding(false)
    }
  }

  const doDeleteSub = async () => {
    if (!subToDelete) return
    try {
      const res = await fetch(`/api/admin/job-sub-categories?id=${encodeURIComponent(subToDelete.id)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json()
        setMessage({ type: "error", text: data.error || "Delete failed" })
      } else {
        setMessage({ type: "success", text: "Sub-category deleted" })
        await loadSubCategories()
      }
      setSubDeleteConfirmOpen(false)
      setSubToDelete(null)
    } catch (e) {
      setMessage({ type: "error", text: "Delete failed" })
      setSubDeleteConfirmOpen(false)
      setSubToDelete(null)
    }
  }

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
              <h1 className="text-3xl font-bold text-foreground">Job Categories</h1>
              <p className="mt-2 text-muted-foreground">Manage job categories for Job & Profile Details (candidate registration and profile)</p>
            </div>
            <div className="flex gap-2">
              {userRole === "super_admin" && (
                <Button variant="outline" onClick={() => setSeedConfirmOpen(true)}>
                  Seed defaults
                </Button>
              )}
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add category
              </Button>
            </div>
          </div>

          {message && !dialogOpen && (
            <MessageBanner message={message} onDismiss={() => setMessage(null)} />
          )}

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  All job categories
                </CardTitle>
                <CardDescription>These appear in the Job Category selector on candidate registration and profile edit.</CardDescription>
              </CardHeader>
              <CardContent>
                {categories.length === 0 ? (
                  <p className="py-4 text-muted-foreground">No job categories yet. Add one to get started.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Emoji</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24">Order</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                        <TableHead className="w-[140px]">Sub-categories</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell className="text-xl">{cat.emoji || "📋"}</TableCell>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell>
                            {cat.group ? (
                              <Badge variant={cat.group === "white_collar" ? "default" : cat.group === "blue_collar" ? "secondary" : "outline"}>
                                {GROUP_LABELS[cat.group] || cat.group}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">{cat.slug}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">{cat.description || "—"}</TableCell>
                          <TableCell>{cat.sortOrder}</TableCell>
                          <TableCell>
                            <Badge variant={cat.isActive ? "default" : "secondary"}>
                              {cat.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => openSubCategoryDialog(cat)}>
                              <Tags className="mr-1 h-4 w-4" />
                              Sub-categories
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openDeleteConfirm(cat)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
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
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit job category" : "Create job category"}</DialogTitle>
            <DialogDescription>
              Name and emoji are shown in the selector. Slug is used internally (e.g. in candidate profile). Leave slug empty to auto-generate from name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {message && dialogOpen && (
              <MessageBanner message={message} onDismiss={() => setMessage(null)} />
            )}
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Construction"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Group</Label>
              <select
                value={form.group}
                onChange={(e) => setForm((f) => ({ ...f, group: e.target.value as typeof form.group }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">—</option>
                <option value="white_collar">White Collar</option>
                <option value="blue_collar">Blue Collar</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Slug (optional)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. construction (auto from name if empty)"
              />
            </div>
            <div className="space-y-2">
              <Label>Emoji</Label>
              <Input
                value={form.emoji}
                onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                placeholder="📋"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description"
              />
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
              <Label>Active (shown in selector)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doSave} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete job category"
        description={
          categoryToDelete
            ? `Are you sure you want to delete "${categoryToDelete.name}"? Candidates who selected this category will keep it in their profile, but it will no longer appear in the selector for new selections.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={doDelete}
      />

      <Dialog open={subCategoryDialogOpen} onOpenChange={setSubCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Sub-categories for {subCategoryFor?.name}
            </DialogTitle>
            <DialogDescription>
              Add sub-categories that appear in the dropdown when this category is selected (e.g. in demand creation).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {message && subCategoryDialogOpen && (
              <MessageBanner message={message} onDismiss={() => setMessage(null)} />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Sub-category name *"
                value={subCategoryForm.name}
                onChange={(e) => setSubCategoryForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                placeholder="Slug (optional)"
                value={subCategoryForm.slug}
                onChange={(e) => setSubCategoryForm((f) => ({ ...f, slug: e.target.value }))}
              />
              <div className="flex items-center gap-2 sm:col-span-2">
                <Input
                  type="number"
                  placeholder="Order"
                  value={subCategoryForm.sortOrder}
                  onChange={(e) => setSubCategoryForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-24"
                />
                <div className="flex items-center gap-1">
                  <Switch
                    checked={subCategoryForm.isActive}
                    onCheckedChange={(v) => setSubCategoryForm((f) => ({ ...f, isActive: v }))}
                  />
                  <Label className="text-xs">Active</Label>
                </div>
                <Button
                  size="sm"
                  onClick={() => (subCategoryForm.name.trim() ? doSaveSub() : null)}
                  disabled={subSaving || !subCategoryForm.name.trim()}
                >
                  {subSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingSubId ? "Save" : "Add"}
                </Button>
                {editingSubId && (
                  <Button variant="outline" size="sm" onClick={() => { setEditingSubId(null); setSubCategoryForm({ name: "", slug: "", sortOrder: "0", isActive: true }); }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            {subCategoryLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : subCategories.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No sub-categories yet. Add one above.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded border p-2 space-y-1">
                {subCategories.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1.5">
                    <span className="font-medium">{sub.name}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditSub(sub)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openSubDeleteConfirm(sub)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={subDeleteConfirmOpen}
        onOpenChange={setSubDeleteConfirmOpen}
        title="Delete sub-category"
        description={subToDelete ? `Are you sure you want to delete "${subToDelete.name}"?` : ""}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={doDeleteSub}
      />

      <ConfirmDialog
        open={seedConfirmOpen}
        onOpenChange={setSeedConfirmOpen}
        title="Seed default categories"
        description="This will replace ALL existing job categories and sub-categories with the default set (White Collar, Blue Collar, Other). This cannot be undone."
        confirmLabel="Replace & Seed"
        variant="destructive"
        onConfirm={doSeedDefaults}
        loading={seeding}
      />
    </div>
  )
}

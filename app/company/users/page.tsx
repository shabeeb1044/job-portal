"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, UserPlus, ShieldCheck, ShieldOff } from "lucide-react"

type StaffUser = {
  id: string
  name: string
  email: string
  role: string
  companyId?: string
  isActive: boolean
  createdAt: string
}

export default function CompanyUsersPage() {
  const router = useRouter()
  const [companyId, setCompanyId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<StaffUser[]>([])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (!stored) {
      router.replace("/login/company")
      return
    }
    try {
      const u = JSON.parse(stored)
      if (u.role !== "company" && u.role !== "corporate" && u.role !== "staff") {
        router.replace("/login/company")
        return
      }
      const cid = u.companyId ?? u.id ?? ""
      setCompanyId(cid)
    } catch {
      router.replace("/login/company")
    }
  }, [router])

  const refresh = async (cid: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/company/users?companyId=${encodeURIComponent(cid)}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to load users")
        setUsers([])
        return
      }
      setUsers(data.users || [])
    } catch {
      toast.error("Failed to load users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!companyId) return
    refresh(companyId)
  }, [companyId])

  const canManage = useMemo(() => {
    try {
      const stored = localStorage.getItem("user")
      if (!stored) return false
      const u = JSON.parse(stored)
      return u.role === "company" || u.role === "corporate"
    } catch {
      return false
    }
  }, [])

  const createUser = async () => {
    if (!canManage) {
      toast.error("Only company owners can add users")
      return
    }
    if (!companyId) return
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/company/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          name: name.trim(),
          email: email.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to create user")
        return
      }
      toast.success("User added")
      setName("")
      setEmail("")
      await refresh(companyId)
    } catch {
      toast.error("Failed to create user")
    } finally {
      setSaving(false)
    }
  }

  const setActive = async (id: string, isActive: boolean) => {
    if (!canManage) {
      toast.error("Only company owners can update users")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/company/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to update user")
        return
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive } : u)))
    } catch {
      toast.error("Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Users (Staff)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add staff users for your company. Staff can log in via Company Login and create demands.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HR Officer" disabled={!canManage || saving} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@company.com" disabled={!canManage || saving} />
            </div>
          </div>

          <Button onClick={createUser} disabled={!canManage || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add User"}
          </Button>

          {!canManage && (
            <p className="text-xs text-muted-foreground">
              Only the main company account can add/disable users.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff list</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No staff users yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Email</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            <ShieldCheck className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                            <ShieldOff className="h-3.5 w-3.5" /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canManage || saving}
                          onClick={() => setActive(u.id, !u.isActive)}
                        >
                          {u.isActive ? "Disable" : "Enable"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


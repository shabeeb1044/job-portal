"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { UserCog, Lock, Save, FileText, Clock } from "lucide-react"
import { PageLoader } from "@/components/page-loader"
import { toast } from "sonner"

export default function AgentSettingsPage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    commissionPercent: 0,
    referralCode: "",
    photoUrl: "",
    idProofUrl: "",
    idProofSubmittedAt: "",
  })
  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agentId, setAgentId] = useState("")
  const [photoUploading, setPhotoUploading] = useState(false)
  const [idProofUploading, setIdProofUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const idProofInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) return
    const { agentId: aid } = JSON.parse(user)
    setAgentId(aid)

    fetch(`/api/agent/profile?agentId=${aid}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProfile({
            name: data.agent.name || "",
            email: data.agent.email || "",
            phone: data.agent.phone || "",
            commissionPercent: data.agent.commissionPercent || 0,
            referralCode: data.agent.referralCode || "",
            photoUrl: data.agent.photoUrl || "",
            idProofUrl: data.agent.idProofUrl || "",
            idProofSubmittedAt: data.agent.idProofSubmittedAt || "",
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, name: profile.name, phone: profile.phone }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Profile updated")
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        user.name = profile.name
        localStorage.setItem("user", JSON.stringify(user))
      } else {
        toast.error(data.error || "Failed to update")
      }
    } catch {
      toast.error("Failed to update")
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!passwordForm.new) {
      toast.error("Please enter a new password")
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("Passwords do not match")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, password: passwordForm.new }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Password updated")
        setPasswordForm({ new: "", confirm: "" })
      } else {
        toast.error(data.error || "Failed to update")
      }
    } catch {
      toast.error("Failed to update")
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !agentId) return

    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", "agent-photo")

      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Photo upload failed")
      }

      const saveRes = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, photoUrl: uploadData.url }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || "Failed to save photo")
      }

      setProfile(p => ({ ...p, photoUrl: uploadData.url }))
      toast.success("Profile photo updated")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Photo upload failed"
      toast.error(message)
    } finally {
      setPhotoUploading(false)
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!agentId || !profile.photoUrl) return
    setPhotoUploading(true)
    try {
      const res = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, photoUrl: "" }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove photo")
      }
      setProfile(p => ({ ...p, photoUrl: "" }))
      toast.success("Profile photo removed")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove photo"
      toast.error(message)
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleIdProofChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !agentId) return

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!validTypes.includes(file.type)) {
      toast.error("Only PDF, DOC, or DOCX files are allowed")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10 MB")
      return
    }

    setIdProofUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", "agent-proof")

      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "ID proof upload failed")
      }

      const saveRes = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, idProofUrl: uploadData.url }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || "Failed to save ID proof")
      }

      setProfile(p => ({
        ...p,
        idProofUrl: uploadData.url,
        idProofSubmittedAt: saveData.agent?.idProofSubmittedAt || new Date().toISOString(),
      }))
      toast.success("ID proof uploaded")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "ID proof upload failed"
      toast.error(message)
    } finally {
      setIdProofUploading(false)
      if (e.target) {
        e.target.value = ""
      }
    }
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your agent profile</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            My Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.name || "Profile photo"} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {(profile.name || profile.email || "AG")
                    .split(" ")
                    .map(part => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Profile Photo</p>
              <p className="text-xs text-muted-foreground">PNG or JPG · Max 2MB</p>
              <div className="flex items-center gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                >
                  {photoUploading ? "Uploading..." : profile.photoUrl ? "Change Photo" : "Upload Photo"}
                </Button>
                {profile.photoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePhoto}
                    disabled={photoUploading}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label>Name</Label>
            <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile.email} disabled className="bg-muted" />
            <p className="mt-1 text-xs text-muted-foreground">Email is set by your agency and cannot be changed</p>
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Commission Rate</p>
              <p className="text-xs text-muted-foreground">Set by your agency</p>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
              {profile.commissionPercent}%
            </Badge>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Referral Code</p>
              <p className="text-xs text-muted-foreground">Your unique recruitment code</p>
            </div>
            <code className="rounded bg-muted px-2 py-1 text-sm">{profile.referralCode}</code>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  ID Proof Document
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload your government ID or license (PDF, DOC, DOCX, max 10MB)
                </p>
                {profile.idProofSubmittedAt ? (
                  <p className="mt-1 text-xs flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Submitted on{" "}
                    {new Date(profile.idProofSubmittedAt).toLocaleString()}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Not submitted yet
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {profile.idProofUrl && (
                  <a
                    href={profile.idProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View current document
                  </a>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={idProofInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleIdProofChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => idProofInputRef.current?.click()}
                    disabled={idProofUploading}
                  >
                    {idProofUploading ? "Uploading..." : profile.idProofUrl ? "Update ID Proof" : "Upload ID Proof"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={saveProfile} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your login password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={passwordForm.new}
              onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
            />
          </div>
          <div>
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
            />
          </div>
          <Button onClick={changePassword} disabled={saving}>
            <Lock className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

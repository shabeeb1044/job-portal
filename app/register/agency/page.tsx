"use client"

import { useState, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Loader2, CheckCircle, Upload, FileText, X, Clock } from "lucide-react"
import Link from "next/link"

export default function AgencyRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [registered, setRegistered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ACCEPTED_DOC_TYPES = ".pdf,.doc,.docx"
  const MAX_SIZE_MB = 10

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!validTypes.includes(file.type)) {
      setError("Only PDF, DOC, or DOCX files are allowed")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size must be under ${MAX_SIZE_MB} MB`)
      return
    }

    setError("")
    setProofFile(file)
  }

  const removeFile = () => {
    setProofFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const uploadProofDocument = async (): Promise<string | null> => {
    if (!proofFile) return null
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", proofFile)
      fd.append("type", "agency-proof")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      return data.url
    } catch (err: any) {
      setError(err.message || "Document upload failed")
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!proofFile) {
      setError("Please upload a proof document (PDF/DOC/DOCX)")
      return
    }

    setLoading(true)

    try {
      const proofUrl = await uploadProofDocument()
      if (!proofUrl) {
        setLoading(false)
        return
      }

      const response = await fetch("/api/register/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          proofDocumentUrl: proofUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        setLoading(false)
        return
      }

      setRegistered(true)
    } catch {
      setError("Network error. Please try again.")
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader className="space-y-1">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Registration Submitted</CardTitle>
              <CardDescription className="text-base">
                Your agency registration has been submitted successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-foreground">
                <p className="font-medium mb-1">Pending Admin Approval</p>
                <p className="text-muted-foreground">
                  Your account is under review. You will be able to access your dashboard once the
                  super admin approves your registration. This usually takes 1-2 business days.
                </p>
              </div>
              <Link href="/login/agency">
                <Button variant="outline" className="w-full">
                  Go to Login Page
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Agency Registration</CardTitle>
            <CardDescription>Register your recruitment agency</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Agency Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="ABC Recruitment Agency"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agency@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Proof Document * <span className="text-xs text-muted-foreground">(PDF, DOC, or DOCX — max {MAX_SIZE_MB}MB)</span></Label>
                {proofFile ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{proofFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(proofFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={removeFile}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload proof document
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_DOC_TYPES}
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || uploading}>
                {loading || uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploading ? "Uploading document..." : "Registering..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Register Agency
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login/agency" className="text-primary hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

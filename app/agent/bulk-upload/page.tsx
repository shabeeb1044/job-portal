"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Briefcase,
  Loader2,
  CheckCircle2,
  Sparkles,
  FileText,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { PageLoader } from "@/components/page-loader"

interface DemandOption {
  id: string
  jobTitle: string
  companyName: string
  positions: number
  status: string
}

interface CandidateItem {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  skills: string[]
  totalExperience?: string
  status: string
  jobSubCategoryId?: string
}

function AgentBulkUploadContent() {
  const searchParams = useSearchParams()
  const demandIdFromUrl = searchParams.get("demandId")

  const [agencyId, setAgencyId] = useState("")
  const [agentId, setAgentId] = useState("")
  const [demands, setDemands] = useState<DemandOption[]>([])
  const [selectedDemandId, setSelectedDemandId] = useState<string>("")
  const [matched, setMatched] = useState<CandidateItem[]>([])
  const [other, setOther] = useState<CandidateItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) return
    const u = JSON.parse(user)
    setAgencyId(u.agencyId ?? "")
    setAgentId(u.agentId ?? u.id ?? "")
  }, [])

  useEffect(() => {
    fetch("/api/agency/demands")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.demands) {
          const open = data.demands.filter((d: DemandOption) => d.status === "open")
          setDemands(open)
          if (demandIdFromUrl && open.some((d: DemandOption) => d.id === demandIdFromUrl)) {
            setSelectedDemandId(demandIdFromUrl)
          } else if (open.length && !selectedDemandId) {
            setSelectedDemandId(open[0].id)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [demandIdFromUrl])

  useEffect(() => {
    if (!selectedDemandId || selectedDemandId === "none" || !agencyId) {
      setMatched([])
      setOther([])
      setSelectedIds(new Set())
      return
    }
    setCandidatesLoading(true)
    setSelectedIds(new Set())
    fetch(`/api/agent/demand-candidates?demandId=${encodeURIComponent(selectedDemandId)}&agencyId=${encodeURIComponent(agencyId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMatched(data.matched ?? [])
          setOther(data.other ?? [])
        } else {
          setMatched([])
          setOther([])
        }
      })
      .catch(() => {
        setMatched([])
        setOther([])
      })
      .finally(() => setCandidatesLoading(false))
  }, [selectedDemandId, agencyId])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllMatched = () => {
    if (matched.length === 0) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      matched.forEach((c) => next.add(c.id))
      return next
    })
  }

  const selectAllOther = () => {
    if (other.length === 0) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      other.forEach((c) => next.add(c.id))
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one candidate")
      return
    }
    const userStr = typeof localStorage !== "undefined" ? localStorage.getItem("user") : null
    const u = userStr ? JSON.parse(userStr) : {}
    const effectiveAgencyId = agencyId || u.agencyId
    const effectiveAgentId = agentId || u.agentId || u.id
    if (!effectiveAgencyId || !effectiveAgentId || !selectedDemandId) {
      toast.error("Session or demand missing. Please log in and select a demand.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/agency/apply-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandId: selectedDemandId,
          candidateIds: Array.from(selectedIds),
          agencyId: effectiveAgencyId,
          agentId: effectiveAgentId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const submitted = data.results?.filter((r: { status: string }) => r.status === "submitted").length ?? 0
        const dupes = data.results?.filter((r: { status: string }) => r.status === "duplicate").length ?? 0
        toast.success(`${submitted} candidate(s) submitted. ${dupes ? `${dupes} already applied.` : ""}`)
        setSelectedIds(new Set())
        fetch(`/api/agent/demand-candidates?demandId=${encodeURIComponent(selectedDemandId)}&agencyId=${encodeURIComponent(effectiveAgencyId)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success) {
              setMatched(d.matched ?? [])
              setOther(d.other ?? [])
            }
          })
      } else {
        toast.error(data.error || "Submit failed")
      }
    } catch {
      toast.error("Submit failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/agent/demands">← Demands</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Submit Candidates</h1>
          <p className="text-sm text-muted-foreground">
            Select a demand and choose candidates from your agency to submit. Matched candidates are shown first.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Select demand
          </CardTitle>
          <CardDescription>
            Candidates are grouped by role match. Subcategory-matched candidates appear in the recommended list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedDemandId} onValueChange={setSelectedDemandId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select demand" />
            </SelectTrigger>
            <SelectContent>
              {demands.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.jobTitle} — {d.companyName} ({d.positions})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!selectedDemandId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Select a demand above to see candidates</p>
          </CardContent>
        </Card>
      ) : candidatesLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Loading candidates…</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Matched candidates */}
          {matched.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Recommended for this Demand
                    </CardTitle>
                    <CardDescription>
                      Candidates whose role matches this demand&apos;s subcategory
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAllMatched}>
                    Select all ({matched.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {matched.map((c) => {
                    const name = `${c.firstName} ${c.lastName}`.trim() || "Candidate"
                    const checked = selectedIds.has(c.id)
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                          checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => toggleSelect(c.id)}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleSelect(c.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          {c.skills?.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {c.skills.slice(0, 3).map((s) => (
                                <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{s}</span>
                              ))}
                              {c.skills.length > 3 && (
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">+{c.skills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {c.totalExperience && (
                          <span className="text-xs text-muted-foreground shrink-0">{c.totalExperience}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other candidates */}
          {other.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      Other Candidates
                    </CardTitle>
                    <CardDescription>
                      Other candidates from your agency (different role or no role set)
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAllOther}>
                    Select all ({other.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {other.map((c) => {
                    const name = `${c.firstName} ${c.lastName}`.trim() || "Candidate"
                    const checked = selectedIds.has(c.id)
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                          checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        }`}
                        onClick={() => toggleSelect(c.id)}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleSelect(c.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          {c.skills?.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {c.skills.slice(0, 3).map((s) => (
                                <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{s}</span>
                              ))}
                              {c.skills.length > 3 && (
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">+{c.skills.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {c.totalExperience && (
                          <span className="text-xs text-muted-foreground shrink-0">{c.totalExperience}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {matched.length === 0 && other.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="font-medium">No candidates to submit</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add candidates via referral or manual entry, then return here.
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/agent/candidates">
                    View candidates <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="font-medium">
                {selectedIds.size} candidate{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit to demand
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function AgentBulkUploadPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AgentBulkUploadContent />
    </Suspense>
  )
}

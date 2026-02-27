'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Check, Briefcase, Utensils, Home, Car, FileCheck, HeartPulse, MoreHorizontal, User, Users, Globe, Clock, CalendarClock, Calendar } from "lucide-react"
import { toast } from "sonner"

type BenefitType = "food" | "accommodation" | "transportation" | "visa" | "medical_insurance" | "other"
type NationalityType = "india" | "nepal" | "indonesia" | "sri_lanka" | "any"
type RoleRow = { jobTitle: string; quantity: string }

const benefitConfig: { value: BenefitType; label: string; icon: React.ReactNode }[] = [
  { value: "food", label: "Food", icon: <Utensils className="h-4 w-4" /> },
  { value: "accommodation", label: "Stay", icon: <Home className="h-4 w-4" /> },
  { value: "transportation", label: "Transport", icon: <Car className="h-4 w-4" /> },
  { value: "visa", label: "Visa", icon: <FileCheck className="h-4 w-4" /> },
  { value: "medical_insurance", label: "Medical", icon: <HeartPulse className="h-4 w-4" /> },
  { value: "other", label: "Other", icon: <MoreHorizontal className="h-4 w-4" /> },
]

const nationalityFlags: Record<NationalityType, string> = {
  india: "🇮🇳",
  nepal: "🇳🇵",
  indonesia: "🇮🇩",
  sri_lanka: "🇱🇰",
  any: "🌍",
}

const nationalityLabels: Record<NationalityType, string> = {
  india: "India",
  nepal: "Nepal",
  indonesia: "Indonesia",
  sri_lanka: "Sri Lanka",
  any: "Any",
}

function SelectChip({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:bg-muted hover:text-foreground",
        className,
      ].join(" ")}
    >
      {active && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-2 ring-background">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </span>
      )}
      {children}
    </button>
  )
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  renderOption,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
  renderOption?: (v: T) => React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={[
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 focus:outline-none",
            value === opt
              ? "bg-background text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {renderOption ? renderOption(opt) : opt}
        </button>
      ))}
    </div>
  )
}

export default function CreateDemandPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [roles, setRoles] = useState<RoleRow[]>([{ jobTitle: "", quantity: "1" }])
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [requirements, setRequirements] = useState("")
  const [skills, setSkills] = useState("")
  const [salaryAmount, setSalaryAmount] = useState("")
  const [currency, setCurrency] = useState("AED")
  const [dutyHoursPerDay, setDutyHoursPerDay] = useState("")
  const [breakTimeHours, setBreakTimeHours] = useState("")
  const [dayOffPerMonth, setDayOffPerMonth] = useState("")
  const [benefits, setBenefits] = useState<BenefitType[]>([])
  const [gender, setGender] = useState<"male" | "female" | "any">("any")
  const [nationality, setNationality] = useState<NationalityType[]>(["any"])
  const [joining, setJoining] = useState<"immediate" | "scheduled">("immediate")
  const [status, setStatus] = useState<"open" | "closed" | "on_hold">("open")
  const [deadline, setDeadline] = useState("")

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) { router.push("/login/company"); return }
    const u = JSON.parse(user)
    setCompanyId(u.companyId ?? u.id ?? "")
    setCompanyName(u.name ?? u.companyName ?? "")
  }, [router])

  const updateRole = (index: number, field: keyof RoleRow, value: string) => {
    setRoles((r) => r.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const toggleBenefit = (value: BenefitType) => {
    setBenefits((prev) => prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value])
  }

  const toggleNationality = (value: NationalityType) => {
    setNationality((prev) => {
      if (value === "any") return ["any"]
      const withoutAny = prev.filter((n) => n !== "any")
      return withoutAny.includes(value) ? withoutAny.filter((n) => n !== value) : [...withoutAny, value]
    })
  }

  const handleSubmit = async () => {
    const valid = roles.filter((r) => r.jobTitle.trim() && Number(r.quantity) >= 1)
    if (valid.length === 0) { toast.error("Add a role with a name and quantity"); return }
    if (!companyId) { toast.error("Company not found. Please log in again."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/company/demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId, companyName: companyName || "Company",
          roles: valid.map((r) => ({ jobTitle: r.jobTitle.trim(), quantity: Math.max(1, Number(r.quantity)) })),
          description, location,
          requirements: requirements.split("\n").map((r) => r.trim()).filter(Boolean),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          salaryAmount: Number(salaryAmount || 0), currency,
          dutyHoursPerDay: Number(dutyHoursPerDay || 0),
          breakTimeHours: Number(breakTimeHours || 0),
          dayOffPerMonth: Number(dayOffPerMonth || 0),
          benefits, gender, nationality, joining, status,
          deadline: deadline || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Demand created. Visible to all approved agencies.")
        router.push("/company/demands")
      } else {
        toast.error(data.error || "Failed to create demand")
      }
    } catch {
      toast.error("Failed to create demand")
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<"open" | "closed" | "on_hold", string> = {
    open: "data-[active=true]:bg-emerald-500 data-[active=true]:border-emerald-500 data-[active=true]:text-white",
    closed: "data-[active=true]:bg-rose-500 data-[active=true]:border-rose-500 data-[active=true]:text-white",
    on_hold: "data-[active=true]:bg-amber-500 data-[active=true]:border-amber-500 data-[active=true]:text-white",
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/company/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Create Demand</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Create Demand
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Company info is filled automatically. Add job details, hiring details and benefits below.
            </p>
          </CardHeader>

          <CardContent className="space-y-8">

            {/* ── Roles ── */}
            <section className="space-y-3">
              <Label>Role (Job title &amp; quantity)</Label>
              {roles.map((row, index) => (
                <div key={index} className="flex gap-2">
                  <Input placeholder="e.g. Cleaner, Shopkeeper, Office Staff" value={row.jobTitle}
                    onChange={(e) => updateRole(index, "jobTitle", e.target.value)} className="flex-1" />
                  <Input type="number" min={1} placeholder="Qty" value={row.quantity}
                    onChange={(e) => updateRole(index, "quantity", e.target.value)} className="w-24" />
                </div>
              ))}
            </section>

            {/* ── Location & Description ── */}
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="e.g. Dubai, UAE" value={location}
                  onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Job description</Label>
                <Textarea id="description" placeholder="Brief job description" value={description}
                  onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
            </section>

            {/* ── Requirements & Skills ── */}
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements <span className="text-muted-foreground font-normal">(one per line)</span></Label>
                <Textarea id="requirements" placeholder={"e.g. 2+ years experience\ne.g. Basic English speaking"}
                  value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
                <Input id="skills" placeholder="e.g. customer service, sales, cleaning"
                  value={skills} onChange={(e) => setSkills(e.target.value)} />
              </div>
            </section>

            {/* ── Salary ── */}
            <section className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="salaryAmount">Salary amount</Label>
                <Input id="salaryAmount" type="number" min={0} placeholder="e.g. 2000"
                  value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" placeholder="e.g. AED" value={currency}
                  onChange={(e) => setCurrency(e.target.value)} />
              </div>
            </section>

            {/* ── Work schedule ── */}
            <section className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dutyHoursPerDay">Duty hrs / day</Label>
                <Input id="dutyHoursPerDay" type="number" min={0} value={dutyHoursPerDay}
                  onChange={(e) => setDutyHoursPerDay(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breakTimeHours">Break (hrs)</Label>
                <Input id="breakTimeHours" type="number" min={0} value={breakTimeHours}
                  onChange={(e) => setBreakTimeHours(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dayOffPerMonth">Days off / mo</Label>
                <Input id="dayOffPerMonth" type="number" min={0} value={dayOffPerMonth}
                  onChange={(e) => setDayOffPerMonth(e.target.value)} />
              </div>
            </section>

            {/* ── Benefits ── */}
            <section className="space-y-3">
              <div>
                <Label>Benefits</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">Select all that apply</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {benefitConfig.map(({ value, label, icon }) => (
                  <SelectChip key={value} active={benefits.includes(value)} onClick={() => toggleBenefit(value)}>
                    {icon}
                    {label}
                  </SelectChip>
                ))}
              </div>
            </section>

            {/* ── Gender ── */}
            <section className="space-y-2">
              <Label>Gender preference</Label>
              <SegmentedControl
                options={["male", "female", "any"] as const}
                value={gender}
                onChange={setGender}
                renderOption={(g) => (
                  <>
                    {g === "male" && <User className="h-3.5 w-3.5" />}
                    {g === "female" && <User className="h-3.5 w-3.5" />}
                    {g === "any" && <Users className="h-3.5 w-3.5" />}
                    <span className="capitalize">{g}</span>
                  </>
                )}
              />
            </section>

            {/* ── Nationality ── */}
            <section className="space-y-3">
              <div>
                <Label>Nationality</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">Select one or more</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["any", "india", "nepal", "indonesia", "sri_lanka"] as NationalityType[]).map((n) => (
                  <SelectChip key={n} active={nationality.includes(n)} onClick={() => toggleNationality(n)}>
                    <span className="text-base leading-none">{nationalityFlags[n]}</span>
                    {nationalityLabels[n]}
                  </SelectChip>
                ))}
              </div>
            </section>

            {/* ── Joining & Status & Deadline ── */}
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Joining */}
                <div className="space-y-2">
                  <Label>Joining</Label>
                  <SegmentedControl
                    options={["immediate", "scheduled"] as const}
                    value={joining}
                    onChange={setJoining}
                    renderOption={(j) => (
                      <>
                        {j === "immediate" ? <Clock className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                        <span className="capitalize">{j}</span>
                      </>
                    )}
                  />
                </div>
                {/* Deadline */}
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="deadline" type="date" value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="pl-9" />
                  </div>
                </div>
              </div>

              {/* Status — coloured chips */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  {(["open", "closed", "on_hold"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      data-active={status === s}
                      className={[
                        "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-150 focus:outline-none",
                        status === s
                          ? s === "open"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500"
                            : s === "closed"
                            ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500"
                            : "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500"
                          : "border-border bg-muted/40 text-muted-foreground hover:border-border/80 hover:bg-muted",
                      ].join(" ")}
                    >
                      <span className={[
                        "h-2 w-2 rounded-full",
                        status === s
                          ? s === "open" ? "bg-emerald-500" : s === "closed" ? "bg-rose-500" : "bg-amber-500"
                          : "bg-muted-foreground/30",
                      ].join(" ")} />
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Actions ── */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" asChild className="flex-1">
                <Link href="/company/dashboard">Cancel</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create demand
                  </>
                )}
              </Button>
            </div>

          </CardContent>
        </Card>
      </main>
    </div>
  )
}
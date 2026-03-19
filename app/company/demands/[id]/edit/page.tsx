"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PageLoader } from "@/components/page-loader"
import {
  ArrowLeft,
  Save,
  Loader2,
  ShieldCheck,
  Briefcase,
  Tags,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  CalendarClock,
  User,
  Users,
  Globe,
  X,
  Utensils,
  Home,
  Car,
  FileCheck,
  HeartPulse,
  Shield,
  CalendarDays,
  MoreHorizontal,
  Check,
} from "lucide-react"
import { BenefitType, NationalityType, BENEFITS } from "@/lib/job-config"
import { ALL_COUNTRIES } from "@/lib/countries"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"

type Demand = {
  id: string
  companyId: string
  companyName: string
  jobTitle: string
  description?: string
  quantity?: number
  location?: string
  requirements: string[]
  skills: string[]
  status: "open" | "closed" | "on_hold"
  deadline?: string
  salary: { amount: number; currency: string }
  dutyHoursPerDay: number
  breakTimeHours: number
  dayOffPerMonth: number
  timeRemark?: string
  benefits: BenefitType[]
  otherBenefitNote?: string
  gender: "male" | "female" | "any"
  nationality: NationalityType[]
  joining: "immediate" | "scheduled"
  jobCategoryId?: string
  jobSubCategoryId?: string
}

const benefitIconMap: Record<BenefitType, React.ReactNode> = {
  food: <Utensils className="h-4 w-4" />,
  accommodation: <Home className="h-4 w-4" />,
  transportation: <Car className="h-4 w-4" />,
  visa: <FileCheck className="h-4 w-4" />,
  medical_insurance: <HeartPulse className="h-4 w-4" />,
  overtime: <Clock className="h-4 w-4" />,
  insurance: <Shield className="h-4 w-4" />,
  annual_leave_30_days: <CalendarDays className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
}

const benefitConfig: { value: BenefitType; label: string; icon: React.ReactNode }[] =
  BENEFITS.map((b) => ({ ...b, icon: benefitIconMap[b.value] }))

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
    <div className="flex items-center gap-1 rounded-xl bg-[#F3F4F6] p-1 ring-1 ring-[#E5E7EB] shadow-sm">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={[
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
            "transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#2563EB]",
            value === opt
              ? "bg-[#2563EB] text-white shadow-sm ring-1 ring-[#1D4ED8]"
              : "bg-transparent text-slate-700 hover:bg-white hover:text-slate-900",
          ].join(" ")}
        >
          {renderOption ? renderOption(opt) : opt}
        </button>
      ))}
    </div>
  )
}

export default function CompanyDemandEditRequestPage() {
  const router = useRouter()
  const params = useParams()
  const demandId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState("")
  const [requestedByUserId, setRequestedByUserId] = useState<string | undefined>(undefined)
  const [requestedByEmployeeName, setRequestedByEmployeeName] = useState<string | undefined>(undefined)

  const [original, setOriginal] = useState<Demand | null>(null)

  const [jobTitle, setJobTitle] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [location, setLocation] = useState("")
  const [requirements, setRequirements] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [salaryAmount, setSalaryAmount] = useState("")
  const [salaryCurrency, setSalaryCurrency] = useState("AED")
  const [dutyHoursPerDay, setDutyHoursPerDay] = useState("")
  const [breakTimeHours, setBreakTimeHours] = useState("")
  const [dayOffPerMonth, setDayOffPerMonth] = useState("")
  const [timeRemark, setTimeRemark] = useState("")
  const [benefits, setBenefits] = useState<BenefitType[]>([])
  const [otherBenefitNote, setOtherBenefitNote] = useState("")
  const [gender, setGender] = useState<"male" | "female" | "any">("any")
  const [nationality, setNationality] = useState<NationalityType[]>([])
  const [nationalitySearch, setNationalitySearch] = useState("")
  const [joining, setJoining] = useState<"immediate" | "scheduled">("immediate")
  const [status, setStatus] = useState<"open" | "closed" | "on_hold">("open")
  const [deadline, setDeadline] = useState("")
  const [jobCategoryId, setJobCategoryId] = useState("")
  const [jobSubCategoryId, setJobSubCategoryId] = useState("")
  const [jobCategories, setJobCategories] = useState<{ id: string; name: string; slug: string; group?: string }[]>([])
  const [jobSubCategories, setJobSubCategories] = useState<{ id: string; name: string; slug: string }[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [countryCode, setCountryCode] = useState("")
  const [stateCode, setStateCode] = useState("")
  const [cityName, setCityName] = useState("")
  const [availableCountries, setAvailableCountries] = useState<{ iso2: string; name: string }[]>([])
  const [availableStates, setAvailableStates] = useState<{ iso2: string; name: string }[]>([])
  const [availableCities, setAvailableCities] = useState<{ name: string }[]>([])
  const [statesLoading, setStatesLoading] = useState(false)
  const [citiesLoading, setCitiesLoading] = useState(false)

  useEffect(() => {
    const userRaw = localStorage.getItem("user")
    if (!userRaw) {
      router.replace("/login/company")
      return
    }
    try {
      const u = JSON.parse(userRaw)
      if (u.role !== "company" && u.role !== "corporate") {
        router.replace("/login/company")
        return
      }
      const cid = u.companyId ?? u.id ?? ""
      setCompanyId(cid)
      setRequestedByUserId(u.id ?? undefined)
      setRequestedByEmployeeName(u.name ?? undefined)
      if (!cid || !demandId) {
        setLoading(false)
        return
      }

      fetch(`/api/company/demands/${demandId}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data?.success || !data?.demand) return
          const d = data.demand as Demand
          if (String(d.companyId) !== String(cid)) {
            router.replace("/company/demands")
            return
          }
          setOriginal(d)
          setJobTitle(d.jobTitle ?? "")
          setDescription(d.description ?? "")
          setQuantity(String(d.quantity ?? 1))
          setLocation(d.location ?? "")
          setRequirements((d.requirements || []).join("\n"))
          setSkills(d.skills || [])
          setSalaryAmount(String(d.salary?.amount ?? ""))
          setSalaryCurrency(d.salary?.currency ?? "AED")
          setDutyHoursPerDay(String(d.dutyHoursPerDay ?? ""))
          setBreakTimeHours(String(d.breakTimeHours ?? ""))
          setDayOffPerMonth(String(d.dayOffPerMonth ?? ""))
          setTimeRemark(d.timeRemark ?? "")
          setBenefits(d.benefits || [])
          setOtherBenefitNote(d.otherBenefitNote ?? "")
          setGender(d.gender ?? "any")
          setNationality(d.nationality || [])
          setJoining(d.joining ?? "immediate")
          setStatus(d.status ?? "open")
          setDeadline(d.deadline ?? "")
          setJobCategoryId(d.jobCategoryId || "")
          setJobSubCategoryId(d.jobSubCategoryId || "")
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    } catch {
      router.replace("/login/company")
    }
  }, [demandId, router])

  useEffect(() => {
    fetch("/api/job-categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setJobCategories(
            data.categories.map((c: { id: string; name: string; slug: string; group?: string }) => ({
              id: c.id,
              name: c.name,
              slug: c.slug || c.id,
              group: c.group,
            }))
          )
        }
      })
      .catch(() => setJobCategories([]))
      .finally(() => setCategoriesLoading(false))
  }, [])

  useEffect(() => {
    if (!jobCategoryId) {
      setJobSubCategories([])
      setJobSubCategoryId("")
      return
    }
    fetch(`/api/job-sub-categories?categoryId=${encodeURIComponent(jobCategoryId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.subCategories) {
          setJobSubCategories(
            data.subCategories.map((s: { id: string; name: string; slug: string }) => ({
              id: s.id,
              name: s.name,
              slug: s.slug || s.id,
            }))
          )
        } else {
          setJobSubCategories([])
        }
      })
      .catch(() => setJobSubCategories([]))
    setJobSubCategoryId("")
  }, [jobCategoryId])

  useEffect(() => {
    fetch("/api/geo/countries")
      .then((res) => res.json())
      .then((data) => {
        if (data.countries) {
          setAvailableCountries(data.countries)
        } else {
          setAvailableCountries([])
        }
      })
      .catch(() => setAvailableCountries([]))
  }, [])

  const updateLocationFromParts = (countryIso2: string, stateIso2: string, city: string) => {
    const country = availableCountries.find((c) => c.iso2 === countryIso2)?.name || ""
    const state = availableStates.find((s) => s.iso2 === stateIso2)?.name || ""
    const cityPart = city || ""

    const parts = [cityPart, state, country].filter(Boolean)
    setLocation(parts.join(", "))
  }

  const commitSkill = () => {
    const trimmed = skillInput.trim()
    if (!trimmed) return
    setSkills((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
    setSkillInput("")
  }

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  const toggleBenefit = (value: BenefitType) => {
    setBenefits((prev) => (prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value]))
  }

  const addNationality = (country: NationalityType) => {
    setNationality((prev) => (prev.includes(country) ? prev : [...prev, country]))
  }

  const removeNationality = (country: NationalityType) => {
    setNationality((prev) => prev.filter((n) => n !== country))
  }

  const changes = useMemo(() => {
    if (!original) return {}
    const ch: Record<string, unknown> = {}
    if ((jobTitle ?? "") !== (original.jobTitle ?? "")) ch.jobTitle = jobTitle
    if ((description ?? "") !== (original.description ?? "")) ch.description = description
    const qtyNum = Math.max(1, Number(quantity || 0))
    if (qtyNum !== (original.quantity ?? 0)) ch.quantity = qtyNum
    if ((location ?? "") !== (original.location ?? "")) ch.location = location
    const reqArr = requirements.split("\n").map((r) => r.trim()).filter(Boolean)
    if (JSON.stringify(reqArr) !== JSON.stringify(original.requirements || [])) ch.requirements = reqArr
    if (JSON.stringify(skills) !== JSON.stringify(original.skills || [])) ch.skills = skills
    const origSalary = original.salary ?? { amount: 0, currency: "AED" }
    const sAmount = Number(salaryAmount || 0)
    if (sAmount !== origSalary.amount || salaryCurrency !== origSalary.currency) {
      ch.salary = { amount: sAmount, currency: salaryCurrency || "AED" }
    }
    const duty = Number(dutyHoursPerDay || 0)
    if (duty !== (original.dutyHoursPerDay ?? 0)) ch.dutyHoursPerDay = duty
    const brk = Number(breakTimeHours || 0)
    if (brk !== (original.breakTimeHours ?? 0)) ch.breakTimeHours = brk
    const daysOff = Number(dayOffPerMonth || 0)
    if (daysOff !== (original.dayOffPerMonth ?? 0)) ch.dayOffPerMonth = daysOff
    if ((timeRemark ?? "") !== (original.timeRemark ?? "")) ch.timeRemark = timeRemark || undefined
    if (JSON.stringify(benefits) !== JSON.stringify(original.benefits || [])) ch.benefits = benefits
    if ((otherBenefitNote ?? "") !== (original.otherBenefitNote ?? "")) {
      ch.otherBenefitNote = benefits.includes("other") ? otherBenefitNote || undefined : undefined
    }
    if (gender !== (original.gender ?? "any")) ch.gender = gender
    if (JSON.stringify(nationality) !== JSON.stringify(original.nationality || [])) ch.nationality = nationality
    if (joining !== (original.joining ?? "immediate")) ch.joining = joining
    if (status !== (original.status ?? "open")) ch.status = status
    if ((deadline ?? "") !== (original.deadline ?? "")) ch.deadline = deadline || undefined
    if ((jobCategoryId ?? "") !== (original.jobCategoryId ?? "")) ch.jobCategoryId = jobCategoryId || undefined
    if ((jobSubCategoryId ?? "") !== (original.jobSubCategoryId ?? "")) ch.jobSubCategoryId = jobSubCategoryId || undefined
    return ch
  }, [
    original,
    jobTitle,
    description,
    quantity,
    location,
    requirements,
    skills,
    salaryAmount,
    salaryCurrency,
    dutyHoursPerDay,
    breakTimeHours,
    dayOffPerMonth,
    timeRemark,
    benefits,
    otherBenefitNote,
    gender,
    nationality,
    joining,
    status,
    deadline,
    jobCategoryId,
    jobSubCategoryId,
  ])

  const submitForApproval = async () => {
    if (!companyId || !demandId) return
    if (!original) return
    if (!jobTitle.trim()) {
      toast.error("Job title is required")
      return
    }
    if (Object.keys(changes).length === 0) {
      toast.error("No changes to submit")
      return
    }

    const ok = window.confirm("Submit these changes for admin/superadmin approval?")
    if (!ok) return

    setSaving(true)
    try {
      const res = await fetch(`/api/company/demands/${demandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          requestedByUserId,
          requestedByEmployeeName,
          changes,
        }),
      })
      const data = await res.json()
      if (data?.success) {
        toast.success("Edit request submitted. Waiting for admin approval.")
        router.push(`/company/demands/${demandId}`)
      } else {
        toast.error(data?.error || "Failed to submit request")
      }
    } catch {
      toast.error("Failed to submit request")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="mx-auto flex max-w-5xl items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href={`/company/demands/${demandId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to demand
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Demand (Approval Required)</h1>
          <p className="text-sm text-muted-foreground">
            This form is the same as create demand. Changes will be saved only after{" "}
            <span className="font-semibold">admin/superadmin approval</span>.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Approval required
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="min-w-0 border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-primary" />
              Edit demand details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-2">
            {/* Job category & quantity */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Tags className="h-5 w-5" />
                <Label className="text-base font-medium">Job Category</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={jobCategoryId} onValueChange={setJobCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder={categoriesLoading ? "Loading…" : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(["white_collar", "blue_collar", "other"] as const).map((group) => {
                        const cats = jobCategories.filter((c) => c.group === group || (!c.group && group === "other"))
                        if (cats.length === 0) return null
                        const label = group === "white_collar" ? "White Collar" : group === "blue_collar" ? "Blue Collar" : "Other"
                        return (
                          <SelectGroup key={group}>
                            <SelectLabel>{label}</SelectLabel>
                            {cats.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sub-category</Label>
                  <Select
                    value={jobSubCategoryId}
                    onValueChange={setJobSubCategoryId}
                    disabled={!jobCategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={jobCategoryId ? "Select sub-category" : "Select category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {jobSubCategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Location & description */}
            <section className="space-y-4">
              <div className="space-y-2">
                <Label>Location (Country / State / City)</Label>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="country-select" className="text-xs text-muted-foreground">
                      Country
                    </Label>
                    <Select
                      value={countryCode}
                      onValueChange={(code) => {
                        const normalizedCountry = code.toUpperCase()
                        setCountryCode(normalizedCountry)
                        setStateCode("")
                        setCityName("")
                        setAvailableStates([])
                        setAvailableCities([])
                        setStatesLoading(true)
                        fetch(`/api/geo/states?country=${encodeURIComponent(normalizedCountry)}`)
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.states) setAvailableStates(data.states)
                            else setAvailableStates([])
                          })
                          .catch(() => setAvailableStates([]))
                          .finally(() => setStatesLoading(false))
                        updateLocationFromParts(normalizedCountry, "", "")
                      }}
                    >
                      <SelectTrigger id="country-select">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCountries.map((country) => (
                          <SelectItem key={country.iso2} value={country.iso2}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="state-select" className="text-xs text-muted-foreground">
                      State / Region
                    </Label>
                    <Select
                      value={stateCode}
                      onValueChange={(code) => {
                        const normalizedState = code.toUpperCase()
                        setStateCode(normalizedState)
                        setCityName("")
                        setAvailableCities([])
                        if (!countryCode) {
                          updateLocationFromParts("", "", "")
                          return
                        }
                        setCitiesLoading(true)
                        fetch(
                          `/api/geo/cities?country=${encodeURIComponent(countryCode)}&state=${encodeURIComponent(
                            normalizedState
                          )}`
                        )
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.cities) setAvailableCities(data.cities)
                            else setAvailableCities([])
                          })
                          .catch(() => setAvailableCities([]))
                          .finally(() => setCitiesLoading(false))
                        updateLocationFromParts(countryCode, normalizedState, "")
                      }}
                      disabled={!countryCode || statesLoading}
                    >
                      <SelectTrigger id="state-select">
                        <SelectValue
                          placeholder={
                            !countryCode
                              ? "Select country first"
                              : statesLoading
                                ? "Loading states…"
                                : availableStates.length === 0
                                  ? "No states found"
                                  : "Select state"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStates.map((state) => (
                          <SelectItem key={state.iso2} value={state.iso2}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="city-select" className="text-xs text-muted-foreground">
                      City
                    </Label>
                    <Select
                      value={cityName}
                      onValueChange={(city) => {
                        setCityName(city)
                        if (!countryCode) {
                          setLocation(city || "")
                          return
                        }
                        updateLocationFromParts(countryCode, stateCode, city)
                      }}
                      disabled={!stateCode || citiesLoading}
                    >
                      <SelectTrigger id="city-select">
                        <SelectValue
                          placeholder={
                            !stateCode
                              ? "Select state first"
                              : citiesLoading
                                ? "Loading cities…"
                                : availableCities.length === 0
                                  ? "No cities found"
                                  : "Select city"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((city) => (
                          <SelectItem key={city.name} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Job description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief job description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </section>

            {/* Requirements & skills */}
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="requirements">
                  Requirements <span className="text-muted-foreground font-normal">(one per line)</span>
                </Label>
                <Textarea
                  id="requirements"
                  placeholder={"e.g. 2+ years experience\ne.g. Basic English speaking"}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skillInput">Skills</Label>
                <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
                          aria-label={`Remove ${skill}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {skills.length === 0 && (
                      <span className="text-[11px] text-muted-foreground">No skills added yet.</span>
                    )}
                  </div>
                  <Input
                    id="skillInput"
                    placeholder="Type a skill and press Enter"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault()
                        commitSkill()
                      } else if (e.key === "Backspace" && !skillInput && skills.length) {
                        removeSkill(skills[skills.length - 1])
                      }
                    }}
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Example: customer service, sales, cleaning</p>
              </div>
            </section>

            {/* Salary */}
            <section className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="salaryAmount">Salary amount</Label>
                <Input
                  id="salaryAmount"
                  type="number"
                  min={0}
                  placeholder="e.g. 2000"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  placeholder="e.g. AED"
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                />
              </div>
            </section>

            {/* Work schedule */}
            <section className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dutyHoursPerDay">Duty hrs / day</Label>
                <Input
                  id="dutyHoursPerDay"
                  type="number"
                  min={0}
                  value={dutyHoursPerDay}
                  onChange={(e) => setDutyHoursPerDay(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breakTimeHours">Break (hrs)</Label>
                <Input
                  id="breakTimeHours"
                  type="number"
                  min={0}
                  value={breakTimeHours}
                  onChange={(e) => setBreakTimeHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dayOffPerMonth">Days off / mo</Label>
                <Input
                  id="dayOffPerMonth"
                  type="number"
                  min={0}
                  value={dayOffPerMonth}
                  onChange={(e) => setDayOffPerMonth(e.target.value)}
                />
              </div>
            </section>

            {/* Benefits */}
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
              {benefits.includes("other") && (
                <div className="space-y-1 pt-1">
                  <Label htmlFor="otherBenefitNote" className="text-xs">
                    Other benefit details
                  </Label>
                  <Textarea
                    id="otherBenefitNote"
                    rows={2}
                    placeholder="Describe the other benefits you provide."
                    value={otherBenefitNote}
                    onChange={(e) => setOtherBenefitNote(e.target.value)}
                  />
                </div>
              )}
            </section>

            {/* Gender */}
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

            {/* Nationality */}
            <section className="space-y-3">
              <div>
                <Label>Nationality</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Search and select one or more countries.
                </p>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    placeholder="Search countries…"
                    value={nationalitySearch}
                    onChange={(e) => setNationalitySearch(e.target.value)}
                    className="pl-9"
                  />
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-muted/40 p-1 text-sm">
                  {ALL_COUNTRIES.filter((c) =>
                    c.toLowerCase().includes(nationalitySearch.toLowerCase())
                  ).map((country) => {
                    const selected = nationality.includes(country)
                    return (
                      <button
                        key={country}
                        type="button"
                        onClick={() => (selected ? removeNationality(country) : addNationality(country))}
                        className={[
                          "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left",
                          selected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-background hover:text-foreground",
                        ].join(" ")}
                      >
                        <span className="truncate">{country}</span>
                        {selected && <Check className="ml-2 h-3.5 w-3.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
              {nationality.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {nationality.map((country) => (
                    <span
                      key={country}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {country}
                      <button
                        type="button"
                        onClick={() => removeNationality(country)}
                        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
                        aria-label={`Remove ${country}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Joining, status, deadline */}
            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label
                    htmlFor="deadline"
                    className={joining === "immediate" ? "text-muted-foreground" : undefined}
                  >
                    Deadline
                  </Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="pl-9"
                      disabled={joining === "immediate"}
                    />
                  </div>
                  {joining === "immediate" && (
                    <p className="text-[11px] text-muted-foreground">
                      Deadline is not required when joining is immediate.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  {(["open", "closed", "on_hold"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
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
                      <span
                        className={[
                          "h-2 w-2 rounded-full",
                          status === s
                            ? s === "open"
                              ? "bg-emerald-500"
                              : s === "closed"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            : "bg-muted-foreground/30",
                        ].join(" ")}
                      />
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Remark */}
            <section className="space-y-2">
              <Label htmlFor="timeRemark">Remark</Label>
              <Textarea
                id="timeRemark"
                placeholder="Any extra notes about this demand (timing, conditions, special instructions, etc.)"
                value={timeRemark}
                onChange={(e) => setTimeRemark(e.target.value)}
                rows={2}
              />
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-muted-foreground">
                {Object.keys(changes).length} field(s) changed
              </p>
              <Button onClick={submitForApproval} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Submit for approval
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="self-start border-border/60 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-primary" />
              Demand Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="min-w-0 text-right font-medium">{jobTitle || original?.jobTitle || "Role"}</p>
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="min-w-0 text-right font-medium">{quantity || original?.quantity || "1"}</p>
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </p>
                <p className="min-w-0 text-right font-medium">{location || original?.location || "—"}</p>
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  Salary
                </p>
                <p className="min-w-0 text-right font-medium">
                  {salaryAmount ? `${salaryAmount} ${salaryCurrency}` : original?.salary ? `${original.salary.amount} ${original.salary.currency}` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


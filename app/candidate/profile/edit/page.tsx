"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react"
import { PersonalInfoStep } from "@/components/candidate/steps/personal-info-step"
import { JobProfileStep } from "@/components/candidate/steps/job-profile-step"
import type { CandidateFormData } from "@/components/candidate/registration-wizard"

const initialFormData: CandidateFormData = {
  fullName: "",
  firstName: "",
  lastName: "",
  email: "",
  whatsapp: "",
  phone: "",
  gender: "",
  nationality: "",
  dateOfBirth: "",
  currentLocation: "",
  preferredLocations: [],
  maritalStatus: "",
  languages: [],
  jobCategories: [],
  totalExperience: "",
  noticePeriod: "",
  currentJobTitle: "",
  currentCompany: "",
  currentSalary: "",
  expectedSalary: "",
  industries: [],
  jobTypes: [],
  qualification: "",
  highestEducation: "",
  fieldOfStudy: "",
  skills: [],
  certifications: [],
  cvFile: null,
  videoFile: null,
  photoFile: null,
  passportFile: null,
  salaryRange: null,
  visaCategory: "",
  acceptTerms: true,
  acceptServiceCharge: false,
  password: "",
  confirmPassword: "",
}

export default function CandidateProfileEditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CandidateFormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null
    if (!userStr) {
      router.replace("/register/candidate")
      return
    }
    try {
      const user = JSON.parse(userStr)
      const id = user.id
      if (!id) {
        router.replace("/register/candidate")
        return
      }
      setCandidateId(id)
      fetch(`/api/candidate/profile?candidateId=${encodeURIComponent(id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
            setLoading(false)
            return
          }
          const c = data.candidate
          if (!c) {
            setLoading(false)
            return
          }
          setFormData({
            ...initialFormData,
            fullName: [c.firstName, c.lastName].filter(Boolean).join(" ") || "",
            firstName: c.firstName || "",
            lastName: c.lastName || "",
            email: c.email || "",
            whatsapp: c.phone || "",
            phone: c.phone || "",
            gender: c.gender || "",
            nationality: c.nationality || "",
            dateOfBirth: c.dateOfBirth || "",
            currentLocation: c.currentLocation || "",
            preferredLocations: Array.isArray(c.preferredLocations) ? c.preferredLocations : [],
            maritalStatus: c.maritalStatus || "",
            languages: Array.isArray(c.languages) ? c.languages : [],
            jobCategories: Array.isArray(c.jobCategories) ? c.jobCategories : [],
            totalExperience: c.totalExperience || "",
            noticePeriod: c.noticePeriod || "",
            currentJobTitle: c.currentJobTitle || "",
            currentCompany: c.currentCompany || "",
            currentSalary: c.currentSalary || "",
            expectedSalary: c.expectedSalary || "",
            industries: Array.isArray(c.industries) ? c.industries : [],
            jobTypes: Array.isArray(c.jobTypes) ? c.jobTypes : [],
            qualification: c.highestEducation || "",
            highestEducation: c.highestEducation || "",
            fieldOfStudy: c.fieldOfStudy || "",
            skills: Array.isArray(c.skills) ? c.skills : [],
            certifications: Array.isArray(c.certifications) ? c.certifications : [],
            salaryRange: c.salaryRange || null,
            visaCategory: c.visaCategory || "",
            acceptTerms: true,
          })
        })
        .catch(() => setError("Failed to load profile"))
        .finally(() => setLoading(false))
    } catch {
      router.replace("/register/candidate")
    }
  }, [router])

  const updateFormData = (data: Partial<CandidateFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleSave = async () => {
    if (!candidateId) return
    setSaving(true)
    setError(null)
    try {
      const parts = formData.fullName.trim().split(" ")
      const firstName = parts[0] || ""
      const lastName = parts.slice(1).join(" ") || ""
      const res = await fetch(`/api/candidate/profile?candidateId=${encodeURIComponent(candidateId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: formData.whatsapp || formData.phone,
          gender: formData.gender,
          nationality: formData.nationality,
          dateOfBirth: formData.dateOfBirth,
          currentLocation: formData.currentLocation,
          preferredLocations: formData.preferredLocations,
          maritalStatus: formData.maritalStatus,
          languages: formData.languages,
          totalExperience: formData.totalExperience,
          noticePeriod: formData.noticePeriod,
          currentJobTitle: formData.currentJobTitle,
          currentCompany: formData.currentCompany,
          currentSalary: formData.currentSalary,
          expectedSalary: formData.expectedSalary,
          industries: formData.industries,
          jobTypes: formData.jobTypes,
          jobCategories: formData.jobCategories,
          highestEducation: formData.qualification || formData.highestEducation,
          fieldOfStudy: formData.fieldOfStudy,
          skills: formData.skills,
          certifications: formData.certifications,
          visaCategory: formData.visaCategory,
          salaryRange: formData.salaryRange,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Update failed")
        setSaving(false)
        return
      }
      toast({ title: "Profile updated", description: "Your changes were saved successfully." })
      router.push("/candidate/profile")
    } catch {
      setError("Network error. Please try again.")
      setSaving(false)
    }
  }

  const steps = [
    { id: 1, name: "Personal Information" },
    { id: 2, name: "Job & Profile" },
  ]
  const progress = (currentStep / steps.length) * 100

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !candidateId) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <p className="text-destructive">{error}</p>
        <Link href="/candidate/dashboard">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/candidate/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="mb-2 text-2xl font-bold text-foreground">Edit profile</h1>
        <p className="mb-6 text-muted-foreground">Update your details to improve profile completion.</p>

        <Progress value={progress} className="mb-6 h-2" />
        <div className="mb-6 flex justify-between">
          {steps.map((step) => (
            <span
              key={step.id}
              className={`text-sm font-medium ${currentStep === step.id ? "text-primary" : "text-muted-foreground"}`}
            >
              {step.name}
            </span>
          ))}
        </div>

        <Card className="border-border shadow-lg">
          <CardContent className="p-6 md:p-8">
            {error && (
              <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
            )}
            {currentStep === 1 && (
              <PersonalInfoStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 2 && (
              <JobProfileStep formData={formData} updateFormData={updateFormData} />
            )}

            <div className="mt-8 flex justify-between border-t border-border pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              {currentStep < steps.length ? (
                <Button onClick={() => setCurrentStep((s) => s + 1)} className="gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Save changes
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          To update your CV or video, go to{" "}
          <Link href="/candidate/profile" className="font-medium text-primary hover:underline">
            My Profile
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

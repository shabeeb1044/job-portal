"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  FileText,
  Video,
  Check,
  X,
  Circle,
  Square,
  RotateCcw,
  ArrowLeft,
  Loader2,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  Sparkles,
} from "lucide-react"

type CandidateProfile = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  gender?: string
  nationality?: string
  dateOfBirth?: string
  currentLocation?: string
  preferredLocations?: string[]
  maritalStatus?: string
  languages?: string[]
  totalExperience?: string
  currentJobTitle?: string
  industries?: string[]
  jobTypes?: string[]
  jobCategories?: string[]
  highestEducation?: string
  fieldOfStudy?: string
  skills?: string[]
  certifications?: string[]
  cvUrl?: string
  videoUrl?: string
  photoUrl?: string
  salaryRange?: { min: number; max: number } | null
  noticePeriod?: string
}

function missingProfileFields(c: CandidateProfile) {
  const missingRequired: Array<{ key: string; label: string }> = []
  const missingOptional: Array<{ key: string; label: string }> = []

  const req = [
    { key: "firstName", label: "First name", ok: !!c.firstName },
    { key: "lastName", label: "Last name", ok: !!c.lastName },
    { key: "email", label: "Email", ok: !!c.email },
    { key: "phone", label: "Phone", ok: !!c.phone },
    { key: "gender", label: "Gender", ok: !!c.gender },
    { key: "nationality", label: "Nationality", ok: !!c.nationality },
    { key: "jobCategories", label: "Job categories", ok: (c.jobCategories?.length ?? 0) > 0 },
    { key: "totalExperience", label: "Total experience", ok: !!c.totalExperience },
    { key: "highestEducation", label: "Highest education", ok: !!c.highestEducation },
    { key: "cvUrl", label: "CV / Resume", ok: !!c.cvUrl },
    { key: "videoUrl", label: "Video introduction", ok: !!c.videoUrl },
  ]
  req.forEach((f) => {
    if (!f.ok) missingRequired.push({ key: f.key, label: f.label })
  })

  const opt = [
    { key: "currentJobTitle", label: "Current job title", ok: !!c.currentJobTitle },
    { key: "industries", label: "Industries", ok: (c.industries?.length ?? 0) > 0 },
    { key: "jobTypes", label: "Job types", ok: (c.jobTypes?.length ?? 0) > 0 },
    { key: "skills", label: "Skills", ok: (c.skills?.length ?? 0) > 0 },
    { key: "languages", label: "Languages", ok: (c.languages?.length ?? 0) > 0 },
    { key: "currentLocation", label: "Current location", ok: !!c.currentLocation },
    { key: "preferredLocations", label: "Preferred locations", ok: (c.preferredLocations?.length ?? 0) > 0 },
    { key: "dateOfBirth", label: "Date of birth", ok: !!c.dateOfBirth },
    { key: "maritalStatus", label: "Marital status", ok: !!c.maritalStatus },
    { key: "photoUrl", label: "Profile photo", ok: !!c.photoUrl },
    { key: "fieldOfStudy", label: "Field of study", ok: !!c.fieldOfStudy },
    { key: "salaryRange", label: "Expected salary range", ok: !!c.salaryRange },
    { key: "noticePeriod", label: "Notice period", ok: !!c.noticePeriod },
  ]
  opt.forEach((f) => {
    if (!f.ok) missingOptional.push({ key: f.key, label: f.label })
  })

  return { missingRequired, missingOptional }
}

export default function CandidateProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [cvUrl, setCvUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [profileCompletion, setProfileCompletion] = useState<number | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [cvFile, setCvFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)

  const [uploadingCv, setUploadingCv] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [cvSuccess, setCvSuccess] = useState(false)
  const [videoSuccess, setVideoSuccess] = useState(false)

  const [videoMode, setVideoMode] = useState<"select" | "record" | "preview">("select")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const cvInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const MAX_DURATION = 60

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCandidateId(user.id)
        if (user.cvUrl) setCvUrl(user.cvUrl)
        if (user.videoUrl) setVideoUrl(user.videoUrl)

        fetch(`/api/candidate/profile?candidateId=${encodeURIComponent(user.id)}`)
          .then((res) => res.ok ? res.json() : Promise.reject())
          .then((data) => {
            if (data?.candidate) setProfile(data.candidate)
            if (data?.profileCompletion != null) setProfileCompletion(data.profileCompletion)
          })
          .catch(() => {})
          .finally(() => setLoadingProfile(false))

        fetch(`/api/candidate/files?candidateId=${user.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.cvUrl) setCvUrl(data.cvUrl)
            if (data.videoUrl) setVideoUrl(data.videoUrl)
          })
          .catch(() => {})
      } catch {}
    }
    setLoadingProfile(false)
  }, [])

  const handleCvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file only.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5 MB.")
      return
    }
    setCvFile(file)
    setCvSuccess(false)
  }

  const uploadCv = async () => {
    if (!cvFile || !candidateId) return
    setUploadingCv(true)
    setCvSuccess(false)
    try {
      const fd = new FormData()
      fd.append("candidateId", candidateId)
      fd.append("cvFile", cvFile)
      const res = await fetch("/api/candidate/files", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok && data.cvUrl) {
        setCvUrl(data.cvUrl)
        setCvFile(null)
        setCvSuccess(true)
        if (cvInputRef.current) cvInputRef.current.value = ""
        const userStr = localStorage.getItem("user")
        if (userStr) {
          const user = JSON.parse(userStr)
          user.cvUrl = data.cvUrl
          localStorage.setItem("user", JSON.stringify(user))
        }
        toast({ title: "CV updated", description: "Your resume was uploaded successfully." })
      } else {
        alert(data.error || "Upload failed")
      }
    } catch {
      alert("Network error. Please try again.")
    } finally {
      setUploadingCv(false)
    }
  }

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      alert("File too large. Maximum size is 50 MB.")
      return
    }
    setVideoFile(file)
    setRecordedBlob(file)
    setVideoMode("preview")
    setVideoSuccess(false)
  }

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true,
      })
      setStream(mediaStream)
      setVideoMode("record")
    } catch {
      alert("Unable to access camera. Please check permissions.")
    }
  }, [])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }, [stream])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(() => {
    if (!stream) return
    chunksRef.current = []
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" })
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      setRecordedBlob(blob)
      const file = new File([blob], "video-profile.webm", { type: "video/webm" })
      setVideoFile(file)
      setVideoMode("preview")
      stopCamera()
    }
    mediaRecorderRef.current = mr
    mr.start()
    setIsRecording(true)
    setRecordingTime(0)
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= MAX_DURATION - 1) {
          stopRecording()
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }, [stream, stopCamera, stopRecording])

  const uploadVideo = async () => {
    if (!videoFile || !candidateId) return
    setUploadingVideo(true)
    setVideoSuccess(false)
    try {
      const fd = new FormData()
      fd.append("candidateId", candidateId)
      fd.append("videoFile", videoFile)
      const res = await fetch("/api/candidate/files", { method: "POST", body: fd })
      const data = await res.json()
      if (res.ok && data.videoUrl) {
        setVideoUrl(data.videoUrl)
        setVideoFile(null)
        setRecordedBlob(null)
        setVideoMode("select")
        setVideoSuccess(true)
        const userStr = localStorage.getItem("user")
        if (userStr) {
          const user = JSON.parse(userStr)
          user.videoUrl = data.videoUrl
          localStorage.setItem("user", JSON.stringify(user))
        }
        toast({ title: "Video updated", description: "Your video introduction was uploaded successfully." })
      } else {
        alert(data.error || "Upload failed")
      }
    } catch {
      alert("Network error. Please try again.")
    } finally {
      setUploadingVideo(false)
    }
  }

  const resetVideo = () => {
    setRecordedBlob(null)
    setVideoFile(null)
    setVideoMode("select")
    setRecordingTime(0)
    setVideoSuccess(false)
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  const formatSize = (b: number) => {
    if (b < 1024) return b + " B"
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB"
    return (b / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/candidate/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your CV and video introduction</p>
        </div>
      </div>

      {/* Profile completion + missing fields */}
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Profile completion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">
                {loadingProfile ? "—" : `${profileCompletion ?? 0}%`}
              </div>
              <p className="text-sm text-muted-foreground">
                Complete your profile to unlock job applications and increase visibility.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/candidate/profile/edit">Update Profile</Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/candidate/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
          <Progress value={profileCompletion ?? 0} className="h-2" />

          {profile && (() => {
            const { missingRequired, missingOptional } = missingProfileFields(profile)
            return (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-destructive/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Complete your profile (required)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {missingRequired.length === 0 ? (
                      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">All required fields completed</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {missingRequired.map((f) => (
                          <Badge key={f.key} variant="destructive">
                            {f.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Nice-to-have (optional)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {missingOptional.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Great — you’ve filled all optional fields.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {missingOptional.slice(0, 10).map((f) => (
                          <Badge key={f.key} variant="secondary">
                            {f.label}
                          </Badge>
                        ))}
                        {missingOptional.length > 10 && (
                          <Badge variant="secondary">+{missingOptional.length - 10} more</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* CV Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            CV / Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current CV */}
          {cvUrl && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Current CV</p>
                  <p className="text-sm text-muted-foreground">{cvUrl.split("/").pop()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={cvUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </a>
                <a href={cvUrl} download>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          )}

          {cvSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">CV uploaded successfully!</span>
            </div>
          )}

          {/* Upload new CV */}
          <div className="space-y-3">
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleCvSelect}
            />
            <Card
              className="cursor-pointer border-2 border-dashed p-6 transition-all hover:border-primary"
              onClick={() => cvInputRef.current?.click()}
            >
              {cvFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{cvFile.name}</p>
                      <p className="text-sm text-muted-foreground">{formatSize(cvFile.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCvFile(null)
                      if (cvInputRef.current) cvInputRef.current.value = ""
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">
                    {cvUrl ? "Upload New CV" : "Upload CV / Resume"}
                  </p>
                  <p className="text-sm text-muted-foreground">PDF only (Max 5 MB)</p>
                </div>
              )}
            </Card>

            {cvFile && (
              <Button onClick={uploadCv} disabled={uploadingCv} className="w-full gap-2">
                {uploadingCv ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {cvUrl ? "Replace CV" : "Upload CV"}
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Video Introduction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Video */}
          {videoUrl && videoMode === "select" && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border">
                <video src={videoUrl} controls className="w-full" />
              </div>
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                Video uploaded
              </Badge>
            </div>
          )}

          {videoSuccess && videoMode === "select" && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Video uploaded successfully!</span>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-lg bg-primary/5 p-4">
            <h3 className="mb-2 text-sm font-medium text-foreground">Tips for a Great Video</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>- Introduce yourself and mention your profession</li>
              <li>- Highlight 2-3 key skills and achievements</li>
              <li>- Speak clearly and maintain eye contact</li>
              <li>- Good lighting and quiet background</li>
              <li>- Keep it under 60 seconds</li>
            </ul>
          </div>

          {/* Video Mode Selection */}
          {videoMode === "select" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                className="cursor-pointer border-2 p-6 transition-all hover:border-primary"
                onClick={startCamera}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Video className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">Record Now</h3>
                  <p className="text-sm text-muted-foreground">Use your camera</p>
                </div>
              </Card>

              <Card
                className="cursor-pointer border-2 p-6 transition-all hover:border-primary"
                onClick={() => videoInputRef.current?.click()}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoFileSelect}
                />
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                    <Upload className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">Upload Video</h3>
                  <p className="text-sm text-muted-foreground">Max 50 MB</p>
                </div>
              </Card>
            </div>
          )}

          {/* Recording Mode */}
          {videoMode === "record" && (
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                {isRecording && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-destructive px-3 py-1">
                    <Circle className="h-3 w-3 animate-pulse fill-current" />
                    <span className="text-sm font-medium text-destructive-foreground">REC</span>
                  </div>
                )}
                <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1">
                  <span className="font-mono text-sm text-white">
                    {formatTime(recordingTime)} / {formatTime(MAX_DURATION)}
                  </span>
                </div>
                {isRecording && (
                  <div className="absolute bottom-0 left-0 right-0">
                    <Progress value={(recordingTime / MAX_DURATION) * 100} className="h-1 rounded-none" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-4 p-4">
                {!isRecording ? (
                  <>
                    <Button variant="outline" onClick={() => { stopCamera(); setVideoMode("select") }} type="button">
                      <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={startRecording} className="gap-2" type="button">
                      <Circle className="h-4 w-4 fill-current" /> Start Recording
                    </Button>
                  </>
                ) : (
                  <Button variant="destructive" onClick={stopRecording} className="gap-2" type="button">
                    <Square className="h-4 w-4 fill-current" /> Stop Recording
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Preview Mode */}
          {videoMode === "preview" && recordedBlob && (
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                <video src={URL.createObjectURL(recordedBlob)} controls className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-foreground">
                    Video ready ({videoFile ? formatSize(videoFile.size) : ""})
                  </span>
                </div>
                <Button variant="outline" onClick={resetVideo} type="button">
                  <RotateCcw className="mr-2 h-4 w-4" /> Re-record
                </Button>
              </div>
              <div className="border-t p-4">
                <Button onClick={uploadVideo} disabled={uploadingVideo} className="w-full gap-2">
                  {uploadingVideo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading video...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {videoUrl ? "Replace Video" : "Upload Video"}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

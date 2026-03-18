"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Video,
  Upload,
  Play,
  FileText,
  Check,
  X,
  Circle,
  Square,
} from "lucide-react"
import { JobCategorySelector } from "../job-category-selector"
import type { CandidateFormData } from "../registration-wizard"

const experienceYears = [
  "Fresher (0-1 years)",
  "1-2 years",
  "2-3 years",
  "3-5 years",
  "5-7 years",
  "7-10 years",
  "10-15 years",
  "15+ years"
]

const qualifications = [
  "High School",
  "Diploma",
  "Vocational Training",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD/Doctorate",
  "Professional Certification",
  "Other"
]

const MAX_DURATION = 60 // 1 minute max
const MAX_CV_SIZE = 5 * 1024 * 1024 // 5MB

interface JobProfileStepProps {
  formData: CandidateFormData
  updateFormData: (data: Partial<CandidateFormData>) => void
}

export function JobProfileStep({ formData, updateFormData }: JobProfileStepProps) {
  const [videoMode, setVideoMode] = useState<"select" | "record" | "upload" | "preview">("select")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const handleSalaryRangeChange = (values: number[]) => {
    updateFormData({
      salaryRange: { min: values[0], max: values[1] },
    })
  }

  const handleCVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > MAX_CV_SIZE) {
        alert(`File too large. Maximum size is 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`)
        return
      }
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file only.")
        return
      }
      updateFormData({ cvFile: file })
    }
  }

  const removeCV = () => {
    updateFormData({ cvFile: null })
    if (cvInputRef.current) {
      cvInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true,
      })
      setStream(mediaStream)
      setVideoMode("record")
    } catch (err) {
      console.error("Error accessing camera:", err)
      alert("Unable to access camera. Please check permissions.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(() => {
    if (!stream) return

    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" })
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      setRecordedBlob(blob)
      const file = new File([blob], "video-profile.webm", { type: "video/webm" })
      updateFormData({ videoFile: file })
      setVideoMode("preview")
      stopCamera()
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
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
  }, [stream, stopCamera, updateFormData, stopRecording])

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("File too large. Maximum size is 50MB.")
        return
      }
      updateFormData({ videoFile: file })
      setRecordedBlob(file)
      setVideoMode("preview")
    }
  }

  const resetVideo = () => {
    setRecordedBlob(null)
    updateFormData({ videoFile: null })
    setVideoMode("select")
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold text-foreground">Job & Profile Details</h2>
        <p className="text-sm text-muted-foreground">
          Complete your profile to get discovered by employers
        </p>
      </div>

      {/* Job Category */}
      <JobCategorySelector
        selectedCategories={formData.jobCategories || []}
        onSelectionChange={(categories) => updateFormData({ jobCategories: categories })}
        required
      />

      {/* Experience & Qualification */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Total Years Experience *</Label>
          <Select
            value={formData.totalExperience}
            onValueChange={(value) => updateFormData({ totalExperience: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              {experienceYears.map((exp) => (
                <SelectItem key={exp} value={exp.toLowerCase()}>
                  {exp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Qualification *</Label>
          <Select
            value={formData.qualification}
            onValueChange={(value) => updateFormData({ qualification: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select qualification" />
            </SelectTrigger>
            <SelectContent>
              {qualifications.map((qual) => (
                <SelectItem key={qual} value={qual.toLowerCase()}>
                  {qual}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* CV Upload */}
      <div className="space-y-2">
        <Label>Upload CV/Resume *</Label>
        <Card className="border-2 border-dashed p-6">
          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleCVSelect}
          />
          
          {formData.cvFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{formData.cvFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(formData.cvFile.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeCV}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="flex cursor-pointer flex-col items-center justify-center py-6"
              onClick={() => cvInputRef.current?.click()}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Upload className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mb-1 font-medium text-foreground">Upload CV/Resume *</p>
              <p className="text-sm text-muted-foreground">
                PDF only (Max 5MB)
              </p>
              <Button variant="outline" className="mt-4 bg-transparent" type="button">
                Choose File
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Video Profile */}
      <div className="space-y-2">
        <Label>Record Video Self-Introduction (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-4">
          Record a 1-minute video introducing yourself (optional)
        </p>

        {/* Video Tips */}
        <div className="rounded-lg bg-primary/5 p-4 mb-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">Tips for a Great Video</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Introduce yourself and mention your profession</li>
            <li>• Highlight 2-3 key skills and achievements</li>
            <li>• Speak clearly and maintain eye contact</li>
            <li>• Good lighting and quiet background</li>
            <li>• Keep it under 60 seconds</li>
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
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">Record Now</h3>
                <p className="text-sm text-muted-foreground">
                  Use your camera to record a video introduction
                </p>
              </div>
            </Card>

            <Card
              className="cursor-pointer border-2 p-6 transition-all hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <Upload className="h-8 w-8 text-accent" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">Upload Video</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a pre-recorded video (Max 50MB)
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Recording Mode */}
        {videoMode === "record" && (
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />

              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-destructive px-3 py-1">
                  <Circle className="h-3 w-3 animate-pulse fill-current" />
                  <span className="text-sm font-medium text-destructive-foreground">REC</span>
                </div>
              )}

              {/* Timer */}
              <div className="absolute right-4 top-4 rounded-full bg-black/50 px-3 py-1">
                <span className="text-sm font-mono text-white">
                  {formatTime(recordingTime)} / {formatTime(MAX_DURATION)}
                </span>
              </div>

              {/* Progress Bar */}
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
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={startRecording} className="gap-2" type="button">
                    <Circle className="h-4 w-4 fill-current" />
                    Start Recording
                  </Button>
                </>
              ) : (
                <Button variant="destructive" onClick={stopRecording} className="gap-2" type="button">
                  <Square className="h-4 w-4 fill-current" />
                  Stop Recording
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Preview Mode */}
        {videoMode === "preview" && recordedBlob && (
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black">
              <video
                src={URL.createObjectURL(recordedBlob)}
                controls
                className="h-full w-full object-cover"
              />
              <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-success">
                <Check className="h-5 w-5 text-success-foreground" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-success" />
                <span className="font-medium text-foreground">Video uploaded successfully</span>
              </div>
              <Button variant="outline" onClick={resetVideo} type="button">
                <X className="mr-2 h-4 w-4" />
                Re-record
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Expected Salary Range */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Expected Salary Range (Monthly) *</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Drag the sliders to set your minimum and maximum expected salary
          </p>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Minimum</span>
              <span className="font-medium">
                {formData.salaryRange?.min || 500} AED  / month
              </span>
            </div>
            <Slider
              value={[formData.salaryRange?.min || 500]}
              onValueChange={(values) =>
                handleSalaryRangeChange([values[0], formData.salaryRange?.max || 5000])
              }
              min={500}
              max={10000}
              step={100}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Maximum</span>
              <span className="font-medium">
                {formData.salaryRange?.max || 5000 } AED / month
              </span>
            </div>
            <Slider
              value={[formData.salaryRange?.max || 5000]}
              onValueChange={(values) =>
                handleSalaryRangeChange([formData.salaryRange?.min || 500, values[0]])
              }
              min={500}
              max={10000}
              step={100}
              className="w-full"
            />
          </div>

          {formData.salaryRange && (
            <div className="mt-4 rounded-lg bg-primary/5 p-3 text-center">
              <p className="text-sm font-medium text-foreground">
                Salary Range: AED {formData.salaryRange.min.toLocaleString()} - AED {formData.salaryRange.max.toLocaleString()} / month
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Terms and Policies */}
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => updateFormData({ acceptTerms: checked === true })}
            required
          />
          <div className="space-y-1">
            <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I accept the Terms and Conditions and Privacy Policy *
            </Label>
            <p className="text-xs text-muted-foreground">
              By checking this box, you agree to our terms of service and privacy policy. 
              Please read them carefully before submitting your profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Video,
  VideoOff,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Mic,
  MicOff,
  Circle,
  Square,
} from "lucide-react"
import type { CandidateFormData } from "../registration-wizard"

interface VideoProfileStepProps {
  formData: CandidateFormData
  updateFormData: (data: Partial<CandidateFormData>) => void
}

const MAX_DURATION = 60 // 1 minute max

export function VideoProfileStep({ formData, updateFormData }: VideoProfileStepProps) {
  const [mode, setMode] = useState<"select" | "record" | "upload" | "preview">("select")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true,
      })
      setStream(mediaStream)
      setMode("record")
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
      setMode("preview")
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("File too large. Maximum size is 50MB.")
        return
      }
      updateFormData({ videoFile: file })
      setRecordedBlob(file)
      setMode("preview")
    }
  }

  const resetVideo = () => {
    setRecordedBlob(null)
    updateFormData({ videoFile: null })
    setMode("select")
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
        <h2 className="mb-1 text-xl font-semibold text-foreground">Video Profile</h2>
        <p className="text-sm text-muted-foreground">
          Record a 1-minute video introduction to stand out to employers
        </p>
      </div>

      {/* Tips */}
      <div className="rounded-lg bg-primary/5 p-4">
        <h3 className="mb-2 font-medium text-foreground">Tips for a Great Video</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Introduce yourself and mention your profession</li>
          <li>• Highlight 2-3 key skills and achievements</li>
          <li>• Speak clearly and maintain eye contact</li>
          <li>• Good lighting and quiet background</li>
          <li>• Keep it under 60 seconds</li>
        </ul>
      </div>

      {/* Mode Selection */}
      {mode === "select" && (
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
              onChange={handleFileUpload}
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
      {mode === "record" && (
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
                <Button variant="outline" onClick={() => { stopCamera(); setMode("select") }}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={startRecording} className="gap-2">
                  <Circle className="h-4 w-4 fill-current" />
                  Start Recording
                </Button>
              </>
            ) : (
              <Button variant="destructive" onClick={stopRecording} className="gap-2">
                <Square className="h-4 w-4 fill-current" />
                Stop Recording
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Preview Mode */}
      {mode === "preview" && recordedBlob && (
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
            <Button variant="outline" onClick={resetVideo}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Re-record
            </Button>
          </div>
        </Card>
      )}

      {/* Optional Skip */}
      {mode === "select" && (
        <p className="text-center text-sm text-muted-foreground">
          Video profile is optional but highly recommended. Candidates with video profiles get 5x more views.
        </p>
      )}
    </div>
  )
}

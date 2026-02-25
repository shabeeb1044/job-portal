"use client"

import { CheckCircle2, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type MessageType = "success" | "error"

export interface MessageBannerProps {
  message: { type: MessageType; text: string } | null
  onDismiss?: () => void
  className?: string
}

export function MessageBanner({ message, onDismiss, className }: MessageBannerProps) {
  if (!message) return null
  const isSuccess = message.type === "success"
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg p-3 text-sm flex items-center gap-2",
        isSuccess
          ? "bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-destructive/10 text-destructive",
        className
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0" />
      )}
      <span className="flex-1">{message.text}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

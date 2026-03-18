"use client"

import { useEffect, useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface JobCategory {
  id: string
  slug: string
  name: string
  emoji: string
  description: string
}

export interface JobSubCategory {
  id: string
  categoryId: string
  name: string
  slug?: string
}

interface JobCategorySelectorProps {
  selectedCategories: string[]
  onSelectionChange: (categories: string[]) => void
  required?: boolean
}

export function JobCategorySelector({
  selectedCategories,
  onSelectionChange,
  required = false,
}: JobCategorySelectorProps) {
  const [jobCategories, setJobCategories] = useState<JobCategory[]>([])
  const [subCategories, setSubCategories] = useState<JobSubCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [subPopoverOpen, setSubPopoverOpen] = useState(false)

  // Map of sub-category id -> { name, categoryName } for displaying tags
  const [subCategoryLabels, setSubCategoryLabels] = useState<Record<string, { name: string; categoryName: string }>>({})

  useEffect(() => {
    let cancelled = false
    fetch("/api/job-categories")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.categories) {
          setJobCategories(
            data.categories.map((c: { id: string; slug: string; name: string; emoji?: string; description?: string }) => ({
              id: c.id,
              slug: c.slug || c.id,
              name: c.name,
              emoji: c.emoji || "📋",
              description: c.description || "",
            }))
          )
        }
      })
      .catch(() => {
        if (!cancelled) setJobCategories([])
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedCategoryId) {
      setSubCategories([])
      return
    }
    let cancelled = false
    setLoadingSubs(true)
    fetch(`/api/job-sub-categories?categoryId=${encodeURIComponent(selectedCategoryId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.subCategories) {
          setSubCategories(data.subCategories)
          const cat = jobCategories.find((c) => c.id === selectedCategoryId)
          const labels: Record<string, { name: string; categoryName: string }> = {}
          data.subCategories.forEach((s: JobSubCategory) => {
            labels[s.id] = { name: s.name, categoryName: cat?.name || "" }
          })
          setSubCategoryLabels((prev) => ({ ...prev, ...labels }))
        }
      })
      .catch(() => {
        if (!cancelled) setSubCategories([])
      })
      .finally(() => {
        if (!cancelled) setLoadingSubs(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedCategoryId, jobCategories])

  const handleToggleSubCategory = (subId: string) => {
    if (selectedCategories.includes(subId)) {
      onSelectionChange(selectedCategories.filter((id) => id !== subId))
    } else {
      onSelectionChange([...selectedCategories, subId])
    }
  }

  const handleRemoveTag = (subId: string) => {
    onSelectionChange(selectedCategories.filter((id) => id !== subId))
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          Job Category {required && <span className="text-destructive">*</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select a category, then choose job sub-categories from the dropdown
        </p>
      </div>

      {loadingCategories ? (
        <p className="text-sm text-muted-foreground">Loading categories…</p>
      ) : (
        <div className="space-y-4">
          {/* Category dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select
              value={selectedCategoryId}
              onValueChange={(v) => {
                setSelectedCategoryId(v)
                setSubPopoverOpen(true)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a job category" />
              </SelectTrigger>
              <SelectContent>
                {jobCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="mr-1.5">{cat.emoji}</span>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-category multi-select dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Job sub-categories</label>
            <Popover open={subPopoverOpen} onOpenChange={setSubPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={subPopoverOpen}
                  className="w-full justify-between font-normal"
                  disabled={!selectedCategoryId}
                >
                  {selectedCategoryId ? (
                    loadingSubs ? (
                      "Loading sub-categories…"
                    ) : (
                      <>
                        Select job sub-categories
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </>
                    )
                  ) : (
                    "Select a category first"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <ScrollArea className="max-h-[280px]">
                  <div className="p-2 space-y-1">
                    {subCategories.length === 0 && !loadingSubs ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No sub-categories available
                      </p>
                    ) : (
                      subCategories.map((sub) => {
                        const isSelected = selectedCategories.includes(sub.id)
                        return (
                          <label
                            key={sub.id}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer hover:bg-accent/50 transition-colors",
                              isSelected && "bg-accent/30"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSubCategory(sub.id)}
                            />
                            <span className="text-sm">{sub.name}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Selected tags */}
          {selectedCategories.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Selected</label>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((subId) => {
                  const label = subCategoryLabels[subId]
                  return (
                    <Badge
                      key={subId}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 gap-1 text-sm font-normal"
                    >
                      {label ? label.name : subId}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(subId)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                        aria-label={`Remove ${label?.name || subId}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {selectedCategories.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedCategories.length} sub-categor{selectedCategories.length === 1 ? "y" : "ies"} selected
            </p>
          )}
        </div>
      )}

      {jobCategories.length === 0 && !loadingCategories && (
        <p className="text-sm text-muted-foreground">No job categories available.</p>
      )}
    </div>
  )
}

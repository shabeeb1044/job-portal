"use client"

import { useEffect, useState } from "react"

export interface JobCategory {
  id: string
  slug: string
  name: string
  emoji: string
  description: string
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
  const [loading, setLoading] = useState(true)

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
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggle = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      onSelectionChange(selectedCategories.filter((id) => id !== slug))
    } else {
      onSelectionChange([...selectedCategories, slug])
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-700">
          Job Category {required && <span className="text-red-500">*</span>}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Select one or more categories</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading categories…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {jobCategories.map((category) => {
              const slug = category.slug || category.id
              const isSelected = selectedCategories.includes(slug)
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleToggle(slug)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                    border transition-all duration-150 cursor-pointer select-none
                    ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
                    }
                  `}
                >
                  <span className="text-base leading-none">{category.emoji}</span>
                  <span>{category.name}</span>
                </button>
              )
            })}
          </div>
          {jobCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">No job categories available.</p>
          )}
        </>
      )}

      {selectedCategories.length > 0 && (
        <p className="text-xs text-gray-400">
          {selectedCategories.length} categor{selectedCategories.length === 1 ? "y" : "ies"} selected
        </p>
      )}
    </div>
  )
}

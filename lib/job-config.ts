export type BenefitType =
  | "food"
  | "accommodation"
  | "transportation"
  | "visa"
  | "medical_insurance"
  | "overtime"
  | "insurance"
  | "annual_leave_30_days"
  | "other"

// Store nationality as free-form country names (e.g. "India", "United Arab Emirates")
export type NationalityType = string

export const BENEFITS: { value: BenefitType; label: string }[] = [
  { value: "food",                label: "Food" },
  { value: "accommodation",       label: "Stay" },
  { value: "transportation",      label: "Transport" },
  { value: "visa",                label: "Visa" },
  { value: "medical_insurance",   label: "Medical" },
  { value: "overtime",            label: "Overtime" },
  { value: "insurance",           label: "Insurance" },
  { value: "annual_leave_30_days", label: "30 days annual leave" },
  { value: "other",               label: "Other" },
]


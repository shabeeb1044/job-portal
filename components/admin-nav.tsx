"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  TrendingUp,
  FileText,
  Video,
  CreditCard,
  Settings,
  Shield,
} from "lucide-react"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/approvals", label: "Approvals", icon: UserCheck },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/agencies", label: "Agencies", icon: Building2 },
  { href: "/admin/companies", label: "Companies", icon: Briefcase },
  { href: "/admin/bids", label: "Bids", icon: DollarSign },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: FileText },
  { href: "/admin/interviews", label: "Interviews", icon: Video },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminNav({ role }: { role?: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-border pb-4">
      <div className="flex items-center gap-2 pr-4 border-r border-border mr-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {role === "super_admin" ? "Super Admin" : "Admin"}
        </span>
        {role === "super_admin" && (
          <Badge variant="secondary" className="text-xs">Full access</Badge>
        )}
      </div>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

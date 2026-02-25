"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MessageBanner } from "@/components/ui/message-banner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Eye,
  TrendingUp,
  DollarSign,
  Building2,
  MapPin,
  Clock,
  CheckCircle,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Sun,
  Moon,
  Menu,
  Home,
  FileText,
  MessageSquare,
  Heart,
} from "lucide-react"
import { useTheme } from "next-themes"

// Mock data
const stats = [
  { label: "Profile Views", value: "6000+", change: "+12%", icon: Eye },
  { label: "Active Bids", value: "8", change: "+3", icon: TrendingUp },
  { label: "Shortlisted", value: "15", change: "+5", icon: Heart },
  { label: "Avg. Bid Amount", value: "$2,500", change: "+8%", icon: DollarSign },
]

const activeBids = [
  {
    id: 1,
    company: "Gulf Construction LLC",
    position: "Senior Civil Engineer",
    location: "Dubai, UAE",
    bidAmount: "$3,500",
    status: "pending",
    date: "2 hours ago",
  },
  {
    id: 2,
    company: "Al Futtaim Group",
    position: "Project Manager",
    location: "Abu Dhabi, UAE",
    bidAmount: "$4,200",
    status: "accepted",
    date: "1 day ago",
  },
  {
    id: 3,
    company: "Emaar Properties",
    position: "Site Engineer",
    location: "Dubai, UAE",
    bidAmount: "$2,800",
    status: "pending",
    date: "3 days ago",
  },
]

export default function CandidateDashboard() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setLogoutConfirmOpen(false)
    import("next-auth/react").then(({ signOut }) => signOut({ callbackUrl: "/" }))
    router.push("/")
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/main-logo.png" alt="TalentBid" className="h-9 w-auto" />
            <span className="text-xl font-bold text-foreground">TalentBid</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          <Link href="/candidate/dashboard" className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3 text-primary">
            <Home className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/candidate/profile" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
            <User className="h-5 w-5" />
            My Profile
          </Link>
          <Link href="/candidate/bids" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
            <TrendingUp className="h-5 w-5" />
            Bids Received
            {activeBids.length > 0 && (
              <Badge className="ml-auto">{activeBids.length}</Badge>
            )}
          </Link>
          <Link href="/candidate/applications" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
            <FileText className="h-5 w-5" />
            Applications
          </Link>
          <Link href="/candidate/messages" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
            <MessageSquare className="h-5 w-5" />
            Messages
          </Link>
          <Link href="/candidate/saved" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Heart className="h-5 w-5" />
            Saved Jobs
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <Link href="/candidate/settings" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground hover:bg-muted hover:text-foreground">
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Welcome back, {displayName}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {initials}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/candidate/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/candidate/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setLogoutConfirmOpen(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 lg:p-8">
          <MessageBanner message={message} onDismiss={() => setMessage(null)} className="mb-4" />
          {/* Profile Completion */}
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  85%
                </div>
                <div>
                  <p className="font-medium text-foreground">Complete your profile</p>
                  <p className="text-sm text-muted-foreground">Add a video profile to increase visibility by 5x</p>
                </div>
              </div>
              <Link href="/candidate/profile">
                <Button>Complete Profile</Button>
              </Link>
            </CardContent>
          </Card>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {stat.change}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Active Bids */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Bids</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/candidate/bids">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeBids.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No bids yet. When companies bid on your profile, they will appear here.</p>
              ) : (
                <div className="space-y-4">
                  {activeBids.map((bid) => (
                    <div key={bid.id} className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{bid.position}</h3>
                          <p className="text-sm text-muted-foreground">{bid.companyName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {bid.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {bid.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatBidDate(bid.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">
                            ${bid.bidAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Monthly Salary</p>
                        </div>
                        <Badge variant={bid.status === "accepted" ? "default" : "secondary"} className="capitalize">
                          {bid.status === "accepted" && <CheckCircle className="mr-1 h-3 w-3" />}
                          {bid.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Log out?"
        description="Are you sure you want to log out? You will need to sign in again to access your dashboard."
        confirmLabel="Log out"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </div>
  )
}

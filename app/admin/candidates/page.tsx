"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// etc.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Eye, Filter, Play, Download, FileText, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Calendar } from "lucide-react"
import type { Candidate } from "@/lib/db"

function DetailRow({ label, value, icon: Icon }: { label: string; value: string | undefined | null; icon?: React.ComponentType<{ className?: string }> }) {
  const display = value ?? "—"
  if (display === "—") return null
  return (
    <div className="flex gap-2 py-1.5 text-sm">
      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className="font-medium text-muted-foreground min-w-[120px]">{label}:</span>
      <span className="text-foreground break-words">{display}</span>
    </div>
  )
}

export default function CandidatesManagementPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/admin/login')
      return
    }
    const userData = JSON.parse(user)
    if (userData.role !== 'super_admin' && userData.role !== 'admin') {
      router.push('/')
      return
    }
    setUserRole(userData.role)
    loadCandidates()
  }, [router])

  const loadCandidates = async () => {
    try {
      const response = await fetch('/api/admin/candidates')
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates || [])
      }
    } catch (error) {
      console.error('Failed to load candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCandidates = candidates
    .filter(candidate => {
      const matchesSearch =
        candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return bTime - aTime // latest registered first
    })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'default'
      case 'under_bidding':
        return 'secondary'
      case 'interviewed':
        return 'outline'
      case 'selected':
        return 'default'
      case 'on_hold':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <AdminNav role={userRole ?? undefined} />
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Candidates Management</h1>
              <p className="text-muted-foreground mt-2">
                View and manage all registered candidates
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Candidates</CardTitle>
                  <CardDescription>
                    {filteredCandidates.length} total candidates
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
            <Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-10"></TableHead> {/* avatar column */}
      <TableHead>Name</TableHead>
      <TableHead>Email / Phone</TableHead>
      <TableHead>Location / Nationality</TableHead>
      <TableHead>Role / Category</TableHead>
      <TableHead>Experience</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right pr-6">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredCandidates.map((candidate) => (
      <TableRow 
        key={candidate.id}
        className="hover:bg-muted/40 cursor-pointer transition-colors"
        onClick={() => setSelectedCandidate(candidate)}
      >
        <TableCell>
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover border"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
          )}
        </TableCell>
        <TableCell className="font-medium">
          {candidate.firstName} {candidate.lastName}
          {candidate.currentJobTitle && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {candidate.currentJobTitle}
            </div>
          )}
        </TableCell>
        <TableCell className="text-sm">
          <div>{candidate.email}</div>
          {candidate.phone && <div className="text-xs text-muted-foreground">{candidate.phone}</div>}
        </TableCell>
        <TableCell className="text-sm">
          {candidate.currentLocation || "—"}
          {candidate.nationality && (
            <span className="block text-xs text-muted-foreground">
              {candidate.nationality}
            </span>
          )}
        </TableCell>
        <TableCell className="text-sm">
          {candidate.jobCategories?.slice(0, 2).join(", ") || "—"}
          {candidate.jobCategories?.length > 2 && (
            <span className="text-xs text-muted-foreground"> +{candidate.jobCategories.length - 2}</span>
          )}
        </TableCell>
        <TableCell className="text-sm">
          {candidate.totalExperience || "—"}
        </TableCell>
        <TableCell>
          <Badge variant={getStatusBadgeVariant(candidate.status)} className="capitalize">
            {candidate.status.replace(/_/g, " ")}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCandidate(candidate);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
            </CardContent>
          </Card>

<Dialog 
  open={!!selectedCandidate} 
  onOpenChange={(open) => !open && setSelectedCandidate(null)}
>
  <DialogContent className="max-w-5xl sm:max-w-[95vw] max-h-[94vh] p-0 gap-0 flex flex-col overflow-hidden">
    {/* Header */}
    {selectedCandidate && (
      <div className="bg-muted/40 px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
            <AvatarImage src={selectedCandidate.photoUrl} alt="Profile photo" />
            <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
              {selectedCandidate.firstName?.[0]}{selectedCandidate.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <div>
            <DialogTitle className="text-2xl font-bold leading-tight">
              {selectedCandidate.firstName} {selectedCandidate.lastName}
            </DialogTitle>
            <p className="text-base text-muted-foreground mt-1">
              {selectedCandidate.currentJobTitle || "—"}
              {selectedCandidate.currentCompany && `  •  ${selectedCandidate.currentCompany}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge 
            variant={getStatusBadgeVariant(selectedCandidate.status)}
            className="px-4 py-1.5 text-base font-medium capitalize"
          >
            {selectedCandidate.status.replace(/_/g, " ")}
          </Badge>

          {/* Optional: quick actions */}
          {/* <Button variant="outline" size="sm">Change Status</Button> */}
        </div>
      </div>
    )}

    <div className="flex flex-1 overflow-hidden">
      {/* Left sidebar - key facts / documents */}
      <div className="hidden md:block w-80 border-r bg-muted/20 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Quick Facts */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quick Info
            </h3>
            <div className="space-y-3.5 text-sm">
              <DetailRow label="Email" value={selectedCandidate?.email} icon={Mail} />
              <DetailRow label="Phone" value={selectedCandidate?.phone} icon={Phone} />
              <DetailRow label="Location" value={selectedCandidate?.currentLocation} icon={MapPin} />
              <DetailRow label="Experience" value={selectedCandidate?.totalExperience} icon={Briefcase} />
              <DetailRow label="Exp. Salary" value={selectedCandidate?.expectedSalary || selectedCandidate?.salaryRange?.min + "–" + selectedCandidate?.salaryRange?.max} />
              <DetailRow label="Notice" value={selectedCandidate?.noticePeriod} />
              <DetailRow label="Nationality" value={selectedCandidate?.nationality} />
            </div>
          </div>

          <Separator />

          {/* Documents */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Documents
            </h3>
            <div className="space-y-4">
              {selectedCandidate?.cvUrl ? (
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <a href={selectedCandidate.cvUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Download CV
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No CV uploaded</p>
              )}

              {selectedCandidate?.videoUrl ? (
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <a href={selectedCandidate.videoUrl} target="_blank" rel="noopener noreferrer">
                    <Play className="h-4 w-4" />
                    Watch Video
                  </a>
                </Button>
              ) : null}

              {selectedCandidate?.passportUrl && (
                <DetailRow label="Passport" value="Uploaded" />
              )}
            </div>
          </div>

          <Separator />

          {/* Meta */}
          <div className="text-xs text-muted-foreground">
            Registered: {selectedCandidate && new Date(selectedCandidate.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Video - prominent */}
        {selectedCandidate?.videoUrl ? (
          <div className="space-y-3">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Introduction Video
            </h3>
            <div className="rounded-xl overflow-hidden border bg-muted shadow-sm">
              <video
                src={selectedCandidate.videoUrl}
                controls
                className="w-full aspect-video"
                preload="metadata"
              />
            </div>
          </div>
        ) : null}

        {/* Tabs for longer sections */}
        <Tabs defaultValue="personal" className="space-y-5">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="work">Work</TabsTrigger>
            <TabsTrigger value="education">Education & Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DetailRow label="Date of birth" value={selectedCandidate?.dateOfBirth} icon={Calendar} />
                <DetailRow label="Gender" value={selectedCandidate?.gender} />
                <DetailRow label="Marital status" value={selectedCandidate?.maritalStatus} />
                <DetailRow label="Visa category" value={selectedCandidate?.visaCategory} />
              </div>
              <div className="space-y-4">
                <DetailRow label="Preferred locations" value={selectedCandidate?.preferredLocations?.join(", ")} />
                <DetailRow label="Languages" value={selectedCandidate?.languages?.join(", ")} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="work" className="space-y-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DetailRow label="Current job title" value={selectedCandidate?.currentJobTitle} />
                <DetailRow label="Current company" value={selectedCandidate?.currentCompany} />
                <DetailRow label="Current salary" value={selectedCandidate?.currentSalary} />
              </div>
              <div className="space-y-4">
                <DetailRow label="Expected salary" value={selectedCandidate?.expectedSalary} />
                <DetailRow label="Notice period" value={selectedCandidate?.noticePeriod} />
                <DetailRow label="Industries" value={selectedCandidate?.industries?.join(", ")} />
                <DetailRow label="Job types" value={selectedCandidate?.jobTypes?.join(", ")} />
                <DetailRow label="Job categories" value={selectedCandidate?.jobCategories?.join(", ")} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="education" className="space-y-6 mt-2">
            <div className="space-y-5">
              <DetailRow label="Highest education" value={selectedCandidate?.highestEducation} />
              <DetailRow label="Field of study" value={selectedCandidate?.fieldOfStudy} />
              <DetailRow label="Skills" value={selectedCandidate?.skills?.join(" • ")} className="text-sm leading-relaxed" />
              <DetailRow label="Certifications" value={selectedCandidate?.certifications?.join(" • ")} icon={Award} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </DialogContent>
</Dialog>
        </div>
      </main>
    </div>
  )
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Eye, Filter, Play, Download, FileText, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Calendar } from "lucide-react"
import type { Candidate } from "@/lib/db"

function DetailRow({ label, value, icon: Icon, className }: { label: string; value: string | undefined | null; icon?: React.ComponentType<{ className?: string }>; className?: string }) {
  const display = value ?? "—"
  if (display === "—") return null
  return (
    <div className={`flex gap-2 py-1.5 text-sm ${className ? className : ""}`}>
      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className="font-medium text-muted-foreground min-w-[120px]">{label}:</span>
      <span className="text-foreground break-words">{display}</span>
    </div>
  )
}

export default function CandidatesManagementPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/admin/login')
      return
    }
    const userData = JSON.parse(user)
    if (userData.role !== 'super_admin' && userData.role !== 'admin') {
      router.push('/')
      return
    }
    setUserRole(userData.role)
    loadCandidates()
  }, [router])

  const loadCandidates = async () => {
    try {
      const response = await fetch('/api/admin/candidates')
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates || [])
      }
    } catch (error) {
      console.error('Failed to load candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCandidates = candidates
    .filter(candidate => {
      const matchesSearch =
        candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()
      return bTime - aTime // latest registered first
    })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'available':
        return 'default'
      case 'under_bidding':
        return 'secondary'
      case 'interviewed':
        return 'outline'
      case 'selected':
        return 'default'
      case 'on_hold':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <AdminNav role={userRole ?? undefined} />
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Candidates Management</h1>
              <p className="text-muted-foreground mt-2">
                View and manage all registered candidates
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Candidates</CardTitle>
                  <CardDescription>
                    {filteredCandidates.length} total candidates
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search candidates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
            <Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-10"></TableHead> {/* avatar column */}
      <TableHead>Name</TableHead>
      <TableHead>Email / Phone</TableHead>
      <TableHead>Location / Nationality</TableHead>
      <TableHead>Role / Category</TableHead>
      <TableHead>Experience</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right pr-6">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredCandidates.map((candidate) => (
      <TableRow 
        key={candidate.id}
        className="hover:bg-muted/40 cursor-pointer transition-colors"
        onClick={() => setSelectedCandidate(candidate)}
      >
        <TableCell>
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover border"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
          )}
        </TableCell>
        <TableCell className="font-medium">
          {candidate.firstName} {candidate.lastName}
          {candidate.currentJobTitle && (
            <div className="text-xs text-muted-foreground mt-0.5">
              {candidate.currentJobTitle}
            </div>
          )}
        </TableCell>
        <TableCell className="text-sm">
          <div>{candidate.email}</div>
          {candidate.phone && <div className="text-xs text-muted-foreground">{candidate.phone}</div>}
        </TableCell>
        <TableCell className="text-sm">
          <div>{candidate.currentLocation || "—"}</div>
          {candidate.nationality && (
            <span className="block text-xs text-muted-foreground">
              {candidate.nationality}
            </span>
          )}
        </TableCell>
        <TableCell className="text-sm">
          {candidate.jobCategories?.slice(0, 2).join(", ") || "—"}
          {candidate.jobCategories?.length > 2 && (
            <span className="text-xs text-muted-foreground"> +{candidate.jobCategories.length - 2}</span>
          )}
        </TableCell>
        <TableCell className="text-sm">
          {candidate.totalExperience || "—"}
        </TableCell>
        <TableCell>
          <Badge variant={getStatusBadgeVariant(candidate.status)} className="capitalize">
            {candidate.status.replace(/_/g, " ")}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCandidate(candidate);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
            </CardContent>
          </Card>

<Dialog 
  open={!!selectedCandidate} 
  onOpenChange={(open) => !open && setSelectedCandidate(null)}
>
  <DialogContent className="max-w-5xl sm:max-w-[95vw] max-h-[94vh] p-0 gap-0 flex flex-col overflow-hidden">
    {/* Header */}
    {selectedCandidate && (
      <div className="bg-muted/40 px-6 py-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
            <AvatarImage src={selectedCandidate.photoUrl} alt="Profile photo" />
            <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
              {selectedCandidate.firstName?.[0]}{selectedCandidate.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <div>
            <DialogTitle className="text-2xl font-bold leading-tight">
              {selectedCandidate.firstName} {selectedCandidate.lastName}
            </DialogTitle>
            <p className="text-base text-muted-foreground mt-1">
              {selectedCandidate.currentJobTitle || "—"}
              {selectedCandidate.currentCompany && `  •  ${selectedCandidate.currentCompany}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Badge 
            variant={getStatusBadgeVariant(selectedCandidate.status)}
            className="px-4 py-1.5 text-base font-medium capitalize"
          >
            {selectedCandidate.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>
    )}

    <div className="flex flex-1 overflow-hidden">
      {/* Left sidebar */}
      <div className="hidden md:block w-80 border-r bg-muted/20 overflow-y-auto">
        <div className="p-6 space-y-8">
          {/* Quick Facts */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quick Info
            </h3>
            <div className="space-y-3.5 text-sm">
              <DetailRow label="Email" value={selectedCandidate?.email} icon={Mail} />
              <DetailRow label="Phone" value={selectedCandidate?.phone} icon={Phone} />
              <DetailRow label="Location" value={selectedCandidate?.currentLocation} icon={MapPin} />
              <DetailRow label="Experience" value={selectedCandidate?.totalExperience} icon={Briefcase} />
              <DetailRow label="Exp. Salary" value={selectedCandidate?.expectedSalary || (selectedCandidate?.salaryRange?.min && selectedCandidate?.salaryRange?.max ? (selectedCandidate.salaryRange.min + "–" + selectedCandidate.salaryRange.max) : undefined)} />
              <DetailRow label="Notice" value={selectedCandidate?.noticePeriod} />
              <DetailRow label="Nationality" value={selectedCandidate?.nationality} />
            </div>
          </div>

          <Separator />

          {/* Documents */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Documents
            </h3>
            <div className="space-y-4">
              {selectedCandidate?.cvUrl ? (
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <a href={selectedCandidate.cvUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Download CV
                  </a>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">No CV uploaded</p>
              )}

              {selectedCandidate?.videoUrl ? (
                <Button asChild variant="outline" className="w-full justify-start gap-2">
                  <a href={selectedCandidate.videoUrl} target="_blank" rel="noopener noreferrer">
                    <Play className="h-4 w-4" />
                    Watch Video
                  </a>
                </Button>
              ) : null}

              {selectedCandidate?.passportUrl && (
                <DetailRow label="Passport" value="Uploaded" />
              )}
            </div>
          </div>

          <Separator />

          {/* Meta */}
          <div className="text-xs text-muted-foreground">
            Registered: {selectedCandidate && new Date(selectedCandidate.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Video - prominent, reduced height */}
        {selectedCandidate?.videoUrl ? (
          <div className="space-y-3">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Introduction Video
            </h3>
            <div className="rounded-xl overflow-hidden border bg-muted shadow-sm">
              <video
                src={selectedCandidate.videoUrl}
                controls
                className="w-full"
                style={{ maxHeight: 230 }}
                preload="metadata"
              />
            </div>
          </div>
        ) : null}

        {/* Tabs for longer sections */}
        <Tabs defaultValue="personal" className="space-y-5">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="work">Work</TabsTrigger>
            <TabsTrigger value="education">Education & Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DetailRow label="Date of birth" value={selectedCandidate?.dateOfBirth} icon={Calendar} />
                <DetailRow label="Gender" value={selectedCandidate?.gender} />
                <DetailRow label="Marital status" value={selectedCandidate?.maritalStatus} />
                <DetailRow label="Visa category" value={selectedCandidate?.visaCategory} />
              </div>
              <div className="space-y-4">
                <DetailRow label="Preferred locations" value={selectedCandidate?.preferredLocations?.join(", ")} />
                <DetailRow label="Languages" value={selectedCandidate?.languages?.join(", ")} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="work" className="space-y-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <DetailRow label="Current job title" value={selectedCandidate?.currentJobTitle} />
                <DetailRow label="Current company" value={selectedCandidate?.currentCompany} />
                <DetailRow label="Current salary" value={selectedCandidate?.currentSalary} />
              </div>
              <div className="space-y-4">
                <DetailRow label="Expected salary" value={selectedCandidate?.expectedSalary} />
                <DetailRow label="Notice period" value={selectedCandidate?.noticePeriod} />
                <DetailRow label="Industries" value={selectedCandidate?.industries?.join(", ")} />
                <DetailRow label="Job types" value={selectedCandidate?.jobTypes?.join(", ")} />
                <DetailRow label="Job categories" value={selectedCandidate?.jobCategories?.join(", ")} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="education" className="space-y-6 mt-2">
            <div className="space-y-5">
              <DetailRow label="Highest education" value={selectedCandidate?.highestEducation} />
              <DetailRow label="Field of study" value={selectedCandidate?.fieldOfStudy} />
              <DetailRow label="Skills" value={selectedCandidate?.skills?.join(" • ")} className="text-sm leading-relaxed" />
              <DetailRow label="Certifications" value={selectedCandidate?.certifications?.join(" • ")} icon={Award} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </DialogContent>
</Dialog>
        </div>
      </main>
    </div>
  )
}

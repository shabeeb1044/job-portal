"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Users, Search, Eye, Filter } from "lucide-react"
import type { Candidate } from "@/lib/db"

export default function CandidatesManagementPage() {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userRole, setUserRole] = useState<string | null>(null)

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

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch =
      candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
    return matchesSearch && matchesStatus
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Job Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expected Salary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">
                        {candidate.firstName} {candidate.lastName}
                      </TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell>{candidate.currentLocation}</TableCell>
                      <TableCell>
                        {candidate.jobCategories && candidate.jobCategories.length > 0
                          ? candidate.jobCategories.join(', ')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(candidate.status)}>
                          {candidate.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {candidate.expectedSalary || candidate.salaryRange
                          ? `$${candidate.expectedSalary || `${candidate.salaryRange?.min}-${candidate.salaryRange?.max}`}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

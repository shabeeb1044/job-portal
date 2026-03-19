import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const demandId = searchParams.get('demandId')
    const agencyId = searchParams.get('agencyId')

    if (!demandId || !agencyId) {
      return NextResponse.json(
        { error: 'demandId and agencyId required' },
        { status: 400 }
      )
    }

    const demand = await db.demands.getById(demandId)
    if (!demand) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 })
    }

    const existingApps = await db.applications.getByDemandId(demandId)
    const appliedCandidateIds = new Set(existingApps.map((a) => a.candidateId))

    const agencyCandidates = (await db.candidates.getAll()).filter(
      (c) => c.agencyId === agencyId && !appliedCandidateIds.has(c.id)
    )

    const jobSubCategoryId = demand.jobSubCategoryId

    const matched =
      jobSubCategoryId
        ? agencyCandidates.filter((c) => c.jobSubCategoryId === jobSubCategoryId)
        : []

    const other = agencyCandidates.filter((c) => c.jobSubCategoryId !== jobSubCategoryId)

    const toSafe = (c: (typeof agencyCandidates)[0]) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      skills: c.skills ?? [],
      totalExperience: c.totalExperience,
      status: c.status,
      jobSubCategoryId: c.jobSubCategoryId,
    })

    return NextResponse.json({
      success: true,
      demandTitle: demand.jobTitle,
      companyName: demand.companyName,
      matched: matched.map(toSafe),
      other: other.map(toSafe),
    })
  } catch (error) {
    console.error('Failed to fetch demand candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
}

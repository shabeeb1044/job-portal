import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { demandId, candidateIds, agencyId, agentId } = body

    if (!demandId || !candidateIds?.length || !agencyId) {
      return NextResponse.json({ error: 'demandId, candidateIds, and agencyId are required' }, { status: 400 })
    }

    const demand = await db.demands.getById(demandId)
    if (!demand) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 })
    }

    const results = []
    for (const candidateId of candidateIds) {
      const candidate = await db.candidates.getById(candidateId)
      if (!candidate) continue

      if (demand.jobSubCategoryId) {
        await db.candidates.update(candidateId, { jobSubCategoryId: demand.jobSubCategoryId })
      }

      const existingApps = await db.applications.getByAgencyId(agencyId)
      const alreadyApplied = existingApps.find(
        a => a.candidateId === candidateId && a.demandId === demandId
      )
      if (alreadyApplied) {
        results.push({ candidateId, status: 'duplicate', message: 'Already applied' })
        continue
      }

      const application = await db.applications.create({
        candidateId,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        demandId,
        demandTitle: demand.jobTitle,
        companyId: demand.companyId,
        companyName: demand.companyName,
        agencyId,
        agentId,
        status: 'submitted',
        commission: 0,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      await db.notifications.create({
        recipientType: 'company',
        recipientId: demand.companyId,
        type: 'new_submission',
        title: 'New application',
        message: `${application.candidateName} applied for ${demand.jobTitle} (via agency).`,
        link: `/company/demands/${demandId}`,
      }).catch(() => {})
      results.push({ candidateId, status: 'submitted', applicationId: application.id })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Failed to apply candidates:', error)
    return NextResponse.json({ error: 'Failed to submit applications' }, { status: 500 })
  }
}

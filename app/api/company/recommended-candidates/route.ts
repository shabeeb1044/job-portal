import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Candidate, Demand } from '@/lib/db'

function computeMatchScore(demand: Demand, candidate: Candidate): number {
  const demandSkills = (demand.skills ?? []).map((s) => s.toLowerCase())
  const candidateSkills = (candidate.skills ?? []).map((s) => s.toLowerCase())

  const skillSet = new Set(candidateSkills)
  const overlapCount = demandSkills.filter((s) => skillSet.has(s)).length
  const skillScore = demandSkills.length ? overlapCount / demandSkills.length : 0

  const expNum = parseFloat((candidate.totalExperience || '').replace(/[^\d.]/g, '')) || 0
  const expScore = Math.min(1, expNum / 5)

  let availScore = 0.5
  switch (candidate.status) {
    case 'available':
      availScore = 1
      break
    case 'under_bidding':
      availScore = 0.7
      break
    case 'interviewed':
      availScore = 0.4
      break
    case 'selected':
    case 'on_hold':
      availScore = 0.1
      break
  }

  return skillScore * 0.5 + expScore * 0.3 + availScore * 0.2
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const demandId = searchParams.get('demandId')

    if (!companyId || !demandId) {
      return NextResponse.json(
        { error: 'companyId and demandId required' },
        { status: 400 }
      )
    }

    const demand = await db.demands.getById(demandId)
    if (!demand || demand.companyId !== companyId) {
      return NextResponse.json({ success: true, candidates: [] })
    }

    if (!demand.jobSubCategoryId) {
      return NextResponse.json({ success: true, candidates: [] })
    }

    const matched = await db.candidates.getByJobSubCategoryId(demand.jobSubCategoryId)

    const submittedCandidateIds = new Set(
      (await db.applications.getByDemandId(demandId)).map((a) => a.candidateId)
    )

    const scored = matched
      .filter((c) => !submittedCandidateIds.has(c.id))
      .map((c) => ({
        candidate: c,
        score: computeMatchScore(demand, c),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)

    const candidates = scored.map(({ candidate, score }) => ({
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone,
      skills: candidate.skills ?? [],
      totalExperience: candidate.totalExperience,
      status: candidate.status,
      cvUrl: candidate.cvUrl,
      videoUrl: candidate.videoUrl,
      score,
    }))

    return NextResponse.json({ success: true, candidates })
  } catch (error) {
    console.error('Failed to fetch recommended candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommended candidates' },
      { status: 500 }
    )
  }
}

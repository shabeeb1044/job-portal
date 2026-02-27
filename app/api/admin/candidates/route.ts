import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const candidates = await db.candidates.getAll()
    const candidatesSafe = await Promise.all(candidates.map(async (candidate) => {
      const agency = candidate.agencyId ? await db.agencies.getById(candidate.agencyId) : null
      // never expose passwords
      const { password, ...rest } = candidate as any
      return { ...rest, agency: agency ? ({ ...agency, password: undefined } as any) : null }
    }))
    return NextResponse.json({ success: true, candidates: candidatesSafe })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, candidateId, ...updates } = body
    if (action === 'approve' && candidateId) {
      const candidate = await db.candidates.getById(candidateId)
      if (!candidate) {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
      }
      await db.candidates.update(candidateId, { ...updates })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update candidate' },
      { status: 500 }
    )
  }
}

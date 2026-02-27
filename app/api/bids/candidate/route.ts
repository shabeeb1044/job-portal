import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    const candidateId = request.nextUrl.searchParams.get('candidateId')
    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 })
    }

    const bids = await db.bids.getByCandidateId(candidateId)
    const withCompany = await Promise.all(
      bids.map(async (bid) => {
        let companyName = 'Company'
        if (bid.companyId) {
          const company = await db.companies.getById(bid.companyId)
          if (company) companyName = company.name
        }
        return {
          id: bid.id,
          companyId: bid.companyId,
          companyName,
          amount: bid.amount,
          status: bid.status,
          createdAt: bid.createdAt,
          message: bid.message,
        }
      })
    )

    return NextResponse.json({ bids: withCompany })
  } catch (error) {
    console.error('GET /api/bids/candidate', error)
    return NextResponse.json({ error: 'Failed to load bids' }, { status: 500 })
  }
}

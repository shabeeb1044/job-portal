import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function isToday(isoDate: string) {
  const d = new Date(isoDate)
  const today = new Date()
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
}

export async function GET() {
  try {
    const candidates = await db.candidates.getAll()
    const agencies = await db.agencies.getAll()
    const companies = await db.companies.getAll()
    const bids = await db.bids.getAll()
    const payments = await db.payments.getAll()
    const subscriptions = await db.subscriptions.getAll()
    const interviews = await db.interviews.getAll()

    const completedPayments = payments.filter(p => p.status === 'completed')
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0)
    const revenueToday = completedPayments
      .filter(p => isToday(p.createdAt))
      .reduce((sum, p) => sum + p.amount, 0)

    const pendingAgencyCount = agencies.filter(
      (a) => (a as { approvalStatus?: string }).approvalStatus === 'pending'
    ).length
    const pendingCompanyCount = companies.filter(
      (c) => !c.subscriptionStatus || c.subscriptionStatus !== 'active'
    ).length

    const stats = {
      totalCandidates: candidates.length,
      totalAgencies: agencies.length,
      totalCompanies: companies.length,
      totalBids: bids.length,
      totalRevenue,
      pendingApprovals: pendingAgencyCount + pendingCompanyCount,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length,
      interviewsScheduled: interviews.filter(i => i.status === 'scheduled').length,
      newCandidatesToday: candidates.filter(c => isToday(c.createdAt)).length,
      newBidsToday: bids.filter(b => isToday(b.createdAt)).length,
      revenueToday,
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

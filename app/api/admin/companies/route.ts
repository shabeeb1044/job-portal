import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const companies = await db.companies.getAll()
    const companiesSafe = companies.map(({ password, ...rest }) => rest)
    companiesSafe.sort((a, b) => {
      const dateA = new Date((a as any).createdAt || 0).getTime()
      const dateB = new Date((b as any).createdAt || 0).getTime()
      return dateB - dateA
    })
    return NextResponse.json({ success: true, companies: companiesSafe })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, companyId, ...rest } = body as {
      action: string
      companyId: string
      subscriptionPlan?: string
      subscriptionStatus?: string
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const company = await db.companies.getById(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (action === 'approve') {
      await db.companies.update(companyId, {
        isActive: true,
        subscriptionStatus: 'active',
        ...rest,
      })
      const updated = await db.companies.getById(companyId)
      if (!updated) return NextResponse.json({ success: true, company: null })
      const { password, ...safe } = updated as any
      return NextResponse.json({ success: true, company: safe })
    }

    if (action === 'reject') {
      await db.companies.update(companyId, {
        isActive: false,
        subscriptionStatus: 'cancelled',
      })
      const updated = await db.companies.getById(companyId)
      if (!updated) return NextResponse.json({ success: true, company: null })
      const { password, ...safe } = updated as any
      return NextResponse.json({ success: true, company: safe })
    }

    if (action === 'setActive') {
      await db.companies.update(companyId, { isActive: true })
      const updated = await db.companies.getById(companyId)
      if (!updated) return NextResponse.json({ success: true, company: null })
      const { password, ...safe } = updated as any
      return NextResponse.json({ success: true, company: safe })
    }

    if (action === 'setInactive') {
      await db.companies.update(companyId, { isActive: false })
      const updated = await db.companies.getById(companyId)
      if (!updated) return NextResponse.json({ success: true, company: null })
      const { password, ...safe } = updated as any
      return NextResponse.json({ success: true, company: safe })
    }

    if (action === 'updateSubscription') {
      const updates: Record<string, unknown> = {}
      if (rest.subscriptionPlan !== undefined) {
        updates.subscriptionPlan = rest.subscriptionPlan
      }
      if (rest.subscriptionStatus !== undefined) {
        updates.subscriptionStatus = rest.subscriptionStatus
      }
      await db.companies.update(companyId, updates as any)
      const updated = await db.companies.getById(companyId)
      if (!updated) return NextResponse.json({ success: true, company: null })
      const { password, ...safe } = updated as any
      return NextResponse.json({ success: true, company: safe })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    )
  }
}


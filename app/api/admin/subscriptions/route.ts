import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [agencies, companies, subscriptions] = await Promise.all([
      db.agencies.getAll(),
      db.companies.getAll(),
      db.subscriptions.getAll(),
    ])

    const agenciesSafe = agencies.map(({ password, ...rest }) => rest)
    const companiesSafe = companies.map(({ password, ...rest }) => rest)

    const agencyById = new Map(agencies.map((a) => [a.id, a]))
    const companyById = new Map(companies.map((c) => [c.id, c]))

    const subscriptionsWithNames = subscriptions.map((s) => {
      const name =
        s.entityType === 'agency'
          ? agencyById.get(s.entityId)?.name ?? '—'
          : companyById.get(s.entityId)?.name ?? '—'
      return { ...s, entityName: name }
    })

    const activeAgencies = agenciesSafe.filter((a: { subscriptionStatus?: string }) => a.subscriptionStatus === 'active')
    const expiredAgencies = agenciesSafe.filter(
      (a: { subscriptionStatus?: string }) => a.subscriptionStatus === 'expired' || a.subscriptionStatus === 'cancelled'
    )
    const activeCompanies = companiesSafe.filter(
      (c: { subscriptionStatus?: string }) => c.subscriptionStatus === 'active'
    )
    const expiredCompanies = companiesSafe.filter(
      (c: { subscriptionStatus?: string }) => c.subscriptionStatus !== 'active'
    )

    const stats = {
      activeAgencies: activeAgencies.length,
      expiredAgencies: expiredAgencies.length,
      activeCompanies: activeCompanies.length,
      expiredCompanies: expiredCompanies.length,
      totalActive: activeAgencies.length + activeCompanies.length,
      totalExpired: expiredAgencies.length + expiredCompanies.length,
      subscriptionRecords: subscriptions.length,
    }

    return NextResponse.json({
      success: true,
      agencies: agenciesSafe,
      companies: companiesSafe,
      subscriptions: subscriptionsWithNames,
      stats,
    })
  } catch (error) {
    console.error('Admin subscriptions GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { entityType, entityId, subscriptionPlan, subscriptionStatus, subscriptionExpiresAt } = body

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    if (entityType === 'agency') {
      const agency = await db.agencies.getById(entityId)
      if (!agency) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
      }
      const updates: { subscriptionPlan?: string; subscriptionStatus?: string; subscriptionExpiresAt?: string } = {}
      if (subscriptionPlan !== undefined && subscriptionPlan !== '') {
        const valid = ['basic', 'silver', 'gold', 'platinum']
        if (!valid.includes(subscriptionPlan)) {
          return NextResponse.json(
            { error: 'subscriptionPlan must be basic, silver, gold, or platinum' },
            { status: 400 }
          )
        }
        updates.subscriptionPlan = subscriptionPlan
      }
      if (subscriptionStatus !== undefined && subscriptionStatus !== '') {
        const valid = ['active', 'expired', 'cancelled']
        if (!valid.includes(subscriptionStatus)) {
          return NextResponse.json(
            { error: 'subscriptionStatus must be active, expired, or cancelled' },
            { status: 400 }
          )
        }
        updates.subscriptionStatus = subscriptionStatus
      }
      if (subscriptionExpiresAt !== undefined) {
        updates.subscriptionExpiresAt = subscriptionExpiresAt || undefined
      }
      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No subscription fields to update' }, { status: 400 })
      }
      await db.agencies.update(entityId, updates as any)
      const updated = await db.agencies.getById(entityId)
      if (!updated) return NextResponse.json({ success: true, entity: null })
      const { password, ...safe } = updated as { password?: string; [k: string]: unknown }
      return NextResponse.json({ success: true, entity: safe, entityType: 'agency' })
    }

    if (entityType === 'company') {
      const company = await db.companies.getById(entityId)
      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      }
      const updates: { subscriptionPlan?: string; subscriptionStatus?: string; subscriptionExpiresAt?: string } = {}
      if (subscriptionPlan !== undefined && subscriptionPlan !== '') {
        const valid = ['bronze', 'silver', 'gold']
        if (!valid.includes(subscriptionPlan)) {
          return NextResponse.json(
            { error: 'subscriptionPlan must be bronze, silver, or gold' },
            { status: 400 }
          )
        }
        updates.subscriptionPlan = subscriptionPlan
      }
      if (subscriptionStatus !== undefined && subscriptionStatus !== '') {
        const valid = ['active', 'expired', 'cancelled']
        if (!valid.includes(subscriptionStatus)) {
          return NextResponse.json(
            { error: 'subscriptionStatus must be active, expired, or cancelled' },
            { status: 400 }
          )
        }
        updates.subscriptionStatus = subscriptionStatus
      }
      if (subscriptionExpiresAt !== undefined) {
        updates.subscriptionExpiresAt = subscriptionExpiresAt || undefined
      }
      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No subscription fields to update' }, { status: 400 })
      }
      if (updates.subscriptionStatus === 'active') {
        await db.companies.update(entityId, { ...updates, isActive: true } as any)
      } else {
        await db.companies.update(entityId, updates as any)
      }
      const updated = await db.companies.getById(entityId)
      if (!updated) return NextResponse.json({ success: true, entity: null })
      const { password, ...safe } = updated as { password?: string; [k: string]: unknown }
      return NextResponse.json({ success: true, entity: safe, entityType: 'company' })
    }

    return NextResponse.json(
      { error: 'entityType must be agency or company' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Admin subscriptions PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 })
    }
    const demands = await db.demands.getByCompanyId(companyId)
    return NextResponse.json({ success: true, demands })
  } catch (error) {
    return apiError(error, 500)
  }
}

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.json()
    const {
      companyId,
      companyName,
      roles,
      description = '',
      location = '',
      salaryMin = 0,
      salaryMax = 0,
      currency = 'AED',
      deadline,
    } = body as {
      companyId: string
      companyName: string
      roles: Array<{ jobTitle: string; positions: number }>
      description?: string
      location?: string
      salaryMin?: number
      salaryMax?: number
      currency?: string
      deadline?: string
    }

    if (!companyId || !companyName || !roles?.length) {
      return NextResponse.json(
        { error: 'companyId, companyName, and roles (array of { jobTitle, positions }) are required' },
        { status: 400 }
      )
    }

    const company = await db.companies.getById(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const name = companyName || company.name
    const deadlineDate = deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const created: Array<{ id: string; jobTitle: string; positions: number }> = []
    for (const role of roles) {
      if (!role.jobTitle?.trim() || (role.positions ?? 0) < 1) continue
      const demand = await db.demands.create({
        companyId,
        companyName: name,
        jobTitle: role.jobTitle.trim(),
        description,
        requirements: [],
        skills: [],
        salary: { min: salaryMin, max: salaryMax, currency },
        gender: 'any',
        location: location || company.city || '',
        positions: Math.max(1, Number(role.positions)),
        filledPositions: 0,
        status: 'open',
        deadline: deadlineDate,
      })
      created.push({ id: demand.id, jobTitle: demand.jobTitle, positions: demand.positions })
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created.length} demand(s)`,
      demands: created,
    })
  } catch (error) {
    return apiError(error, 500)
  }
}

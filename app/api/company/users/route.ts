import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { apiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    const companyId = request.nextUrl.searchParams.get('companyId')
    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 })
    }

    const users = await db.users.getByCompanyId(companyId, 'staff')
    return NextResponse.json({
      success: true,
      users: users.map(({ password: _pw, ...rest }) => rest),
    })
  } catch (error) {
    return apiError(error, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const body = await request.json()
    const { companyId, name, email, password } = body as {
      companyId?: string
      name?: string
      email?: string
      password?: string
    }

    if (!companyId || !name || !email || !password) {
      return NextResponse.json(
        { error: 'companyId, name, email, password are required' },
        { status: 400 }
      )
    }

    // Ensure company exists
    const company = await db.companies.getById(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check email uniqueness across auth collections
    const normalizedEmail = email.trim().toLowerCase()
    const existingCompany = await db.companies.getByEmail(normalizedEmail)
    const existingAgency = await db.agencies.getByEmail(normalizedEmail)
    const existingCandidate = await db.candidates.getByEmail(normalizedEmail)
    const existingUser = await db.users.getByEmail(normalizedEmail)
    if (existingCompany || existingAgency || existingCandidate || existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const created = await db.users.create({
      email: normalizedEmail,
      password: hashPassword(password),
      role: 'staff',
      name: name.trim(),
      isActive: true,
      companyId,
    })

    const { password: _pw, ...userWithoutPassword } = created
    return NextResponse.json({ success: true, user: userWithoutPassword })
  } catch (error) {
    return apiError(error, 500)
  }
}


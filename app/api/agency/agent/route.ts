import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agencyId, name, email, password, phone, commissionPercent, idProofUrl } = body

    if (!agencyId || !name || !email || !password) {
      return NextResponse.json({ error: 'agencyId, name, email, and password are required' }, { status: 400 })
    }

    const existing = await db.agents.getByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'An agent with this email already exists' }, { status: 409 })
    }

    const referralCode = `AGT${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const agent = await db.agents.create({
      agencyId,
      name,
      email,
      password: hashPassword(password),
      phone: phone || '',
      commissionPercent: commissionPercent || 10,
      referralCode,
      isActive: true,
      totalReferrals: 0,
      totalPlacements: 0,
      totalEarnings: 0,
      ...(idProofUrl && {
        idProofUrl,
        idProofSubmittedAt: new Date().toISOString(),
      }),
    })

    const { password: _, ...agentWithoutPassword } = agent
    return NextResponse.json({ success: true, agent: agentWithoutPassword })
  } catch (error) {
    console.error('Failed to create agent:', error)
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}

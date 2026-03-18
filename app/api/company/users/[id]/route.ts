import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import { apiError } from '@/lib/api-utils'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initializeDatabase()
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const { isActive, name } = body as { isActive?: boolean; name?: string }

    const updated = await db.users.update(id, {
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
      ...(typeof name === 'string' ? { name: name.trim() } : {}),
    })

    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { password: _pw, ...userWithoutPassword } = updated
    return NextResponse.json({ success: true, user: userWithoutPassword })
  } catch (error) {
    return apiError(error, 500)
  }
}


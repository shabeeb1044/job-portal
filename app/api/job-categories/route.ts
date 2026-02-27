import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.jobCategories.getAll(true)
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Job categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job categories' },
      { status: 500 }
    )
  }
}

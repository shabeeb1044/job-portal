import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.jobCategories.getAll(true)
    // Sort by group (white_collar, blue_collar, other) then sortOrder
    const order = { white_collar: 0, blue_collar: 1, other: 2 }
    categories.sort((a, b) => {
      const ga = (a.group && order[a.group as keyof typeof order]) ?? 3
      const gb = (b.group && order[b.group as keyof typeof order]) ?? 3
      return ga !== gb ? ga - gb : a.sortOrder - b.sortOrder
    })
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Job categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job categories' },
      { status: 500 }
    )
  }
}

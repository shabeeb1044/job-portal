import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    }
    const subCategories = await db.jobSubCategories.getByCategoryId(categoryId, true)
    return NextResponse.json({ subCategories })
  } catch (error) {
    console.error('Job sub-categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job sub-categories' },
      { status: 500 }
    )
  }
}

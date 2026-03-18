import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DEFAULT_JOB_CATEGORIES } from '@/lib/seed-job-categories'

function slugify(t: string): string {
  return t.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    const existing = await db.jobCategories.getAll()
    if (existing.length > 0 && !force) {
      return NextResponse.json(
        { error: 'Categories already exist. Use ?force=true to replace with defaults.' },
        { status: 400 }
      )
    }
    if (force && existing.length > 0) {
      const allSubs = await db.jobSubCategories.getAll()
      for (const sub of allSubs) {
        await db.jobSubCategories.delete(sub.id)
      }
      for (const cat of existing) {
        await db.jobCategories.delete(cat.id)
      }
    }
    let sortOrder = 1
    for (const seed of DEFAULT_JOB_CATEGORIES) {
      const cat = await db.jobCategories.create({
        slug: seed.slug,
        name: seed.name,
        emoji: seed.emoji,
        description: seed.description,
        sortOrder,
        isActive: true,
        group: seed.group,
      })
      let subOrder = 1
      for (const subName of seed.subCategories) {
        await db.jobSubCategories.create({
          categoryId: cat.id,
          slug: slugify(subName),
          name: subName,
          sortOrder: subOrder++,
          isActive: true,
        })
      }
      sortOrder++
    }
    return NextResponse.json({
      success: true,
      message: 'Default job categories and sub-categories seeded (White Collar, Blue Collar, Other)',
    })
  } catch (error) {
    console.error('Seed job categories error:', error)
    return NextResponse.json(
      { error: 'Failed to seed job categories' },
      { status: 500 }
    )
  }
}

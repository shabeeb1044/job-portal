import { NextRequest, NextResponse } from 'next/server'
import { db, JobCategory } from '@/lib/db'

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET() {
  try {
    const categories = await db.jobCategories.getAll(false)
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Admin job categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, emoji, description, slug: slugInput, sortOrder, isActive, group } = body
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    const slug = (slugInput && String(slugInput).trim()) ? slugify(String(slugInput)) : slugify(name)
    if (!slug) {
      return NextResponse.json(
        { error: 'Could not generate a valid slug from name' },
        { status: 400 }
      )
    }
    const existing = await db.jobCategories.getBySlug(slug)
    if (existing) {
      return NextResponse.json(
        { error: 'A job category with this slug already exists' },
        { status: 400 }
      )
    }
    const maxOrder = await db.jobCategories.getAll(false).then((list) =>
      list.length > 0 ? Math.max(...list.map((c) => c.sortOrder), 0) + 1 : 1
    )
    const validGroups = ['white_collar', 'blue_collar', 'other'] as const
    const newCat: Omit<JobCategory, 'id' | 'createdAt' | 'updatedAt'> = {
      slug,
      name: name.trim(),
      emoji: emoji != null ? String(emoji).trim() || '📋' : '📋',
      description: description != null ? String(description).trim() : '',
      sortOrder: typeof sortOrder === 'number' ? sortOrder : maxOrder,
      isActive: isActive !== false,
      ...(group && validGroups.includes(group) ? { group } : {}),
    }
    const created = await db.jobCategories.create(newCat)
    return NextResponse.json({ success: true, category: created })
  } catch (error) {
    console.error('Job category create error:', error)
    return NextResponse.json(
      { error: 'Failed to create job category' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, slug, name, emoji, description, sortOrder, isActive, group } = body
    const categoryId = id != null ? String(id) : ''
    if (!categoryId) {
      return NextResponse.json({ error: 'Category id required' }, { status: 400 })
    }
    const updates: Partial<JobCategory> = {}
    if (slug !== undefined) updates.slug = slugify(String(slug))
    if (name !== undefined) updates.name = String(name).trim()
    if (emoji !== undefined) updates.emoji = String(emoji).trim() || '📋'
    if (description !== undefined) updates.description = String(description).trim()
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder)
    if (isActive !== undefined) updates.isActive = !!isActive
    if (group !== undefined) {
      const validGroups = ['white_collar', 'blue_collar', 'other'] as const
      updates.group = validGroups.includes(group) ? group : undefined
    }

    const updated = await db.jobCategories.update(categoryId, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, category: updated })
  } catch (error) {
    console.error('Job category update error:', error)
    return NextResponse.json(
      { error: 'Failed to update job category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const categoryId = id != null ? String(id) : ''
    if (!categoryId) {
      return NextResponse.json({ error: 'Category id required' }, { status: 400 })
    }
    const deleted = await db.jobCategories.delete(categoryId)
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Job category delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete job category' },
      { status: 500 }
    )
  }
}

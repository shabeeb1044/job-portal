import { NextRequest, NextResponse } from 'next/server'
import { db, JobSubCategory } from '@/lib/db'

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    let subCategories: JobSubCategory[]
    if (categoryId) {
      subCategories = await db.jobSubCategories.getByCategoryId(categoryId, false)
    } else {
      subCategories = await db.jobSubCategories.getAll(false)
    }
    return NextResponse.json({ subCategories })
  } catch (error) {
    console.error('Admin job sub-categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job sub-categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoryId, name, slug: slugInput, sortOrder, isActive } = body
    if (!categoryId || typeof categoryId !== 'string' || !categoryId.trim()) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    }
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
    const existing = await db.jobSubCategories.getByCategoryId(categoryId, false)
    if (existing.some((s) => s.slug === slug)) {
      return NextResponse.json(
        { error: 'A sub-category with this slug already exists in this category' },
        { status: 400 }
      )
    }
    const maxOrder = existing.length > 0 ? Math.max(...existing.map((s) => s.sortOrder), 0) + 1 : 1
    const newSub: Omit<JobSubCategory, 'id' | 'createdAt' | 'updatedAt'> = {
      categoryId: categoryId.trim(),
      slug,
      name: name.trim(),
      sortOrder: typeof sortOrder === 'number' ? sortOrder : maxOrder,
      isActive: isActive !== false,
    }
    const created = await db.jobSubCategories.create(newSub)
    return NextResponse.json({ success: true, subCategory: created })
  } catch (error) {
    console.error('Job sub-category create error:', error)
    return NextResponse.json(
      { error: 'Failed to create job sub-category' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, slug, name, sortOrder, isActive } = body
    const subCategoryId = id != null ? String(id) : ''
    if (!subCategoryId) {
      return NextResponse.json({ error: 'Sub-category id required' }, { status: 400 })
    }
    const updates: Partial<JobSubCategory> = {}
    if (slug !== undefined) updates.slug = slugify(String(slug))
    if (name !== undefined) updates.name = String(name).trim()
    if (sortOrder !== undefined) updates.sortOrder = Number(sortOrder)
    if (isActive !== undefined) updates.isActive = !!isActive

    const updated = await db.jobSubCategories.update(subCategoryId, updates)
    if (!updated) {
      return NextResponse.json({ error: 'Sub-category not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, subCategory: updated })
  } catch (error) {
    console.error('Job sub-category update error:', error)
    return NextResponse.json(
      { error: 'Failed to update job sub-category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const subCategoryId = id != null ? String(id) : ''
    if (!subCategoryId) {
      return NextResponse.json({ error: 'Sub-category id required' }, { status: 400 })
    }
    const deleted = await db.jobSubCategories.delete(subCategoryId)
    if (!deleted) {
      return NextResponse.json({ error: 'Sub-category not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Job sub-category delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete job sub-category' },
      { status: 500 }
    )
  }
}

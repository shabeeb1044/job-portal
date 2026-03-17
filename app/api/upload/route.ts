import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary, getResourceType, CLOUDINARY_FOLDERS } from '@/lib/cloudinary'

export const runtime = 'nodejs'

const proofMimes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const imageMimes = ['image/jpeg', 'image/png', 'image/webp']

const ALLOWED_TYPES: Record<string, { mimes: string[]; maxSize: number; folder: string }> = {
  // candidate-cv
  cv: {
    mimes: ['application/pdf'],
    maxSize: 5 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.CANDIDATE_CV,
  },
  video: {
    mimes: ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
    maxSize: 50 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.CANDIDATE_CV,
  },
  passport: {
    mimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.CANDIDATE_CV,
  },
  // agency
  'agency-logo': {
    mimes: imageMimes,
    maxSize: 2 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.AGENCY,
  },
  'agency-proof': {
    mimes: proofMimes,
    maxSize: 10 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.AGENCY,
  },
  // agent
  'agent-photo': {
    mimes: imageMimes,
    maxSize: 2 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.AGENT,
  },
  'agent-proof': {
    mimes: proofMimes,
    maxSize: 10 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.AGENT,
  },
  // company-proof
  'company-proof': {
    mimes: proofMimes,
    maxSize: 10 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.COMPANY_PROOF,
  },
  // legacy (keep for backward compat)
  photo: {
    mimes: imageMimes,
    maxSize: 2 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.AGENT,
  },
  proof: {
    mimes: proofMimes,
    maxSize: 10 * 1024 * 1024,
    folder: CLOUDINARY_FOLDERS.AGENCY,
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileType = formData.get('type') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!fileType || !ALLOWED_TYPES[fileType]) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Use: cv, video, passport, agency-logo, agency-proof, agent-photo, company-proof',
        },
        { status: 400 }
      )
    }

    const config = ALLOWED_TYPES[fileType]

    if (!config.mimes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file format for ${fileType}. Allowed: ${config.mimes.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > config.maxSize) {
      const maxMB = config.maxSize / (1024 * 1024)
      return NextResponse.json(
        { error: `File too large. Maximum size for ${fileType} is ${maxMB} MB` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const resourceType = getResourceType(file.type)
    const { folder } = ALLOWED_TYPES[fileType]

    const url = await uploadToCloudinary(buffer, file.type, {
      folder,
      resource_type: resourceType,
    })

    return NextResponse.json({
      success: true,
      url,
      fileName: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error: unknown) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed. Please try again.'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import { uploadToCloudinary, getResourceType, CLOUDINARY_FOLDERS } from '@/lib/cloudinary'

export const runtime = 'nodejs'

const ALLOWED_CV_TYPES = ['application/pdf']
const ALLOWED_VIDEO_TYPES = [
  'video/webm',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
]
const MAX_CV_SIZE = 5 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024

async function saveFileToCloudinary(file: File, prefix: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const resourceType = getResourceType(file.type)
  const url = await uploadToCloudinary(buffer, file.type, {
    folder: `${CLOUDINARY_FOLDERS.CANDIDATE_CV}/${prefix}`,
    resource_type: resourceType,
  })
  return url
}

// No-op for cloud URLs; local paths are no longer used
function deleteOldFile(_fileUrl: string | undefined) {
  // Files are now on Cloudinary; optional: implement Cloudinary delete by public_id if needed
}

// GET - Fetch candidate's current files info
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()
    const candidateId = request.nextUrl.searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 })
    }

    const candidate = await db.candidates.getById(candidateId)
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    return NextResponse.json({
      cvUrl: candidate.cvUrl || null,
      videoUrl: candidate.videoUrl || null,
      photoUrl: candidate.photoUrl || null,
      passportUrl: candidate.passportUrl || null,
    })
  } catch (error) {
    console.error('Fetch files error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Upload or replace CV / video for an existing candidate
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const formData = await request.formData()

    const candidateId = formData.get('candidateId') as string
    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 })
    }

    const candidate = await db.candidates.getById(candidateId)
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const cvFile = formData.get('cvFile') as File | null
    const videoFile = formData.get('videoFile') as File | null

    if (!cvFile && !videoFile) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const updates: Record<string, string> = {}

    if (cvFile) {
      if (!ALLOWED_CV_TYPES.includes(cvFile.type)) {
        return NextResponse.json({ error: 'CV must be a PDF file' }, { status: 400 })
      }
      if (cvFile.size > MAX_CV_SIZE) {
        return NextResponse.json({ error: 'CV must be under 5 MB' }, { status: 400 })
      }
      deleteOldFile(candidate.cvUrl)
      updates.cvUrl = await saveFileToCloudinary(cvFile, 'cv')
    }

    if (videoFile) {
      if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
        return NextResponse.json(
          { error: 'Video must be MP4, WebM, MOV, AVI, or MKV' },
          { status: 400 }
        )
      }
      if (videoFile.size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ error: 'Video must be under 50 MB' }, { status: 400 })
      }
      deleteOldFile(candidate.videoUrl)
      updates.videoUrl = await saveFileToCloudinary(videoFile, 'video')
    }

    await db.candidates.update(candidateId, updates)

    return NextResponse.json({
      success: true,
      message: 'Files updated successfully',
      ...updates,
    })
  } catch (error: unknown) {
    console.error('File update error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

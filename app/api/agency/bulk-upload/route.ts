import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import { apiError } from '@/lib/api-utils'
import { uploadToCloudinary, getResourceType, CLOUDINARY_FOLDERS } from '@/lib/cloudinary'

// Allow larger multipart body for bulk CV uploads (e.g. many PDFs)
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 5 * 1024 * 1024

function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/** Derive a display name from filename (e.g. "John_Doe_Resume.pdf" -> "John Doe Resume") */
function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
  return base || 'Unknown'
}

export async function POST(request: NextRequest) {
  try { 
    await initializeDatabase()

    const formData = await request.formData()
    const agencyId = (formData.get('agencyId') as string)?.trim()

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency session missing' }, { status: 401 })
    }

    const agency = await db.agencies.getById(agencyId)
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    }

    // collect files safely
    const files: Blob[] = []
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof Blob && value.size > 0) {
        files.push(value)
      }
    }

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const dbInstance = await getDatabase()

    let successCount = 0

    const results = await Promise.all(
      files.map(async (file, index) => {
        const filename =
          (file as any).name || `file-${index}.pdf`

        try {
          const buffer = Buffer.from(await file.arrayBuffer())

          if (buffer.length > MAX_FILE_SIZE) {
            return { filename, status: 'error', message: 'File too large' }
          }

          const hash = sha256(buffer)

          // 🔹 FAST duplicate hash check
          const hashExists = await dbInstance
            .collection('candidates')
            .findOne({ resumeHash: hash }, { projection: { _id: 1 } })

          if (hashExists) {
            return { filename, status: 'duplicate', message: 'Duplicate (hash)' }
          }

          // 🔹 upload CV to Cloudinary (candidate-cv folder)
          const cvUrl = await uploadToCloudinary(buffer, file.type, {
            folder: CLOUDINARY_FOLDERS.CANDIDATE_CV,
            resource_type: getResourceType(file.type),
          })

          const displayName = nameFromFilename(filename)
          const nameParts = displayName.split(/\s+/)
          const firstName = nameParts[0] ?? 'Unknown'
          const lastName = nameParts.slice(1).join(' ') ?? ''

          // Use unique placeholder for email to avoid MongoDB E11000 duplicate key (email index)
          const emailForDb = `no-email-${hash}`

          const candidate = await db.candidates.create({
            firstName,
            lastName,
            email: emailForDb,
            phone: '',
            skills: [],
            totalExperience: '',
            currentLocation: '',
            currentJobTitle: undefined,
            currentCompany: undefined,
            highestEducation: '',
            fieldOfStudy: '',
            languages: [],
            certifications: [],
            status: 'available',
            role: 'candidate',
            agencyId,
            cvUrl,
            password: '',
            isActive: true,
          } as any)

          await dbInstance.collection('candidates').updateOne(
            { _id: new ObjectId(candidate.id) },
            { $set: { resumeHash: hash } }
          )

          successCount++

          return {
            filename,
            status: 'success',
            message: 'Uploaded',
            candidateId: candidate.id,
          }
        } catch (err: any) {
          return {
            filename,
            status: 'error',
            message: err.message,
          }
        }
      })
    )

    // update agency counters
    await db.agencies.update(agencyId, {
      cvUploadsUsed: (agency.cvUploadsUsed || 0) + successCount,
      totalCandidates: (agency.totalCandidates || 0) + successCount,
    })

    return NextResponse.json({
      success: true,
      total: files.length,
      uploaded: successCount,
      duplicates: results.filter((r) => r.status === 'duplicate').length,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    })
  } catch (error) {
    return apiError(error, 500)
  }
}

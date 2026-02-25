import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { db, initializeDatabase } from '@/lib/db'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import { extractTextFromBuffer, parseCandidateFromText } from '@/lib/cv-parser'
import { apiError } from '@/lib/api-utils'

// Allow larger multipart body for bulk CV uploads (e.g. many PDFs)
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

function sanitizeFileName(name: string | undefined): string {
  return (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_').slice(0, 100)
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

    ensureUploadsDir()
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

          // 🔹 parse CV
          const text = await extractTextFromBuffer(buffer, file.type)
          const parsed = parseCandidateFromText(text, filename)

          console.log(text,"8888");
          console.log(parsed,"9999999999");

          // 🔹 duplicate by contact
          if (parsed.email || parsed.phone) {
            const exists = await dbInstance.collection('candidates').findOne(
              {
                $or: [
                  parsed.email && { email: parsed.email },
                  parsed.phone && { phone: parsed.phone },
                ].filter(Boolean),
              },
              { projection: { _id: 1 } }
            )

            if (exists) {
              return {
                filename,
                status: 'duplicate',
                message: 'Duplicate (email/phone)',
              }
            }
          }

          // 🔹 save file async (non-blocking)
          const safe = sanitizeFileName(filename)
          const saved = `cv-${Date.now()}-${safe}`
          const filepath = path.join(UPLOADS_DIR, saved)

          await fs.promises.writeFile(filepath, buffer)

          const candidate = await db.candidates.create({
            firstName: parsed.name || 'Unknown',
            lastName: '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            skills: parsed.skills || [],
            totalExperience: parsed.experience || '',
            status: 'available',
            role: 'candidate',
            agencyId,
            cvUrl: `/uploads/${saved}`,
            password: '',
            isActive: true,
          })

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

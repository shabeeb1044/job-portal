import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import { uploadToCloudinary, getResourceType, CLOUDINARY_FOLDERS } from '@/lib/cloudinary'
import { apiError } from '@/lib/api-utils'

export const runtime = 'nodejs'

const MAX_CV_SIZE = 5 * 1024 * 1024
const ALLOWED_CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

async function saveCvToCloudinary(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const resourceType = getResourceType(file.type)
  return uploadToCloudinary(buffer, file.type, {
    folder: CLOUDINARY_FOLDERS.CANDIDATE_CV,
    resource_type: resourceType,
  })
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    const formData = await request.formData()

    const rawAgentId = (formData.get('agentId') as string | null)?.trim() || ''
    const rawAgencyId = (formData.get('agencyId') as string | null)?.trim() || ''

    if (!rawAgentId) {
      return NextResponse.json({ error: 'Agent is required' }, { status: 400 })
    }

    const agent = await db.agents.getById(rawAgentId)
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const agencyId = agent.agencyId
    if (!agencyId) {
      return NextResponse.json({ error: 'Agent is not linked to an agency' }, { status: 400 })
    }

    if (rawAgencyId && rawAgencyId !== agencyId) {
      return NextResponse.json({ error: 'Agent does not belong to this agency' }, { status: 403 })
    }

    const firstName = (formData.get('firstName') as string | null)?.trim() || ''
    const lastName = (formData.get('lastName') as string | null)?.trim() || ''
    const email = (formData.get('email') as string | null)?.trim().toLowerCase() || ''
    const phone = (formData.get('phone') as string | null)?.trim() || ''
    const dateOfBirth = (formData.get('dateOfBirth') as string | null)?.trim() || ''
    const gender = (formData.get('gender') as string | null)?.trim() || ''
    const nationality = (formData.get('nationality') as string | null)?.trim() || ''
    const currentLocation = (formData.get('currentLocation') as string | null)?.trim() || ''
    const languagesRaw = (formData.get('languages') as string | null)?.trim() || ''
    const maritalStatus = (formData.get('maritalStatus') as string | null)?.trim() || ''
    const skillsRaw = (formData.get('skill') as string | null)?.trim() || ''
    const currentSalary = (formData.get('currentSalary') as string | null)?.trim() || ''
    const salaryExpectation = (formData.get('salaryExpectation') as string | null)?.trim() || ''
    const visaValidity = (formData.get('visaValidity') as string | null)?.trim() || ''
    const remarks = (formData.get('remarks') as string | null)?.trim() || ''
    const jobCategoriesStr = (formData.get('jobCategories') as string | null) || ''

    const cvFile = formData.get('cvUpload') as File | null

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'First name, last name, email, and phone are required' },
        { status: 400 }
      )
    }

    let jobCategories: string[] = []
    try {
      jobCategories = jobCategoriesStr ? JSON.parse(jobCategoriesStr) : []
    } catch {
      // Fallback: accept single value
      if (jobCategoriesStr) jobCategories = [jobCategoriesStr]
    }

    if (!jobCategories.length) {
      return NextResponse.json(
        { error: 'Select at least one job category' },
        { status: 400 }
      )
    }

    if (!cvFile) {
      return NextResponse.json({ error: 'CV is required' }, { status: 400 })
    }

    if (!ALLOWED_CV_TYPES.includes(cvFile.type)) {
      return NextResponse.json(
        { error: 'CV must be a PDF or Word document (PDF, DOC, DOCX)' },
        { status: 400 }
      )
    }

    if (cvFile.size > MAX_CV_SIZE) {
      return NextResponse.json(
        { error: 'CV must be under 5 MB' },
        { status: 400 }
      )
    }

    // Ensure email is unique across entities
    const existing =
      (await db.candidates.getByEmail(email)) ||
      (await db.agencies.getByEmail(email)) ||
      (await db.companies.getByEmail(email)) ||
      (await db.users.getByEmail(email))

    if (existing) {
      return NextResponse.json(
        { error: 'Email already exists in the system' },
        { status: 400 }
      )
    }

    const languages = languagesRaw
      ? languagesRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const skills = skillsRaw
      ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const cvUrl = await saveCvToCloudinary(cvFile)

    const candidate = await db.candidates.create({
      role: 'candidate',
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      nationality,
      currentLocation,
      preferredLocations: [],
      languages,
      maritalStatus,
      totalExperience: '',
      currentJobTitle: '',
      currentCompany: '',
      currentSalary,
      expectedSalary: salaryExpectation,
      noticePeriod: '',
      industries: [],
      jobTypes: [],
      jobCategories,
      highestEducation: '',
      fieldOfStudy: '',
      skills,
      certifications: [],
      cvUrl,
      photoUrl: undefined,
      passportUrl: undefined,
      videoUrl: undefined,
      status: 'available',
      visaCategory: visaValidity,
      salaryRange: undefined,
      password: '',
      isActive: true,
      agencyId,
    } as any)

    await db.candidateSources.create({
      candidateId: candidate.id,
      agentId: agent.id,
      agencyId,
      sourceType: 'manual',
    })

    const agency = await db.agencies.getById(agencyId)
    if (agency) {
      await db.agencies.update(agencyId, {
        cvUploadsUsed: (agency.cvUploadsUsed || 0) + 1,
        totalCandidates: (agency.totalCandidates || 0) + 1,
      })
    }

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
    })
  } catch (error) {
    return apiError(error, 500)
  }
}


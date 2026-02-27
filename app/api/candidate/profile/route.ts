import { NextRequest, NextResponse } from 'next/server'
import { db, initializeDatabase } from '@/lib/db'
import type { Candidate } from '@/lib/db'

export const runtime = 'nodejs'

/** Compute profile completion 0–100 from candidate. Required ≈40%, optional ≈60%. */
function profileCompletion(c: Candidate): number {
  const required = [
    c.firstName,
    c.lastName,
    c.email,
    c.phone,
    c.gender,
    c.nationality,
    (c.jobCategories?.length ?? 0) > 0,
    !!c.totalExperience,
    !!c.highestEducation,
    !!c.cvUrl,
    !!c.videoUrl,
  ]
  const optional = [
    !!c.currentJobTitle,
    (c.industries?.length ?? 0) > 0,
    (c.jobTypes?.length ?? 0) > 0,
    (c.skills?.length ?? 0) > 0,
    (c.languages?.length ?? 0) > 0,
    !!c.currentLocation,
    (c.preferredLocations?.length ?? 0) > 0,
    !!c.dateOfBirth,
    !!c.maritalStatus,
    !!c.photoUrl,
    !!c.fieldOfStudy,
    !!c.salaryRange,
    !!c.noticePeriod,
  ]
  const requiredScore = (required.filter(Boolean).length / required.length) * 40
  const optionalScore = (optional.filter(Boolean).length / optional.length) * 60
  return Math.round(requiredScore + optionalScore)
}

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

    const profileCompletionPercent = profileCompletion(candidate)

    return NextResponse.json({
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        gender: candidate.gender,
        nationality: candidate.nationality,
        dateOfBirth: candidate.dateOfBirth,
        currentLocation: candidate.currentLocation,
        preferredLocations: candidate.preferredLocations,
        maritalStatus: candidate.maritalStatus,
        languages: candidate.languages,
        totalExperience: candidate.totalExperience,
        currentJobTitle: candidate.currentJobTitle,
        currentCompany: candidate.currentCompany,
        currentSalary: candidate.currentSalary,
        expectedSalary: candidate.expectedSalary,
        noticePeriod: candidate.noticePeriod,
        industries: candidate.industries,
        jobTypes: candidate.jobTypes,
        jobCategories: candidate.jobCategories,
        highestEducation: candidate.highestEducation,
        fieldOfStudy: candidate.fieldOfStudy,
        skills: candidate.skills,
        certifications: candidate.certifications,
        cvUrl: candidate.cvUrl,
        photoUrl: candidate.photoUrl,
        passportUrl: candidate.passportUrl,
        videoUrl: candidate.videoUrl,
        visaCategory: candidate.visaCategory,
        salaryRange: candidate.salaryRange,
      },
      profileCompletion: profileCompletionPercent,
    })
  } catch (error) {
    console.error('GET /api/candidate/profile', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json()

    const updates: Partial<Candidate> = {}
    if (body.firstName != null) updates.firstName = String(body.firstName)
    if (body.lastName != null) updates.lastName = String(body.lastName)
    if (body.phone != null) updates.phone = String(body.phone)
    if (body.gender != null) updates.gender = String(body.gender)
    if (body.nationality != null) updates.nationality = String(body.nationality)
    if (body.dateOfBirth != null) updates.dateOfBirth = String(body.dateOfBirth)
    if (body.currentLocation != null) updates.currentLocation = String(body.currentLocation)
    if (body.preferredLocations != null) updates.preferredLocations = Array.isArray(body.preferredLocations) ? body.preferredLocations : []
    if (body.maritalStatus != null) updates.maritalStatus = String(body.maritalStatus)
    if (body.languages != null) updates.languages = Array.isArray(body.languages) ? body.languages : []
    if (body.totalExperience != null) updates.totalExperience = String(body.totalExperience)
    if (body.noticePeriod != null) updates.noticePeriod = String(body.noticePeriod)
    if (body.currentJobTitle != null) updates.currentJobTitle = String(body.currentJobTitle)
    if (body.currentCompany != null) updates.currentCompany = String(body.currentCompany)
    if (body.currentSalary != null) updates.currentSalary = String(body.currentSalary)
    if (body.expectedSalary != null) updates.expectedSalary = String(body.expectedSalary)
    if (body.industries != null) updates.industries = Array.isArray(body.industries) ? body.industries : []
    if (body.jobTypes != null) updates.jobTypes = Array.isArray(body.jobTypes) ? body.jobTypes : []
    if (body.jobCategories != null) updates.jobCategories = Array.isArray(body.jobCategories) ? body.jobCategories : []
    if (body.highestEducation != null) updates.highestEducation = String(body.highestEducation)
    if (body.fieldOfStudy != null) updates.fieldOfStudy = String(body.fieldOfStudy)
    if (body.skills != null) updates.skills = Array.isArray(body.skills) ? body.skills : []
    if (body.certifications != null) updates.certifications = Array.isArray(body.certifications) ? body.certifications : []
    if (body.visaCategory != null) updates.visaCategory = String(body.visaCategory)
    if (body.salaryRange != null) {
      const sr = body.salaryRange
      updates.salaryRange = typeof sr?.min === 'number' && typeof sr?.max === 'number' ? { min: sr.min, max: sr.max } : undefined
    }

    await db.candidates.update(candidateId, updates)
    const updated = await db.candidates.getById(candidateId)
    const profileCompletionPercent = updated ? profileCompletion(updated) : 0

    return NextResponse.json({
      success: true,
      profileCompletion: profileCompletionPercent,
    })
  } catch (error) {
    console.error('PATCH /api/candidate/profile', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

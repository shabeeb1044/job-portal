import dotenv from 'dotenv'
import path from 'path'
import type { CreateAgencyInput, CreateCompanyInput } from './lib/db'

// Load .env.local before any module that reads DATABASE_URL (standalone scripts don't get Next.js env loading)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function seed() {
  // Load db and auth after env is set so lib/mongodb sees DATABASE_URL
  const { db, initializeDatabase } = await import('./lib/db')
  const { hashPassword } = await import('./lib/auth')

  console.log('Starting database seed with demo users...')

  await initializeDatabase()

  // Demo admin user (for /admin/login)
  const adminEmail = '7start@gmail.com'
  const adminPasswordPlain = 'admin123'

  const existingAdmin = await db.users.getByEmail(adminEmail)
  if (!existingAdmin) {
    const admin = await db.users.create({
      email: adminEmail,
      password: hashPassword(adminPasswordPlain),
      role: 'super_admin',
      name: 'Main Admin',
      isActive: true,
    })
    console.log('Created admin user:', admin.email, 'password:', adminPasswordPlain)
  } else {
    console.log('Admin user already exists:', adminEmail)
  }

  // Demo agency account (for agency login flows)
  const agencyEmail = 'agency@example.com'
  const agencyPasswordPlain = 'agency123'

  const existingAgency = await db.agencies.getByEmail(agencyEmail)
  if (!existingAgency) {
    const agencyInput: CreateAgencyInput = {
      role: 'agency',
      password: hashPassword(agencyPasswordPlain),
      isActive: true,
      approvalStatus: 'approved',
      name: 'Demo Agency',
      email: agencyEmail,
      phone: '+1000000000',
      proofDocumentUrl: '',
      subscriptionPlan: 'silver',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cvUploadLimit: 150,
      cvUploadsUsed: 0,
      biddingLimit: 60,
      bidsUsed: 0,
      jobOfferLimit: 30,
      jobOffersUsed: 0,
      totalCandidates: 0,
      totalInterviews: 0,
      totalSelections: 0,
      totalRevenue: 0,
      totalCommission: 0,
    }

    const agency = await db.agencies.create(agencyInput)
    console.log('Created demo agency:', agency.email, 'password:', agencyPasswordPlain)
  } else {
    console.log('Agency already exists:', agencyEmail)
  }

  // Demo company account (for /login/company)
  const companyEmail = 'company@example.com'
  const companyPasswordPlain = 'company123'

  const existingCompany = await db.companies.getByEmail(companyEmail)
  if (!existingCompany) {
    const companyInput: CreateCompanyInput = {
      role: 'company',
      password: hashPassword(companyPasswordPlain),
      isActive: true,

      name: 'Demo Company',
      tradeLicense: 'TL-DEM0-123456',
      industry: 'Construction',
      companySize: '51-200',
      website: 'https://example.com',
      country: 'UAE',
      city: 'Dubai',
      address: 'Demo Street 123, Dubai',
      description: 'Demo company account for testing the platform.',
      logoUrl: '',
      proofDocumentUrl: '',

      contactName: 'Demo HR Manager',
      contactEmail: companyEmail,
      contactPhone: '+1000000001',
      contactPosition: 'HR Manager',

      email: companyEmail,
      phone: '+1000000001',
      type: 'regular',
      subscriptionPlan: 'silver',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),

      isCorporate: false,
      totalCVDownloads: 0,
      totalBids: 0,
      totalInterviews: 0,
      totalHires: 0,
    }

    const company = await db.companies.create(companyInput)
    console.log('Created demo company:', company.email, 'password:', companyPasswordPlain)
  } else {
    console.log('Company already exists:', companyEmail)
  }

  console.log('Database seeding completed.')
}

seed()
  .then(() => {
    console.log('Seed script finished successfully.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed script failed:', error)
    process.exit(1)
  })


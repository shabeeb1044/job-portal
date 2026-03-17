import { v2 as cloudinary } from 'cloudinary'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (cloudName) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })
}

/**
 * Cloudinary folder structure (all uploads go under these folders only):
 *
 * - candidate-cv   — candidate CVs, videos, passports (agency bulk, candidate profile, registration)
 * - agency         — agency logos, agency proof documents
 * - agent          — agent profile photos
 * - company-proof  — company proof documents
 */
export const CLOUDINARY_FOLDERS = {
  CANDIDATE_CV: 'candidate-cv',
  AGENCY: 'agency',
  AGENT: 'agent',
  COMPANY_PROOF: 'company-proof',
} as const

export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto'

export interface UploadToCloudinaryOptions {
  folder?: string
  resource_type?: CloudinaryResourceType
  public_id?: string
}

/**
 * Upload a file buffer to Cloudinary and return the secure URL.
 * Uses env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  options: UploadToCloudinaryOptions = {}
): Promise<string> {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local'
    )
  }

  const { folder = CLOUDINARY_FOLDERS.CANDIDATE_CV, resource_type = 'auto', public_id } = options

  const uploadOptions: Record<string, unknown> = {
    folder,
    resource_type,
  }
  if (public_id) uploadOptions.public_id = public_id

  return new Promise((resolve, reject) => {
    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`
    cloudinary.uploader.upload(dataUri, uploadOptions, (error, result) => {
      if (error) {
        reject(error)
        return
      }
      if (!result || !result.secure_url) {
        reject(new Error('Cloudinary upload did not return a URL'))
        return
      }
      resolve(result.secure_url)
    })
  })
}

/**
 * Infer Cloudinary resource_type from MIME type.
 */
export function getResourceType(mimeType: string): CloudinaryResourceType {
  if (!mimeType) return 'raw'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'raw'
}

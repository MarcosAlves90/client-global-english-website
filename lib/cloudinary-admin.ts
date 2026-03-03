import { v2 as cloudinary } from "cloudinary"

const CLOUDINARY_HOST_PATTERN = /(^|\.)cloudinary\.com$/i
const UPLOAD_SEGMENT = "/upload/"

let isConfigured = false

function ensureCloudinaryConfig() {
  if (isConfigured) {
    return
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing.")
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
  isConfigured = true
}

export function isCloudinaryUrl(url: string) {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return CLOUDINARY_HOST_PATTERN.test(parsed.hostname)
  } catch {
    return false
  }
}

export function getCloudinaryPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null

  const uploadIndex = url.indexOf(UPLOAD_SEGMENT)
  if (uploadIndex === -1) return null

  const afterUpload = url.slice(uploadIndex + UPLOAD_SEGMENT.length)
  const segments = afterUpload.split("/").filter(Boolean)
  if (!segments.length) return null

  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment))
  const publicIdSegments = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments
  if (!publicIdSegments.length) return null

  const publicIdWithExt = publicIdSegments.join("/")
  return publicIdWithExt.replace(/\.[^/.]+$/, "")
}

export async function deleteCloudinaryPublicId(publicId: string) {
  ensureCloudinaryConfig()

  const resourceTypes: Array<"image" | "video" | "raw"> = ["image", "video", "raw"]
  let lastResult: { result?: string } | null = null

  for (const resourceType of resourceTypes) {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    })
    lastResult = result
    if (result.result === "ok" || result.result === "not found") {
      return result
    }
  }

  throw new Error(`Cloudinary destroy failed for public_id=${publicId}: ${JSON.stringify(lastResult)}`)
}

export async function deleteCloudinaryAssetsByUrls(urls: string[]) {
  const publicIds = Array.from(
    new Set(
      urls
        .map((url) => getCloudinaryPublicIdFromUrl(url))
        .filter((value): value is string => Boolean(value))
    )
  )

  await Promise.all(publicIds.map((publicId) => deleteCloudinaryPublicId(publicId)))
}

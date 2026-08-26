import { v2 as cloudinary } from "cloudinary"
import {
  cloudinaryUrlsMatch as areCloudinaryUrlsEquivalent,
  getCloudinaryPublicIdFromUrl as extractCloudinaryPublicIdFromUrl,
  isCloudinaryUrl as checkIsCloudinaryUrl,
  requireCloudinaryCloudName,
} from "@/lib/cloudinary-url"

let isConfigured = false

function ensureCloudinaryConfig() {
  if (isConfigured) {
    return
  }

  const cloudName = requireCloudinaryCloudName()
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
  return checkIsCloudinaryUrl(url)
}

function getCloudinaryPublicIdFromUrl(url: string): string | null {
  return extractCloudinaryPublicIdFromUrl(url)
}

async function deleteCloudinaryPublicId(publicId: string) {
  ensureCloudinaryConfig()

  const resourceTypes: Array<"image" | "video" | "raw"> = ["image", "video", "raw"]
  let lastResult: { result?: string } | null = null

  for (const resourceType of resourceTypes) {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    })
    lastResult = result
    if (result.result === "ok") {
      return result
    }
    if (result.result !== "not found") {
      throw new Error(
        `Cloudinary destroy failed for public_id=${publicId}, resource_type=${resourceType}: ${JSON.stringify(result)}`
      )
    }
  }

  return lastResult ?? { result: "not found" }
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

export function cloudinaryAssetUrlsMatch(left: string, right: string) {
  return areCloudinaryUrlsEquivalent(left, right)
}

"use server"

import { v2 as cloudinary } from "cloudinary"

import {
  getCloudinaryPublicIdFromUrl,
  requireCloudinaryCloudName,
} from "@/lib/cloudinary-url"
import {
  getAudioCloudinaryUploadOptions,
  isAudioFile,
  validateAudioFile,
} from "@/lib/media/audio"

function getCloudinaryClient() {
  const cloudName = requireCloudinaryCloudName()
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing.")
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  return cloudinary
}

export type UploadedMedia = {
  public_id: string
  secure_url: string
  resource_type: "image" | "video" | "raw"
  bytes: number
  format?: string
}

export async function uploadMedia(formData: FormData, subfolder: string = "general") {
  const file = formData.get("file") as File | null
  if (!file) {
    throw new Error("No file provided.")
  }

  const audio = isAudioFile(file)
  if (audio) {
    const validation = validateAudioFile(file)
    if (!validation.ok) {
      throw new Error(validation.message)
    }
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const options = audio
    ? {
        folder: `global-english/${subfolder}`,
        ...getAudioCloudinaryUploadOptions(),
      }
    : {
        folder: `global-english/${subfolder}`,
        resource_type: "auto" as const,
      }

  return new Promise<UploadedMedia>((resolve, reject) => {
    getCloudinaryClient().uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
        return
      }
      if (!result) {
        reject(new Error("Upload failed: No result from Cloudinary."))
        return
      }
      resolve({
        public_id: result.public_id,
        secure_url: result.secure_url,
        resource_type:
          result.resource_type === "video" || result.resource_type === "raw"
            ? result.resource_type
            : "image",
        bytes: Number(result.bytes ?? 0),
        format: result.format,
      })
    }).end(buffer)
  })
}

export async function uploadImage(formData: FormData, subfolder: string = "general") {
  return uploadMedia(formData, subfolder)
}

export async function getPublicIdFromUrl(url: string): Promise<string | null> {
  return getCloudinaryPublicIdFromUrl(url)
}

export async function deleteMedia(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
) {
  if (!publicId) return
  try {
    return await getCloudinaryClient().uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    })
  } catch (error) {
    console.error("Cloudinary delete failed:", error)
  }
}

export async function deleteMediaByUrl(url: string) {
  const publicId = getCloudinaryPublicIdFromUrl(url)
  if (!publicId) return

  for (const resourceType of ["image", "video", "raw"] as const) {
    const result = await deleteMedia(publicId, resourceType)
    if (result?.result === "ok") return result
  }
}

export async function deleteImage(publicId: string) {
  return deleteMedia(publicId, "image")
}

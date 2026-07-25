"use server"

import { v2 as cloudinary } from "cloudinary"
import { getCloudinaryPublicIdFromUrl, requireCloudinaryCloudName } from "@/lib/cloudinary-url"

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

export async function uploadImage(formData: FormData, subfolder: string = "general") {
    const file = formData.get("file") as File
    if (!file) {
        throw new Error("No file provided.")
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: `global-english/${subfolder}`,
            },
            (error, result) => {
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
                })
            }
        ).end(buffer)
    })
}

export async function getPublicIdFromUrl(url: string): Promise<string | null> {
    return getCloudinaryPublicIdFromUrl(url)
}

export async function deleteImage(publicId: string) {
    if (!publicId) return
    try {
        return await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        console.error("Cloudinary delete failed:", error)
    }
}

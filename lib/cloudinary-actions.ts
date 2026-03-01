"use server"

import { v2 as cloudinary } from "cloudinary"

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary environment variables are missing.")
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
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
                    reject(error)
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
    if (!url || !url.includes("cloudinary.com")) return null

    // Extract the part after /upload/v<numeric>/
    // Example: https://res.cloudinary.com/demo/image/upload/v12345/global-english/avatars/foobar.jpg
    const parts = url.split("/")
    const uploadIndex = parts.indexOf("upload")
    if (uploadIndex === -1) return null

    // The public ID is everything from parts[uploadIndex + 2] to the end, excluding the extension
    // We skip the version (v12345)
    const publicIdWithExtension = parts.slice(uploadIndex + 2).join("/")
    return publicIdWithExtension.replace(/\.[^/.]+$/, "")
}

export async function deleteImage(publicId: string) {
    if (!publicId) return
    try {
        return await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        console.error("Cloudinary delete failed:", error)
    }
}

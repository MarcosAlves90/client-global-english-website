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

export async function deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId)
}

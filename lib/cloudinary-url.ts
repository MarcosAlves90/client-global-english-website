type CloudinaryOptimizeOptions = {
  width?: number
  height?: number
  crop?: "fill" | "limit" | "fit" | "thumb"
  gravity?: "auto" | "face"
  quality?: "auto" | number
  format?: "auto" | "webp" | "avif" | "jpg" | "png"
  dpr?: "auto" | number
  progressive?: boolean
}

const CLOUDINARY_HOSTNAME = "res.cloudinary.com"
const CLOUDINARY_HOST_PATTERN = /(^|\.)cloudinary\.com$/i
const CLOUDINARY_UPLOAD_SEGMENT = "/upload/"

type CloudinaryResourceType = "image" | "video" | "raw"

export function getCloudinaryCloudName() {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    ""
  )
}

export function requireCloudinaryCloudName() {
  const cloudName = getCloudinaryCloudName()
  if (!cloudName) {
    throw new Error("Cloudinary cloud name is missing from environment variables.")
  }

  return cloudName
}

function normalizePositiveNumber(value?: number) {
  if (!Number.isFinite(value) || !value) return undefined
  const normalized = Math.round(value)
  return normalized > 0 ? normalized : undefined
}

function getCloudinaryUploadPathFromUrl(src: string) {
  const parsedUrl = new URL(src)
  const uploadIndex = parsedUrl.pathname.indexOf(CLOUDINARY_UPLOAD_SEGMENT)
  if (uploadIndex === -1) {
    return null
  }

  return parsedUrl.pathname.slice(uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length)
}

function isCloudinaryImageHost(url: URL) {
  return url.hostname === CLOUDINARY_HOSTNAME
}

function hasOptimizationTokens(segment: string) {
  return ["f_auto", "q_auto", "dpr_auto", "fl_progressive"].some((token) =>
    segment.includes(token)
  )
}

function buildCloudinaryTransformations({
  width,
  height,
  crop,
  gravity,
  quality,
  format,
  dpr,
  progressive,
}: {
  width?: number
  height?: number
  crop?: "fill" | "limit" | "fit" | "thumb"
  gravity?: "auto" | "face"
  quality?: "auto" | number
  format?: "auto" | "webp" | "avif" | "jpg" | "png"
  dpr?: "auto" | number
  progressive?: boolean
}) {
  const normalizedWidth = normalizePositiveNumber(width)
  const normalizedHeight = normalizePositiveNumber(height)
  const resolvedCrop = crop ?? (normalizedWidth || normalizedHeight ? "limit" : undefined)

  return [
    format ? `f_${format}` : undefined,
    quality === undefined ? undefined : `q_${quality}`,
    dpr === undefined ? undefined : `dpr_${dpr}`,
    progressive ? "fl_progressive" : undefined,
    resolvedCrop ? `c_${resolvedCrop}` : undefined,
    gravity ? `g_${gravity}` : undefined,
    normalizedWidth ? `w_${normalizedWidth}` : undefined,
    normalizedHeight ? `h_${normalizedHeight}` : undefined,
  ].filter(Boolean)
}

export function buildCloudinaryUrl(
  uploadPath: string,
  resourceType: CloudinaryResourceType = "image"
) {
  const cloudName = requireCloudinaryCloudName()
  const normalizedUploadPath = uploadPath.replace(/^\/+/, "")

  return `https://${CLOUDINARY_HOSTNAME}/${cloudName}/${resourceType}/upload/${normalizedUploadPath}`
}

export function isCloudinaryUrl(src: string) {
  if (!src) return false

  try {
    const parsedUrl = new URL(src)
    return CLOUDINARY_HOST_PATTERN.test(parsedUrl.hostname)
  } catch {
    return false
  }
}

export function normalizeCloudinaryUrl(src: string) {
  if (!src || !isCloudinaryUrl(src)) {
    return src
  }

  const cloudName = getCloudinaryCloudName()
  if (!cloudName) {
    return src
  }

  try {
    const parsedUrl = new URL(src)
    const segments = parsedUrl.pathname.split("/")
    if (segments.length < 4) {
      return src
    }

    if (segments[1] === cloudName) {
      return src
    }

    segments[1] = cloudName
    parsedUrl.pathname = segments.join("/")
    return parsedUrl.toString()
  } catch {
    return src
  }
}

export function normalizeCloudinaryUrlValue(url?: string | null) {
  const trimmed = url?.trim()
  if (!trimmed) {
    return undefined
  }

  return normalizeCloudinaryUrl(trimmed)
}

export function normalizeCloudinaryUrlItems<T extends { url?: string | null }>(
  items?: T[] | null
) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => ({
    ...item,
    url: normalizeCloudinaryUrlValue(item.url) ?? "",
  }))
}

export function getCloudinaryPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null

  try {
    const uploadPath = getCloudinaryUploadPathFromUrl(url)
    if (!uploadPath) {
      return null
    }

    const segments = uploadPath.split("/").filter(Boolean)
    const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment))
    const publicIdSegments = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments
    if (!publicIdSegments.length) return null

    const publicIdWithExt = publicIdSegments.join("/")
    return publicIdWithExt.replace(/\.[^/.]+$/, "")
  } catch {
    return null
  }
}

export function cloudinaryUrlsMatch(left: string, right: string) {
  const leftPublicId = getCloudinaryPublicIdFromUrl(left)
  const rightPublicId = getCloudinaryPublicIdFromUrl(right)

  if (leftPublicId && rightPublicId) {
    return leftPublicId === rightPublicId
  }

  return normalizeCloudinaryUrl(left) === normalizeCloudinaryUrl(right)
}

export function optimizeCloudinaryUrl(
  src: string,
  {
    width,
    height,
    crop,
    gravity,
    quality = "auto",
    format = "auto",
    dpr = "auto",
    progressive = true,
  }: CloudinaryOptimizeOptions = {}
) {
  if (!src) return src

  try {
    const parsedUrl = new URL(src)
    if (!isCloudinaryImageHost(parsedUrl)) {
      return src
    }
  } catch {
    return src
  }

  const normalizedSrc = normalizeCloudinaryUrl(src)

  const uploadIndex = normalizedSrc.indexOf(CLOUDINARY_UPLOAD_SEGMENT)
  if (uploadIndex === -1) {
    return normalizedSrc
  }

  const uploadStart = uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length
  const afterUpload = normalizedSrc.slice(uploadStart)
  const firstSegment = afterUpload.split("/")[0] ?? ""
  const isVersionSegment = /^v\d+$/.test(firstSegment)
  const alreadyOptimized = !isVersionSegment && hasOptimizationTokens(firstSegment)

  if (alreadyOptimized) {
    return normalizedSrc
  }

  const transformations = buildCloudinaryTransformations({
    width,
    height,
    crop,
    gravity,
    quality,
    format,
    dpr,
    progressive,
  })

  if (!transformations.length) {
    return normalizedSrc
  }

  const transformSegment = transformations.join(",")
  return `${normalizedSrc.slice(0, uploadStart)}${transformSegment}/${afterUpload}`
}

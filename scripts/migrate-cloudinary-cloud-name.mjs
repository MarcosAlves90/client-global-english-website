import { existsSync, readFileSync } from "node:fs"
import admin from "firebase-admin"

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return false
  }

  const raw = readFileSync(path, "utf8")
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) return
    const idx = trimmed.indexOf("=")
    if (idx <= 0) return
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  })

  return true
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    envFile: process.env.ENV_FILE ?? ".env.local",
  }

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (current === "--dry-run") {
      args.dryRun = true
      continue
    }

    if (current === "--env-file") {
      const nextValue = argv[index + 1]
      if (!nextValue) {
        throw new Error("--env-file requires a value")
      }
      args.envFile = nextValue
      index += 1
    }
  }

  return args
}

function assertEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing env: ${name}`)
  }
  return value
}

function getCloudinaryCloudName() {
  return (
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    ""
  )
}

function isCloudinaryUrl(url) {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return /(^|\.)cloudinary\.com$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

function normalizeCloudinaryUrl(url) {
  if (!url || !isCloudinaryUrl(url)) {
    return url
  }

  const cloudName = getCloudinaryCloudName()
  if (!cloudName) {
    return url
  }

  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split("/")
    if (segments.length < 4 || segments[1] === cloudName) {
      return url
    }
    segments[1] = cloudName
    parsed.pathname = segments.join("/")
    return parsed.toString()
  } catch {
    return url
  }
}

function stripCloudinaryVersionFromPathname(pathname) {
  const segments = pathname.split("/")
  const uploadIndex = segments.indexOf("upload")
  if (uploadIndex === -1) {
    return pathname
  }

  const versionIndex = segments
    .slice(uploadIndex + 1)
    .findIndex((segment) => /^v\d+$/.test(segment))

  if (versionIndex === -1) {
    return pathname
  }

  segments.splice(uploadIndex + 1 + versionIndex, 1)
  return segments.join("/")
}

function normalizeCloudinaryUrlWithoutVersion(url) {
  const normalizedUrl = normalizeCloudinaryUrl(url)
  if (!normalizedUrl || !isCloudinaryUrl(normalizedUrl)) {
    return normalizedUrl
  }

  try {
    const parsed = new URL(normalizedUrl)
    const pathnameWithoutVersion = stripCloudinaryVersionFromPathname(parsed.pathname)
    if (pathnameWithoutVersion === parsed.pathname) {
      return normalizedUrl
    }

    parsed.pathname = pathnameWithoutVersion
    return parsed.toString()
  } catch {
    return normalizedUrl
  }
}

function normalizeAttachmentList(attachments) {
  if (!Array.isArray(attachments)) {
    return { value: [], changed: false }
  }

  let changed = false
  const value = attachments.map((item) => {
    if (!item || typeof item !== "object") {
      return item
    }

    const currentUrl = typeof item.url === "string" ? item.url.trim() : ""
    if (!currentUrl) {
      return item
    }

    const normalizedUrl = normalizeCloudinaryUrl(currentUrl)
    if (normalizedUrl === currentUrl) {
      return item
    }

    changed = true
    return {
      ...item,
      url: normalizedUrl,
    }
  })

  return { value, changed }
}

function normalizeDocument(collectionName, data) {
  const updates = {}

  if (collectionName === "users") {
    const photoURL = typeof data.photoURL === "string" ? data.photoURL.trim() : ""
    if (photoURL) {
      const normalizedPhotoURL = normalizeCloudinaryUrlWithoutVersion(photoURL)
      if (normalizedPhotoURL !== photoURL) {
        updates.photoURL = normalizedPhotoURL
      }
    }
  }

  if (collectionName === "courses") {
    const coverUrl = typeof data.coverUrl === "string" ? data.coverUrl.trim() : ""
    if (coverUrl) {
      const normalizedCoverUrl = normalizeCloudinaryUrlWithoutVersion(coverUrl)
      if (normalizedCoverUrl !== coverUrl) {
        updates.coverUrl = normalizedCoverUrl
      }
    }
  }

  if (collectionName === "materials") {
    const url = typeof data.url === "string" ? data.url.trim() : ""
    if (url) {
      const normalizedUrl = normalizeCloudinaryUrl(url)
      if (normalizedUrl !== url) {
        updates.url = normalizedUrl
      }
    }

    const { value, changed } = normalizeAttachmentList(data.attachments)
    if (changed) {
      updates.attachments = value
    }
  }

  if (collectionName === "activities") {
    const { value, changed } = normalizeAttachmentList(data.attachments)
    if (changed) {
      updates.attachments = value
    }
  }

  return updates
}

async function commitBatch(batch, writeCount) {
  if (writeCount === 0) {
    return
  }
  await batch.commit()
}

async function migrateCollection(db, collectionName, dryRun) {
  const snapshot = await db.collection(collectionName).get()
  const changes = []

  let batch = db.batch()
  let pendingWrites = 0
  let updatedDocs = 0

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data()
    const updates = normalizeDocument(collectionName, data)

    if (!Object.keys(updates).length) {
      continue
    }

    updatedDocs += 1
    changes.push({
      path: `${collectionName}/${docSnap.id}`,
      fields: Object.keys(updates),
    })

    if (dryRun) {
      continue
    }

    batch.set(
      docSnap.ref,
      {
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
    pendingWrites += 1

    if (pendingWrites >= 450) {
      await commitBatch(batch, pendingWrites)
      batch = db.batch()
      pendingWrites = 0
    }
  }

  if (!dryRun) {
    await commitBatch(batch, pendingWrites)
  }

  return {
    collectionName,
    scanned: snapshot.size,
    updatedDocs,
    changes,
  }
}

async function run() {
  const { dryRun, envFile } = parseArgs(process.argv.slice(2))
  loadEnvFile(".env")
  loadEnvFile(envFile)

  const cloudName = getCloudinaryCloudName()
  if (!cloudName) {
    throw new Error(
      "Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or CLOUDINARY_CLOUD_NAME."
    )
  }

  const projectId = assertEnv("FIREBASE_PROJECT_ID")
  const clientEmail = assertEnv("FIREBASE_CLIENT_EMAIL")
  const privateKey = assertEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n")

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }

  const db = admin.firestore()
  const collections = ["users", "courses", "materials", "activities"]

  console.log(
    `Cloudinary migration starting (${dryRun ? "dry-run" : "write"}) for cloud_name=${cloudName}`
  )

  const results = []
  for (const collectionName of collections) {
    const result = await migrateCollection(db, collectionName, dryRun)
    results.push(result)
  }

  const totalScanned = results.reduce((acc, item) => acc + item.scanned, 0)
  const totalUpdated = results.reduce((acc, item) => acc + item.updatedDocs, 0)

  results.forEach((result) => {
    console.log(
      `${result.collectionName}: scanned=${result.scanned}, updated=${result.updatedDocs}`
    )
    if (dryRun && result.changes.length) {
      result.changes.slice(0, 10).forEach((change) => {
        console.log(`  - ${change.path}: ${change.fields.join(", ")}`)
      })
      if (result.changes.length > 10) {
        console.log(`  ... ${result.changes.length - 10} more`)
      }
    }
  })

  console.log(`Total scanned=${totalScanned}, updated=${totalUpdated}`)
  if (dryRun) {
    console.log("Dry run complete. Re-run without --dry-run to write changes.")
  } else {
    console.log("Migration complete.")
  }
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

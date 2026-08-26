import { readFileSync } from "node:fs"
import { spawn } from "node:child_process"

import admin from "firebase-admin"

function loadEnvFile(path) {
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
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(url)
      if (resp.ok || resp.status >= 300) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`Server did not become ready: ${url}`)
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
    "demo"
  )
}

function cloudinaryRawUrl(assetPath) {
  return `https://res.cloudinary.com/${getCloudinaryCloudName()}/raw/upload/v1/${assetPath}`
}

function assertOkResponse(resp, label) {
  if (!resp.ok || !resp.data?.id) {
    throw new Error(`${label} failed: ${resp.status}`)
  }

  return resp.data.id
}

function assertStatus(resp, expectedStatus, label) {
  if (resp.status !== expectedStatus) {
    throw new Error(`${label} failed: ${resp.status}`)
  }
}

async function createResource(baseUrl, path, idToken, body, label) {
  const resp = await api(baseUrl, path, "POST", idToken, body)
  return assertOkResponse(resp, label)
}

async function deleteAttachmentAndVerify(baseUrl, idToken, entityType, entityId, attachmentUrl, label) {
  const resp = await api(baseUrl, "/api/admin/attachments", "DELETE", idToken, {
    entityType,
    entityId,
    attachmentUrl,
  })

  if (!resp.ok) {
    throw new Error(`${label} failed: ${resp.status}`)
  }
}

async function fetchCollectionByCourseId(db, collectionName, courseId) {
  return db.collection(collectionName).where("courseId", "==", courseId).get()
}

async function cleanupCourseData(db, courseId) {
  if (!courseId) {
    return
  }

  const collections = ["materials", "activities", "tracks"]
  for (const collectionName of collections) {
    const snapshot = await fetchCollectionByCourseId(db, collectionName, courseId)
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete().catch(() => {})))
  }

  await db.collection("courses").doc(courseId).delete().catch(() => {})
}

async function api(baseUrl, path, method, idToken, body) {
  const resp = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await resp.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  return { ok: resp.ok, status: resp.status, data }
}

async function run() {
  loadEnvFile(".env.local")

  const projectId = assertEnv("FIREBASE_PROJECT_ID")
  const clientEmail = assertEnv("FIREBASE_CLIENT_EMAIL")
  const privateKey = assertEnv("FIREBASE_PRIVATE_KEY").replaceAll(String.raw`\n`, "\n")
  const apiKey = assertEnv("NEXT_PUBLIC_FIREBASE_API_KEY")

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    })
  }

  const db = admin.firestore()
  const auth = admin.auth()
  const baseUrl = "http://localhost:3101"
  const ts = Date.now()
  const testUid = `e2e-admin-${ts}`

  let dev = null
  let courseId = null
  let materialId = null
  let activityId = null

  try {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm"
    dev = spawn(npmCommand, ["run", "dev", "--", "--port", "3101"], {
      stdio: "ignore",
      env: process.env,
    })

    await waitForServer(baseUrl, 90_000)

    await db.collection("users").doc(testUid).set({
      uid: testUid,
      name: "E2E Admin",
      email: `e2e-admin-${ts}@local.test`,
      role: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const customToken = await auth.createCustomToken(testUid)
    const signInResp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      }
    )
    if (!signInResp.ok) {
      throw new Error(`signInWithCustomToken failed: ${signInResp.status}`)
    }
    const signInData = await signInResp.json()
    const idToken = signInData.idToken
    if (!idToken) {
      throw new Error("Missing idToken from Identity Toolkit")
    }

    courseId = await createResource(baseUrl, "/api/admin/courses", idToken, {
      title: `E2E Course ${ts}`,
      description: "Smoke test attachments",
      level: "Beginner",
      durationWeeks: 4,
      status: "Pausado",
    }, "create course")

    const trackId = await createResource(baseUrl, "/api/admin/tracks", idToken, {
      courseId,
      title: "Modulo E2E",
      description: "Modulo para smoke test",
      order: 1,
      userIds: [],
    }, "create track")

    materialId = await createResource(baseUrl, "/api/admin/materials", idToken, {
      courseId,
      trackId,
      title: "Material E2E",
      visibility: "module",
      attachments: [
        {
          name: "PDF Teste",
          type: "pdf",
          url: cloudinaryRawUrl("global-english/materials/e2e-file.pdf"),
        },
      ],
    }, "create material")

    const invalidMaterial = await api(baseUrl, "/api/admin/materials", "POST", idToken, {
      courseId,
      trackId,
      title: "Material Invalido",
      visibility: "module",
      attachments: [
        {
          name: "Link externo",
          type: "pdf",
          url: "https://example.com/file.pdf",
        },
      ],
    })
    assertStatus(invalidMaterial, 400, "cloudinary validation for material")

    const originalMaterialAttachmentUrl = cloudinaryRawUrl("global-english/materials/e2e-file.pdf")
    const appendedMaterialAttachmentUrl = cloudinaryRawUrl("global-english/materials/e2e-added.pdf")
    const updateMaterialAttachments = await api(baseUrl, "/api/admin/materials", "PATCH", idToken, {
      id: materialId,
      attachments: [
        { name: "PDF Teste", type: "pdf", url: originalMaterialAttachmentUrl },
        { name: "PDF Adicionado", type: "pdf", url: appendedMaterialAttachmentUrl },
      ],
    })
    assertStatus(updateMaterialAttachments, 200, "append material attachment after creation")
    if ((updateMaterialAttachments.data?.attachments ?? []).length !== 2) {
      throw new Error("material PATCH did not persist appended attachments")
    }

    activityId = await createResource(baseUrl, "/api/admin/activities", idToken, {
      courseId,
      trackId,
      title: "Atividade E2E",
      type: "lesson",
      estimatedMinutes: 10,
      visibility: "module",
      attachments: [
        {
          name: "Audio Teste",
          type: "audio",
          url: cloudinaryRawUrl("global-english/activities/e2e-audio.mp3"),
        },
      ],
      questions: [],
    }, "create activity")

    await deleteAttachmentAndVerify(
      baseUrl,
      idToken,
      "material",
      materialId,
      originalMaterialAttachmentUrl,
      "delete material attachment"
    )

    const materials = await api(
      baseUrl,
      `/api/admin/materials?courseId=${encodeURIComponent(courseId)}`,
      "GET",
      idToken
    )
    const mat = (materials.data ?? []).find((item) => item.id === materialId)
    if (!mat || (mat.attachments ?? []).length !== 1 || mat.attachments?.[0]?.url !== appendedMaterialAttachmentUrl) {
      throw new Error("material attachment removal did not preserve the appended attachment")
    }

    await deleteAttachmentAndVerify(
      baseUrl,
      idToken,
      "activity",
      activityId,
      "https://res.cloudinary.com/demo/raw/upload/v1/global-english/activities/e2e-audio.mp3",
      "delete activity attachment"
    )

    const activities = await api(
      baseUrl,
      `/api/admin/activities?courseId=${encodeURIComponent(courseId)}`,
      "GET",
      idToken
    )
    const act = (activities.data ?? []).find((item) => item.id === activityId)
    if (!act || (act.attachments ?? []).length !== 0) {
      throw new Error("activity attachment was not removed")
    }

    await createResource(
      baseUrl,
      "/api/admin/materials",
      idToken,
      {
        courseId,
        trackId,
        title: "Material Cascade",
        visibility: "module",
        attachments: [
          {
            name: "Cascade PDF",
            type: "pdf",
            url: cloudinaryRawUrl("global-english/materials/e2e-cascade.pdf"),
          },
        ],
      },
      "create material cascade"
    )

    await createResource(
      baseUrl,
      "/api/admin/activities",
      idToken,
      {
        courseId,
        trackId,
        title: "Atividade Cascade",
        type: "lesson",
        estimatedMinutes: 12,
        visibility: "module",
        attachments: [
          {
            name: "Cascade Audio",
            type: "audio",
            url: cloudinaryRawUrl("global-english/activities/e2e-cascade.mp3"),
          },
        ],
        questions: [],
      },
      "create activity cascade"
    )

    const deleteCourse = await api(baseUrl, "/api/admin/courses", "DELETE", idToken, {
      id: courseId,
    })
    if (!deleteCourse.ok) {
      throw new Error(`delete course failed: ${deleteCourse.status}`)
    }

    const [tracksLeft, materialsLeft, activitiesLeft] = await Promise.all([
      fetchCollectionByCourseId(db, "tracks", courseId),
      fetchCollectionByCourseId(db, "materials", courseId),
      fetchCollectionByCourseId(db, "activities", courseId),
    ])

    if (!tracksLeft.empty || !materialsLeft.empty || !activitiesLeft.empty) {
      throw new Error("cascade delete left related docs")
    }

    console.log("E2E smoke test: PASS")
    console.log("Checked: Cloudinary-only validation, attachment delete endpoint, course cascade delete")
  } finally {
    await cleanupCourseData(db, courseId).catch(() => {})

    await db.collection("users").doc(testUid).delete().catch(() => {})
    await auth.deleteUser(testUid).catch(() => {})

    if (dev && !dev.killed) {
      dev.kill("SIGTERM")
    }
  }
}

try {
  await run()
} catch (error) {
  console.error("E2E smoke test: FAIL")
  console.error(error?.stack || error?.message || error)
  process.exit(1)
}

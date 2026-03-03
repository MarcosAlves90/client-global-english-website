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
  const privateKey = assertEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n")
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
    dev = spawn("npm.cmd", ["run", "dev", "--", "--port", "3101"], {
      stdio: "ignore",
      shell: true,
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

    const createCourse = await api(baseUrl, "/api/admin/courses", "POST", idToken, {
      title: `E2E Course ${ts}`,
      description: "Smoke test attachments",
      level: "Beginner",
      durationWeeks: 4,
      status: "Pausado",
    })
    if (!createCourse.ok || !createCourse.data?.id) {
      throw new Error(`create course failed: ${createCourse.status}`)
    }
    courseId = createCourse.data.id

    const createTrack = await api(baseUrl, "/api/admin/tracks", "POST", idToken, {
      courseId,
      title: "Modulo E2E",
      description: "Modulo para smoke test",
      order: 1,
      userIds: [],
    })
    if (!createTrack.ok || !createTrack.data?.id) {
      throw new Error(`create track failed: ${createTrack.status}`)
    }
    const trackId = createTrack.data.id

    const createMaterial = await api(baseUrl, "/api/admin/materials", "POST", idToken, {
      courseId,
      trackId,
      title: "Material E2E",
      visibility: "module",
      attachments: [
        {
          name: "PDF Teste",
          type: "pdf",
          url: "https://res.cloudinary.com/demo/raw/upload/v1/global-english/materials/e2e-file.pdf",
        },
      ],
    })
    if (!createMaterial.ok || !createMaterial.data?.id) {
      throw new Error(`create material failed: ${createMaterial.status}`)
    }
    materialId = createMaterial.data.id

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
    if (invalidMaterial.status !== 400) {
      throw new Error(`cloudinary validation failed for material: ${invalidMaterial.status}`)
    }

    const createActivity = await api(baseUrl, "/api/admin/activities", "POST", idToken, {
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
          url: "https://res.cloudinary.com/demo/raw/upload/v1/global-english/activities/e2e-audio.mp3",
        },
      ],
      questions: [],
    })
    if (!createActivity.ok || !createActivity.data?.id) {
      throw new Error(`create activity failed: ${createActivity.status}`)
    }
    activityId = createActivity.data.id

    const deleteMaterialAttachment = await api(
      baseUrl,
      "/api/admin/attachments",
      "DELETE",
      idToken,
      {
        entityType: "material",
        entityId: materialId,
        attachmentUrl:
          "https://res.cloudinary.com/demo/raw/upload/v1/global-english/materials/e2e-file.pdf",
      }
    )
    if (!deleteMaterialAttachment.ok) {
      throw new Error(`delete material attachment failed: ${deleteMaterialAttachment.status}`)
    }

    const materials = await api(
      baseUrl,
      `/api/admin/materials?courseId=${encodeURIComponent(courseId)}`,
      "GET",
      idToken
    )
    const mat = (materials.data ?? []).find((item) => item.id === materialId)
    if (!mat || (mat.attachments ?? []).length !== 0) {
      throw new Error("material attachment was not removed")
    }

    const deleteActivityAttachment = await api(
      baseUrl,
      "/api/admin/attachments",
      "DELETE",
      idToken,
      {
        entityType: "activity",
        entityId: activityId,
        attachmentUrl:
          "https://res.cloudinary.com/demo/raw/upload/v1/global-english/activities/e2e-audio.mp3",
      }
    )
    if (!deleteActivityAttachment.ok) {
      throw new Error(`delete activity attachment failed: ${deleteActivityAttachment.status}`)
    }

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

    const createMaterialCascade = await api(
      baseUrl,
      "/api/admin/materials",
      "POST",
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
            url: "https://res.cloudinary.com/demo/raw/upload/v1/global-english/materials/e2e-cascade.pdf",
          },
        ],
      }
    )
    if (!createMaterialCascade.ok) {
      throw new Error(`create material cascade failed: ${createMaterialCascade.status}`)
    }

    const createActivityCascade = await api(
      baseUrl,
      "/api/admin/activities",
      "POST",
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
            url: "https://res.cloudinary.com/demo/raw/upload/v1/global-english/activities/e2e-cascade.mp3",
          },
        ],
        questions: [],
      }
    )
    if (!createActivityCascade.ok) {
      throw new Error(`create activity cascade failed: ${createActivityCascade.status}`)
    }

    const deleteCourse = await api(baseUrl, "/api/admin/courses", "DELETE", idToken, {
      id: courseId,
    })
    if (!deleteCourse.ok) {
      throw new Error(`delete course failed: ${deleteCourse.status}`)
    }

    const tracksLeft = await db
      .collection("tracks")
      .where("courseId", "==", courseId)
      .get()
    const materialsLeft = await db
      .collection("materials")
      .where("courseId", "==", courseId)
      .get()
    const activitiesLeft = await db
      .collection("activities")
      .where("courseId", "==", courseId)
      .get()

    if (!tracksLeft.empty || !materialsLeft.empty || !activitiesLeft.empty) {
      throw new Error("cascade delete left related docs")
    }

    console.log("E2E smoke test: PASS")
    console.log("Checked: Cloudinary-only validation, attachment delete endpoint, course cascade delete")
  } finally {
    try {
      if (courseId) {
        const mats = await db
          .collection("materials")
          .where("courseId", "==", courseId)
          .get()
        await Promise.all(mats.docs.map((d) => d.ref.delete().catch(() => {})))
        const acts = await db
          .collection("activities")
          .where("courseId", "==", courseId)
          .get()
        await Promise.all(acts.docs.map((d) => d.ref.delete().catch(() => {})))
        const trs = await db.collection("tracks").where("courseId", "==", courseId).get()
        await Promise.all(trs.docs.map((d) => d.ref.delete().catch(() => {})))
        await db.collection("courses").doc(courseId).delete().catch(() => {})
      }
    } catch {}

    await db.collection("users").doc(testUid).delete().catch(() => {})
    await auth.deleteUser(testUid).catch(() => {})

    if (dev && !dev.killed) {
      dev.kill("SIGTERM")
    }
  }
}

run().catch((error) => {
  console.error("E2E smoke test: FAIL")
  console.error(error?.stack || error?.message || error)
  process.exit(1)
})

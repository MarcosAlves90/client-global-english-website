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

async function getIdTokenFromCustomToken(params) {
  const signInResp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${params.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.customToken, returnSecureToken: true }),
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

  return idToken
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

  const baseUrl = "http://localhost:3102"
  const ts = Date.now()

  const adminUid = `e2e-admin-course-activity-${ts}`
  const studentUid = `e2e-student-course-activity-${ts}`

  let dev = null
  let courseId = null
  let trackId = null
  let activityId = null

  try {
    dev = spawn("npm.cmd", ["run", "dev", "--", "--port", "3102"], {
      stdio: "ignore",
      shell: true,
      env: process.env,
    })

    await waitForServer(baseUrl, 90_000)

    await Promise.all([
      auth.createUser({
        uid: adminUid,
        email: `e2e-admin-course-activity-${ts}@local.test`,
        displayName: "E2E Admin Course Activity",
      }),
      auth.createUser({
        uid: studentUid,
        email: `e2e-student-course-activity-${ts}@local.test`,
        displayName: "E2E Student Course Activity",
      }),
    ])

    const now = admin.firestore.FieldValue.serverTimestamp()

    await Promise.all([
      db.collection("users").doc(adminUid).set({
        uid: adminUid,
        name: "E2E Admin Course Activity",
        email: `e2e-admin-course-activity-${ts}@local.test`,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      }),
      db.collection("users").doc(studentUid).set({
        uid: studentUid,
        name: "E2E Student Course Activity",
        email: `e2e-student-course-activity-${ts}@local.test`,
        role: "student",
        createdAt: now,
        updatedAt: now,
      }),
    ])

    const adminCustomToken = await auth.createCustomToken(adminUid)
    const adminIdToken = await getIdTokenFromCustomToken({
      apiKey,
      customToken: adminCustomToken,
    })

    const createCourse = await api(baseUrl, "/api/admin/courses", "POST", adminIdToken, {
      title: `E2E Curso ${ts}`,
      description: "Smoke E2E curso ate resposta de atividade",
      level: "Beginner",
      durationWeeks: 4,
      status: "Em andamento",
    })
    if (!createCourse.ok || !createCourse.data?.id) {
      throw new Error(`create course failed: ${createCourse.status}`)
    }
    courseId = createCourse.data.id

    const createTrack = await api(baseUrl, "/api/admin/tracks", "POST", adminIdToken, {
      courseId,
      title: "Trilha E2E",
      description: "Trilha para validar fluxo completo",
      order: 1,
      userIds: [studentUid],
    })
    if (!createTrack.ok || !createTrack.data?.id) {
      throw new Error(`create track failed: ${createTrack.status}`)
    }
    trackId = createTrack.data.id

    const createActivity = await api(baseUrl, "/api/admin/activities", "POST", adminIdToken, {
      courseId,
      trackId,
      title: "Atividade E2E Resposta",
      type: "quiz",
      estimatedMinutes: 10,
      visibility: "module",
      questions: [
        {
          id: "q-1",
          type: "single_choice",
          prompt: "Qual e o plural de child?",
          options: ["childs", "children", "childes"],
          correctAnswers: ["children"],
          points: 1,
          required: true,
        },
      ],
    })
    if (!createActivity.ok || !createActivity.data?.id) {
      throw new Error(`create activity failed: ${createActivity.status}`)
    }
    activityId = createActivity.data.id

    const enrollmentSnapshot = await db
      .collection("enrollments")
      .where("courseId", "==", courseId)
      .where("userId", "==", studentUid)
      .limit(1)
      .get()

    if (enrollmentSnapshot.empty) {
      throw new Error("student enrollment was not created from track assignment")
    }

    const progressId = `${studentUid}_${activityId}`
    await db.collection("activityProgress").doc(progressId).set({
      userId: studentUid,
      activityId,
      courseId,
      trackId,
      status: "completed",
      answers: {
        "q-1": "children",
      },
      answeredCount: 1,
      totalQuestions: 1,
      completionPercent: 100,
      scorePercent: 100,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const progressSnapshot = await db.collection("activityProgress").doc(progressId).get()
    if (!progressSnapshot.exists) {
      throw new Error("activity response document was not created")
    }

    const progressData = progressSnapshot.data() ?? {}
    if (progressData.status !== "completed") {
      throw new Error("activity response status mismatch")
    }
    if (progressData.answeredCount !== 1 || progressData.totalQuestions !== 1) {
      throw new Error("activity response counters mismatch")
    }

    console.log("E2E smoke test (course -> activity response): PASS")
    console.log("Checked: course creation, track assignment, activity creation, student response persistence")
  } finally {
    try {
      if (activityId && studentUid) {
        await db.collection("activityProgress").doc(`${studentUid}_${activityId}`).delete().catch(() => {})
      }

      if (courseId) {
        const mats = await db.collection("materials").where("courseId", "==", courseId).get()
        await Promise.all(mats.docs.map((docSnap) => docSnap.ref.delete().catch(() => {})))

        const acts = await db.collection("activities").where("courseId", "==", courseId).get()
        await Promise.all(acts.docs.map((docSnap) => docSnap.ref.delete().catch(() => {})))

        const trs = await db.collection("tracks").where("courseId", "==", courseId).get()
        await Promise.all(trs.docs.map((docSnap) => docSnap.ref.delete().catch(() => {})))

        const enrollments = await db
          .collection("enrollments")
          .where("courseId", "==", courseId)
          .get()
        await Promise.all(enrollments.docs.map((docSnap) => docSnap.ref.delete().catch(() => {})))

        await db.collection("courses").doc(courseId).delete().catch(() => {})
      }
    } catch {}

    await Promise.all([
      db.collection("users").doc(adminUid).delete().catch(() => {}),
      db.collection("users").doc(studentUid).delete().catch(() => {}),
      auth.deleteUser(adminUid).catch(() => {}),
      auth.deleteUser(studentUid).catch(() => {}),
    ])

    if (dev && !dev.killed) {
      dev.kill("SIGTERM")
    }
  }
}

run().catch((error) => {
  console.error("E2E smoke test (course -> activity response): FAIL")
  console.error(error?.stack || error?.message || error)
  process.exit(1)
})

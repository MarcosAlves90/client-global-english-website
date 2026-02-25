import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth"
import { getAuthErrorMessage } from "@/lib/auth/errors"
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/auth/validators"
import { auth, hasFirebaseConfig } from "@/lib/firebase/client"
import { ensureUserProfile, setUserMustChangePassword } from "@/lib/firebase/firestore"
import { resolveUserRole } from "@/lib/firebase/roles"

function getAuthOrThrow() {
  if (!hasFirebaseConfig || !auth) {
    throw new Error("Firebase não configurado.")
  }

  return auth
}

export async function signInWithEmail(params: {
  email: string
  password: string
}) {
  const normalizedEmail = normalizeEmail(params.email)
  const emailError = validateEmail(normalizedEmail)
  if (emailError) {
    throw new Error(emailError)
  }

  if (!params.password) {
    throw new Error("Senha é obrigatória.")
  }

  const firebaseAuth = getAuthOrThrow()

  const credential = await signInWithEmailAndPassword(
    firebaseAuth,
    normalizedEmail,
    params.password
  )

  await ensureUserProfile({
    uid: credential.user.uid,
    name: credential.user.displayName ?? credential.user.email ?? "",
    email: credential.user.email ?? normalizedEmail,
    role: resolveUserRole({
      email: credential.user.email ?? normalizedEmail,
    }),
  })

  return credential.user
}

export async function signUpWithEmail(params: {
  name: string
  email: string
  password: string
}) {
  const nameError = validateName(params.name)
  if (nameError) {
    throw new Error(nameError)
  }

  const normalizedEmail = normalizeEmail(params.email)
  const emailError = validateEmail(normalizedEmail)
  if (emailError) {
    throw new Error(emailError)
  }

  const passwordError = validatePassword(params.password)
  if (passwordError) {
    throw new Error(passwordError)
  }

  const firebaseAuth = getAuthOrThrow()

  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    normalizedEmail,
    params.password
  )

  await updateProfile(credential.user, {
    displayName: params.name.trim(),
  })

  // Email verification is desirable but must not break account creation flow.
  // If SMTP/provider is temporarily unavailable, the user can request again later.
  try {
    await sendEmailVerification(credential.user)
  } catch {
    // no-op by design
  }

  await ensureUserProfile({
    uid: credential.user.uid,
    name: params.name.trim(),
    email: normalizedEmail,
    role: resolveUserRole({ email: normalizedEmail }),
  })

  return credential.user
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const emailError = validateEmail(normalizedEmail)
  if (emailError) {
    throw new Error(emailError)
  }

  const firebaseAuth = getAuthOrThrow()
  await sendPasswordResetEmail(firebaseAuth, normalizedEmail)
}

export async function updateCurrentUserPassword(params: { password: string }) {
  const passwordError = validatePassword(params.password)
  if (passwordError) {
    throw new Error(passwordError)
  }

  const firebaseAuth = getAuthOrThrow()
  if (!firebaseAuth.currentUser) {
    throw new Error("Usuário não autenticado.")
  }

  await updatePassword(firebaseAuth.currentUser, params.password)
  await setUserMustChangePassword({
    uid: firebaseAuth.currentUser.uid,
    value: false,
  })
}

export async function signOutUser() {
  if (!hasFirebaseConfig || !auth) {
    return
  }

  await signOut(auth)
}

export function toFriendlyAuthError(error: unknown, fallback: string) {
  return getAuthErrorMessage(error, fallback)
}

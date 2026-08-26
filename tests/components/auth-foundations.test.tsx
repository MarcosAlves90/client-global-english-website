import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ isFirebaseReady: true }),
}))

vi.mock("@/lib/firebase/auth", () => ({
  signInWithEmail: vi.fn(),
  requestPasswordReset: vi.fn(),
  signUpWithEmail: vi.fn(),
  toFriendlyAuthError: (_error: unknown, fallback: string) => fallback,
}))

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}))

afterEach(cleanup)

describe("authentication UI foundations", () => {
  it("uses the same rounded surface language as the application", () => {
    const { container } = render(
      <AuthLayout
        imageSrc="https://res.cloudinary.com/demo/image/upload/sample.jpg"
        imageAlt="Cidade"
        badgeText="Acesso à plataforma"
        title="Bem-vindo"
        description="Entre para continuar."
      >
        <div>Formulário</div>
      </AuthLayout>
    )

    expect(screen.getByText("Bem-vindo").closest(".ge-surface")).toBeInTheDocument()
    expect(container.querySelector("[data-auth-visual]")).toBeInTheDocument()
  })

  it("does not advertise public signup from the login form", () => {
    render(<LoginForm />)

    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /cadastro|criar conta/i })).not.toBeInTheDocument()
    expect(screen.getByText(/fale com a coordenação da global english/i)).toBeInTheDocument()
  })

  it("keeps public signup unavailable without rendering editable fields", () => {
    render(<SignupForm isDisabled />)

    expect(screen.getByText("Contas são criadas pela equipe")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /ir para o login/i })).toHaveAttribute("href", "/login")
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /criar conta/i })).not.toBeInTheDocument()
  })
})

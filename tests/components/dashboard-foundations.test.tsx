import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { FileText, Search } from "lucide-react"

import {
  DashboardEmptyState,
  DashboardNotice,
} from "@/components/dashboard/dashboard-feedback"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

describe("dashboard visual foundations", () => {
  it("uses the shared surface and control contracts", () => {
    const { container } = render(
      <div>
        <Card>Conteúdo</Card>
        <Input aria-label="Nome" />
        <NativeSelect aria-label="Nível" defaultValue="basic">
          <option value="basic">Básico</option>
        </NativeSelect>
        <Textarea aria-label="Descrição" />
      </div>
    )

    expect(container.querySelector('[data-slot="card"]')).toHaveClass("ge-surface")
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveClass("ge-control")
    expect(screen.getByRole("combobox", { name: "Nível" })).toHaveClass("ge-control")
    expect(screen.getByRole("textbox", { name: "Descrição" })).toHaveClass("ge-control")
  })

  it("keeps compact icon actions circular for the Cupertino shape language", () => {
    render(
      <Button size="icon" aria-label="Pesquisar">
        <Search />
      </Button>
    )

    expect(screen.getByRole("button", { name: "Pesquisar" })).toHaveClass("data-[size=icon]:rounded-full")
  })

  it("exposes standardized feedback semantics", () => {
    render(
      <>
        <DashboardNotice>Sincronizando dados</DashboardNotice>
        <DashboardNotice tone="danger">Falha ao carregar</DashboardNotice>
        <DashboardEmptyState
          icon={FileText}
          title="Nada por aqui"
          description="Nenhum item foi encontrado."
        />
      </>
    )

    expect(screen.getByRole("status")).toHaveTextContent("Sincronizando dados")
    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar")
    expect(screen.getByText("Nada por aqui")).toBeInTheDocument()
  })
})

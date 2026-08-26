import { describe, expect, it } from "vitest"

import {
  getAvailableWorkspaces,
  getWorkspaceDefinition,
  resolveWorkspace,
} from "@/lib/navigation/workspaces"

describe("workspace navigation", () => {
  it("returns workspace definitions by id", () => {
    expect(getWorkspaceDefinition("student")).toEqual({
      id: "student",
      label: "Aluno",
      home: "/dashboard",
    })
    expect(getWorkspaceDefinition("teacher").home).toBe("/dashboard/teacher")
    expect(getWorkspaceDefinition("admin").home).toBe("/dashboard/admin")
  })

  it("exposes only the student workspace to learners", () => {
    expect(getAvailableWorkspaces("user").map((workspace) => workspace.id)).toEqual([
      "student",
    ])
  })

  it("exposes student and teacher workspaces to teachers", () => {
    expect(getAvailableWorkspaces("teacher").map((workspace) => workspace.id)).toEqual([
      "student",
      "teacher",
    ])
  })

  it("exposes all workspaces to administrators", () => {
    expect(getAvailableWorkspaces("admin").map((workspace) => workspace.id)).toEqual([
      "student",
      "teacher",
      "admin",
    ])
  })

  it("resolves deep routes to the correct workspace", () => {
    expect(resolveWorkspace("/dashboard/teacher/grading", "teacher")).toBe("teacher")
    expect(resolveWorkspace("/dashboard/admin/users", "admin")).toBe("admin")
    expect(resolveWorkspace("/dashboard/grades", "admin")).toBe("student")
  })

  it("preserves the current workspace on shared routes", () => {
    expect(resolveWorkspace("/dashboard/settings", "admin", "admin")).toBe("admin")
    expect(resolveWorkspace("/dashboard/support", "admin", "teacher")).toBe("teacher")
    expect(resolveWorkspace("/dashboard/settings", "teacher", "teacher")).toBe("teacher")
    expect(resolveWorkspace("/dashboard/support", "admin", "student")).toBe("student")
    expect(resolveWorkspace("/dashboard/settings/profile", "admin", "admin")).toBe("admin")
  })

  it("does not preserve a workspace unavailable to the current role", () => {
    expect(resolveWorkspace("/dashboard/settings", "teacher", "admin")).toBe("student")
    expect(resolveWorkspace("/dashboard/support", "user", "teacher")).toBe("student")
  })
})

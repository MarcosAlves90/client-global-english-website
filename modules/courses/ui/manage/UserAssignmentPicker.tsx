"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdminUserSummary } from "@/lib/firebase/types"

type UserAssignmentPickerProps = {
  label: string
  helperText?: string
  searchValue: string
  onSearchValueChange: (value: string) => void
  selectedUsers: AdminUserSummary[]
  suggestedUsers: AdminUserSummary[]
  selectedCount: number
  emptyStateLabel?: string
  onToggleUser: (uid: string) => void
}

export function UserAssignmentPicker({
  label,
  helperText,
  searchValue,
  onSearchValueChange,
  selectedUsers,
  suggestedUsers,
  selectedCount,
  emptyStateLabel = "Nenhum aluno selecionado",
  onToggleUser,
}: UserAssignmentPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
          {label}
        </Label>
        <span className="rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-bold text-primary">
          {selectedCount} selecionado(s)
        </span>
      </div>

      {helperText ? (
        <p className="text-[10px] leading-relaxed text-muted-foreground/70">
          {helperText}
        </p>
      ) : null}

      <Input
        placeholder="Buscar por nome ou email..."
        value={searchValue}
        onChange={(e) => onSearchValueChange(e.target.value)}
        className="bg-background/50 border-primary/20"
      />

      <div className="space-y-3 rounded-xl border border-dashed border-primary/20 p-3">
        <div className="flex flex-wrap gap-2">
          {selectedUsers.length === 0 ? (
            <span className="p-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              {emptyStateLabel}
            </span>
          ) : (
            selectedUsers.map((user) => (
              <span
                key={user.uid}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-foreground"
              >
                {user.name}
                <button
                  type="button"
                  onClick={() => onToggleUser(user.uid)}
                  className="transition-colors hover:text-primary"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {suggestedUsers.length > 0 ? (
          <div className="space-y-1 border-t border-primary/5 pt-2">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              Sugestões
            </p>
            {suggestedUsers.map((user) => (
              <button
                key={user.uid}
                type="button"
                onClick={() => onToggleUser(user.uid)}
                className="flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {user.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">{user.name}</p>
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  + Add
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

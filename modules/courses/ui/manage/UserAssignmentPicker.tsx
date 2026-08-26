"use client"

import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
export type UserAssignmentOption = {
  uid: string
  name: string
  email: string
}

type UserAssignmentPickerProps = {
  label: string
  helperText?: string
  searchValue: string
  onSearchValueChange: (value: string) => void
  selectedUsers: UserAssignmentOption[]
  suggestedUsers: UserAssignmentOption[]
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
      <div className="flex items-center justify-between gap-3">
        <Label className="ge-kicker text-muted-foreground/70">{label}</Label>
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
          {selectedCount} selecionado(s)
        </Badge>
      </div>

      {helperText ? <p className="text-xs leading-5 text-muted-foreground">{helperText}</p> : null}

      <Input
        placeholder="Buscar por nome ou email..."
        value={searchValue}
        onChange={(event) => onSearchValueChange(event.target.value)}
      />

      <div className="ge-surface-muted space-y-3 p-3">
        <div className="flex flex-wrap gap-2">
          {selectedUsers.length === 0 ? (
            <span className="p-1 text-[10px] font-medium text-muted-foreground/60">
              {emptyStateLabel}
            </span>
          ) : (
            selectedUsers.map((user) => (
              <span key={user.uid} className="ge-chip border-primary/20 bg-primary/5 text-foreground">
                {user.name}
                <button
                  type="button"
                  onClick={() => onToggleUser(user.uid)}
                  className="rounded-full p-0.5 transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label={`Remover ${user.name}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {suggestedUsers.length > 0 ? (
          <div className="space-y-1 border-t border-border/60 pt-3">
            <p className="ge-kicker mb-2 text-muted-foreground/60">Sugestões</p>
            {suggestedUsers.map((user) => (
              <button
                key={user.uid}
                type="button"
                onClick={() => onToggleUser(user.uid)}
                className="group flex w-full items-center justify-between rounded-xl p-2 text-left transition-colors hover:bg-primary/5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="ge-icon-tile size-7 shrink-0 rounded-full text-[10px] font-semibold">
                    {user.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold leading-none">{user.name}</p>
                    <p className="truncate text-[10px] leading-tight text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  + Adicionar
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

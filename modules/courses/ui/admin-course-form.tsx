"use client"

import * as React from "react"
import Image from "next/image"
import { AlertCircle, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { deleteMediaByUrl, uploadImage } from "@/lib/cloudinary-actions"
import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url"
import type { AdminCourseSummary, AdminUserSummary } from "@/lib/firebase/types"
import { COURSE_STATUS_OPTIONS, type CourseStatus } from "@/modules/courses/model/course"

export type AdminCourseFormValue = {
  title: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  durationWeeks: string
  coverUrl: string
  status: CourseStatus
  teacherIds: string[]
}

export function createAdminCourseFormValue(course?: AdminCourseSummary | null): AdminCourseFormValue {
  const status =
    course && COURSE_STATUS_OPTIONS.includes(course.status as CourseStatus)
      ? (course.status as CourseStatus)
      : "Inscrições abertas"

  return {
    title: course?.title ?? "",
    description: course?.description ?? "",
    level: course?.level ?? "Beginner",
    durationWeeks: String(course?.durationWeeks || 4),
    coverUrl: course?.coverUrl ?? "",
    status,
    teacherIds: course?.teacherIds ?? [],
  }
}

type AdminCourseFormProps = Readonly<{
  title: string
  value: AdminCourseFormValue
  teachers: AdminUserSummary[]
  submitting: boolean
  error: string | null
  submitLabel: string
  initialCoverUrl?: string | null
  onChange: React.Dispatch<React.SetStateAction<AdminCourseFormValue>>
  onSubmit: () => void
  onCancel: () => void
  onReset?: () => void
}>

export function AdminCourseForm({
  title,
  value,
  teachers,
  submitting,
  error,
  submitLabel,
  initialCoverUrl = null,
  onChange,
  onSubmit,
  onCancel,
  onReset,
}: AdminCourseFormProps) {
  const coverInputRef = React.useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadImage(formData, "covers")

      if (value.coverUrl && value.coverUrl !== initialCoverUrl) {
        await deleteMediaByUrl(value.coverUrl)
      }

      onChange((current) => ({ ...current, coverUrl: result.secure_url }))
      toast.success("Capa enviada com sucesso")
    } catch (uploadError) {
      console.error("Course cover upload failed", uploadError)
      toast.error("Falha no envio da capa")
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label required htmlFor="course-title">Título do curso</Label>
          <Input
            id="course-title"
            placeholder="Ex.: Inglês para negociações internacionais"
            value={value.title}
            onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label required htmlFor="course-description">Descrição</Label>
          <Textarea
            id="course-description"
            placeholder="Resumo do objetivo, público-alvo e entregáveis"
            value={value.description}
            onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
          />
          <p className="text-xs text-muted-foreground">{value.description.length} caracteres</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="course-level">Nível</Label>
          <NativeSelect
            id="course-level"
            value={value.level}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                level: event.target.value as AdminCourseFormValue["level"],
              }))
            }
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label required htmlFor="course-duration">Duração (semanas)</Label>
          <Input
            id="course-duration"
            type="number"
            min={1}
            value={value.durationWeeks}
            onChange={(event) => onChange((current) => ({ ...current, durationWeeks: event.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="course-status">Status operacional</Label>
          <NativeSelect
            id="course-status"
            value={value.status}
            onChange={(event) =>
              onChange((current) => ({ ...current, status: event.target.value as CourseStatus }))
            }
          >
            {COURSE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Professores responsáveis</Label>
          {teachers.length === 0 ? (
            <p className="ge-surface-muted rounded-xl p-3 text-xs text-muted-foreground">
              Nenhuma conta com perfil Professor foi encontrada. Crie ou altere um usuário antes de atribuí-lo ao curso.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {teachers.map((teacher) => {
                const checked = value.teacherIds.includes(teacher.uid)
                return (
                  <label key={teacher.uid} className="ge-inset flex cursor-pointer items-center justify-between gap-3 p-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{teacher.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{teacher.email}</span>
                    </span>
                    <Switch
                      checked={checked}
                      onCheckedChange={(nextChecked) =>
                        onChange((current) => ({
                          ...current,
                          teacherIds: nextChecked
                            ? Array.from(new Set([...current.teacherIds, teacher.uid]))
                            : current.teacherIds.filter((id) => id !== teacher.uid),
                        }))
                      }
                      aria-label={`Atribuir ${teacher.name} ao curso`}
                    />
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Capa do curso</Label>
          <div className="flex items-center gap-4">
            {value.coverUrl ? (
              <div className="relative size-11 overflow-hidden rounded-xl border border-primary/20">
                <Image
                  src={optimizeCloudinaryUrl(value.coverUrl, {
                    width: 160,
                    height: 160,
                    crop: "fill",
                    gravity: "auto",
                  })}
                  alt={value.title ? `Capa de ${value.title}` : "Capa do curso"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleCoverUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 flex-1 border-dashed"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading || submitting}
            >
              {isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
              {isUploading ? "Enviando..." : value.coverUrl ? "Alterar capa" : "Upload da capa"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-sm text-destructive md:col-span-2">
            <AlertCircle className="size-4" />
            {error}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-primary/5 pt-6 md:col-span-2">
          <Button onClick={onSubmit} disabled={submitting || isUploading} className="px-8">
            {submitting ? "Salvando..." : submitLabel}
          </Button>
          {onReset ? (
            <Button variant="outline" onClick={onReset} disabled={submitting || isUploading}>
              Limpar
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onCancel} disabled={submitting || isUploading}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

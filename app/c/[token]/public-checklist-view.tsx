"use client"

import type React from "react"
import { useState } from "react"
import { format, isPast } from "date-fns"
import { de } from "date-fns/locale"
import { Check, AlertTriangle, Calendar, Upload, X, Loader2 } from "lucide-react"
import type { Checklist, Task } from "@/lib/types"
import { calculateProgress, updateChecklistByToken } from "@/lib/db"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ComnovoLogo } from "@/components/comnovo-logo"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface PublicChecklistViewProps {
  checklist: Checklist
  token: string
}

export function PublicChecklistView({ checklist: initialChecklist, token }: PublicChecklistViewProps) {
  const [checklist, setChecklist] = useState(initialChecklist)
  const [taskStates, setTaskStates] = useState<Record<string, unknown>>(
    (initialChecklist.task_states || {}) as Record<string, unknown>,
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})

  const progress = calculateProgress({ ...checklist, task_states: taskStates })
  const isOverdue = checklist.due_date
    ? isPast(new Date(checklist.due_date)) && checklist.status !== "completed"
    : false
  const isCompleted = checklist.status === "completed"
  const isLocked = isOverdue

  const getTaskValue = (taskId: string) => {
    return taskStates[taskId] ?? null
  }

  const handleTaskChange = async (task: Task, value: boolean | string | number | null) => {
    if (isLocked) return

    setSaving(task.id)

    const newTaskStates = { ...taskStates, [task.id]: value }
    setTaskStates(newTaskStates)

    let allCompleted = true
    for (const category of checklist.categories) {
      for (const t of category.tasks) {
        if (t.required) {
          const val = newTaskStates[t.id]
          if (t.type === "checkbox") {
            if (val !== true) allCompleted = false
          } else {
            if (val === null || val === undefined || val === "") allCompleted = false
          }
        }
      }
    }

    const updates: Partial<Checklist> = {
      task_states: newTaskStates,
      status: allCompleted ? "completed" : "in_progress",
    }
    if (allCompleted) {
      updates.completed_at = new Date().toISOString()
    }

    try {
      const result = await updateChecklistByToken(token, updates)
      if (!result) {
        throw new Error("Speichern fehlgeschlagen")
      }

      if (allCompleted) {
        setChecklist({ ...checklist, status: "completed", completed_at: new Date().toISOString() })
        toast.success("Alle Aufgaben erledigt!")
      }
    } catch (error) {
      console.error("[v0] Error saving task state:", error)
      toast.error("Fehler beim Speichern. Bitte erneut versuchen.")
      // Revert optimistic update
      setTaskStates(taskStates)
    }

    setSaving(null)
  }

  const handleFileUpload = (task: Task, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [task.id]: file.name }))
      handleTaskChange(task, file.name)
    }
  }

  const removeFile = (task: Task) => {
    setUploadedFiles((prev) => {
      const newFiles = { ...prev }
      delete newFiles[task.id]
      return newFiles
    })
    handleTaskChange(task, null)
  }

  const renderTaskInput = (task: Task) => {
    const value = getTaskValue(task.id)
    const isSaving = saving === task.id
    const fileName = uploadedFiles[task.id] || (typeof value === "string" && task.type === "file" ? value : null)

    switch (task.type) {
      case "checkbox":
        return (
          <div className="flex items-center gap-3">
            <Checkbox
              checked={value === true}
              onCheckedChange={(checked) => handleTaskChange(task, checked as boolean)}
              disabled={isLocked || isSaving}
              className="h-5 w-5 rounded border-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        )

      case "text":
        return (
          <div className="relative">
            <Input
              value={(value as string) || ""}
              onChange={(e) => handleTaskChange(task, e.target.value)}
              placeholder="Hier eingeben..."
              disabled={isLocked}
              className="h-9 pr-8"
            />
            {isSaving && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        )

      case "number":
        return (
          <div className="relative">
            <Input
              type="number"
              value={(value as number) || ""}
              onChange={(e) => handleTaskChange(task, e.target.value ? Number(e.target.value) : null)}
              placeholder="0"
              disabled={isLocked}
              className="h-9 pr-8"
            />
            {isSaving && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        )

      case "file":
        return (
          <div>
            {fileName ? (
              <div className="flex items-center gap-2 rounded border border-border bg-muted/50 px-3 py-2">
                <span className="flex-1 truncate text-sm text-foreground">{fileName}</span>
                {!isLocked && (
                  <button onClick={() => removeFile(task)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-border px-4 py-2.5 transition-colors",
                  isLocked ? "cursor-not-allowed opacity-50" : "hover:border-primary hover:bg-primary/5",
                )}
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Datei auswählen</span>
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(task, e)} disabled={isLocked} />
              </label>
            )}
            {isSaving && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Speichern...
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const isTaskCompleted = (task: Task) => {
    const value = getTaskValue(task.id)
    if (task.type === "checkbox") return value === true
    return value !== null && value !== "" && value !== false && value !== undefined
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-4 sm:px-6">
          <ComnovoLogo className="h-7" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Project Info */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{checklist.project_name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{checklist.customer_name}</p>
        </div>

        {/* Status Banner */}
        {checklist.due_date && (
          <div
            className={cn(
              "mb-6 flex items-start gap-3 rounded-lg border p-4",
              isOverdue
                ? "border-destructive/30 bg-destructive/5"
                : isCompleted
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-amber-500/30 bg-amber-500/5",
            )}
          >
            {isOverdue ? (
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive" />
            ) : isCompleted ? (
              <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
            ) : (
              <Calendar className="h-5 w-5 flex-shrink-0 text-amber-600" />
            )}
            <div className="min-w-0 flex-1">
              {isOverdue ? (
                <>
                  <p className="font-medium text-destructive">Fälligkeitsdatum überschritten</p>
                  <p className="mt-0.5 text-sm text-destructive/80">Kontakt: support@comnovo.de</p>
                </>
              ) : isCompleted ? (
                <>
                  <p className="font-medium text-green-700">Alle Aufgaben erledigt</p>
                  <p className="mt-0.5 text-sm text-green-600">Vielen Dank für Ihre Mitarbeit.</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-amber-700">
                    Fällig: {format(new Date(checklist.due_date), "d. MMMM yyyy", { locale: de })}
                  </p>
                  <p className="mt-0.5 text-sm text-amber-600">
                    Bitte alle Pflichtaufgaben bis zu diesem Datum erledigen.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Fortschritt</p>
              <p className="text-xs text-muted-foreground">
                {progress.completed} von {progress.total} Pflichtaufgaben
              </p>
            </div>
            <div className="text-right">
              <span
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  progress.percentage === 100 ? "text-green-600" : "text-foreground",
                )}
              >
                {progress.percentage}%
              </span>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full transition-all duration-300",
                progress.percentage === 100 ? "bg-green-500" : "bg-primary",
              )}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-4">
          {checklist.categories.map((category) => (
            <div key={category.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="border-b border-border bg-muted/30 px-4 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.name}
                </h3>
              </div>
              <div className="divide-y divide-border">
                {category.tasks.map((task) => {
                  const completed = isTaskCompleted(task)
                  return (
                    <div key={task.id} className={cn("px-4 py-4 transition-colors", completed && "bg-green-500/5")}>
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                            completed ? "bg-green-500 text-white" : "border-2 border-muted-foreground/30",
                          )}
                        >
                          {completed && <Check className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-medium", completed && "text-muted-foreground")}>
                              {task.title}
                            </span>
                            {task.required && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                                Pflicht
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                          )}
                          <div className="mt-2">{renderTaskInput(task)}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">Ihre Eingaben werden automatisch gespeichert.</p>
        </div>
      </main>
    </div>
  )
}

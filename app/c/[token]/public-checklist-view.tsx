"use client"

import type React from "react"
import { useState } from "react"
import { format, isPast } from "date-fns"
import { de } from "date-fns/locale"
import { CheckCircle2, Circle, AlertTriangle, Calendar, Upload, X, Loader2 } from "lucide-react"
import type { Checklist, Task } from "@/lib/types"
import { calculateProgress, updateChecklistByToken } from "@/lib/db"
import { ProgressBar } from "@/components/progress-bar"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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

    // Update local state optimistically
    const newTaskStates = { ...taskStates, [task.id]: value }
    setTaskStates(newTaskStates)

    // Check if all required tasks are completed
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

    // Update in database
    const updates: Partial<Checklist> = {
      task_states: newTaskStates,
      status: allCompleted ? "completed" : "in_progress",
    }
    if (allCompleted) {
      updates.completed_at = new Date().toISOString()
    }

    await updateChecklistByToken(token, updates)

    if (allCompleted) {
      setChecklist({ ...checklist, status: "completed", completed_at: new Date().toISOString() })
    }

    setSaving(null)
  }

  const handleFileUpload = (task: Task, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [task.id]: file.name }))
      handleTaskChange(task, file.name)
      toast.success(`Datei "${file.name}" hochgeladen`)
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
              className="h-6 w-6"
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
              className="pr-8"
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
              className="pr-8"
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
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
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
                  "flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-3 transition-colors",
                  isLocked ? "cursor-not-allowed opacity-50" : "hover:border-primary hover:bg-primary/5",
                )}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
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
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
              <span className="text-lg font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-lg font-semibold text-foreground">Comnovo</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Project Info */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">{checklist.project_name}</h1>
          <p className="mt-1 text-muted-foreground">{checklist.customer_name}</p>
        </div>

        {/* Due Date Warning */}
        {checklist.due_date && (
          <div
            className={cn(
              "mb-6 rounded-lg border p-4",
              isOverdue
                ? "border-red-200 bg-red-50"
                : isCompleted
                  ? "border-green-200 bg-green-50"
                  : "border-amber-200 bg-amber-50",
            )}
          >
            <div className="flex items-start gap-3">
              {isOverdue ? (
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
              ) : isCompleted ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              ) : (
                <Calendar className="h-5 w-5 flex-shrink-0 text-amber-600" />
              )}
              <div>
                {isOverdue ? (
                  <>
                    <p className="font-medium text-red-800">Das Fälligkeitsdatum ist überschritten.</p>
                    <p className="mt-1 text-sm text-red-700">
                      Bitte kontaktieren Sie uns unter{" "}
                      <a href="mailto:support@comnovo.de" className="underline">
                        support@comnovo.de
                      </a>
                    </p>
                  </>
                ) : isCompleted ? (
                  <>
                    <p className="font-medium text-green-800">Vielen Dank! Alle Aufgaben sind erledigt.</p>
                    <p className="mt-1 text-sm text-green-700">Ihre Checkliste wurde erfolgreich abgeschlossen.</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-amber-800">
                      Fälligkeitsdatum: {format(new Date(checklist.due_date), "dd. MMMM yyyy", { locale: de })}
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      Bitte schließen Sie alle Pflichtaufgaben bis zu diesem Datum ab.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="mb-8 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-foreground">Fortschritt</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {progress.completed} von {progress.total} Pflichtaufgaben erledigt
              </p>
            </div>
            <span
              className={cn("text-2xl font-bold", progress.percentage === 100 ? "text-green-600" : "text-foreground")}
            >
              {progress.percentage}%
            </span>
          </div>
          <div className="mt-4">
            <ProgressBar percentage={progress.percentage} showLabel={false} />
          </div>
        </div>

        {/* Tasks by Category */}
        <div className="space-y-6">
          {checklist.categories.map((category) => (
            <div key={category.id} className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{category.name}</h3>
              </div>
              <div className="divide-y divide-border">
                {category.tasks.map((task) => {
                  const completed = isTaskCompleted(task)
                  return (
                    <div key={task.id} className={cn("p-5 transition-colors", completed && "bg-green-50/50")}>
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 flex-shrink-0">
                          {completed ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{task.title}</h4>
                            {task.required && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                                Pflicht
                              </span>
                            )}
                          </div>
                          {task.description && <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>}
                          <div className="mt-3">{renderTaskInput(task)}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-8 rounded-lg border border-border bg-muted/50 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Ihre Eingaben werden automatisch gespeichert. Sie können diese Seite jederzeit erneut öffnen, um
            fortzufahren.
          </p>
        </div>
      </main>
    </div>
  )
}

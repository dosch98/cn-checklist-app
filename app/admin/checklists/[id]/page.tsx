"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { ArrowLeft, ExternalLink, Clock, Calendar, User, Mail, Loader2 } from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { StatusBadge } from "@/components/status-badge"
import { ProgressBar } from "@/components/progress-bar"
import { Button } from "@/components/ui/button"
import { getChecklist, calculateProgress } from "@/lib/db"
import { ChecklistDetailClient } from "./checklist-detail-client"
import type { Checklist } from "@/lib/types"

export default function ChecklistDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChecklist() {
      const data = await getChecklist(id)
      setChecklist(data)
      setLoading(false)
    }
    loadChecklist()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  if (!checklist) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">Checkliste nicht gefunden</h1>
            <Link href="/admin" className="mt-4 inline-block">
              <Button>Zurück zur Übersicht</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const progress = calculateProgress(checklist)
  const publicUrl = `/c/${checklist.public_token}`
  const taskStates = (checklist.task_states || {}) as Record<string, unknown>

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </div>

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{checklist.project_name}</h1>
              <StatusBadge status={checklist.status} />
            </div>
            <p className="mt-1 text-muted-foreground">{checklist.customer_name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={publicUrl} target="_blank">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Vorschau
              </Button>
            </Link>
            <ChecklistDetailClient publicUrl={publicUrl} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium text-foreground">Fortschritt</h2>
              <div className="mb-4">
                <ProgressBar percentage={progress.percentage} />
              </div>
              <p className="text-sm text-muted-foreground">
                {progress.completed} von {progress.total} Pflichtaufgaben erledigt
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-medium text-foreground">Aufgaben</h2>
              </div>
              <div className="divide-y divide-border">
                {checklist.categories.map((category) => (
                  <div key={category.id} className="p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {category.name}
                    </h3>
                    <div className="space-y-3">
                      {category.tasks.map((task) => {
                        const value = taskStates[task.id]
                        const isCompleted = value !== null && value !== undefined && value !== "" && value !== false

                        return (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 rounded-md border border-border bg-background p-4"
                          >
                            <div
                              className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 ${
                                isCompleted ? "border-green-500 bg-green-500" : "border-muted-foreground/30"
                              }`}
                            >
                              {isCompleted && (
                                <svg
                                  className="h-full w-full text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{task.title}</p>
                                {task.required && <span className="text-xs text-primary">Pflicht</span>}
                              </div>
                              {task.description && (
                                <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                              )}
                              {isCompleted && value && task.type !== "checkbox" && (
                                <p className="mt-2 text-sm font-medium text-foreground">Antwort: {String(value)}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium text-foreground">Details</h2>
              <div className="space-y-4">
                {checklist.due_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Fälligkeitsdatum</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(checklist.due_date), "dd. MMMM yyyy", { locale: de })}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Maschinentyp</p>
                    <p className="text-sm text-muted-foreground">{checklist.machine_type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Seriennummer</p>
                    <p className="text-sm text-muted-foreground">{checklist.serial_number}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">E-Mail</p>
                    <p className="text-sm text-muted-foreground">{checklist.customer_email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-medium text-foreground">Zeitstempel</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Erstellt</span>
                  <span className="text-foreground">
                    {format(new Date(checklist.created_at), "dd.MM.yyyy", { locale: de })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aktualisiert</span>
                  <span className="text-foreground">
                    {format(new Date(checklist.updated_at), "dd.MM.yyyy", { locale: de })}
                  </span>
                </div>
                {checklist.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Abgeschlossen</span>
                    <span className="text-foreground">
                      {format(new Date(checklist.completed_at), "dd.MM.yyyy", { locale: de })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

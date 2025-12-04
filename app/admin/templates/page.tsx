"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Plus, FileText, ChevronRight, Loader2 } from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { getTemplates } from "@/lib/db"
import type { Template } from "@/lib/types"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTemplates() {
      const data = await getTemplates()
      setTemplates(data)
      setLoading(false)
    }
    loadTemplates()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Vorlagen</h1>
            <p className="mt-1 text-muted-foreground">Verwalten Sie Ihre Checklisten-Vorlagen</p>
          </div>
          <Link href="/admin/templates/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Vorlage
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.length === 0 ? (
              <div className="col-span-full rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Keine Vorlagen vorhanden</h3>
                <p className="mt-2 text-muted-foreground">
                  Erstellen Sie Ihre erste Vorlage, um Checklisten zu generieren.
                </p>
                <Link href="/admin/templates/new" className="mt-4 inline-block">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Vorlage erstellen
                  </Button>
                </Link>
              </div>
            ) : (
              templates.map((template) => {
                const totalTasks = template.categories.reduce((sum, cat) => sum + cat.tasks.length, 0)
                const requiredTasks = template.categories.reduce(
                  (sum, cat) => sum + cat.tasks.filter((t) => t.required).length,
                  0,
                )

                return (
                  <Link
                    key={template.id}
                    href={`/admin/templates/${template.id}`}
                    className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-foreground">{template.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{template.categories.length} Kategorien</span>
                      <span>•</span>
                      <span>{totalTasks} Aufgaben</span>
                      <span>•</span>
                      <span>{requiredTasks} Pflicht</span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Aktualisiert: {format(new Date(template.updated_at), "dd. MMM yyyy", { locale: de })}
                    </p>
                  </Link>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}

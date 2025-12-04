"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Loader2 } from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { ChecklistTable } from "@/components/checklist-table"
import { Button } from "@/components/ui/button"
import { getChecklists } from "@/lib/db"
import type { Checklist } from "@/lib/types"

export default function AdminDashboard() {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadChecklists() {
      const data = await getChecklists()
      setChecklists(data)
      setLoading(false)
    }
    loadChecklists()
  }, [])

  const stats = {
    total: checklists.length,
    inProgress: checklists.filter((c) => c.status === "in_progress").length,
    completed: checklists.filter((c) => c.status === "completed").length,
    overdue: checklists.filter((c) => c.status === "overdue").length,
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Checklisten</h1>
            <p className="mt-1 text-muted-foreground">Verwalten Sie Ihre Inbetriebnahme-Checklisten</p>
          </div>
          <Link href="/admin/checklists/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Checkliste
            </Button>
          </Link>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">Gesamt</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">In Bearbeitung</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.inProgress}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">Abgeschlossen</p>
            <p className="mt-2 text-3xl font-semibold text-green-600">{stats.completed}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">Überfällig</p>
            <p className="mt-2 text-3xl font-semibold text-red-600">{stats.overdue}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChecklistTable checklists={checklists} />
        )}
      </main>
    </div>
  )
}

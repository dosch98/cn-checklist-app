"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { ChevronRight, Search, Filter } from "lucide-react"
import type { Checklist } from "@/lib/types"
import { calculateProgress } from "@/lib/db"
import { StatusBadge } from "./status-badge"
import { ProgressBar } from "./progress-bar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChecklistTableProps {
  checklists: Checklist[]
}

export function ChecklistTable({ checklists }: ChecklistTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredChecklists = checklists.filter((checklist) => {
    const matchesSearch =
      checklist.project_name.toLowerCase().includes(search.toLowerCase()) ||
      checklist.customer_name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || checklist.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Suchen nach Projekt oder Kunde..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
              <SelectItem value="sent">Gesendet</SelectItem>
              <SelectItem value="in_progress">In Bearbeitung</SelectItem>
              <SelectItem value="completed">Abgeschlossen</SelectItem>
              <SelectItem value="overdue">Überfällig</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Projekt</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Kunde</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Fälligkeitsdatum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Fortschritt</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredChecklists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Keine Checklisten gefunden.
                  </td>
                </tr>
              ) : (
                filteredChecklists.map((checklist) => {
                  const progress = calculateProgress(checklist)
                  return (
                    <tr key={checklist.id} className="group transition-colors hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <span className="font-medium text-foreground">{checklist.project_name}</span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{checklist.customer_name}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {checklist.due_date
                          ? format(new Date(checklist.due_date), "dd. MMM yyyy", { locale: de })
                          : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={checklist.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <ProgressBar percentage={progress.percentage} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/checklists/${checklist.id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-accent hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

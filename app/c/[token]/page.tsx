"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getChecklistByToken, updateChecklistByToken } from "@/lib/db"
import { PublicChecklistView } from "./public-checklist-view"
import type { Checklist } from "@/lib/types"
import { Loader2 } from "lucide-react"

export default function PublicChecklistPage() {
  const params = useParams()
  const token = params.token as string
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function loadChecklist() {
      const data = await getChecklistByToken(token)
      if (data) {
        // Mark as opened / in_progress if it was just sent
        if (data.status === "sent") {
          await updateChecklistByToken(token, { status: "in_progress" })
          data.status = "in_progress"
        }
        setChecklist(data)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    loadChecklist()
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !checklist) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Checkliste nicht gefunden</h1>
          <p className="mt-2 text-muted-foreground">
            Der angeforderte Link ist ungültig oder die Checkliste existiert nicht mehr.
          </p>
        </div>
      </div>
    )
  }

  return <PublicChecklistView checklist={checklist} token={token} />
}

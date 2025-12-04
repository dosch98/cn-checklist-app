import Link from "next/link"
import { ArrowLeft, FileQuestion } from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"

export default function ChecklistNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-muted p-4">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-foreground">Checkliste nicht gefunden</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            Die angeforderte Checkliste existiert nicht oder wurde gelöscht.
          </p>
          <Link href="/admin">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

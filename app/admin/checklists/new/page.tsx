"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react"
import { format, addDays } from "date-fns"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTemplates, createChecklist } from "@/lib/db"
import type { Template } from "@/lib/types"
import { toast } from "sonner"

export default function NewChecklistPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [projectName, setProjectName] = useState("")
  const [machineType, setMachineType] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdChecklist, setCreatedChecklist] = useState<{
    id: string
    publicToken: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadTemplates() {
      const data = await getTemplates()
      setTemplates(data)
      setLoading(false)
    }
    loadTemplates()
  }, [])

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template && template.estimated_days) {
      const newDueDate = addDays(new Date(), template.estimated_days)
      setDueDate(format(newDueDate, "yyyy-MM-dd"))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTemplateId || !projectName || !customerName || !customerEmail || !dueDate) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.")
      return
    }

    const template = templates.find((t) => t.id === selectedTemplateId)
    if (!template) {
      toast.error("Vorlage nicht gefunden.")
      return
    }

    setIsSubmitting(true)

    const checklist = await createChecklist({
      template_id: selectedTemplateId,
      project_name: projectName,
      machine_type: machineType || "N/A",
      serial_number: serialNumber || "N/A",
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || undefined,
      due_date: new Date(dueDate).toISOString(),
      categories: template.categories,
    })

    setIsSubmitting(false)

    if (checklist) {
      setCreatedChecklist({
        id: checklist.id,
        publicToken: checklist.public_token,
      })
      toast.success("Checkliste erfolgreich erstellt!")
    } else {
      toast.error("Fehler beim Erstellen der Checkliste.")
    }
  }

  const handleCopyLink = () => {
    if (createdChecklist) {
      const url = `${window.location.origin}/c/${createdChecklist.publicToken}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link in die Zwischenablage kopiert!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (createdChecklist) {
    const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${createdChecklist.publicToken}`

    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-foreground">Checkliste erstellt!</h1>
            <p className="mb-6 text-muted-foreground">Teilen Sie den folgenden Link mit Ihrem Kunden:</p>
            <div className="mb-6 rounded-md border border-border bg-muted p-4">
              <code className="break-all text-sm text-foreground">{publicUrl}</code>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={handleCopyLink}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Link kopieren
                  </>
                )}
              </Button>
              <Link href={`/admin/checklists/${createdChecklist.id}`}>
                <Button variant="outline">Zur Checkliste</Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline">Zur Übersicht</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="mb-6 text-2xl font-semibold text-foreground">Neue Checkliste erstellen</h1>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="template">Vorlage *</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Vorlage auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <p className="mt-1.5 text-sm text-muted-foreground">{selectedTemplate.description}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="projectName">Projektname *</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="z.B. Warehouse Automation Phase 1"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="customerName">Kunde / Partner *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Firmenname"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="machineType">Maschinentyp</Label>
                  <Input
                    id="machineType"
                    value={machineType}
                    onChange={(e) => setMachineType(e.target.value)}
                    placeholder="z.B. E16C"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="serialNumber">Seriennummer</Label>
                  <Input
                    id="serialNumber"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="z.B. LIN-2024-001"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="customerEmail">E-Mail *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Telefon</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+49 ..."
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dueDate">Fälligkeitsdatum *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1.5"
                />
                {selectedTemplate?.estimated_days && (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Standardmäßig {selectedTemplate.estimated_days} Tage ab heute
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Link href="/admin">
                  <Button type="button" variant="outline">
                    Abbrechen
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Erstellen..." : "Checkliste erstellen"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

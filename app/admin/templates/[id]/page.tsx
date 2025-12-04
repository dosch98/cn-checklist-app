"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getTemplate, updateTemplate, deleteTemplate } from "@/lib/db"
import type { TaskType, Template } from "@/lib/types"
import { toast } from "sonner"

interface DraftTask {
  id: string
  title: string
  description: string
  type: TaskType
  required: boolean
}

interface DraftCategory {
  id: string
  name: string
  tasks: DraftTask[]
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export default function EditTemplatePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedDays, setEstimatedDays] = useState<string>("")
  const [categories, setCategories] = useState<DraftCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (id === "new") {
      router.replace("/admin/templates/new")
      return
    }

    async function loadTemplate() {
      const t = await getTemplate(id)
      if (t) {
        setTemplate(t)
        setName(t.name)
        setDescription(t.description || "")
        setEstimatedDays(t.estimated_days?.toString() || "14")
        setCategories(
          t.categories.map((c) => ({
            id: c.id,
            name: c.name,
            tasks: c.tasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description || "",
              type: task.type,
              required: task.required,
            })),
          })),
        )
      }
      setIsLoading(false)
    }
    loadTemplate()
  }, [id, router])

  const addCategory = () => {
    setCategories([
      ...categories,
      {
        id: generateId(),
        name: "",
        tasks: [],
      },
    ])
  }

  const removeCategory = (categoryId: string) => {
    setCategories(categories.filter((c) => c.id !== categoryId))
  }

  const updateCategoryName = (categoryId: string, name: string) => {
    setCategories(categories.map((c) => (c.id === categoryId ? { ...c, name } : c)))
  }

  const addTask = (categoryId: string) => {
    setCategories(
      categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              tasks: [
                ...c.tasks,
                {
                  id: generateId(),
                  title: "",
                  description: "",
                  type: "checkbox" as TaskType,
                  required: true,
                },
              ],
            }
          : c,
      ),
    )
  }

  const removeTask = (categoryId: string, taskId: string) => {
    setCategories(
      categories.map((c) => (c.id === categoryId ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) } : c)),
    )
  }

  const updateTask = (categoryId: string, taskId: string, updates: Partial<DraftTask>) => {
    setCategories(
      categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
            }
          : c,
      ),
    )
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Bitte geben Sie einen Namen für die Vorlage ein.")
      return
    }

    const validCategories = categories.filter((c) => c.name.trim() && c.tasks.some((t) => t.title.trim()))

    if (validCategories.length === 0) {
      toast.error("Bitte fügen Sie mindestens eine Kategorie mit einer Aufgabe hinzu.")
      return
    }

    setIsSaving(true)

    const templateCategories = validCategories.map((c) => ({
      id: c.id,
      name: c.name,
      tasks: c.tasks
        .filter((t) => t.title.trim())
        .map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          type: t.type,
          required: t.required,
        })),
    }))

    const result = await updateTemplate(id, {
      name,
      description: description || undefined,
      estimated_days: estimatedDays ? Number.parseInt(estimatedDays) : 14,
      categories: templateCategories,
    })

    setIsSaving(false)

    if (result) {
      toast.success("Vorlage erfolgreich gespeichert!")
    } else {
      toast.error("Fehler beim Speichern der Vorlage.")
    }
  }

  const handleDelete = async () => {
    const success = await deleteTemplate(id)
    if (success) {
      toast.success("Vorlage wurde gelöscht.")
      router.push("/admin/templates")
    } else {
      toast.error("Fehler beim Löschen der Vorlage.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-background">
        <AdminHeader />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">Vorlage nicht gefunden</h1>
            <Link href="/admin/templates" className="mt-4 inline-block">
              <Button>Zurück zu Vorlagen</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/admin/templates"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Vorlagen
          </Link>
          <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Vorlage löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Die Vorlage wird dauerhaft gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h1 className="mb-6 text-2xl font-semibold text-foreground">Vorlage bearbeiten</h1>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Vorlagenname</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Standard-Inbetriebnahme"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="estimatedDays">Geschätzte Tage bis Fälligkeit</Label>
                <Input
                  id="estimatedDays"
                  type="number"
                  min="1"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  placeholder="z.B. 14"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung der Vorlage..."
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">Kategorien & Aufgaben</h2>
            <Button type="button" variant="outline" onClick={addCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Kategorie hinzufügen
            </Button>
          </div>

          {categories.map((category) => (
            <div key={category.id} className="rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                <Input
                  value={category.name}
                  onChange={(e) => updateCategoryName(category.id, e.target.value)}
                  placeholder="Kategoriename (z.B. Elektrik)"
                  className="flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
                {categories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(category.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="p-4 space-y-3">
                {category.tasks.map((task) => (
                  <div key={task.id} className="rounded-md border border-border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="mt-2 h-5 w-5 text-muted-foreground/50" />
                      <div className="flex-1 space-y-3">
                        <Input
                          value={task.title}
                          onChange={(e) =>
                            updateTask(category.id, task.id, {
                              title: e.target.value,
                            })
                          }
                          placeholder="Aufgabentitel"
                        />
                        <Textarea
                          value={task.description}
                          onChange={(e) =>
                            updateTask(category.id, task.id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Beschreibung / Anweisungen..."
                          rows={2}
                        />
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Typ:</Label>
                            <Select
                              value={task.type}
                              onValueChange={(value: TaskType) => updateTask(category.id, task.id, { type: value })}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                <SelectItem value="text">Textfeld</SelectItem>
                                <SelectItem value="number">Zahl</SelectItem>
                                <SelectItem value="file">Datei-Upload</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`required-${task.id}`}
                              checked={task.required}
                              onCheckedChange={(checked) =>
                                updateTask(category.id, task.id, {
                                  required: checked as boolean,
                                })
                              }
                            />
                            <Label htmlFor={`required-${task.id}`} className="text-sm text-muted-foreground">
                              Pflichtfeld
                            </Label>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(category.id, task.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTask(category.id)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Aufgabe hinzufügen
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createTemplate } from "@/lib/db"
import type { TaskType } from "@/lib/types"
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

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [estimatedDays, setEstimatedDays] = useState("14")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<DraftCategory[]>([
    {
      id: generateId(),
      name: "",
      tasks: [],
    },
  ])

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

  const updateCategory = (categoryId: string, name: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Bitte geben Sie einen Namen für die Vorlage ein.")
      return
    }

    const validCategories = categories.filter((c) => c.name.trim() && c.tasks.some((t) => t.title.trim()))

    if (validCategories.length === 0) {
      toast.error("Bitte fügen Sie mindestens eine Kategorie mit einer Aufgabe hinzu.")
      return
    }

    setIsSubmitting(true)

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

    const result = await createTemplate({
      name,
      description: description || undefined,
      estimated_days: estimatedDays ? Number.parseInt(estimatedDays) : 14,
      categories: templateCategories,
    })

    setIsSubmitting(false)

    if (result) {
      toast.success("Vorlage erfolgreich erstellt!")
      router.push("/admin/templates")
    } else {
      toast.error("Fehler beim Erstellen der Vorlage.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/admin/templates"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Vorlagen
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-lg border border-border bg-card p-6">
            <h1 className="mb-6 text-2xl font-semibold text-foreground">Neue Vorlage erstellen</h1>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Vorlagenname *</Label>
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
                    onChange={(e) => updateCategory(category.id, e.target.value)}
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

          <div className="mt-6 flex justify-end gap-3">
            <Link href="/admin/templates">
              <Button type="button" variant="outline">
                Abbrechen
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Erstellen..." : "Vorlage erstellen"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

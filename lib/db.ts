import { createClient } from "@/lib/supabase/client"
import type { Template, Checklist, Category } from "./types"

// Generate a random token for public checklist links
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Templates

export async function getTemplates(): Promise<Template[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("templates").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching templates:", error)
    return []
  }

  return data || []
}

export async function getTemplate(id: string): Promise<Template | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("templates").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching template:", error)
    return null
  }

  return data
}

export async function createTemplate(template: {
  name: string
  description?: string
  estimated_days?: number
  categories: Category[]
}): Promise<Template | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("templates")
    .insert({
      name: template.name,
      description: template.description || null,
      estimated_days: template.estimated_days || 14,
      categories: template.categories,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating template:", error)
    return null
  }

  return data
}

export async function updateTemplate(
  id: string,
  updates: {
    name?: string
    description?: string
    estimated_days?: number
    categories?: Category[]
  },
): Promise<Template | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("templates")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating template:", error)
    return null
  }

  return data
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("templates").delete().eq("id", id)

  if (error) {
    console.error("Error deleting template:", error)
    return false
  }

  return true
}

// Checklists

export async function getChecklists(): Promise<Checklist[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from("checklists").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching checklists:", error)
    return []
  }

  return data || []
}

export async function getChecklist(id: string): Promise<Checklist | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("checklists").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching checklist:", error)
    return null
  }

  return data
}

export async function getChecklistByToken(token: string): Promise<Checklist | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("checklists").select("*").eq("public_token", token).single()

  if (error) {
    console.error("Error fetching checklist by token:", error)
    return null
  }

  return data
}

export async function createChecklist(checklist: {
  template_id: string
  project_name: string
  machine_type: string
  serial_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  due_date: string
  categories: Category[]
}): Promise<Checklist | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("checklists")
    .insert({
      template_id: checklist.template_id,
      project_name: checklist.project_name,
      machine_type: checklist.machine_type,
      serial_number: checklist.serial_number,
      customer_name: checklist.customer_name,
      customer_email: checklist.customer_email,
      customer_phone: checklist.customer_phone || null,
      public_token: generateToken(),
      status: "sent",
      due_date: checklist.due_date,
      categories: checklist.categories,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating checklist:", error)
    return null
  }

  return data
}

export async function updateChecklist(id: string, updates: Partial<Checklist>): Promise<Checklist | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("checklists")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating checklist:", error)
    return null
  }

  return data
}

export async function updateChecklistByToken(token: string, updates: Partial<Checklist>): Promise<Checklist | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("checklists")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("public_token", token)
    .select()
    .single()

  if (error) {
    console.error("Error updating checklist:", error)
    return null
  }

  return data
}

export async function deleteChecklist(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from("checklists").delete().eq("id", id)

  if (error) {
    console.error("Error deleting checklist:", error)
    return false
  }

  return true
}

// Calculate progress from categories with task_states
export function calculateProgress(checklist: Checklist): { completed: number; total: number; percentage: number } {
  let completed = 0
  let total = 0
  const taskStates = (checklist.task_states || {}) as Record<string, unknown>

  for (const category of checklist.categories) {
    for (const task of category.tasks) {
      if (task.required) {
        total++
        const value = taskStates[task.id]
        if (task.type === "checkbox") {
          if (value === true) completed++
        } else {
          if (value !== null && value !== undefined && value !== "") completed++
        }
      }
    }
  }

  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

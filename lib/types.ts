export type TaskType = "checkbox" | "text" | "number" | "file"

export type ChecklistStatus = "draft" | "sent" | "in_progress" | "completed" | "overdue"

export interface Task {
  id: string
  title: string
  description?: string
  type: TaskType
  required: boolean
}

export interface Category {
  id: string
  name: string
  tasks: Task[]
}

export interface Template {
  id: string
  name: string
  description: string | null
  estimated_days: number
  categories: Category[]
  created_at: string
  updated_at: string
}

export interface Checklist {
  id: string
  template_id: string | null
  project_name: string
  machine_type: string
  serial_number: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  public_token: string
  status: ChecklistStatus
  due_date: string | null
  categories: Category[]
  created_at: string
  updated_at: string
  completed_at: string | null
  task_states?: Record<string, unknown>
}

export interface AdminUser {
  id: string
  username: string
  display_name: string
  created_at: string
}

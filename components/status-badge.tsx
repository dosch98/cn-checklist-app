import { cn } from "@/lib/utils"
import type { ChecklistStatus } from "@/lib/types"

const statusConfig: Record<ChecklistStatus, { label: string; className: string }> = {
  not_sent: {
    label: "Nicht gesendet",
    className: "bg-muted text-muted-foreground",
  },
  sent: {
    label: "Gesendet",
    className: "bg-blue-100 text-blue-700",
  },
  in_progress: {
    label: "In Bearbeitung",
    className: "bg-amber-100 text-amber-700",
  },
  completed: {
    label: "Abgeschlossen",
    className: "bg-green-100 text-green-700",
  },
  overdue: {
    label: "Überfällig",
    className: "bg-red-100 text-red-700",
  },
}

interface StatusBadgeProps {
  status: ChecklistStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}

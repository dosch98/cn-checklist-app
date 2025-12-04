import { cn } from "@/lib/utils"

interface ProgressBarProps {
  percentage: number
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ percentage, className, showLabel = true }: ProgressBarProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            percentage === 100 ? "bg-green-500" : "bg-primary",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <span className="text-sm font-medium text-muted-foreground">{percentage}%</span>}
    </div>
  )
}

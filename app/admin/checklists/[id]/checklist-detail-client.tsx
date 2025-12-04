"use client"

import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ChecklistDetailClientProps {
  publicUrl: string
}

export function ChecklistDetailClient({ publicUrl }: ChecklistDetailClientProps) {
  const handleCopyLink = () => {
    const fullUrl = window.location.origin + publicUrl
    navigator.clipboard.writeText(fullUrl)
    toast.success("Link kopiert!")
  }

  return (
    <Button onClick={handleCopyLink}>
      <Copy className="mr-2 h-4 w-4" />
      Link kopieren
    </Button>
  )
}

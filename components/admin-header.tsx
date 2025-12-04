"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, FileText, LogOut, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ComnovoLogo } from "@/components/comnovo-logo"
import { cn } from "@/lib/utils"

export function AdminHeader() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin"
    return pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-10">
          <Link href="/admin" className="flex items-center">
            <ComnovoLogo className="h-7" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive("/admin") && !isActive("/admin/templates")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Checklisten
            </Link>
            <Link
              href="/admin/templates"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive("/admin/templates")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FileText className="h-4 w-4" />
              Vorlagen
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="hidden sm:flex">
            <Link href="/admin/checklists/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Neue Checkliste
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Abmelden</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

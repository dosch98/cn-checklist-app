"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ComnovoLogo } from "@/components/comnovo-logo"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: user, error: dbError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("username", username.toLowerCase())
        .eq("password_hash", password)
        .single()

      if (dbError || !user) {
        throw new Error("Ungültige Anmeldedaten")
      }

      document.cookie = `admin_session=${user.id}; path=/; max-age=${60 * 60 * 24 * 7}`
      document.cookie = `admin_name=${user.display_name}; path=/; max-age=${60 * 60 * 24 * 7}`

      router.push("/admin")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <ComnovoLogo className="h-12" />
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-foreground">Anmelden</h1>
            <p className="mt-1 text-sm text-muted-foreground">Checklist-System für Inbetriebnahme</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Benutzername
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Benutzername"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Passwort
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Passwort"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-10"
              />
            </div>

            {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

            <Button type="submit" className="h-10 w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmeldung...
                </>
              ) : (
                "Anmelden"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Comnovo GmbH</p>
      </div>
    </div>
  )
}

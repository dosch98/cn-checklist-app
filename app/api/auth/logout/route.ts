import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear admin session cookies
  response.cookies.set("admin_session", "", { maxAge: 0, path: "/" })
  response.cookies.set("admin_name", "", { maxAge: 0, path: "/" })

  return response
}

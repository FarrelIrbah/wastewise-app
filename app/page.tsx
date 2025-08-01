import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/login")
    }

    redirect("/dashboard")
  } catch (error) {
    // If there's an error (like missing env vars), redirect to login
    redirect("/login")
  }
}

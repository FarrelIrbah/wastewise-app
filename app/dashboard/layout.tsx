import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Force dynamic rendering untuk memastikan data user selalu fresh
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Refresh session untuk memastikan data ter-update
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Ambil nama dari metadata jika ada, fallback ke email
  const displayName = user.user_metadata?.name || user.user_metadata?.full_name || user.email || "Pengguna WasteWise"
  const avatar = user.user_metadata?.avatar_url || "/placeholder.svg?height=32&width=32"

  // Debug: Log data user untuk memastikan ter-update
  console.log('Current user data:', {
    email: user.email,
    displayName,
    metadata: user.user_metadata
  })

  return (
    <SidebarProvider>
      <AppSidebar 
        key={user.email} // Force re-render ketika email berubah
        user={{
          name: displayName,
          email: user.email ?? "-",
          avatar,
        }} 
      />
      {/* FIXED: Added classes here to constrain the width and handle overflow */}
      <SidebarInset className="flex flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="/dashboard">WasteWise</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm sm:text-base">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {/* This main area will now scroll vertically if content is long */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

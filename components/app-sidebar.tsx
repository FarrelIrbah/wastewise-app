"use client"

import type * as React from "react"
import { BarChart3, Home, Leaf, Recycle, ShoppingCart, Trash2 } from "lucide-react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Sampah Organik",
    url: "/dashboard/waste-organic",
    icon: Leaf,
  },
  {
    title: "Sampah Anorganik",
    url: "/dashboard/waste-inorganic",
    icon: Recycle,
  },
  {
    title: "Rekap Penjualan",
    url: "/dashboard/sales",
    icon: ShoppingCart,
  },
  {
    title: "Analitik",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
]

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: { name: string; email: string; avatar: string } }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* ✨ PERUBAHAN: Padding diatur pada tombol, bukan pada div custom ✨ */}
            <SidebarMenuButton asChild className="h-auto justify-start px-3">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-green-600 text-white">
                  <Trash2 className="size-4" />
                </div>
                {!isCollapsed && (
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                    <span className="truncate font-semibold text-sm sm:text-base">WasteWise</span>
                    <span className="truncate text-xs">Manajemen Sampah</span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser key={user.email} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

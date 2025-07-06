"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function FooterNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 flex items-center justify-around px-4 z-10">
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center justify-center text-xs gap-1 w-1/3",
          isActive("/") ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Home className="h-5 w-5" />
        <span>お客様画面</span>
      </Link>

      <Link
        href="/admin/dashboard"
        className={cn(
          "flex flex-col items-center justify-center text-xs gap-1 w-1/3",
          isActive("/admin/dashboard") ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Calendar className="h-5 w-5" />
        <span>管理</span>
      </Link>

      <Link
        href="/admin/stats"
        className={cn(
          "flex flex-col items-center justify-center text-xs gap-1 w-1/3",
          isActive("/admin/stats") ? "text-primary" : "text-muted-foreground",
        )}
      >
        <BarChart2 className="h-5 w-5" />
        <span>集計</span>
      </Link>
    </div>
  )
}

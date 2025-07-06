"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/dashboard")
  }, [router])
  return (
    <div className="flex items-center justify-center h-screen">
      <p>リダイレクト中...</p>
    </div>
  )
}

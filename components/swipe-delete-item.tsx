"use client"

import { ReactNode } from "react"
import { Trash2 } from "lucide-react"
import { useSwipeDelete } from "@/hooks/use-swipe-delete"

interface SwipeDeleteItemProps {
  children: ReactNode
  onDelete: () => void
  enabled?: boolean
}

export function SwipeDeleteItem({ children, onDelete, enabled = true }: SwipeDeleteItemProps) {
  const { elementRef, isSwiping, swipeProgress } = useSwipeDelete({
    onDelete,
    enabled,
  })

  return (
    <div
      ref={elementRef}
      className={`relative overflow-hidden rounded-lg border transition-all duration-200 ${
        isSwiping ? "bg-red-50" : "bg-card"
      }`}
      style={{
        transform: `translateX(-${swipeProgress * 80}px)`,
      }}
    >
      {/* 削除背景 */}
      <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center">
        <Trash2 className="h-6 w-6 text-white" />
      </div>

      {/* メインコンテンツ */}
      <div className="relative bg-card p-4">
        {children}
      </div>
    </div>
  )
} 
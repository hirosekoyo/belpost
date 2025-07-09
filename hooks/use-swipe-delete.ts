"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface SwipeDeleteOptions {
  onDelete: () => void
  threshold?: number
  enabled?: boolean
}

export function useSwipeDelete(options: SwipeDeleteOptions) {
  const { onDelete, threshold = 100, enabled = true } = options
  const [isSwiping, setIsSwiping] = useState(false)
  const [swipeDistance, setSwipeDistance] = useState(0)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  const handleDelete = useCallback(() => {
    if (enabled) {
      onDelete()
    }
  }, [enabled, onDelete])

  useEffect(() => {
    if (!enabled) return

    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      })
      setIsSwiping(false)
      setSwipeDistance(0)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return

      const touchEnd = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }

      const deltaX = touchStart.x - touchEnd.x
      const deltaY = touchStart.y - touchEnd.y

      // 水平スワイプのみを検出
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
        setIsSwiping(true)
        setSwipeDistance(Math.min(deltaX, threshold))
        e.preventDefault()
      }
    }

    const handleTouchEnd = () => {
      if (isSwiping && swipeDistance >= threshold * 0.8) {
        handleDelete()
      }
      setIsSwiping(false)
      setSwipeDistance(0)
      setTouchStart(null)
    }

    element.addEventListener("touchstart", handleTouchStart)
    element.addEventListener("touchmove", handleTouchMove, { passive: false })
    element.addEventListener("touchend", handleTouchEnd)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [touchStart, isSwiping, swipeDistance, threshold, handleDelete, enabled])

  return {
    elementRef,
    isSwiping: enabled ? isSwiping : false,
    swipeDistance: enabled ? swipeDistance : 0,
    swipeProgress: enabled ? swipeDistance / threshold : 0,
  }
} 
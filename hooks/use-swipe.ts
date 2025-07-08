"use client"

import type React from "react"

import { useState, useEffect, type TouchEvent } from "react"

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface SwipeOptions {
  threshold?: number
  preventDefault?: boolean
}

export function useSwipe(ref: React.RefObject<HTMLElement | null>, handlers: SwipeHandlers, options: SwipeOptions = {}) {
  const { threshold = 50, preventDefault = true } = options
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return

      const touchEnd = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }

      const deltaX = touchStart.x - touchEnd.x
      const deltaY = touchStart.y - touchEnd.y

      // Determine if the user is swiping horizontally or vertically
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY)

      if (isHorizontalSwipe) {
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0 && handlers.onSwipeLeft) {
            handlers.onSwipeLeft()
            if (preventDefault) e.preventDefault()
          } else if (deltaX < 0 && handlers.onSwipeRight) {
            handlers.onSwipeRight()
            if (preventDefault) e.preventDefault()
          }
          setTouchStart(null)
        }
      } else {
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0 && handlers.onSwipeUp) {
            handlers.onSwipeUp()
            if (preventDefault) e.preventDefault()
          } else if (deltaY < 0 && handlers.onSwipeDown) {
            handlers.onSwipeDown()
            if (preventDefault) e.preventDefault()
          }
          setTouchStart(null)
        }
      }
    }

    const handleTouchEnd = () => {
      setTouchStart(null)
    }

    element.addEventListener("touchstart", handleTouchStart as any)
    element.addEventListener("touchmove", handleTouchMove as any)
    element.addEventListener("touchend", handleTouchEnd as any)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart as any)
      element.removeEventListener("touchmove", handleTouchMove as any)
      element.removeEventListener("touchend", handleTouchEnd as any)
    }
  }, [ref, handlers, touchStart, threshold, preventDefault])
}

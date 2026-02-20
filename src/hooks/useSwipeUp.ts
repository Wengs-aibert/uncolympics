import { useRef, useEffect, useCallback } from 'react'

interface UseSwipeUpOptions {
  onSwipe: () => void
  threshold?: number // default 80px
  enabled?: boolean // default true
}

interface SwipeUpReturn {
  swipeHintRef: React.RefObject<HTMLDivElement>
}

export const useSwipeUp = ({
  onSwipe,
  threshold = 80,
  enabled = true
}: UseSwipeUpOptions): SwipeUpReturn => {
  const swipeHintRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number>(0)
  const isDraggingRef = useRef<boolean>(false)

  const handleStart = useCallback((clientY: number) => {
    if (!enabled) return
    startYRef.current = clientY
    isDraggingRef.current = true
  }, [enabled])

  const handleEnd = useCallback((clientY: number) => {
    if (!enabled || !isDraggingRef.current) return
    
    const deltaY = startYRef.current - clientY // positive = upward swipe
    isDraggingRef.current = false
    
    if (deltaY > threshold) {
      onSwipe()
    }
  }, [enabled, threshold, onSwipe])

  // Touch events
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientY)
    }
  }, [handleStart])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.changedTouches.length === 1) {
      handleEnd(e.changedTouches[0].clientY)
    }
  }, [handleEnd])

  // Mouse events (for desktop testing)
  const handleMouseDown = useCallback((e: MouseEvent) => {
    handleStart(e.clientY)
  }, [handleStart])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    handleEnd(e.clientY)
  }, [handleEnd])

  useEffect(() => {
    const element = swipeHintRef.current
    if (!element) return

    // Touch events
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    // Mouse events
    element.addEventListener('mousedown', handleMouseDown)
    element.addEventListener('mouseup', handleMouseUp)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('mousedown', handleMouseDown)
      element.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleTouchStart, handleTouchEnd, handleMouseDown, handleMouseUp])

  return { swipeHintRef }
}
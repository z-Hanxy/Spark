import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Mobile-only: Capacitor native back button + left-edge swipe gesture.
 *
 * @param {{ isRoot?: boolean }} opts
 *   isRoot: if true, show "press again to exit" instead of navigating back
 */
export default function useMobileBack({ isRoot = false } = {}) {
  const navigate = useNavigate()
  const exitTimer = useRef(null)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const swiping = useRef(false)

  // ── Capacitor Android back button ──
  const handleBack = useCallback(() => {
    if (isRoot) {
      if (exitTimer.current) {
        // Second press within 2s → exit
        clearTimeout(exitTimer.current)
        const { App } = window.Capacitor?.Plugins || {}
        if (App?.exitApp) {
          App.exitApp()
        } else {
          window.close()
        }
      } else {
        // First press → show hint, wait 2s
        if ('ontouchstart' in window) {
          exitTimer.current = setTimeout(() => {
            exitTimer.current = null
          }, 2000)
        } else {
          navigate(-1)
        }
      }
    } else {
      navigate(-1)
    }
  }, [isRoot, navigate])

  useEffect(() => {
    const isTouch = 'ontouchstart' in window
    if (!isTouch) return

    let cleanup = null

    // Capacitor back button listener
    const App = window.Capacitor?.Plugins?.App
    if (App?.addListener) {
      cleanup = App.addListener('backButton', handleBack)
    }

    // ── left-edge swipe gesture ──
    let edgeThreshold = 28 // px from left edge
    let swipeDistance = 80 // px required to trigger back

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return
      const x = e.touches[0].clientX
      const y = e.touches[0].clientY
      if (x <= edgeThreshold) {
        touchStartX.current = x
        touchStartY.current = y
        swiping.current = true
      }
    }

    const onTouchMove = (e) => {
      if (!swiping.current) return
      if (e.touches.length !== 1) {
        swiping.current = false
        touchStartX.current = null
        return
      }

      // Cancel if mostly vertical scroll
      const dx = e.touches[0].clientX - (touchStartX.current || 0)
      const dy = Math.abs(e.touches[0].clientY - (touchStartY.current || 0))
      if (dy > dx * 1.2) {
        swiping.current = false
        touchStartX.current = null
        return
      }
    }

    const onTouchEnd = (e) => {
      if (!swiping.current) return
      swiping.current = false

      const endX = e.changedTouches[0]?.clientX || 0
      const dx = endX - (touchStartX.current || 0)
      touchStartX.current = null

      if (dx >= swipeDistance && !isRoot) {
        navigate(-1)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      if (typeof cleanup === 'function') cleanup()
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      if (exitTimer.current) clearTimeout(exitTimer.current)
    }
  }, [handleBack, isRoot, navigate])

  // Return nothing to consumer — hook is fully self-contained
  return null
}

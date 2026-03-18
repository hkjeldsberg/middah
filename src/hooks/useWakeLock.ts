'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseWakeLockReturn {
  isActive: boolean
  isSupported: boolean
  toggle: () => void
}

export function useWakeLock(): UseWakeLockReturn {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const [isActive, setIsActive] = useState(false)
  const enabledRef = useRef(false)

  const isSupported =
    typeof navigator !== 'undefined' && 'wakeLock' in navigator

  const requestLock = useCallback(async () => {
    if (!isSupported || !enabledRef.current) return
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      setIsActive(true)
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null
        setIsActive(false)
      })
    } catch {
      setIsActive(false)
    }
  }, [isSupported])

  const releaseLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release()
      wakeLockRef.current = null
    }
    setIsActive(false)
  }, [])

  const toggle = useCallback(() => {
    if (enabledRef.current) {
      enabledRef.current = false
      releaseLock()
    } else {
      enabledRef.current = true
      requestLock()
    }
  }, [requestLock, releaseLock])

  // Re-request lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enabledRef.current) {
        requestLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseLock()
    }
  }, [requestLock, releaseLock])

  return { isActive, isSupported, toggle }
}

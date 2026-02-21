import { useEffect, useRef, useState } from 'react'

const TONE_STYLES = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const ANIMATION_MS = 220

const StatusMessage = ({
  tone = 'error',
  message = '',
  children = null,
  className = '',
  autoDismiss = true,
  autoDismissMs = 5000,
}) => {
  const hasContent = Boolean(message || children)
  const [isMounted, setIsMounted] = useState(hasContent)
  const [isClosing, setIsClosing] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const containerRef = useRef(null)
  const mountTimerRef = useRef(null)
  const dismissTimerRef = useRef(null)

  useEffect(() => {
    if (mountTimerRef.current) clearTimeout(mountTimerRef.current)
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)

    if (!hasContent) {
      mountTimerRef.current = setTimeout(() => {
        setIsClosing(false)
        setIsMounted(false)
      }, 0)
      return () => {
        if (mountTimerRef.current) clearTimeout(mountTimerRef.current)
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
      }
    }

    mountTimerRef.current = setTimeout(() => {
      setIsMounted(true)
      setIsClosing(false)
    }, 0)

    if (autoDismiss && autoDismissMs > 0) {
      dismissTimerRef.current = setTimeout(() => {
        setIsClosing(true)
      }, autoDismissMs)
    }

    return () => {
      if (mountTimerRef.current) clearTimeout(mountTimerRef.current)
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [hasContent, message, tone, autoDismiss, autoDismissMs])

  useEffect(() => {
    if (!isMounted) return undefined
    const frameId = window.requestAnimationFrame(() => {
      setContentHeight(containerRef.current?.scrollHeight ?? 0)
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [isMounted, message, children, isClosing])

  if (!isMounted || !hasContent) return null

  const toneClass = TONE_STYLES[tone] ?? TONE_STYLES.error
  const animationClass = isClosing ? 'fade-down-out' : 'fade-down-in'
  const mergedClassName = [
    'rounded-md border px-3 py-2 text-sm',
    toneClass,
    animationClass,
    className,
  ].filter(Boolean).join(' ')
  const animationStyle = { '--anim-distance': '8px', '--anim-duration': `${ANIMATION_MS}ms` }

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-220 ease-out"
      style={{
        maxHeight: isClosing ? '0px' : `${Math.max(contentHeight, 1)}px`,
        opacity: isClosing ? 0 : 1,
      }}
      onTransitionEnd={(event) => {
        if (!isClosing) return
        if (event.propertyName !== 'max-height') return
        setIsMounted(false)
        setIsClosing(false)
      }}
    >
      <div ref={containerRef} className={mergedClassName} style={animationStyle}>
        {message ? <p>{message}</p> : null}
        {children}
      </div>
    </div>
  )
}

export default StatusMessage

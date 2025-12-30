'use client'

import React, { useRef, useEffect, useState } from 'react'
import { theme } from '@/styles/theme'
import type { SyllabusSlot } from '@/types/database'

interface SyllabusSlotSelectorProps {
  slots: SyllabusSlot[]
  selectedSlot: SyllabusSlot | null
  onSelectSlot: (slot: SyllabusSlot) => void
  defaultSlotIndex?: number
}

const SLOT_WIDTH = 120
const SLOT_GAP = 12

export function SyllabusSlotSelector({
  slots,
  selectedSlot,
  onSelectSlot,
  defaultSlotIndex = 0,
}: SyllabusSlotSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure container width for centering calculations
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Calculate padding needed to center first/last items
  const sidePadding = Math.max(0, (containerWidth - SLOT_WIDTH) / 2)

  // Prevent manual scrolling (wheel/trackpad) - must use non-passive listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const preventScroll = (e: WheelEvent) => {
      e.preventDefault()
    }

    container.addEventListener('wheel', preventScroll, { passive: false })
    return () => container.removeEventListener('wheel', preventScroll)
  }, [])

  // Scroll to selected slot when selection changes or container becomes visible
  useEffect(() => {
    if (!containerRef.current || !selectedSlot || containerWidth === 0) return

    const selectedIndex = slots.findIndex(
      (s) => s.weekIndex === selectedSlot.weekIndex && s.dayOfWeek === selectedSlot.dayOfWeek
    )
    if (selectedIndex === -1) return

    // Calculate the scroll position to center this item
    const scrollTo = selectedIndex * (SLOT_WIDTH + SLOT_GAP)

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({
        left: scrollTo,
        behavior: 'smooth',
      })
    })
  }, [selectedSlot, slots, containerWidth])

  // Auto-select default slot on mount if no selection
  useEffect(() => {
    if (!selectedSlot && slots.length > 0 && defaultSlotIndex < slots.length) {
      onSelectSlot(slots[defaultSlotIndex])
    }
  }, []) // Only run on mount

  if (slots.length === 0) {
    return (
      <div
        style={{
          padding: theme.spacing.xl,
          textAlign: 'center',
          color: theme.colors.text.muted,
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.md,
          border: `1px dashed ${theme.colors.border.primary}`,
        }}
      >
        No training themes configured in your syllabus.
        <br />
        <span style={{ fontSize: theme.typography.fontSize.sm }}>
          Set up your training syllabus first.
        </span>
      </div>
    )
  }

  const isSlotSelected = (slot: SyllabusSlot) =>
    selectedSlot?.weekIndex === slot.weekIndex && selectedSlot?.dayOfWeek === slot.dayOfWeek

  return (
    <div style={{ position: 'relative' }}>
      {/* Fade edges for rolodex effect */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '60px',
          background: `linear-gradient(to right, ${theme.colors.background.primary}, transparent)`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '60px',
          background: `linear-gradient(to left, ${theme.colors.background.primary}, transparent)`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Scrollable container - no manual scrolling, only click to select */}
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          gap: `${SLOT_GAP}px`,
          overflowX: 'auto',
          padding: `${theme.spacing.md} 0`,
          scrollbarWidth: 'none',
          scrollSnapType: 'x mandatory',
          msOverflowStyle: 'none',
          touchAction: 'none',
        }}
      >
        {/* Left spacer for centering first item */}
        <div style={{ flexShrink: 0, width: `${sidePadding}px` }} />

        {slots.map((slot) => {
          const isSelected = isSlotSelected(slot)

          return (
            <button
              type="button"
              key={`${slot.weekIndex}-${slot.dayOfWeek}`}
              onClick={() => onSelectSlot(slot)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.xs,
                padding: theme.spacing.md,
                width: `${SLOT_WIDTH}px`,
                minHeight: '100px',
                backgroundColor: isSelected
                  ? 'rgba(239, 191, 4, 0.15)'
                  : theme.colors.background.secondary,
                border: isSelected
                  ? `2px solid ${theme.colors.gold.main}`
                  : `1px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: isSelected ? 'scale(1.05)' : 'scale(0.95)',
                opacity: isSelected ? 1 : 0.7,
                scrollSnapAlign: 'center',
              }}
            >
              {/* Day of Week */}
              <div
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.muted,
                  opacity: 0.7,
                }}
              >
                {slot.dayName}
              </div>

              {/* Week Number */}
              <div
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                }}
              >
                Week {slot.weekOrder}
              </div>

              {/* Theme Name */}
              <div
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: isSelected ? theme.colors.gold.main : theme.colors.text.primary,
                  textAlign: 'center',
                  lineHeight: 1.3,
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  marginTop: theme.spacing.xs,
                }}
              >
                {slot.theme.blockName}
              </div>
            </button>
          )
        })}

        {/* Right spacer for centering last item */}
        <div style={{ flexShrink: 0, width: `${sidePadding}px` }} />
      </div>
    </div>
  )
}

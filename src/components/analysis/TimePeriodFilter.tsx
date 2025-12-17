'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FaCalendarAlt, FaChevronDown } from 'react-icons/fa'
import { theme } from '@/styles/theme'
import type { TimePeriodPreset } from '@/types/database'
import { getDateRangeFromPreset } from '@/types/database'

interface TimePeriodFilterProps {
  preset: TimePeriodPreset
  startDate: Date | null
  endDate: Date | null
  onChange: (preset: TimePeriodPreset, start: Date | null, end: Date | null) => void
}

const PRESETS: { value: TimePeriodPreset; label: string }[] = [
  { value: '1w', label: '1 Week' },
  { value: '1m', label: '1 Month' },
  { value: '6w', label: '6 Weeks' },
  { value: '12w', label: '12 Weeks' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
]

export function TimePeriodFilter({
  preset,
  startDate,
  endDate,
  onChange,
}: TimePeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCustomPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initialize custom dates when switching to custom
  useEffect(() => {
    if (preset === 'custom' && startDate && endDate) {
      setCustomStart(formatDateForInput(startDate))
      setCustomEnd(formatDateForInput(endDate))
    }
  }, [preset, startDate, endDate])

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const getDisplayLabel = (): string => {
    if (preset === 'custom' && startDate && endDate) {
      return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
    }
    return PRESETS.find((p) => p.value === preset)?.label || 'Select Period'
  }

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  }

  const handlePresetSelect = (selectedPreset: TimePeriodPreset) => {
    if (selectedPreset === 'custom') {
      setShowCustomPicker(true)
      // Initialize with last 30 days if no custom dates set
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      setCustomStart(formatDateForInput(thirtyDaysAgo))
      setCustomEnd(formatDateForInput(now))
    } else {
      const { start, end } = getDateRangeFromPreset(selectedPreset)
      onChange(selectedPreset, start, end)
      setIsOpen(false)
      setShowCustomPicker(false)
    }
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart)
      const end = new Date(customEnd)
      // Set end date to end of day
      end.setHours(23, 59, 59, 999)
      onChange('custom', start, end)
      setIsOpen(false)
      setShowCustomPicker(false)
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          backgroundColor: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.primary}`,
          borderRadius: theme.borderRadius.md,
          color: theme.colors.text.primary,
          fontSize: theme.typography.fontSize.sm,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <FaCalendarAlt size={14} style={{ color: theme.colors.text.primary }} />
        <span>{getDisplayLabel()}</span>
        <FaChevronDown
          size={10}
          style={{
            color: theme.colors.text.secondary,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: theme.spacing.xs,
            backgroundColor: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            minWidth: '200px',
            overflow: 'hidden',
          }}
        >
          {/* Preset Options */}
          {!showCustomPicker && (
            <div style={{ padding: theme.spacing.xs }}>
              {PRESETS.map((presetOption) => (
                <button
                  key={presetOption.value}
                  onClick={() => handlePresetSelect(presetOption.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    backgroundColor:
                      preset === presetOption.value
                        ? theme.colors.background.tertiary
                        : 'transparent',
                    border: 'none',
                    borderRadius: theme.borderRadius.sm,
                    color:
                      preset === presetOption.value
                        ? theme.colors.gold.main
                        : theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.sm,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (preset !== presetOption.value) {
                      e.currentTarget.style.backgroundColor = theme.colors.background.tertiary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (preset !== presetOption.value) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {presetOption.label}
                </button>
              ))}
            </div>
          )}

          {/* Custom Date Picker */}
          {showCustomPicker && (
            <div style={{ padding: theme.spacing.md }}>
              <div style={{ marginBottom: theme.spacing.md }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.background.primary,
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.sm,
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div style={{ marginBottom: theme.spacing.md }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.text.secondary,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.background.primary,
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.text.primary,
                    fontSize: theme.typography.fontSize.sm,
                    colorScheme: 'dark',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                <button
                  onClick={() => setShowCustomPicker(false)}
                  style={{
                    flex: 1,
                    padding: theme.spacing.sm,
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.colors.border.primary}`,
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.text.secondary,
                    fontSize: theme.typography.fontSize.sm,
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  style={{
                    flex: 1,
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.gold.main,
                    border: 'none',
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.background.primary,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: customStart && customEnd ? 'pointer' : 'not-allowed',
                    opacity: customStart && customEnd ? 1 : 0.5,
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

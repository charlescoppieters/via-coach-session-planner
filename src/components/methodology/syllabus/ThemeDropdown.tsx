'use client'

import React from 'react'
import { theme } from '@/styles/theme'
import type { GameZone, ThemeSelection } from '@/types/database'

interface ThemeDropdownProps {
  zones: GameZone[]
  selectedTheme: ThemeSelection | null
  onSelect: (theme: ThemeSelection | null) => void
}

interface ThemeOption {
  zoneId: string
  zoneName: string
  blockType: 'in_possession' | 'out_of_possession'
  blockId: string
  blockName: string
}

export function ThemeDropdown({ zones, selectedTheme, onSelect }: ThemeDropdownProps) {
  // Build options grouped by zone
  const groupedOptions: { zoneName: string; zoneOrder: number; options: ThemeOption[] }[] = zones
    .filter((zone) => {
      // Check if zone has any blocks with content
      const hasInPossBlocks = zone.in_possession.some((b) => b.name.trim() !== '')
      const hasOutPossBlocks = zone.out_of_possession.some((b) => b.name.trim() !== '')
      return hasInPossBlocks || hasOutPossBlocks
    })
    .map((zone) => {
      const options: ThemeOption[] = []

      // Add all in-possession blocks with names
      zone.in_possession.forEach((block) => {
        if (block.name.trim() !== '') {
          options.push({
            zoneId: zone.id,
            zoneName: zone.name,
            blockType: 'in_possession',
            blockId: block.id,
            blockName: block.name,
          })
        }
      })

      // Add all out-of-possession blocks with names
      zone.out_of_possession.forEach((block) => {
        if (block.name.trim() !== '') {
          options.push({
            zoneId: zone.id,
            zoneName: zone.name,
            blockType: 'out_of_possession',
            blockId: block.id,
            blockName: block.name,
          })
        }
      })

      return {
        zoneName: zone.name,
        zoneOrder: zone.order,
        options,
      }
    })
    .filter((group) => group.options.length > 0)

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (!value) {
      onSelect(null)
      return
    }

    // Parse the value (format: zoneId|blockType|blockId)
    const [zoneId, blockType, blockId] = value.split('|')

    // Find the matching option
    for (const group of groupedOptions) {
      const option = group.options.find(
        (o) => o.zoneId === zoneId && o.blockType === blockType && o.blockId === blockId
      )
      if (option) {
        onSelect({
          zoneId: option.zoneId,
          zoneName: option.zoneName,
          blockType: option.blockType as 'in_possession' | 'out_of_possession',
          blockId: option.blockId,
          blockName: option.blockName,
        })
        return
      }
    }
  }

  // Current value for the select
  const currentValue = selectedTheme
    ? `${selectedTheme.zoneId}|${selectedTheme.blockType}|${selectedTheme.blockId}`
    : ''

  return (
    <select
      value={currentValue}
      onChange={handleChange}
      style={{
        width: '100%',
        padding: theme.spacing.sm,
        paddingRight: '28px',
        backgroundColor: theme.colors.background.tertiary,
        color: selectedTheme ? theme.colors.text.primary : 'rgba(255, 255, 255, 0.4)',
        border: `1px solid ${theme.colors.border.primary}`,
        borderRadius: theme.borderRadius.md,
        fontSize: theme.typography.fontSize.base,
        cursor: 'pointer',
        outline: 'none',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23717171' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
    >
      <option value="">Select a theme...</option>

      {groupedOptions.map((group) => (
        <optgroup key={group.zoneName} label={`Zone ${group.zoneOrder} - ${group.zoneName}`}>
          {group.options.map((option) => {
            const suffix = option.blockType === 'in_possession'
              ? '(In Possession)'
              : '(Out of Possession)'

            return (
              <option
                key={`${option.zoneId}|${option.blockType}|${option.blockId}`}
                value={`${option.zoneId}|${option.blockType}|${option.blockId}`}
              >
                {option.blockName} {suffix}
              </option>
            )
          })}
        </optgroup>
      ))}
    </select>
  )
}

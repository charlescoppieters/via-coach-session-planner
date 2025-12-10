'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { CgSpinnerAlt } from 'react-icons/cg'
import { theme } from '@/styles/theme'
import { getSpaceOptions, getEquipmentOptions, type EquipmentItem } from '@/lib/facilities'
import type { SystemDefault } from '@/types/database'

interface OptionValue {
  name: string
}

interface TeamFacilitiesStepProps {
  onNext: (facilities: {
    spaceType: string
    customSpace: string
    equipment: EquipmentItem[]
    otherFactors: string
  }) => void
  onBack: () => void
  onSkip: () => void
  isSubmitting?: boolean
}

export const TeamFacilitiesStep: React.FC<TeamFacilitiesStepProps> = ({
  onNext,
  onBack,
  onSkip,
  isSubmitting = false,
}) => {
  const [spaceOptions, setSpaceOptions] = useState<SystemDefault[]>([])
  const [equipmentOptions, setEquipmentOptions] = useState<SystemDefault[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [spaceType, setSpaceType] = useState('')
  const [customSpace, setCustomSpace] = useState('')
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [otherFactors, setOtherFactors] = useState('')

  useEffect(() => {
    const fetchOptions = async () => {
      const [spaceRes, equipRes] = await Promise.all([getSpaceOptions(), getEquipmentOptions()])

      if (spaceRes.data) setSpaceOptions(spaceRes.data)
      if (equipRes.data) setEquipmentOptions(equipRes.data)

      setIsLoading(false)
    }

    fetchOptions()
  }, [])

  const handleAddEquipment = () => {
    setEquipment(prev => [...prev, { type: '', quantity: 1 }])
  }

  const handleUpdateEquipment = (index: number, field: 'type' | 'quantity', value: string | number) => {
    setEquipment(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === 'quantity' ? Number(value) : value } : item
      )
    )
  }

  const handleRemoveEquipment = (index: number) => {
    setEquipment(prev => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    onNext({
      spaceType,
      customSpace,
      equipment: equipment.filter(e => e.type && e.quantity > 0),
      otherFactors,
    })
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <CgSpinnerAlt size={32} color={theme.colors.gold.main} />
        </motion.div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing.xl,
        maxWidth: '700px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <h2
        style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm,
          textAlign: 'center',
        }}
      >
        Facilities & Equipment
      </h2>
      <p
        style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing.xl,
          textAlign: 'center',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto',
          marginTop: theme.spacing.sm,
        }}
      >
        Tell us about your training environment. AI uses this to suggest appropriate
        drills and session setups that match your available resources.
      </p>

      {/* Form Content - Fixed Height Container */}
      <div style={{ minHeight: '350px' }}>
        {/* Training Space */}
        <div style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
        <label
          style={{
            display: 'block',
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Training Space
        </label>
        <select
          value={spaceType}
          onChange={e => setSpaceType(e.target.value)}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            fontSize: theme.typography.fontSize.base,
            color: spaceType ? theme.colors.text.primary : theme.colors.text.secondary,
            backgroundColor: theme.colors.background.primary,
            border: `2px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            outline: 'none',
            boxSizing: 'border-box',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.7rem center',
            backgroundSize: '1.2em',
            paddingRight: '2.5rem',
          }}
          onFocus={e => {
            e.target.style.borderColor = theme.colors.gold.main
          }}
          onBlur={e => {
            e.target.style.borderColor = theme.colors.border.primary
          }}
        >
          <option value="">Select training space...</option>
          {spaceOptions.map(option => (
            <option key={option.key} value={option.key}>
              {(option.value as unknown as OptionValue)?.name || option.key}
            </option>
          ))}
          <option value="other">Other</option>
        </select>

        {spaceType === 'other' && (
          <input
            type="text"
            value={customSpace}
            onChange={e => setCustomSpace(e.target.value)}
            placeholder="Describe your training space..."
            style={{
              width: '100%',
              marginTop: theme.spacing.md,
              padding: theme.spacing.md,
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.background.primary,
              border: `2px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => {
              e.target.style.borderColor = theme.colors.gold.main
            }}
            onBlur={e => {
              e.target.style.borderColor = theme.colors.border.primary
            }}
          />
        )}
      </div>

      {/* Equipment */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label
          style={{
            display: 'block',
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Available Equipment
        </label>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.sm,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {equipment.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: theme.spacing.sm,
                alignItems: 'center',
              }}
            >
              <select
                value={item.type}
                onChange={e => handleUpdateEquipment(index, 'type', e.target.value)}
                style={{
                  flex: 1,
                  padding: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.base,
                  color: item.type ? theme.colors.text.primary : theme.colors.text.secondary,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select equipment...</option>
                {equipmentOptions.map(option => (
                  <option key={option.key} value={option.key}>
                    {(option.value as unknown as OptionValue)?.name || option.key}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.quantity}
                onChange={e => handleUpdateEquipment(index, 'quantity', e.target.value)}
                min="1"
                style={{
                  width: '80px',
                  padding: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
              <button
                onClick={() => handleRemoveEquipment(index)}
                style={{
                  padding: theme.spacing.sm,
                  backgroundColor: 'transparent',
                  color: theme.colors.status.error,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FaTrash size={14} />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddEquipment}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background.primary,
              border: `2px dashed ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = theme.colors.gold.main
              e.currentTarget.style.color = theme.colors.gold.main
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = theme.colors.border.primary
              e.currentTarget.style.color = theme.colors.text.secondary
            }}
          >
            <FaPlus size={12} />
            Add Equipment
          </button>
        </div>
      </div>

      {/* Other Factors */}
      <div style={{ marginBottom: theme.spacing.lg }}>
        <label
          style={{
            display: 'block',
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Other Factors (Optional)
        </label>
        <textarea
          value={otherFactors}
          onChange={e => setOtherFactors(e.target.value)}
          placeholder="Any other relevant information about your training environment..."
          rows={3}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.background.primary,
            border: `2px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onFocus={e => {
            e.target.style.borderColor = theme.colors.gold.main
          }}
          onBlur={e => {
            e.target.style.borderColor = theme.colors.border.primary
          }}
        />
      </div>
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: theme.spacing.md,
          marginTop: theme.spacing.xl,
        }}
      >
        <button
          onClick={onBack}
          disabled={isSubmitting}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: theme.colors.background.primary,
            color: theme.colors.text.primary,
            border: `2px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: theme.transitions.fast,
            opacity: isSubmitting ? 0.5 : 1,
          }}
        >
          Back
        </button>

        <button
          onClick={onSkip}
          disabled={isSubmitting}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: theme.transitions.fast,
            opacity: isSubmitting ? 0.5 : 1,
          }}
        >
          Skip
        </button>

        <button
          onClick={handleNext}
          disabled={isSubmitting}
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.xl}`,
            backgroundColor: theme.colors.gold.main,
            color: theme.colors.background.primary,
            border: 'none',
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: theme.transitions.fast,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
          }}
        >
          {isSubmitting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-flex' }}
              >
                <CgSpinnerAlt size={16} />
              </motion.span>
              Completing...
            </>
          ) : (
            'Complete Setup'
          )}
        </button>
      </div>

      {/* Skip note */}
      <p
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.muted,
          textAlign: 'center',
          marginTop: theme.spacing.lg,
          fontStyle: 'italic',
        }}
      >
        You can configure this later in Team Settings
      </p>
    </div>
  )
}

'use client'

import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FaPlus, FaRegTrashAlt } from 'react-icons/fa'
import { RxDragHandleDots2 } from 'react-icons/rx'
import { theme } from '@/styles/theme'
import { DayCell } from './DayCell'
import type { TrainingSyllabus, SyllabusWeek, SyllabusDay } from '@/types/database'

interface WeeklyCalendarProps {
  syllabus: TrainingSyllabus
  onDayClick: (weekId: string, dayOfWeek: number) => void
  onAddWeek: () => void
  onRemoveWeek: (weekId: string) => void
  onReorderWeeks?: (reorderedWeeks: SyllabusWeek[]) => void
  readOnly?: boolean
}

export function WeeklyCalendar({
  syllabus,
  onDayClick,
  onAddWeek,
  onRemoveWeek,
  onReorderWeeks,
  readOnly = false,
}: WeeklyCalendarProps) {
  const canRemoveWeek = syllabus.weeks.length > 1

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = syllabus.weeks.findIndex((w) => w.id === active.id)
      const newIndex = syllabus.weeks.findIndex((w) => w.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(syllabus.weeks, oldIndex, newIndex)
        // Update order numbers to match new positions
        const updatedWeeks = reordered.map((week, index) => ({
          ...week,
          order: index + 1,
        }))
        onReorderWeeks?.(updatedWeeks)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Weeks */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={syllabus.weeks.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          {syllabus.weeks.map((week) => (
            <SortableWeekRow
              key={week.id}
              week={week}
              onDayClick={(dayOfWeek) => onDayClick(week.id, dayOfWeek)}
              onRemoveWeek={() => onRemoveWeek(week.id)}
              canRemove={canRemoveWeek && !readOnly}
              readOnly={readOnly}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Week Button */}
      {!readOnly && (
        <button
          onClick={onAddWeek}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            padding: theme.spacing.md,
            backgroundColor: 'transparent',
            color: theme.colors.text.secondary,
            border: `1px dashed ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <FaPlus size={12} />
          Add Week
        </button>
      )}
    </div>
  )
}

interface SortableWeekRowProps {
  week: SyllabusWeek
  onDayClick: (dayOfWeek: number) => void
  onRemoveWeek: () => void
  canRemove: boolean
  readOnly: boolean
}

function SortableWeekRow({
  week,
  onDayClick,
  onRemoveWeek,
  canRemove,
  readOnly,
}: SortableWeekRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: week.id, disabled: readOnly })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Ensure we have all 7 days in order
  const days: SyllabusDay[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
    const existingDay = week.days.find((d) => d.dayOfWeek === dayOfWeek)
    return (
      existingDay || {
        dayOfWeek: dayOfWeek as SyllabusDay['dayOfWeek'],
        theme: null,
        comments: null,
      }
    )
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'stretch',
        gap: theme.spacing.sm,
      }}
    >
      {/* Drag Handle */}
      {!readOnly && (
        <div
          {...attributes}
          {...listeners}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            cursor: 'grab',
            color: theme.colors.text.muted,
            opacity: 0.5,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.5'
          }}
        >
          <RxDragHandleDots2 size={16} />
        </div>
      )}

      {/* Week label */}
      <div
        style={{
          width: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.sm,
          backgroundColor: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.md,
          gap: theme.spacing.xs,
        }}
      >
        <span
          style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Week
        </span>
        <span
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
          }}
        >
          {week.order}
        </span>
      </div>

      {/* Days */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: theme.spacing.sm,
        }}
      >
        {days.map((day) => (
          <DayCell
            key={day.dayOfWeek}
            day={day}
            onClick={() => onDayClick(day.dayOfWeek)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Delete Button */}
      {canRemove && (
        <button
          onClick={onRemoveWeek}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            backgroundColor: 'transparent',
            color: theme.colors.text.muted,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = theme.colors.status.error
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = theme.colors.text.muted
          }}
          title="Remove week"
        >
          <FaRegTrashAlt size={14} />
        </button>
      )}
    </div>
  )
}

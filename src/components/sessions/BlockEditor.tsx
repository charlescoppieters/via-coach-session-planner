'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FiPlus } from 'react-icons/fi';
import { CgSpinnerAlt } from 'react-icons/cg';
import { theme } from '@/styles/theme';
import { SortableBlock } from './blocks/SortableBlock';
import { TrainingBlock } from './blocks/TrainingBlock';
import { BlockEditorModal } from './BlockEditorModal';
import { BlockPickerModal } from './BlockPickerModal';
import {
  type AssignedBlock,
  type SessionBlock,
  getSessionBlocks,
  createAndAssignBlock,
  assignBlockToSession,
  removeBlockFromSession,
  updateAssignmentPositions,
  editBlockWithCopyOnWrite,
} from '@/lib/sessionBlocks';
import type { TacticsElement } from '@/components/tactics/types';

interface BlockEditorProps {
  sessionId: string;
  coachId: string | null;
  clubId: string | null;
  readOnly?: boolean;
  onBlocksChange?: (blocks: AssignedBlock[]) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  sessionId,
  coachId,
  clubId,
  readOnly = false,
  onBlocksChange,
}) => {
  const [blocks, setBlocks] = useState<AssignedBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<AssignedBlock | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load blocks on mount
  useEffect(() => {
    const loadBlocks = async () => {
      setIsLoading(true);
      const { data, error } = await getSessionBlocks(sessionId);
      if (error) {
        console.error('Failed to load blocks:', error);
      }
      if (data) {
        setBlocks(data);
      }
      setIsLoading(false);
    };

    loadBlocks();
  }, [sessionId]);

  // Notify parent of block changes
  useEffect(() => {
    onBlocksChange?.(blocks);
  }, [blocks, onBlocksChange]);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.assignment_id === active.id);
        const newIndex = blocks.findIndex((b) => b.assignment_id === over.id);

        const newBlocks = arrayMove(blocks, oldIndex, newIndex);

        // Update positions
        const updatedBlocks = newBlocks.map((block, index) => ({
          ...block,
          position: index,
        }));

        setBlocks(updatedBlocks);

        // Persist to database
        await updateAssignmentPositions(
          updatedBlocks.map((b) => ({ id: b.assignment_id, position: b.position }))
        );
      }
    },
    [blocks]
  );

  // Open picker to add a block
  const handleAddBlock = () => {
    setShowPicker(true);
  };

  // Handle selecting an existing block from picker
  const handleSelectExistingBlock = async (block: SessionBlock) => {
    const position = blocks.length;
    const { data, error } = await assignBlockToSession(sessionId, block.id, position);
    if (error) {
      console.error('Failed to assign block:', error);
      return;
    }
    // Add to local state
    const assignedBlock: AssignedBlock = {
      ...block,
      assignment_id: data!.id,
      position: data!.position,
    };
    setBlocks((prev) => [...prev, assignedBlock]);
    setShowPicker(false);
  };

  // Handle "Create Training Block" from picker
  const handleCreateFromPicker = () => {
    setShowPicker(false);
    setEditingBlock(null);
    setShowModal(true);
  };

  // Open modal to edit existing block
  const handleEditBlock = (block: AssignedBlock) => {
    setEditingBlock(block);
    setShowModal(true);
  };

  // Save block (create or update)
  const handleSaveBlock = async (data: { title: string; description: string | null; coaching_points: string | null; image_url: string | null; diagram_data: TacticsElement[] | null; duration: number | null }) => {
    if (!coachId) {
      console.error('No coachId available');
      return;
    }

    if (editingBlock) {
      // Update existing block (with copy-on-write if not owner)
      const { data: updatedBlock, error, copied } = await editBlockWithCopyOnWrite(
        editingBlock.id,
        sessionId,
        editingBlock.assignment_id,
        data,
        coachId
      );

      if (error) {
        console.error('Failed to update block:', error);
        throw error;
      }

      if (updatedBlock) {
        // Update local state
        setBlocks((prev) =>
          prev.map((b) =>
            b.assignment_id === editingBlock.assignment_id
              ? { ...updatedBlock, assignment_id: b.assignment_id, position: b.position }
              : b
          )
        );
      }
    } else {
      // Create new block
      const position = blocks.length;
      const { data: newBlock, error } = await createAndAssignBlock(
        sessionId,
        {
          title: data.title,
          description: data.description,
          coaching_points: data.coaching_points,
          image_url: data.image_url,
          diagram_data: data.diagram_data,
          duration: data.duration,
          creator_id: coachId,
          club_id: clubId,
          is_public: false,
          source: 'user',
        },
        position
      );

      if (error) {
        console.error('Failed to create block:', error);
        throw error;
      }

      if (newBlock) {
        setBlocks((prev) => [...prev, newBlock]);
      }
    }

    setShowModal(false);
    setEditingBlock(null);
  };

  // Delete block (remove assignment)
  const handleDeleteBlock = async () => {
    if (!editingBlock) return;

    const { error } = await removeBlockFromSession(editingBlock.assignment_id);

    if (error) {
      console.error('Failed to remove block:', error);
      throw error;
    }

    // Update local state
    const newBlocks = blocks.filter((b) => b.assignment_id !== editingBlock.assignment_id);
    const reorderedBlocks = newBlocks.map((b, i) => ({ ...b, position: i }));
    setBlocks(reorderedBlocks);

    // Update positions in database
    if (reorderedBlocks.length > 0) {
      await updateAssignmentPositions(
        reorderedBlocks.map((b) => ({ id: b.assignment_id, position: b.position }))
      );
    }

    setShowModal(false);
    setEditingBlock(null);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
          color: theme.colors.text.muted,
        }}
      >
        <CgSpinnerAlt
          style={{
            animation: 'spin 1s linear infinite',
            fontSize: '24px',
            marginRight: theme.spacing.sm,
          }}
        />
        Loading blocks...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Blocks List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: theme.spacing.md,
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.assignment_id)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.map((block) => (
              <div key={block.assignment_id} style={{ marginBottom: theme.spacing.md }}>
                <SortableBlock
                  id={block.assignment_id}
                  disabled={readOnly}
                >
                  <TrainingBlock
                    block={block}
                    onClick={() => handleEditBlock(block)}
                    readOnly={readOnly}
                  />
                </SortableBlock>
              </div>
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Block Button - appears after blocks */}
        {!readOnly && coachId && (
          <button
            onClick={handleAddBlock}
            style={{
              width: 'calc(100% - 28px)',
              marginLeft: '28px',
              padding: theme.spacing.md,
              backgroundColor: theme.colors.background.secondary,
              border: `2px dashed ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              fontWeight: theme.typography.fontWeight.medium,
              fontSize: theme.typography.fontSize.base,
              transition: theme.transitions.fast,
              marginTop: blocks.length > 0 ? theme.spacing.sm : 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.gold.main;
              e.currentTarget.style.color = theme.colors.gold.main;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border.primary;
              e.currentTarget.style.color = theme.colors.text.muted;
            }}
          >
            <FiPlus size={18} style={{ opacity: 0.6 }} />
            <span style={{ opacity: 0.6 }}>Add a block</span>
          </button>
        )}

        {/* Empty state */}
        {blocks.length === 0 && !isLoading && !coachId && (
          <div
            style={{
              textAlign: 'center',
              padding: theme.spacing.xl,
              color: theme.colors.text.muted,
            }}
          >
            <p>No training blocks yet.</p>
          </div>
        )}
      </div>

      {/* Block Picker Modal */}
      {showPicker && coachId && (
        <BlockPickerModal
          onSelectBlock={handleSelectExistingBlock}
          onCreateNew={handleCreateFromPicker}
          onCancel={() => setShowPicker(false)}
          coachId={coachId}
          clubId={clubId}
        />
      )}

      {/* Block Editor Modal */}
      {showModal && (
        <BlockEditorModal
          block={editingBlock}
          onSave={handleSaveBlock}
          onDelete={editingBlock ? handleDeleteBlock : undefined}
          onCancel={() => {
            setShowModal(false);
            setEditingBlock(null);
          }}
        />
      )}
    </div>
  );
};

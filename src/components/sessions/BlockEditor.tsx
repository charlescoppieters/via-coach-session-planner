'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { BlockGroup } from './blocks/BlockGroup';
import { BlockEditorModal } from './BlockEditorModal';
import { BlockPickerModal } from './BlockPickerModal';
import {
  type AssignedBlock,
  type SessionBlock,
  type BlockAttribute,
  type BlockGroup as BlockGroupType,
  getSessionBlocks,
  createAndAssignBlock,
  assignBlockToSession,
  removeBlockFromSession,
  updateGroupPositions,
  editBlockWithCopyOnWrite,
  saveBlockAttributes,
  groupBlocksByPosition,
  addSimultaneousPractice,
  removeFromGroup,
  syncGroupDuration,
} from '@/lib/sessionBlocks';
import type { BlockSaveData } from './BlockEditorModal';
import type { TacticsElement } from '@/components/tactics/types';
import { setBlockExclusions } from '@/lib/blockAttendance';
import type { GameModelZones, SessionThemeSnapshot } from '@/types/database';

interface BlockEditorProps {
  sessionId: string;
  coachId: string | null;
  clubId: string | null;
  teamId?: string | null;
  readOnly?: boolean;
  onBlocksChange?: (blocks: AssignedBlock[]) => void;
  gameModel?: GameModelZones | null;
  sessionTheme?: SessionThemeSnapshot | null;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  sessionId,
  coachId,
  clubId,
  teamId,
  readOnly = false,
  onBlocksChange,
  gameModel,
  sessionTheme,
}) => {
  const [blocks, setBlocks] = useState<AssignedBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<AssignedBlock | null>(null);
  const [addSimultaneousPosition, setAddSimultaneousPosition] = useState<number | null>(null);

  // Group blocks by position for rendering
  const blockGroups = useMemo(() => groupBlocksByPosition(blocks), [blocks]);

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

  // Handle drag end - now works with groups
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = blockGroups.findIndex((g) => `group-${g.position}` === active.id);
        const newIndex = blockGroups.findIndex((g) => `group-${g.position}` === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const newGroups = arrayMove(blockGroups, oldIndex, newIndex);

        // Assign new positions to all blocks in all groups
        const updatedBlocks = newGroups.flatMap((group, newPos) =>
          group.practices.map((p) => ({ ...p, position: newPos }))
        );

        setBlocks(updatedBlocks);

        // Persist to database - update positions for each group
        const positionUpdates = newGroups.map((group, newPos) => ({
          position: newPos,
          assignmentIds: group.practices.map((p) => p.assignment_id),
        }));

        await updateGroupPositions(positionUpdates);
      }
    },
    [blockGroups]
  );

  // Open picker to add a new block group
  const handleAddBlock = () => {
    setAddSimultaneousPosition(null);
    setShowPicker(true);
  };

  // Handle adding a simultaneous practice to an existing group
  const handleAddSimultaneous = (position: number) => {
    setAddSimultaneousPosition(position);
    setShowPicker(true);
  };

  // Handle selecting an existing block from picker
  const handleSelectExistingBlock = async (block: SessionBlock) => {
    if (addSimultaneousPosition !== null) {
      // Adding as simultaneous practice to existing group
      const { data, error } = await addSimultaneousPractice(
        sessionId,
        block.id,
        addSimultaneousPosition
      );
      if (error) {
        console.error('Failed to add simultaneous practice:', error);
        setAddSimultaneousPosition(null);
        setShowPicker(false);
        return;
      }

      // Get the primary practice's duration to sync
      const primaryPractice = blocks.find(
        (b) => b.position === addSimultaneousPosition && b.slot_index === 0
      );
      const syncedDuration = primaryPractice?.duration ?? block.duration;

      // Sync duration across the group if primary has a duration
      if (syncedDuration) {
        await syncGroupDuration(sessionId, addSimultaneousPosition, syncedDuration);
      }

      // Add to local state with synced duration
      const assignedBlock: AssignedBlock = {
        ...block,
        assignment_id: data!.id,
        position: data!.position,
        slot_index: data!.slot_index,
        duration: syncedDuration,
      };
      setBlocks((prev) => [...prev, assignedBlock]);
      setAddSimultaneousPosition(null);
      setShowPicker(false);
    } else {
      // Adding as new block group
      const position = blockGroups.length;
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
        slot_index: data!.slot_index,
      };
      setBlocks((prev) => [...prev, assignedBlock]);
      setShowPicker(false);
    }
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
  const handleSaveBlock = async (data: BlockSaveData) => {
    if (!coachId) {
      console.error('No coachId available');
      return;
    }

    let blockId: string | null = null;

    if (editingBlock) {
      // Update existing block (with copy-on-write if not owner)
      const { data: updatedBlock, error, copied } = await editBlockWithCopyOnWrite(
        editingBlock.id,
        sessionId,
        editingBlock.assignment_id,
        {
          title: data.title,
          description: data.description,
          coaching_points: data.coaching_points,
          image_url: data.image_url,
          diagram_data: data.diagram_data,
          duration: data.duration,
          ball_rolling: data.ball_rolling,
        },
        coachId
      );

      if (error) {
        console.error('Failed to update block:', error);
        throw error;
      }

      if (updatedBlock) {
        blockId = updatedBlock.id;
        // Update local state (preserve slot_index)
        setBlocks((prev) =>
          prev.map((b) =>
            b.assignment_id === editingBlock.assignment_id
              ? { ...updatedBlock, assignment_id: b.assignment_id, position: b.position, slot_index: b.slot_index }
              : b
          )
        );

        // Sync duration across the group if this block has a duration
        if (data.duration !== null && data.duration !== undefined) {
          await syncGroupDuration(sessionId, editingBlock.position, data.duration);
          // Update local state to reflect synced duration
          setBlocks((prev) =>
            prev.map((b) =>
              b.position === editingBlock.position
                ? { ...b, duration: data.duration }
                : b
            )
          );
        }
      }
    } else {
      // Create new block - determine position and slot_index
      const isSimultaneous = addSimultaneousPosition !== null;
      const position = isSimultaneous ? addSimultaneousPosition : blockGroups.length;
      const slotIndex = isSimultaneous ? 1 : 0;

      const { data: newBlock, error } = await createAndAssignBlock(
        sessionId,
        {
          title: data.title,
          description: data.description,
          coaching_points: data.coaching_points,
          image_url: data.image_url,
          diagram_data: data.diagram_data,
          duration: data.duration,
          ball_rolling: data.ball_rolling,
          creator_id: coachId,
          club_id: clubId,
          is_public: false,
          source: 'user',
        },
        position,
        slotIndex
      );

      // Clear simultaneous position after creation
      setAddSimultaneousPosition(null);

      if (error) {
        console.error('Failed to create block:', error);
        throw error;
      }

      if (newBlock) {
        blockId = newBlock.id;
        setBlocks((prev) => [...prev, newBlock]);

        // Save player exclusions if any were specified during creation
        if (data.excludedPlayerIds && data.excludedPlayerIds.length > 0) {
          const { error: exclusionError } = await setBlockExclusions(
            newBlock.assignment_id,
            data.excludedPlayerIds
          );
          if (exclusionError) {
            console.error('Failed to save player exclusions:', exclusionError);
            // Don't throw - the block was saved successfully, just exclusions failed
          }
        }
      }
    }

    // Save block attributes if we have a blockId and attributes
    if (blockId && data.attributes && data.attributes.length > 0) {
      const { error: attrError } = await saveBlockAttributes(blockId, data.attributes);
      if (attrError) {
        console.error('Failed to save block attributes:', attrError);
        // Don't throw - the block was saved successfully, just attributes failed
      }
    } else if (blockId && data.attributes && data.attributes.length === 0) {
      // Clear attributes if empty array provided (editing case)
      await saveBlockAttributes(blockId, []);
    }

    setShowModal(false);
    setEditingBlock(null);
  };

  // Delete block (remove assignment) - called from modal
  const handleDeleteBlock = async () => {
    if (!editingBlock) return;

    await handleRemoveFromGroup(editingBlock.assignment_id);

    setShowModal(false);
    setEditingBlock(null);
  };

  // Remove a block from a group (handles promotion and reordering)
  const handleRemoveFromGroup = async (assignmentId: string) => {
    const blockToRemove = blocks.find((b) => b.assignment_id === assignmentId);
    if (!blockToRemove) return;

    const { error } = await removeFromGroup(assignmentId);

    if (error) {
      console.error('Failed to remove block from group:', error);
      return;
    }

    // Update local state
    const remainingBlocks = blocks.filter((b) => b.assignment_id !== assignmentId);

    // Check if this was a simultaneous block (slot_index 1) or primary block
    const wasSimultaneous = blockToRemove.slot_index === 1;

    if (wasSimultaneous) {
      // Just remove it, no reordering needed
      setBlocks(remainingBlocks);
    } else {
      // Was primary (slot 0) - check if there was a simultaneous block to promote
      const siblingBlock = blocks.find(
        (b) => b.position === blockToRemove.position && b.slot_index === 1
      );

      if (siblingBlock) {
        // Promote sibling to slot 0
        const updatedBlocks = remainingBlocks.map((b) =>
          b.assignment_id === siblingBlock.assignment_id
            ? { ...b, slot_index: 0 }
            : b
        );
        setBlocks(updatedBlocks);
      } else {
        // No sibling - need to reorder groups
        const newGroups = groupBlocksByPosition(remainingBlocks);
        const reorderedBlocks = newGroups.flatMap((group, newPos) =>
          group.practices.map((p) => ({ ...p, position: newPos }))
        );
        setBlocks(reorderedBlocks);

        // Persist the new positions
        const positionUpdates = newGroups.map((group, newPos) => ({
          position: newPos,
          assignmentIds: group.practices.map((p) => p.assignment_id),
        }));
        await updateGroupPositions(positionUpdates);
      }
    }
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
            items={blockGroups.map((g) => `group-${g.position}`)}
            strategy={verticalListSortingStrategy}
          >
            {blockGroups.map((group) => (
              <div key={`group-${group.position}`} style={{ marginBottom: theme.spacing.md }}>
                <SortableBlock
                  id={`group-${group.position}`}
                  disabled={readOnly}
                >
                  <BlockGroup
                    group={group}
                    onBlockClick={handleEditBlock}
                    onAddSimultaneous={handleAddSimultaneous}
                    onRemoveBlock={handleRemoveFromGroup}
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
          onCancel={() => {
            setShowPicker(false);
            setAddSimultaneousPosition(null);
          }}
          coachId={coachId}
          clubId={clubId}
          teamId={teamId}
          excludeBlockIds={blocks.map((b) => b.id)}
          mode={addSimultaneousPosition !== null ? 'simultaneous' : 'new'}
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
            setAddSimultaneousPosition(null);
          }}
          teamId={teamId}
          assignmentId={editingBlock?.assignment_id || null}
          gameModel={gameModel}
          sessionTheme={sessionTheme}
        />
      )}
    </div>
  );
};

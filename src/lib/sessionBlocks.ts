import { createClient } from '@/lib/supabase/client';
import type { TacticsElement } from '@/components/tactics/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient() as any;

// Types for the new reusable session blocks schema
export interface SessionBlock {
  id: string;
  title: string;
  description: string | null;
  coaching_points: string | null;
  image_url: string | null;
  diagram_data: TacticsElement[] | null;
  duration: number | null;
  ball_rolling: number | null;
  creator_id: string;
  club_id: string | null;
  is_public: boolean;
  source: 'user' | 'system' | 'marketplace';
  created_at: string;
  updated_at: string;
}

export interface SessionBlockAssignment {
  id: string;
  session_id: string;
  block_id: string;
  position: number;
  slot_index: number;
  created_at: string;
}

// Combined type for UI - block with its assignment info
export interface AssignedBlock extends SessionBlock {
  assignment_id: string;
  position: number;
  slot_index: number;
}

// Block group type for grouping simultaneous practices
export interface BlockGroup {
  position: number;
  practices: AssignedBlock[]; // 1 or 2 blocks, sorted by slot_index
}

// Module block type for session modules
export interface ModuleBlock {
  id: string;
  module_title: string;
  module_body: string;
  module_image_url?: string | null;
}

// Section block type for session sections
export interface SectionBlock {
  id: string;
  section_title: string;
  section_subtitle?: string | null;
}

// Block attribute type for tagging blocks with training attributes
export interface BlockAttribute {
  id?: string;
  block_id?: string;
  attribute_key: string;
  relevance: number;
  order_type: 'first' | 'second';
  source: 'coach' | 'llm' | 'system';
}

// Input types
export type CreateBlockInput = {
  title: string;
  description?: string | null;
  coaching_points?: string | null;
  image_url?: string | null;
  diagram_data?: TacticsElement[] | null;
  duration?: number | null;
  ball_rolling?: number | null;
  creator_id: string;
  club_id?: string | null;
  is_public?: boolean;
  source?: 'user' | 'system' | 'marketplace';
};

export type UpdateBlockInput = Partial<Omit<SessionBlock, 'id' | 'creator_id' | 'created_at' | 'updated_at'>>;

// ============================================
// BLOCK CRUD OPERATIONS
// ============================================

// Create a new block
export async function createBlock(input: CreateBlockInput) {
  const { data, error } = await supabase
    .from('session_blocks')
    .insert({
      title: input.title,
      description: input.description || null,
      coaching_points: input.coaching_points || null,
      image_url: input.image_url || null,
      diagram_data: input.diagram_data || null,
      duration: input.duration || null,
      ball_rolling: input.ball_rolling || null,
      creator_id: input.creator_id,
      club_id: input.club_id || null,
      is_public: input.is_public ?? false,
      source: input.source || 'user',
    })
    .select()
    .single();

  return { data: data as SessionBlock | null, error };
}

// Get a single block by ID
export async function getBlock(blockId: string) {
  const { data, error } = await supabase
    .from('session_blocks')
    .select('*')
    .eq('id', blockId)
    .single();

  return { data: data as SessionBlock | null, error };
}

// Update a block (only creator can update)
export async function updateBlock(blockId: string, updates: UpdateBlockInput) {
  const { data, error } = await supabase
    .from('session_blocks')
    .update(updates)
    .eq('id', blockId)
    .select()
    .single();

  return { data: data as SessionBlock | null, error };
}

// Delete a block (only creator can delete)
export async function deleteBlock(blockId: string) {
  const { error } = await supabase
    .from('session_blocks')
    .delete()
    .eq('id', blockId);

  return { error };
}

// ============================================
// SESSION BLOCK ASSIGNMENT OPERATIONS
// ============================================

// Get all blocks assigned to a session (with block details)
export async function getSessionBlocks(sessionId: string) {
  const { data, error } = await supabase
    .from('session_block_assignments')
    .select(`
      id,
      session_id,
      block_id,
      position,
      slot_index,
      created_at,
      session_blocks (
        id,
        title,
        description,
        coaching_points,
        image_url,
        diagram_data,
        duration,
        ball_rolling,
        creator_id,
        club_id,
        is_public,
        source,
        created_at,
        updated_at
      )
    `)
    .eq('session_id', sessionId)
    .order('position', { ascending: true })
    .order('slot_index', { ascending: true });

  if (error) {
    return { data: null, error };
  }

  // Transform to AssignedBlock format
  const assignedBlocks: AssignedBlock[] = (data || []).map((assignment: {
    id: string;
    session_id: string;
    block_id: string;
    position: number;
    slot_index: number;
    created_at: string;
    session_blocks: SessionBlock;
  }) => ({
    ...assignment.session_blocks,
    assignment_id: assignment.id,
    position: assignment.position,
    slot_index: assignment.slot_index,
  }));

  return { data: assignedBlocks, error: null };
}

// Assign a block to a session
export async function assignBlockToSession(
  sessionId: string,
  blockId: string,
  position: number,
  slotIndex: number = 0
) {
  const { data, error } = await supabase
    .from('session_block_assignments')
    .insert({
      session_id: sessionId,
      block_id: blockId,
      position,
      slot_index: slotIndex,
    })
    .select()
    .single();

  return { data: data as SessionBlockAssignment | null, error };
}

// Remove a block assignment from a session
export async function removeBlockFromSession(assignmentId: string) {
  const { error } = await supabase
    .from('session_block_assignments')
    .delete()
    .eq('id', assignmentId);

  return { error };
}

// Update assignment positions (for reordering)
export async function updateAssignmentPositions(
  assignments: { id: string; position: number }[]
) {
  const updates = assignments.map((assignment) =>
    supabase
      .from('session_block_assignments')
      .update({ position: assignment.position })
      .eq('id', assignment.id)
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return { success: errors.length === 0, errors };
}

// ============================================
// COMBINED OPERATIONS
// ============================================

// Create a block and assign it to a session in one operation
export async function createAndAssignBlock(
  sessionId: string,
  input: CreateBlockInput,
  position: number,
  slotIndex: number = 0
) {
  // First create the block
  const { data: block, error: blockError } = await createBlock(input);

  if (blockError || !block) {
    return { data: null, error: blockError };
  }

  // Then assign it to the session
  const { data: assignment, error: assignError } = await assignBlockToSession(
    sessionId,
    block.id,
    position,
    slotIndex
  );

  if (assignError) {
    // Rollback: delete the block if assignment failed
    await deleteBlock(block.id);
    return { data: null, error: assignError };
  }

  // Return the combined AssignedBlock
  const assignedBlock: AssignedBlock = {
    ...block,
    assignment_id: assignment!.id,
    position: assignment!.position,
    slot_index: assignment!.slot_index,
  };

  return { data: assignedBlock, error: null };
}

// Copy-on-write: If editing someone else's block, create a copy
export async function editBlockWithCopyOnWrite(
  blockId: string,
  sessionId: string,
  assignmentId: string,
  updates: UpdateBlockInput,
  currentCoachId: string
) {
  // Get the current block
  const { data: block, error: getError } = await getBlock(blockId);

  if (getError || !block) {
    return { data: null, error: getError, copied: false };
  }

  // Check if current user is the creator
  if (block.creator_id === currentCoachId) {
    // Direct update - user owns this block
    const { data: updatedBlock, error: updateError } = await updateBlock(blockId, updates);
    return { data: updatedBlock, error: updateError, copied: false };
  }

  // Copy-on-write: Create a new block with the updates
  const { data: newBlock, error: createError } = await createBlock({
    title: updates.title ?? block.title,
    description: updates.description !== undefined ? updates.description : block.description,
    coaching_points: updates.coaching_points !== undefined ? updates.coaching_points : block.coaching_points,
    image_url: updates.image_url !== undefined ? updates.image_url : block.image_url,
    diagram_data: updates.diagram_data !== undefined ? updates.diagram_data : block.diagram_data,
    duration: updates.duration !== undefined ? updates.duration : block.duration,
    ball_rolling: updates.ball_rolling !== undefined ? updates.ball_rolling : block.ball_rolling,
    creator_id: currentCoachId,
    club_id: updates.club_id !== undefined ? updates.club_id : block.club_id,
    is_public: false, // New copy is private by default
    source: 'user',
  });

  if (createError || !newBlock) {
    return { data: null, error: createError, copied: false };
  }

  // Update the assignment to point to the new block
  const { error: assignError } = await supabase
    .from('session_block_assignments')
    .update({ block_id: newBlock.id })
    .eq('id', assignmentId);

  if (assignError) {
    // Rollback: delete the new block
    await deleteBlock(newBlock.id);
    return { data: null, error: assignError, copied: false };
  }

  return { data: newBlock, error: null, copied: true };
}

// ============================================
// BLOCK PICKER
// ============================================

// Fetch blocks for the block picker, categorized by ownership
export async function getBlocksForPicker(coachId: string, clubId: string | null) {
  // Build filter conditions
  const conditions = [`creator_id.eq.${coachId}`];
  if (clubId) {
    conditions.push(`club_id.eq.${clubId}`);
  }
  conditions.push('is_public.eq.true');
  conditions.push('source.eq.system');

  const { data, error } = await supabase
    .from('session_blocks')
    .select('*')
    .or(conditions.join(','))
    .order('updated_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  // Categorize blocks
  const myBlocks: SessionBlock[] = [];
  const clubBlocks: SessionBlock[] = [];
  const defaultBlocks: SessionBlock[] = [];

  for (const block of (data || []) as SessionBlock[]) {
    if (block.creator_id === coachId) {
      myBlocks.push(block);
    } else if (block.is_public || block.source === 'system') {
      defaultBlocks.push(block);
    } else if (clubId && block.club_id === clubId) {
      clubBlocks.push(block);
    }
  }

  return {
    data: { myBlocks, clubBlocks, defaultBlocks },
    error: null,
  };
}

// ============================================
// IMAGE UPLOAD
// ============================================

export async function uploadBlockImage(file: File, blockId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${blockId}-${Date.now()}.${fileExt}`;
  const filePath = `block-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('session-images')
    .upload(filePath, file);

  if (uploadError) {
    return { url: null, error: uploadError };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('session-images')
    .getPublicUrl(filePath);

  return { url: publicUrl, error: null };
}

// ============================================
// BLOCK ATTRIBUTE OPERATIONS
// ============================================

// Get all attributes for a block
export async function getBlockAttributes(blockId: string) {
  const { data, error } = await supabase
    .from('session_block_attributes')
    .select('*')
    .eq('block_id', blockId)
    .order('order_type', { ascending: true })
    .order('relevance', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  return { data: data as BlockAttribute[], error: null };
}

// Save block attributes (delete existing and insert new)
export async function saveBlockAttributes(
  blockId: string,
  attributes: Omit<BlockAttribute, 'id' | 'block_id'>[]
) {
  // First, delete all existing attributes for this block
  const { error: deleteError } = await supabase
    .from('session_block_attributes')
    .delete()
    .eq('block_id', blockId);

  if (deleteError) {
    return { success: false, error: deleteError };
  }

  // If no new attributes, we're done
  if (attributes.length === 0) {
    return { success: true, error: null };
  }

  // Insert new attributes
  const attributesToInsert = attributes.map((attr) => ({
    block_id: blockId,
    attribute_key: attr.attribute_key,
    relevance: attr.relevance,
    order_type: attr.order_type,
    source: attr.source,
  }));

  const { error: insertError } = await supabase
    .from('session_block_attributes')
    .insert(attributesToInsert);

  if (insertError) {
    return { success: false, error: insertError };
  }

  return { success: true, error: null };
}

// ============================================
// BLOCK GROUP OPERATIONS (Simultaneous Practices)
// ============================================

// Group blocks by position into BlockGroups
export function groupBlocksByPosition(blocks: AssignedBlock[]): BlockGroup[] {
  const groups: Map<number, AssignedBlock[]> = new Map();

  for (const block of blocks) {
    const existing = groups.get(block.position) || [];
    existing.push(block);
    groups.set(block.position, existing);
  }

  // Convert to array, sort by position, ensure practices sorted by slot_index
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([position, practices]) => ({
      position,
      practices: practices.sort((a, b) => a.slot_index - b.slot_index),
    }));
}

// Add a simultaneous practice to an existing block group
export async function addSimultaneousPractice(
  sessionId: string,
  blockId: string,
  targetPosition: number
) {
  // First verify the position only has 1 block (slot_index 0)
  const { data: existing, error: checkError } = await supabase
    .from('session_block_assignments')
    .select('slot_index')
    .eq('session_id', sessionId)
    .eq('position', targetPosition);

  if (checkError) {
    return { data: null, error: checkError };
  }

  // Check max 2 practices per group
  if (existing && existing.length >= 2) {
    return { data: null, error: new Error('Maximum 2 practices per block group') };
  }

  // Add at slot_index 1
  return assignBlockToSession(sessionId, blockId, targetPosition, 1);
}

// Remove a block from a group (handles promotion of slot 1 to slot 0)
export async function removeFromGroup(assignmentId: string) {
  // Get the assignment first to check slot_index and position
  const { data: assignment, error: getError } = await supabase
    .from('session_block_assignments')
    .select('*')
    .eq('id', assignmentId)
    .single();

  if (getError || !assignment) {
    return { error: getError || new Error('Assignment not found') };
  }

  // Delete the assignment
  const { error: deleteError } = await supabase
    .from('session_block_assignments')
    .delete()
    .eq('id', assignmentId);

  if (deleteError) {
    return { error: deleteError };
  }

  // If we deleted slot_index 0 and there's a slot_index 1, promote it to 0
  if (assignment.slot_index === 0) {
    await supabase
      .from('session_block_assignments')
      .update({ slot_index: 0 })
      .eq('session_id', assignment.session_id)
      .eq('position', assignment.position)
      .eq('slot_index', 1);
  }

  return { error: null };
}

// Update positions for entire block groups (for drag-drop reordering)
export async function updateGroupPositions(
  groups: { position: number; assignmentIds: string[] }[]
) {
  const updates: Promise<{ error: unknown }>[] = [];

  for (const group of groups) {
    for (const assignmentId of group.assignmentIds) {
      updates.push(
        supabase
          .from('session_block_assignments')
          .update({ position: group.position })
          .eq('id', assignmentId)
      );
    }
  }

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return { success: errors.length === 0, errors };
}

// Sync duration across all practices in a group
export async function syncGroupDuration(
  sessionId: string,
  position: number,
  duration: number
) {
  // Get all assignments at this position
  const { data: assignments, error: fetchError } = await supabase
    .from('session_block_assignments')
    .select('block_id')
    .eq('session_id', sessionId)
    .eq('position', position);

  if (fetchError || !assignments) {
    return { error: fetchError };
  }

  // Update duration on all blocks in the group
  const blockIds = assignments.map((a: { block_id: string }) => a.block_id);
  const { error: updateError } = await supabase
    .from('session_blocks')
    .update({ duration })
    .in('id', blockIds);

  return { error: updateError };
}

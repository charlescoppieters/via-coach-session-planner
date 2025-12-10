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
  created_at: string;
}

// Combined type for UI - block with its assignment info
export interface AssignedBlock extends SessionBlock {
  assignment_id: string;
  position: number;
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

// Input types
export type CreateBlockInput = {
  title: string;
  description?: string | null;
  coaching_points?: string | null;
  image_url?: string | null;
  diagram_data?: TacticsElement[] | null;
  duration?: number | null;
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
      created_at,
      session_blocks (
        id,
        title,
        description,
        coaching_points,
        image_url,
        diagram_data,
        duration,
        creator_id,
        club_id,
        is_public,
        source,
        created_at,
        updated_at
      )
    `)
    .eq('session_id', sessionId)
    .order('position', { ascending: true });

  if (error) {
    return { data: null, error };
  }

  // Transform to AssignedBlock format
  const assignedBlocks: AssignedBlock[] = (data || []).map((assignment: {
    id: string;
    session_id: string;
    block_id: string;
    position: number;
    created_at: string;
    session_blocks: SessionBlock;
  }) => ({
    ...assignment.session_blocks,
    assignment_id: assignment.id,
    position: assignment.position,
  }));

  return { data: assignedBlocks, error: null };
}

// Assign a block to a session
export async function assignBlockToSession(sessionId: string, blockId: string, position: number) {
  const { data, error } = await supabase
    .from('session_block_assignments')
    .insert({
      session_id: sessionId,
      block_id: blockId,
      position,
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
  position: number
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
    position
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

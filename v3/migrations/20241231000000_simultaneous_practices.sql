-- Migration: Add simultaneous practices support
-- Allows grouping 1-2 practices (blocks) side-by-side that run simultaneously

-- Add slot_index column to session_block_assignments
-- slot_index = 0: Primary practice (left)
-- slot_index = 1: Simultaneous practice (right)
-- Blocks with same position but different slot_index form a group
ALTER TABLE session_block_assignments
  ADD COLUMN IF NOT EXISTS slot_index INTEGER DEFAULT 0 NOT NULL;

-- Add check constraint for slot_index (0 or 1 only, max 2 practices per group)
ALTER TABLE session_block_assignments
  ADD CONSTRAINT chk_slot_index CHECK (slot_index >= 0 AND slot_index <= 1);

-- Create unique constraint to ensure only one block per position+slot combination
ALTER TABLE session_block_assignments
  DROP CONSTRAINT IF EXISTS session_block_assignments_unique_position_slot;

ALTER TABLE session_block_assignments
  ADD CONSTRAINT session_block_assignments_unique_position_slot
  UNIQUE (session_id, position, slot_index);

-- Add index for efficient querying of block groups
CREATE INDEX IF NOT EXISTS idx_session_block_assignments_position_slot
  ON session_block_assignments (session_id, position, slot_index);

COMMENT ON COLUMN session_block_assignments.slot_index IS
  'Slot within a position group. 0=primary practice, 1=simultaneous practice. Blocks with same position form a group.';

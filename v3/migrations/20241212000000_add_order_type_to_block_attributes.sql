-- ========================================
-- Migration: Add order_type column to session_block_attributes
-- ========================================
-- This migration adds the order_type column to distinguish between
-- first-order and second-order attributes in training blocks.
--
-- First-order: Primary skills the drill directly trains
-- Second-order: Secondary skills (e.g., GK in a shooting drill)

-- Add the order_type column with a default of 'first'
ALTER TABLE session_block_attributes
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'first'
CHECK (order_type IN ('first', 'second'));

-- Add an index for efficient filtering by order_type
CREATE INDEX IF NOT EXISTS idx_session_block_attributes_order_type
ON session_block_attributes(block_id, order_type);

-- Comment on the new column
COMMENT ON COLUMN session_block_attributes.order_type IS 'first = primary training focus, second = secondary/indirect training (e.g., GK in shooting drill)';

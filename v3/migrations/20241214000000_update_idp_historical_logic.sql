-- ============================================================
-- Migration: Update IDP historical logic
--
-- Changes the behavior of update_player_idps function:
-- - IDPs being removed become historical only if the player
--   attended any sessions during that IDP period
-- - IDPs with no session attendance are deleted instead of
--   becoming historical (cleans up accidental assignments)
--
-- Also drops the now-unused get_accidental_idps function
-- ============================================================

-- Drop the get_accidental_idps function (no longer needed)
DROP FUNCTION IF EXISTS get_accidental_idps(UUID);

-- Update the update_player_idps function with new logic
CREATE OR REPLACE FUNCTION update_player_idps(
  p_player_id UUID,
  p_new_idps JSONB  -- Array of {attribute_key, priority, notes}
)
RETURNS VOID AS $$
DECLARE
  v_new_attributes TEXT[];
BEGIN
  -- Extract attribute keys from the new IDPs array
  SELECT ARRAY_AGG(idp->>'attribute_key')
  INTO v_new_attributes
  FROM jsonb_array_elements(p_new_idps) as idp;

  -- For IDPs being removed: check if player attended any sessions during the IDP period
  -- If yes: mark as historical (set ended_at)
  -- If no: delete the record

  -- Delete IDPs with no session attendance during their period
  DELETE FROM player_idps pi
  WHERE pi.player_id = p_player_id
    AND pi.ended_at IS NULL
    AND pi.attribute_key != ALL(COALESCE(v_new_attributes, ARRAY[]::TEXT[]))
    AND NOT EXISTS (
      SELECT 1 FROM session_attendance sa
      JOIN sessions s ON s.id = sa.session_id
      WHERE sa.player_id = p_player_id
        AND sa.status = 'present'
        AND s.session_date >= pi.started_at
        AND s.session_date <= NOW()
    );

  -- End IDPs that have session attendance (make historical)
  UPDATE player_idps
  SET ended_at = NOW(), updated_at = NOW()
  WHERE player_id = p_player_id
    AND ended_at IS NULL
    AND attribute_key != ALL(COALESCE(v_new_attributes, ARRAY[]::TEXT[]));

  -- Insert new IDPs (only those not already active)
  INSERT INTO player_idps (player_id, attribute_key, priority, notes, started_at)
  SELECT
    p_player_id,
    (idp->>'attribute_key')::TEXT,
    COALESCE((idp->>'priority')::INTEGER, 1),
    (idp->>'notes')::TEXT,
    NOW()
  FROM jsonb_array_elements(p_new_idps) as idp
  WHERE NOT EXISTS (
    SELECT 1 FROM player_idps existing
    WHERE existing.player_id = p_player_id
      AND existing.attribute_key = (idp->>'attribute_key')::TEXT
      AND existing.ended_at IS NULL
  );

  -- Update priority/notes for existing active IDPs that remain
  UPDATE player_idps pi
  SET
    priority = COALESCE((new_idp.idp->>'priority')::INTEGER, pi.priority),
    notes = COALESCE(new_idp.idp->>'notes', pi.notes),
    updated_at = NOW()
  FROM (
    SELECT idp FROM jsonb_array_elements(p_new_idps) as idp
  ) new_idp
  WHERE pi.player_id = p_player_id
    AND pi.ended_at IS NULL
    AND pi.attribute_key = (new_idp.idp->>'attribute_key')::TEXT;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

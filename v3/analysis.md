# VIA Session Planner - Analysis & Feedback System

---

## Overview

This document describes the analysis and feedback mechanism for tracking player development through sessions. The goal is to create a closed-loop system:

**Planning → Execution → Feedback → Analysis → Recommendations → Planning**

### Core Goals

1. **Track training opportunities** - How many sessions has each player worked on each of their IDP attributes?
2. **Track performance** - Based on coach post-session feedback, how are players progressing?
3. **IDP progress tracking** - Over the lifetime of each IDP, what has the player worked on and how have they improved?
4. **PDF exports** - Generate player development reports with stats and progress summaries
5. **Recommendations** - Feed analysis back into session planning to suggest blocks targeting undertrained IDPs

---

## Key Design Decisions

### 1. Attributes are Database-Driven (Not Hardcoded)

The attribute taxonomy lives in the `system_defaults` table (category: 'attributes'). This allows:
- Adding new attributes without code changes
- Future admin UI for managing attributes
- Flexibility per sport/context

**Current attribute categories:**
- **Technical**: Passing, Dribbling, First Touch, Crossing, Shooting, Heading, Tackling, Ball Control
- **Physical**: Pace, Strength, Stamina, Agility, Balance, Jumping
- **Mental**: Vision, Positioning, Decision Making, Leadership, Communication, Composure, Tactical Awareness, Work Rate

### 2. Feedback is Optional

Coach feedback after sessions is encouraged but not required. The system works in two modes:

- **With feedback**: Full analysis including training opportunities + performance sentiment + coach observations
- **Without feedback**: Analysis based solely on training opportunities (which sessions/blocks the player attended)

### 3. Historical Depth is IDP-Based (Not Time-Based)

Analysis is scoped to individual IDP records, not arbitrary time periods.

- Each IDP record has a `started_at` and optional `ended_at` date
- When analyzing progress for an IDP, the system pulls all sessions between those dates
- If a player has the same IDP for 6 months, analysis covers all 6 months
- If they change IDPs, each IDP period is analyzed separately
- Coaches can view historical IDPs with full analysis for each period

### 4. Accidental IDP Handling

If an IDP's start and end dates are within ~24 hours of each other, the system should:
- Flag it as potentially accidental
- Offer the option to delete the record
- Not include it in historical analysis if deleted

### 5. IDP-Scoped Tracking Only

**Training events are only recorded for attributes that match a player's active IDPs.** We do not track every player on every attribute - this would be too much data and too noisy.

- If a player doesn't have "Shooting" as an IDP, they won't accumulate training events for shooting drills
- When a player's IDPs change, future training events will track the new attributes (no backfill of past sessions)
- Historical training events remain tied to the IDP that was active at the time

This keeps the system focused on what matters: tracking progress toward each player's specific development goals.

### 6. Minimum IDP Requirement

**Every player must have at least 1 active IDP at all times.** This is enforced in the UI:
- When adding a new player, coach must set at least 1 IDP
- When editing IDPs, coach cannot remove all IDPs without adding a replacement
- This ensures every player is always being tracked on something

### 7. Training Event Generation Trigger

**Training events are generated when the coach submits post-session feedback**, not when the session date passes. This ensures:
- Coach has explicitly reviewed the session before tracking kicks in
- Attendance has been confirmed
- The session is truly "complete" from a coaching perspective

**Session Completion Model:** A session is considered "complete" when feedback is submitted. The coach can skip entering feedback text, but must go through the feedback modal to mark the session as complete. There is no separate "status" field on sessions - feedback submission IS the completion trigger.

Flow: Session occurs → Coach opens feedback modal → Coach confirms attendance → Coach optionally enters feedback → Coach submits → `generate_training_events()` runs → Training events created for all attending players (IDP-filtered)

### 8. No Minimum Relevance Threshold

**All attribute relevance scores are recorded**, even low ones (e.g., 0.2). There is no minimum threshold to create a training event. Low weights naturally diminish their impact in aggregate statistics, so filtering them out is unnecessary complexity.

### 9. Multi-Audience Reports

PDF reports are generated for different audiences with appropriate tone:

- **Coach reports**: Full detail, technical language, areas for improvement clearly stated
- **Player/Parent reports**: Encouraging tone, focus on progress and effort, constructive framing of development areas

---

## The Universal Taxonomy: Attributes

Everything connects through attributes:

```
Players have IDPs → IDPs target attributes
Session blocks train → specific attributes
Coach feedback references → attributes (extracted by LLM)
Stats are tracked per → player + attribute + IDP period
```

This creates a unified data model where we can always answer: "How much has Player X worked on Attribute Y during IDP Z?"

---

## System Components

### 1. Session Block Categorization

Each session block is tagged with attributes it trains, using a **first-order / second-order** framework to help the LLM think comprehensively about all participants and training effects.

**First-order attributes**: The obvious, direct training focus of the drill (e.g., shooting, finishing for a shooting drill)

**Second-order attributes**: What other participants train, or indirect benefits (e.g., shot stopping for the goalkeeper in a shooting drill, passing for the player who assists)

Both first-order and second-order attributes use the same 0.0-1.0 relevance scale. A goalkeeper's shot stopping in a finishing drill could be 0.9 relevance (high) even though it's "second-order".

**Hybrid approach (LLM + Coach confirmation):**

```
Block created/edited
  → LLM analyzes title, description, coaching_points
  → Thinks about first-order (direct focus) and second-order (other participants)
  → Suggests up to 6 attributes total with relevance scores (0.0-1.0)
  → Coach sees suggestions in UI
  → Coach can accept, modify, or override
  → Tags stored in session_block_attributes
```

**Example LLM prompt:**
```
Analyze this session block for youth football training:

Title: "1v1 Finishing with GK"
Description: "Players receive through balls from a midfielder and
finish 1v1 against the goalkeeper. Focus on composure in front of goal
and varied finishing techniques."
Coaching Points: "Take a good first touch to set the angle, stay
composed, pick your spot, vary finish types (driven, placed, chipped)"

Categorize the attributes this drill trains:

FIRST-ORDER (direct training focus - what the drill is designed for):
Consider the main participants and primary objectives.

SECOND-ORDER (indirect training - other participants and side benefits):
Consider goalkeepers, passers, defenders, or other roles in the drill.

Return JSON with relevance scores (0.0-1.0) for each attribute.
Both first and second order can have high relevance if that role gets
significant training from this drill.

{
  "first_order": [
    {"attribute": "shooting", "relevance": 0.95},
    {"attribute": "composure", "relevance": 0.85},
    {"attribute": "first_touch", "relevance": 0.7}
  ],
  "second_order": [
    {"attribute": "shot_stopping", "relevance": 0.9},
    {"attribute": "positioning", "relevance": 0.7},
    {"attribute": "passing", "relevance": 0.5}
  ]
}

Available attributes: [Passing, Dribbling, First Touch, Crossing,
Shooting, Heading, Tackling, Ball Control, Pace, Strength, Stamina,
Agility, Balance, Jumping, Vision, Positioning, Decision Making,
Leadership, Communication, Composure, Tactical Awareness, Work Rate,
Shot Stopping, Distribution, Aerial Ability, ...]
```

**Storage**: All attributes (first and second order) are flattened and stored in the same `session_block_attributes` table with their relevance scores. The first/second order distinction is **only used during LLM prompting** to ensure comprehensive coverage of all participants - it is not stored in the database.

```
LLM returns:                          Stored in DB:
{                                     session_block_attributes:
  "first_order": [                    | block_id | attribute_key  | relevance |
    {shooting: 0.95},                 |   abc    | shooting       |   0.95    |
    {composure: 0.85}                 |   abc    | composure      |   0.85    |
  ],                                  |   abc    | first_touch    |   0.70    |
  "second_order": [                   |   abc    | shot_stopping  |   0.90    |
    {shot_stopping: 0.9},             |   abc    | positioning    |   0.70    |
    {positioning: 0.7}                |   abc    | passing        |   0.50    |
  ]
}
```

**Why hybrid?**
- LLM provides consistent, scalable categorization
- First/second order framing helps LLM think about ALL participants (not just the main focus)
- Coach override catches errors and adds domain expertise
- Builds a corpus of well-categorized blocks over time
- Low friction (accept-by-default workflow)

### 2. Training Opportunity Tracking

**Important**: Training events are **only tracked for attributes that match a player's active IDPs**. We don't track every player on every attribute - only what's relevant to their current development focus. This keeps the system focused and manageable.

When a session is marked complete:

```
Session completed
  → Get all session blocks used in the session
  → Get all players who attended (from attendance records)
  → For each player:
      → Get their active IDPs (attribute_key list)
      → For each block attribute that matches an active IDP:
          Create a training_event record with weight = relevance score
      → Block attributes NOT in player's IDPs are ignored
```

**Example:**
- Jake has IDPs: [Shooting, First Touch, Composure]
- Session includes a finishing drill with attributes: shooting (0.95), composure (0.85), shot_stopping (0.9)
- Jake gets training events for: shooting (0.95), composure (0.85)
- Jake does NOT get a training event for shot_stopping (not in his IDPs)
- The goalkeeper (with shot_stopping IDP) WOULD get that training event

**Weight calculation**: The `relevance` score (0.0-1.0) is used directly as the training event weight.

This produces the raw data for queries like: "Jake has accumulated 8.5 weighted training units for Shooting during his current IDP period across 12 sessions."

### 3. Post-Session Feedback

**Input options:**
- Text input (team-level feedback)
- Text input (player-specific notes)
- Voice recording (transcribed via Whisper or similar)

**Coach feedback prompts (examples):**
- "How did the session go overall?"
- "Any standout performances?"
- "Any players who struggled today?"
- "What would you do differently?"

**LLM extraction from feedback:**

```
Analyze this post-session feedback:

"The rondo work was brilliant today. Jake and Mia showed really good
movement off the ball and their passing under pressure has improved.
Tom struggled a bit with his first touch but kept trying. Overall
the team's decision making in transition is getting better but we
still need to work on composure in the final third."

Extract:
1. Overall sentiment (positive/neutral/negative)
2. Attributes mentioned with sentiment
3. Player mentions with: name, attribute focus, sentiment, relevant quote

Return structured JSON.
```

**Stored insights:**
- Which attributes were mentioned
- Sentiment per attribute (positive/negative/neutral)
- Player-specific observations linked to attributes
- Confidence scores from LLM

### 4. IDP Progress Analysis

For each player's IDP record, the system can calculate:

**Quantitative metrics:**
- Total sessions attended during IDP period
- Training opportunities for the IDP attribute
- Percentage of sessions that included IDP-relevant training
- Trend over time (increasing/decreasing focus)

**Qualitative metrics (when feedback available):**
- Count of positive mentions
- Count of negative mentions
- Count of neutral mentions
- Sentiment trend over time
- Key quotes from coach feedback

**Progress indicators:**
- ↑ Improving (positive trend in feedback sentiment)
- → Stable (consistent feedback)
- ⚠ Needs focus (negative trend or low training opportunities)

### 5. Recommendation Engine

During session planning:

```
Coach starts planning a new session
  → System calculates for each player on the team:
      - Their active IDP targets
      - Training opportunities per IDP (during current IDP period)
      - Gap score = expected frequency - actual frequency

  → Aggregates across team:
      "5 players have 'First Touch' as IDP with < 2 training sessions"
      "3 players need work on 'Decision Making'"

  → Recommends session blocks:
      - Filter block library by matching attributes
      - Rank by relevance to team's aggregate gaps
      - Display: "Recommended: 4v2 Rondo (targets First Touch, Passing)"

  → Option to create custom block targeting specific gaps
```

**UI prompts during planning:**
```
"Based on your team's IDPs, consider including drills for:
• First Touch (5 players undertrained)
• Decision Making (3 players undertrained)

Suggested blocks from your library:
[Block 1] [Block 2] [Block 3]

Or: [Create Custom Block]"
```

### 6. PDF Export

**Player Development Report structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  PLAYER DEVELOPMENT REPORT                                  │
│  Jake Smith | U12 | Central Midfielder                      │
│  Report Period: Current IDP (Started: Sep 1, 2024)          │
├─────────────────────────────────────────────────────────────┤
│  SUMMARY                                                    │
│  Sessions Attended: 24/28 (86%)                             │
│  Total Training Hours: 36                                   │
│  IDP Focus Areas: Passing, Vision, First Touch              │
├─────────────────────────────────────────────────────────────┤
│  IDP PROGRESS                                               │
│                                                             │
│  1. Passing (Primary Focus)                                 │
│     ├─ Training Opportunities: 18 sessions                  │
│     ├─ Coach Feedback: 12 positive, 2 neutral               │
│     ├─ Progress: ↑ Improving                                │
│     └─ Recent notes: "Much better weight of pass"           │
│                                                             │
│  2. Vision                                                  │
│     ├─ Training Opportunities: 8 sessions                   │
│     ├─ Coach Feedback: 4 positive, 3 neutral                │
│     ├─ Progress: → Stable                                   │
│     └─ Recent notes: "Good awareness in rondos"             │
│                                                             │
│  3. First Touch                                             │
│     ├─ Training Opportunities: 6 sessions                   │
│     ├─ Coach Feedback: 2 positive, 4 constructive           │
│     ├─ Progress: ⚠ Needs continued focus                    │
│     └─ Recent notes: "Improving under pressure"             │
├─────────────────────────────────────────────────────────────┤
│  TRAINING BREAKDOWN                                         │
│  [Visual: chart showing attribute coverage]                 │
├─────────────────────────────────────────────────────────────┤
│  SESSION HISTORY (Last 10 sessions)                         │
│  • Nov 15: Passing & Movement (Attended ✓)                  │
│  • Nov 12: Finishing Session (Attended ✓)                   │
│  • Nov 8: Defensive Shape (Attended ✓)                      │
│  ...                                                        │
├─────────────────────────────────────────────────────────────┤
│  HISTORICAL IDPs                                            │
│  • Sep 2024 - Present: Passing, Vision, First Touch         │
│  • Mar 2024 - Aug 2024: Dribbling, Ball Control, Agility    │
│    └─ [View Full Report]                                    │
├─────────────────────────────────────────────────────────────┤
│  COACH RECOMMENDATIONS                                      │
│  • Continue focus on First Touch exercises                  │
│  • Consider 1-on-1 receiving drills under pressure          │
│  • Vision development is progressing well                   │
└─────────────────────────────────────────────────────────────┘
```

**Tone variations:**

| Audience | Tone | Example phrasing |
|----------|------|------------------|
| Coach | Direct, technical | "Struggles with first touch under pressure. Needs focused work." |
| Player/Parent | Encouraging, constructive | "First touch is an area of growth. Jake is working hard on receiving the ball under pressure and showing steady improvement." |

---

## Database Schema

### Alignment with Existing Schema (v3/schema.sql)

The following tables/columns **already exist** and will be reused:

| Existing | Notes |
|----------|-------|
| `session_attendance` | Already has `session_id`, `player_id`, `status`, `notes`. Uses `status TEXT` which is more flexible than boolean. |
| `system_defaults` | Already stores attributes (category='attributes'). Will be referenced by `attribute_key`. |
| `session_blocks` | Already has `title`, `description`, `coaching_points` for LLM categorization. |
| `players.target_1/2/3` | **Will be removed** in favor of the new `player_idps` table for proper historical tracking. |

### Migration Notes

**Players table change:**
The current `players` table has `target_1`, `target_2`, `target_3` TEXT columns for IDPs. These columns will be **removed** as part of this implementation (fresh database, no existing data to migrate). The new `player_idps` table replaces them with:
- Historical tracking with start/end dates
- Proper foreign key to attributes
- Priority ordering
- Coach notes per IDP
- Analysis scoped to IDP periods

**Attendance tracking:**
The existing `session_attendance` table is sufficient. No changes needed.

### New Tables

```sql
-- ============================================================
-- SESSION BLOCK ATTRIBUTES
-- Links session blocks to the attributes they train
-- ============================================================
CREATE TABLE session_block_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID NOT NULL REFERENCES session_blocks(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,  -- references system_defaults key (category='attributes')
  relevance FLOAT DEFAULT 1.0 CHECK (relevance >= 0 AND relevance <= 1),
  source TEXT DEFAULT 'llm' CHECK (source IN ('llm', 'coach', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(block_id, attribute_key)
);

CREATE INDEX idx_sba_block_id ON session_block_attributes(block_id);
CREATE INDEX idx_sba_attribute ON session_block_attributes(attribute_key);

-- ============================================================
-- PLAYER IDPs (Individual Development Plans)
-- Replaces players.target_1/2/3 with proper historical tracking
-- Each record represents one IDP target for a player
-- ============================================================
CREATE TABLE player_idps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,  -- references system_defaults key (category='attributes')
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3),  -- 1 = primary, 2 = secondary, 3 = tertiary
  notes TEXT,  -- coach notes about why this IDP was chosen
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,  -- NULL means currently active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_idps_player ON player_idps(player_id);
CREATE INDEX idx_player_idps_active ON player_idps(player_id) WHERE ended_at IS NULL;
CREATE INDEX idx_player_idps_attribute ON player_idps(attribute_key);
CREATE INDEX idx_player_idps_dates ON player_idps(player_id, started_at, ended_at);

-- ============================================================
-- PLAYER TRAINING EVENTS
-- Records each time a player trained a specific attribute
-- Generated when a session is completed (from attendance + block attributes)
-- ============================================================
CREATE TABLE player_training_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,  -- relevance * duration factor
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pte_player_attribute ON player_training_events(player_id, attribute_key);
CREATE INDEX idx_pte_player_date ON player_training_events(player_id, created_at);
CREATE INDEX idx_pte_session ON player_training_events(session_id);

-- ============================================================
-- SESSION FEEDBACK
-- Raw post-session feedback from coaches
-- One record per session (coach can update, not create multiple)
-- ============================================================
CREATE TABLE session_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id),
  team_feedback TEXT,
  audio_url TEXT,  -- stored in 'session-feedback-audio' bucket
  transcript TEXT,  -- transcribed from audio via Whisper
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  processed_at TIMESTAMPTZ,  -- when LLM analysis completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id)  -- one feedback record per session
);

CREATE INDEX idx_session_feedback_session ON session_feedback(session_id);
CREATE INDEX idx_session_feedback_coach ON session_feedback(coach_id);
CREATE INDEX idx_session_feedback_unprocessed ON session_feedback(id) WHERE processed_at IS NULL;

-- ============================================================
-- PLAYER FEEDBACK NOTES
-- Player-specific notes within a session feedback
-- ============================================================
CREATE TABLE player_feedback_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_feedback_id UUID NOT NULL REFERENCES session_feedback(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_feedback_id, player_id)  -- one note per player per feedback
);

CREATE INDEX idx_pfn_feedback ON player_feedback_notes(session_feedback_id);
CREATE INDEX idx_pfn_player ON player_feedback_notes(player_id);

-- ============================================================
-- FEEDBACK INSIGHTS
-- LLM-extracted structured insights from feedback
-- Multiple insights can be extracted from one feedback record
-- ============================================================
CREATE TABLE feedback_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_feedback_id UUID NOT NULL REFERENCES session_feedback(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,  -- NULL = team-level insight
  attribute_key TEXT,  -- NULL if insight doesn't relate to specific attribute
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  extracted_text TEXT,  -- the relevant quote from feedback
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fi_feedback ON feedback_insights(session_feedback_id);
CREATE INDEX idx_fi_player ON feedback_insights(player_id) WHERE player_id IS NOT NULL;
CREATE INDEX idx_fi_player_attribute ON feedback_insights(player_id, attribute_key) WHERE player_id IS NOT NULL;
CREATE INDEX idx_fi_attribute ON feedback_insights(attribute_key) WHERE attribute_key IS NOT NULL;

-- ============================================================
-- STORAGE BUCKET FOR AUDIO FEEDBACK
-- Add to existing storage buckets in schema.sql
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'session-feedback-audio',
--     'session-feedback-audio',
--     false,  -- private - only accessible to club members
--     52428800, -- 50MB (voice recordings can be large)
--     ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
-- )
-- ON CONFLICT (id) DO NOTHING;
```

### Views for Common Queries

```sql
-- ============================================================
-- VIEW: Player IDP Progress
-- Aggregates training and feedback data per player per IDP
-- ============================================================
CREATE OR REPLACE VIEW player_idp_progress AS
SELECT
  pi.id as idp_id,
  pi.player_id,
  pi.attribute_key,
  pi.priority,
  pi.started_at,
  pi.ended_at,
  -- Training metrics
  COUNT(DISTINCT pte.session_id) as training_sessions,
  COALESCE(SUM(pte.weight), 0) as total_training_weight,
  -- Feedback metrics
  COUNT(DISTINCT fi.id) FILTER (WHERE fi.sentiment = 'positive') as positive_mentions,
  COUNT(DISTINCT fi.id) FILTER (WHERE fi.sentiment = 'negative') as negative_mentions,
  COUNT(DISTINCT fi.id) FILTER (WHERE fi.sentiment = 'neutral') as neutral_mentions
FROM player_idps pi
LEFT JOIN player_training_events pte
  ON pte.player_id = pi.player_id
  AND pte.attribute_key = pi.attribute_key
  AND pte.created_at >= pi.started_at
  AND (pi.ended_at IS NULL OR pte.created_at <= pi.ended_at)
LEFT JOIN feedback_insights fi
  ON fi.player_id = pi.player_id
  AND fi.attribute_key = pi.attribute_key
  AND fi.created_at >= pi.started_at
  AND (pi.ended_at IS NULL OR fi.created_at <= pi.ended_at)
GROUP BY pi.id, pi.player_id, pi.attribute_key, pi.priority, pi.started_at, pi.ended_at;

-- ============================================================
-- VIEW: Team IDP Gaps
-- Identifies undertrained IDPs across a team for recommendations
-- ============================================================
CREATE OR REPLACE VIEW team_idp_gaps AS
SELECT
  p.team_id,
  pi.attribute_key,
  COUNT(DISTINCT pi.player_id) as players_with_idp,
  AVG(COALESCE(progress.training_sessions, 0)) as avg_training_sessions,
  ARRAY_AGG(DISTINCT p.id) as player_ids,
  ARRAY_AGG(DISTINCT p.name) as player_names
FROM player_idps pi
JOIN players p ON p.id = pi.player_id
LEFT JOIN player_idp_progress progress ON progress.idp_id = pi.id
WHERE pi.ended_at IS NULL  -- active IDPs only
GROUP BY p.team_id, pi.attribute_key;

-- ============================================================
-- VIEW: Player Attendance Summary
-- Uses existing session_attendance table
-- ============================================================
CREATE OR REPLACE VIEW player_attendance_summary AS
SELECT
  sa.player_id,
  p.team_id,
  COUNT(*) FILTER (WHERE sa.status = 'present') as sessions_attended,
  COUNT(*) FILTER (WHERE sa.status = 'absent') as sessions_missed,
  COUNT(*) as total_sessions,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE sa.status = 'present') / NULLIF(COUNT(*), 0),
    1
  ) as attendance_percentage
FROM session_attendance sa
JOIN players p ON p.id = sa.player_id
GROUP BY sa.player_id, p.team_id;
```

### RPC Functions

```sql
-- ============================================================
-- FUNCTION: Generate training events for a completed session
-- Call this when feedback is submitted (session completion trigger)
-- Only creates events for attributes matching player's active IDPs
-- Uses SECURITY DEFINER to bypass RLS for system-generated inserts
-- ============================================================
CREATE OR REPLACE FUNCTION generate_training_events(p_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Insert training events for each player-attribute combination
  -- ONLY for attributes that match the player's active IDPs
  INSERT INTO player_training_events (player_id, session_id, attribute_key, weight)
  SELECT DISTINCT
    sa.player_id,
    p_session_id,
    sba.attribute_key,
    sba.relevance  -- weight = relevance score directly
  FROM session_attendance sa
  -- Get all block attributes for this session
  JOIN session_block_assignments sba_assign ON sba_assign.session_id = p_session_id
  JOIN session_block_attributes sba ON sba.block_id = sba_assign.block_id
  -- Only include attributes that match player's active IDPs
  JOIN player_idps pi ON pi.player_id = sa.player_id
    AND pi.attribute_key = sba.attribute_key
    AND pi.ended_at IS NULL  -- active IDPs only
  WHERE sa.session_id = p_session_id
    AND sa.status = 'present'
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- FUNCTION: End current IDPs and start new ones
-- Handles the IDP transition for a player
-- ============================================================
CREATE OR REPLACE FUNCTION update_player_idps(
  p_player_id UUID,
  p_new_idps JSONB  -- Array of {attribute_key, priority, notes}
)
RETURNS VOID AS $$
BEGIN
  -- End all current active IDPs
  UPDATE player_idps
  SET ended_at = NOW(), updated_at = NOW()
  WHERE player_id = p_player_id AND ended_at IS NULL;

  -- Insert new IDPs
  INSERT INTO player_idps (player_id, attribute_key, priority, notes, started_at)
  SELECT
    p_player_id,
    (idp->>'attribute_key')::TEXT,
    COALESCE((idp->>'priority')::INTEGER, 1),
    (idp->>'notes')::TEXT,
    NOW()
  FROM jsonb_array_elements(p_new_idps) as idp;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCTION: Check for accidental IDP records
-- Returns IDP records with very short duration (< 24 hours)
-- ============================================================
CREATE OR REPLACE FUNCTION get_accidental_idps(p_player_id UUID)
RETURNS TABLE (
  idp_id UUID,
  attribute_key TEXT,
  duration_hours FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pi.id,
    pi.attribute_key,
    EXTRACT(EPOCH FROM (COALESCE(pi.ended_at, NOW()) - pi.started_at)) / 3600 as duration_hours
  FROM player_idps pi
  WHERE pi.player_id = p_player_id
    AND pi.ended_at IS NOT NULL
    AND EXTRACT(EPOCH FROM (pi.ended_at - pi.started_at)) < 86400;  -- < 24 hours
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION generate_training_events TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_idps TO authenticated;
GRANT EXECUTE ON FUNCTION get_accidental_idps TO authenticated;
```

### RLS Policies for New Tables

```sql
-- ============================================================
-- Enable RLS on new tables
-- ============================================================
ALTER TABLE session_block_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_idps ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_feedback_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_insights ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: SESSION_BLOCK_ATTRIBUTES
-- Follows same pattern as session_blocks (relaxed read access)
-- ============================================================
CREATE POLICY "sba_select" ON session_block_attributes
    FOR SELECT USING (
        block_id IN (
            SELECT id FROM session_blocks
            WHERE is_public = TRUE
            OR creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            OR club_id IN (
                SELECT club_id FROM club_memberships
                WHERE coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "sba_insert" ON session_block_attributes
    FOR INSERT WITH CHECK (
        block_id IN (
            SELECT id FROM session_blocks
            WHERE creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "sba_update" ON session_block_attributes
    FOR UPDATE USING (
        block_id IN (
            SELECT id FROM session_blocks
            WHERE creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "sba_delete" ON session_block_attributes
    FOR DELETE USING (
        block_id IN (
            SELECT id FROM session_blocks
            WHERE creator_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- ============================================================
-- RLS: PLAYER_IDPS
-- Club members can view, assigned coaches can modify
-- ============================================================
CREATE POLICY "player_idps_select" ON player_idps
    FOR SELECT USING (
        player_id IN (
            SELECT p.id FROM players p
            JOIN club_memberships cm ON cm.club_id = p.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "player_idps_insert" ON player_idps
    FOR INSERT WITH CHECK (
        player_id IN (
            SELECT p.id FROM players p
            WHERE EXISTS (
                SELECT 1 FROM club_memberships cm
                WHERE cm.club_id = p.club_id
                AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND cm.role = 'admin'
            )
            OR EXISTS (
                SELECT 1 FROM team_coaches tc
                WHERE tc.team_id = p.team_id
                AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "player_idps_update" ON player_idps
    FOR UPDATE USING (
        player_id IN (
            SELECT p.id FROM players p
            WHERE EXISTS (
                SELECT 1 FROM club_memberships cm
                WHERE cm.club_id = p.club_id
                AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND cm.role = 'admin'
            )
            OR EXISTS (
                SELECT 1 FROM team_coaches tc
                WHERE tc.team_id = p.team_id
                AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "player_idps_delete" ON player_idps
    FOR DELETE USING (
        player_id IN (
            SELECT p.id FROM players p
            WHERE EXISTS (
                SELECT 1 FROM club_memberships cm
                WHERE cm.club_id = p.club_id
                AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND cm.role = 'admin'
            )
        )
    );

-- ============================================================
-- RLS: PLAYER_TRAINING_EVENTS
-- Club members can view, system generates via SECURITY DEFINER RPC
-- ============================================================
CREATE POLICY "pte_select" ON player_training_events
    FOR SELECT USING (
        player_id IN (
            SELECT p.id FROM players p
            JOIN club_memberships cm ON cm.club_id = p.club_id
            WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- Insert is done via SECURITY DEFINER function (generate_training_events)

-- ============================================================
-- RLS: SESSION_FEEDBACK
-- Same access pattern as sessions table
-- ============================================================
CREATE POLICY "session_feedback_select" ON session_feedback
    FOR SELECT USING (
        session_id IN (
            SELECT s.id FROM sessions s
            WHERE EXISTS (
                SELECT 1 FROM club_memberships cm
                WHERE cm.club_id = s.club_id
                AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND cm.role = 'admin'
            )
            OR EXISTS (
                SELECT 1 FROM team_coaches tc
                WHERE tc.team_id = s.team_id
                AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "session_feedback_insert" ON session_feedback
    FOR INSERT WITH CHECK (
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        AND session_id IN (
            SELECT s.id FROM sessions s
            WHERE EXISTS (
                SELECT 1 FROM club_memberships cm
                WHERE cm.club_id = s.club_id
                AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND cm.role = 'admin'
            )
            OR EXISTS (
                SELECT 1 FROM team_coaches tc
                WHERE tc.team_id = s.team_id
                AND tc.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "session_feedback_update" ON session_feedback
    FOR UPDATE USING (
        coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        OR session_id IN (
            SELECT s.id FROM sessions s
            WHERE EXISTS (
                SELECT 1 FROM club_memberships cm
                WHERE cm.club_id = s.club_id
                AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND cm.role = 'admin'
            )
        )
    );

CREATE POLICY "session_feedback_delete" ON session_feedback
    FOR DELETE USING (
        session_id IN (
            SELECT s.id FROM sessions s
            WHERE EXISTS (
                SELECT 1 FROM club_memberships cm
                WHERE cm.club_id = s.club_id
                AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
                AND cm.role = 'admin'
            )
        )
    );

-- ============================================================
-- RLS: PLAYER_FEEDBACK_NOTES
-- Same access pattern as session_feedback
-- ============================================================
CREATE POLICY "pfn_select" ON player_feedback_notes
    FOR SELECT USING (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            JOIN sessions s ON s.id = sf.session_id
            WHERE EXISTS (
                SELECT 1 FROM club_memberships cm
                WHERE cm.club_id = s.club_id
                AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

CREATE POLICY "pfn_insert" ON player_feedback_notes
    FOR INSERT WITH CHECK (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            WHERE sf.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "pfn_update" ON player_feedback_notes
    FOR UPDATE USING (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            WHERE sf.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "pfn_delete" ON player_feedback_notes
    FOR DELETE USING (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            WHERE sf.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
        )
    );

-- ============================================================
-- RLS: FEEDBACK_INSIGHTS
-- Read access for club members, insert via SECURITY DEFINER
-- ============================================================
CREATE POLICY "fi_select" ON feedback_insights
    FOR SELECT USING (
        session_feedback_id IN (
            SELECT sf.id FROM session_feedback sf
            JOIN sessions s ON s.id = sf.session_id
            WHERE EXISTS (
                SELECT 1 FROM club_memberships cm
                WHERE cm.club_id = s.club_id
                AND cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
            )
        )
    );

-- Insert/update/delete done via SECURITY DEFINER function for LLM processing
```

### Triggers for New Tables

```sql
-- Apply updated_at trigger to new tables (uses existing function from schema.sql)
CREATE TRIGGER update_session_block_attributes_updated_at
    BEFORE UPDATE ON session_block_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_idps_updated_at
    BEFORE UPDATE ON player_idps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_feedback_updated_at
    BEFORE UPDATE ON session_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Implementation Phases

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| **1** | Data Foundation | `player_idps` table (replaces target_1/2/3), remove old columns, attendance UI |
| **2** | Block Tagging | `session_block_attributes` table, manual tagging UI, LLM auto-suggest |
| **3** | Training Events | `player_training_events` table, `generate_training_events()` RPC |
| **4** | Feedback Input | `session_feedback` + `player_feedback_notes` tables, basic UI (text only) |
| **5** | Voice Input | *(Deferred)* Audio recording, Whisper transcription, storage bucket |
| **6** | Feedback Analysis | LLM extraction pipeline, `feedback_insights` table |
| **7** | IDP Dashboard | Player IDP progress view, historical IDPs, basic stats |
| **8** | Team Analytics | Team IDP gaps view, aggregate statistics |
| **9** | Recommendations | Session planning integration, block suggestions |
| **10** | PDF Export | Report generation, coach and player/parent versions |

### Phase Details

**Phase 1: Data Foundation**
- Create `player_idps` table (new IDP system with historical tracking)
- Remove `target_1`, `target_2`, `target_3` columns from `players` table (fresh DB, no migration needed)
- Build UI for managing player IDPs (add/edit/end IDPs)
- Build attendance UI for `session_attendance` table (table already exists in schema)

**Phase 2: Block Tagging**
- Create `session_block_attributes` table
- Build UI for manually tagging blocks with attributes
- Integrate LLM auto-suggestion when creating/editing blocks
- Store both LLM suggestions and coach overrides

**Phase 3: Training Events**
- Create `player_training_events` table
- Create `generate_training_events()` SECURITY DEFINER function
- Call function when session is marked complete
- Build basic training events viewer (for debugging/verification)

**Phase 4: Feedback System (Text Input)**
- Build feedback input UI (integrated into session view)
- Text input for team-level feedback and player-specific notes
- Feedback submission triggers training event generation

**Phase 5: Voice Input (Deferred)**
- Deferred to later iteration
- Will add audio recording capability with Whisper transcription
- Storage bucket for audio files

**Phase 6: Feedback Analysis**
- Create LLM extraction pipeline (async processing)
- Store structured insights in `feedback_insights`

**Phase 7-8: Analytics**
- Build player IDP progress dashboard
- Show training opportunities, feedback sentiment, trends
- Build team-level IDP gap analysis view
- Aggregate statistics across team

**Phase 9: Recommendations**
- Integrate gap analysis into session planning workflow
- Suggest blocks from library that target undertrained attributes
- Prompt for custom block creation when gaps identified

**Phase 10: PDF Export**
- Design report templates (coach version, player/parent version)
- Implement server-side PDF generation
- Include stats, charts, progress indicators
- Add export button to player detail view

---

## Technical Decisions

### LLM Provider

Recommended: **Claude API** or **GPT-4** for structured extraction tasks.
- Claude excels at following complex extraction instructions
- GPT-4 has reliable JSON mode for structured output

### Voice Transcription (Deferred)

**Status:** Voice input is deferred to a later phase. Initial implementation will focus on text-based feedback only.

When implemented, recommended approach:
- **OpenAI Whisper API**
- Excellent accuracy for UK English
- Cost-effective
- Easy integration

**Sync vs Async**: Ideally synchronous for better UX (coach waits for transcription to complete before reviewing). Final decision to be made during implementation based on latency testing.

### Stats Computation

Start with **on-demand queries** using the views defined above.

If performance becomes an issue:
- Add materialized views refreshed periodically
- Or maintain denormalized stats tables updated via triggers

### PDF Generation

Recommended: **Server-side generation** (Puppeteer or similar)
- Better control over complex layouts
- Consistent rendering across devices
- Can include charts and visualizations

Alternative: `@react-pdf/renderer` for simpler reports

### Processing Architecture

**Feedback Analysis (LLM extraction)**: Likely async
- Coach submits feedback → immediate confirmation
- LLM analysis runs in background
- `processed_at` timestamp set when complete
- Insights available shortly after (not blocking the coach)

**Training Event Generation**: Synchronous
- Runs immediately after feedback submission
- Fast SQL operation, no external API calls
- Coach sees confirmation that session is fully logged

**Phase 1 (MVP)**: Start with synchronous LLM calls if latency acceptable
**Phase 2 (Scale)**: Move to async with queues (Supabase Edge Functions or Vercel background functions)

---

## Open Questions / Future Considerations

1. **Attribute weighting**: Should some attributes be harder to train than others? (e.g., mental attributes might need more sessions than technical)

2. **Session type classification**: Beyond block attributes, should sessions themselves have a "type" (technical, tactical, physical, match prep)?

3. **Benchmark data**: Could we provide "typical" progress benchmarks by age group to contextualize individual progress?

4. **Parent engagement**: Should parents be able to add notes or observations from matches/home practice?

5. **Export frequency**: Should we generate periodic reports automatically (monthly/termly) or only on-demand?

6. **Data retention**: How long do we keep detailed training events? Forever? Or aggregate after X months?

---

## Implementation Order (Recommended)

This section outlines the recommended build order based on dependencies between features.

### Dependency Graph

```
Phase 1: player_idps ─────────────────┐
                                      │
Phase 2: block_attributes ────────────┼──→ Phase 4: training_events
                                      │           │
Phase 3: feedback_input ──────────────┘           │
         │                                        │
         └──→ Phase 5: feedback_insights          │
                        │                         │
                        └─────────┬───────────────┘
                                  ↓
                        Phase 6: analytics
                                  ↓
                        Phase 7: recommendations
                                  ↓
                        Phase 8: pdf_export
```

### Phase 1: Player IDPs

**Goal:** Replace `players.target_1/2/3` with proper IDP tracking system.

**Deliverables:**
- Create `player_idps` table
- Remove `target_1`, `target_2`, `target_3` columns from `players` table (fresh DB, no data to migrate)
- Build UI for managing player IDPs (add/edit/end)
- Enforce "at least 1 IDP" rule in UI

**Why first?** Training events JOIN on `player_idps` to filter by active IDPs. Without this table, the entire tracking system cannot function.

---

### Phase 2: Session Block Tagging

**Goal:** Tag session blocks with the attributes they train.

**Deliverables:**
- Create `session_block_attributes` table
- Build manual tagging UI on block create/edit screen
- Integrate LLM auto-suggestion (first-order/second-order prompting)
- Coach accept/modify flow for LLM suggestions

**Why second?** Can be built independently since blocks already exist. Required for training event generation.

---

### Phase 3: Feedback System (Input)

**Goal:** Allow coaches to submit post-session feedback.

**Deliverables:**
- Create `session_feedback` table
- Create `player_feedback_notes` table
- Build feedback UI integrated into session view
- Text input for team-level feedback
- Text input for player-specific notes
- Attendance confirmation (using existing `session_attendance` table)

**Deferred:** Voice recording (add in later iteration)

**Why third?** Feedback submission is the trigger for training event generation.

---

### Phase 4: Training Event Generation

**Goal:** Automatically record training events when feedback is submitted.

**Deliverables:**
- Create `player_training_events` table
- Create `generate_training_events()` RPC function
- Hook function call into feedback submission flow
- Verify events are only created for IDP-matching attributes

**Dependencies:** Requires Phase 1 (IDPs), Phase 2 (block attributes), Phase 3 (feedback trigger)

**Why fourth?** This is the core tracking mechanism - connects players, IDPs, sessions, and block attributes.

---

### Phase 5: Feedback Analysis (LLM Extraction)

**Goal:** Extract structured insights from coach feedback using LLM.

**Deliverables:**
- Create `feedback_insights` table
- Build LLM extraction pipeline (likely async)
- Extract: player mentions, attribute references, sentiment
- Set `processed_at` timestamp when analysis completes

**Can parallelize with Phase 4** - only needs feedback data from Phase 3.

---

### Phase 6: Analytics Dashboard

**Goal:** Visualize player and team progress.

**Deliverables:**
- Player IDP progress view (training units, feedback sentiment, trends)
- Historical IDP analysis (past IDPs with their stats)
- Team overview (attendance rates, IDP coverage)
- Create database views for efficient querying (`player_idp_progress`, `player_attendance_summary`)

**Why sixth?** Requires training events and feedback insights to exist.

---

### Phase 7: Recommendations

**Goal:** Suggest session blocks based on IDP gaps.

**Deliverables:**
- Create `team_idp_gaps` view/query
- Integrate recommendations into session planning UI
- Show: "5 players have undertrained IDPs in First Touch"
- Suggest blocks from library that target those attributes
- Option to create custom block for specific gaps

**Why seventh?** Requires analytics data to identify gaps.

---

### Phase 8: PDF Export

**Goal:** Generate player development reports.

**Deliverables:**
- Server-side PDF generation (Puppeteer or similar)
- Coach report template (full detail, direct language)
- Player/Parent report template (encouraging tone)
- Export button on player detail view
- Include: IDP progress, training stats, feedback highlights, recommendations

**Why last?** Nice-to-have feature that builds on all previous phases.

---

### Phase Summary Table

| Phase | Focus | Key Tables/Features | Dependencies |
|-------|-------|---------------------|--------------|
| 1 | Player IDPs | `player_idps`, IDP management UI | None |
| 2 | Block Tagging | `session_block_attributes`, LLM auto-tag | None |
| 3 | Feedback Input | `session_feedback`, `player_feedback_notes` | None |
| 4 | Training Events | `player_training_events`, generation RPC | 1, 2, 3 |
| 5 | Feedback Analysis | `feedback_insights`, LLM extraction | 3 |
| 6 | Analytics | Progress views, dashboards | 4, 5 |
| 7 | Recommendations | IDP gap analysis, block suggestions | 6 |
| 8 | PDF Export | Report generation | 6 |

---

### Parallel Work Opportunities

Some phases can be worked on simultaneously:

- **Phases 1, 2, 3** can all be built in parallel (no dependencies on each other)
- **Phases 4 and 5** can be built in parallel (both depend on Phase 3)
- **Phases 7 and 8** can be built in parallel (both depend on Phase 6)

### MVP Scope

For a minimal viable product, complete **Phases 1-4**. This gives you:
- IDP tracking per player
- Tagged session blocks
- Post-session feedback
- Training event accumulation

Analytics (Phase 6) and Recommendations (Phase 7) can follow. PDF export (Phase 8) and LLM feedback analysis (Phase 5) are nice-to-haves that enhance the core system.

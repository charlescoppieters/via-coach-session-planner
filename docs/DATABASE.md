# Via Session Planner - Database Documentation

## Overview

The database is PostgreSQL hosted on Supabase. It uses Row Level Security (RLS) for access control, JSONB columns for flexible data structures, and RPC functions for complex analytics.

**Schema Location:** `v3/schema.sql`
**Migrations:** `v3/migrations/`

---

## Table Reference

### Core Entity Tables

#### `coaches`
User accounts for coaches, linked to Supabase Auth.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `auth_user_id` | UUID | Reference to `auth.users(id)` |
| `email` | TEXT | Unique email address |
| `name` | TEXT | Display name |
| `profile_picture` | TEXT | URL to profile image |
| `position` | TEXT | Role title (Head Coach, Assistant, etc.) |
| `onboarding_completed` | BOOLEAN | Whether onboarding wizard is done |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

#### `clubs`
Organizations that own all data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Club name |
| `logo_url` | TEXT | URL to club logo |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

#### `club_memberships`
Links coaches to clubs with roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `club_id` | UUID | Reference to `clubs(id)` |
| `coach_id` | UUID | Reference to `coaches(id)` |
| `role` | TEXT | `admin` or `coach` |
| `joined_at` | TIMESTAMPTZ | When coach joined |

**Constraints:** `UNIQUE(club_id, coach_id)`, role must be `admin` or `coach`

#### `teams`
Teams within a club.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `club_id` | UUID | Reference to `clubs(id)` |
| `created_by_coach_id` | UUID | Coach who created the team |
| `name` | TEXT | Team name |
| `age_group` | TEXT | Age category (U10, U12, etc.) |
| `skill_level` | TEXT | Skill tier (beginner, intermediate, advanced) |
| `gender` | TEXT | Team gender |
| `player_count` | INTEGER | Number of players |
| `sessions_per_week` | INTEGER | Training frequency |
| `session_duration` | INTEGER | Default session length (minutes) |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

#### `team_coaches`
Junction table linking coaches to teams.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | Reference to `teams(id)` |
| `coach_id` | UUID | Reference to `coaches(id)` |
| `assigned_at` | TIMESTAMPTZ | When assigned |

**Constraints:** `UNIQUE(team_id, coach_id)`

#### `players`
Players on teams.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `club_id` | UUID | Reference to `clubs(id)` |
| `team_id` | UUID | Reference to `teams(id)` |
| `name` | TEXT | Player name |
| `age` | INTEGER | Player age |
| `position` | TEXT | Playing position |
| `gender` | TEXT | Gender |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

---

### Session Tables

#### `sessions`
Training sessions for teams.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `club_id` | UUID | Reference to `clubs(id)` |
| `team_id` | UUID | Reference to `teams(id)` |
| `coach_id` | UUID | Coach who created session |
| `session_date` | TIMESTAMPTZ | Date and start time |
| `title` | TEXT | Session title |
| `content` | TEXT | Session plan content |
| `notes` | TEXT | Additional notes |
| `player_count` | INTEGER | Expected players |
| `duration` | INTEGER | Duration in minutes |
| `age_group` | TEXT | Target age group |
| `skill_level` | TEXT | Target skill level |
| `syllabus_week_index` | INTEGER | Week in syllabus (0-indexed) |
| `syllabus_day_of_week` | INTEGER | Day of week (0=Mon, 6=Sun) |
| `theme_block_id` | TEXT | Reference to Game Model block |
| `theme_snapshot` | JSONB | Denormalized theme data |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Theme Snapshot Structure:**
```json
{
  "zoneName": "Attacking Third",
  "blockType": "in_possession",
  "blockName": "Final Third Entry"
}
```

#### `session_blocks`
Reusable training exercises/drills.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Block title |
| `description` | TEXT | Full description |
| `coaching_points` | TEXT | Key coaching points |
| `image_url` | TEXT | Optional image URL |
| `diagram_data` | JSONB | Konva canvas data |
| `duration` | INTEGER | Block duration (minutes) |
| `creator_id` | UUID | Coach who created block |
| `club_id` | UUID | NULL for global blocks |
| `is_public` | BOOLEAN | Whether discoverable |
| `source` | TEXT | `user`, `system`, or `marketplace` |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Diagram Data Structure:**
```json
[
  {"type": "player", "id": "p1", "x": 100, "y": 200, "team": "red", "number": "1"},
  {"type": "cone", "id": "c1", "x": 150, "y": 250, "color": "orange"},
  {"type": "arrow", "id": "a1", "points": [100, 200, 150, 250], "color": "white"},
  {"type": "line", "id": "l1", "points": [50, 50, 100, 100], "dashed": true}
]
```

#### `session_block_assignments`
Links blocks to sessions with ordering.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | UUID | Reference to `sessions(id)` |
| `block_id` | UUID | Reference to `session_blocks(id)` |
| `position` | INTEGER | Order in session (0-indexed) |
| `slot_index` | INTEGER | 0=primary, 1=simultaneous |
| `created_at` | TIMESTAMPTZ | Record creation time |

**Constraints:**
- `UNIQUE(session_id, block_id)` - No duplicate blocks
- `UNIQUE(session_id, position, slot_index)` - One block per slot

#### `session_block_attributes`
Tags blocks with the attributes they train.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `block_id` | UUID | Reference to `session_blocks(id)` |
| `attribute_key` | TEXT | Key from `system_defaults` |
| `relevance` | FLOAT | 0.0-1.0 relevance score |
| `source` | TEXT | `llm`, `coach`, or `system` |
| `order_type` | TEXT | `first` or `second` order |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Constraints:** `UNIQUE(block_id, attribute_key)`

**Order Types:**
- `first`: Primary training focus (full weight)
- `second`: Secondary/indirect training (e.g., GK in shooting drill)

#### `session_attendance`
Tracks player attendance per session.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | UUID | Reference to `sessions(id)` |
| `player_id` | UUID | Reference to `players(id)` |
| `status` | TEXT | `present`, `absent`, `excused` |
| `notes` | TEXT | Attendance notes |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Constraints:** `UNIQUE(session_id, player_id)`

#### `block_player_exclusions`
Players excluded from specific blocks.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `assignment_id` | UUID | Reference to `session_block_assignments(id)` |
| `player_id` | UUID | Reference to `players(id)` |
| `created_at` | TIMESTAMPTZ | Record creation time |

**Constraints:** `UNIQUE(assignment_id, player_id)`

**Purpose:**
- Track which players don't participate in specific blocks
- Used for simultaneous practices (split squads)
- Excluded players don't get training events for that block

---

### IDP & Training Tables

#### `player_idps`
Individual Development Plans with historical tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `player_id` | UUID | Reference to `players(id)` |
| `attribute_key` | TEXT | Attribute being developed |
| `priority` | INTEGER | 1=primary, 2=secondary, 3=tertiary |
| `notes` | TEXT | Coach notes |
| `started_at` | TIMESTAMPTZ | When IDP started |
| `ended_at` | TIMESTAMPTZ | When IDP ended (NULL if active) |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Historical Tracking:**
- Active IDPs have `ended_at = NULL`
- When IDPs change, old ones get `ended_at` set
- Training events are scoped to IDP active period

#### `player_training_events`
Records each training opportunity per player.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `player_id` | UUID | Reference to `players(id)` |
| `session_id` | UUID | Reference to `sessions(id)` |
| `attribute_key` | TEXT | Attribute trained |
| `weight` | FLOAT | Relevance score from block |
| `created_at` | TIMESTAMPTZ | Event timestamp |

**Constraints:** `UNIQUE(player_id, session_id, attribute_key)`

**Generation Logic:**
Events are created when:
1. Player attended session (`status = 'present'`)
2. Player not excluded from block
3. Block has attribute matching player's active IDP

---

### Feedback Tables

#### `session_feedback`
Post-session feedback from coaches.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | UUID | Reference to `sessions(id)` |
| `coach_id` | UUID | Reference to `coaches(id)` |
| `team_feedback` | TEXT | General session feedback |
| `audio_url` | TEXT | Voice recording URL (future) |
| `transcript` | TEXT | Transcribed audio (future) |
| `overall_rating` | INTEGER | 1-5 rating |
| `processed_at` | TIMESTAMPTZ | When LLM processed |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Constraints:** `UNIQUE(session_id)` - One feedback per session

#### `player_feedback_notes`
Player-specific notes within feedback.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_feedback_id` | UUID | Reference to `session_feedback(id)` |
| `player_id` | UUID | Reference to `players(id)` |
| `note` | TEXT | Player-specific note |
| `created_at` | TIMESTAMPTZ | Record creation time |

**Constraints:** `UNIQUE(session_feedback_id, player_id)`

#### `feedback_insights`
LLM-extracted insights from feedback.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_feedback_id` | UUID | Reference to `session_feedback(id)` |
| `player_id` | UUID | NULL for team-level insights |
| `attribute_key` | TEXT | Related attribute (optional) |
| `sentiment` | TEXT | `positive`, `negative`, `neutral` |
| `confidence` | FLOAT | 0.0-1.0 confidence score |
| `extracted_text` | TEXT | Quote from feedback |
| `created_at` | TIMESTAMPTZ | Record creation time |

---

### Methodology Tables

#### `game_model`
Game model with pitch zones.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `club_id` | UUID | Reference to `clubs(id)` |
| `team_id` | UUID | NULL for club-level |
| `created_by_coach_id` | UUID | Creator coach |
| `title` | TEXT | Model title |
| `description` | TEXT | Description |
| `zones` | JSONB | Zone configuration |
| `display_order` | INTEGER | Display ordering |
| `is_active` | BOOLEAN | Whether active |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Zones Structure (v2):**
```json
{
  "zone_count": 3,
  "zones": [
    {
      "id": "zone-1",
      "order": 1,
      "name": "Defensive Third",
      "in_possession": {
        "blocks": [
          {"id": "block-1", "name": "Build Up"},
          {"id": "block-2", "name": "Play Out From Back"}
        ]
      },
      "out_of_possession": {
        "blocks": [
          {"id": "block-1", "name": "High Press"}
        ]
      }
    }
  ]
}
```

#### `training_methodology`
Training syllabus configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `club_id` | UUID | Reference to `clubs(id)` |
| `team_id` | UUID | NULL for club-level |
| `created_by_coach_id` | UUID | Creator coach |
| `title` | TEXT | Title |
| `description` | TEXT | Description |
| `syllabus` | JSONB | Weekly calendar data |
| `display_order` | INTEGER | Display ordering |
| `is_active` | BOOLEAN | Whether active |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Syllabus Structure:**
```json
{
  "weeks": [
    {
      "weekIndex": 0,
      "days": [
        {
          "dayOfWeek": 0,
          "theme": {
            "zoneId": "zone-1",
            "zoneName": "Defensive Third",
            "blockType": "in_possession",
            "blockId": "block-1",
            "blockName": "Build Up"
          }
        }
      ]
    }
  ]
}
```

#### `positional_profiles`
Position attributes configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `club_id` | UUID | Reference to `clubs(id)` |
| `team_id` | UUID | NULL for club-level |
| `position_key` | TEXT | Position identifier |
| `custom_position_name` | TEXT | Custom name (optional) |
| `attributes` | JSONB | Attribute configuration |
| `is_active` | BOOLEAN | Whether active |
| `display_order` | INTEGER | Display ordering |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Attributes Structure:**
```json
{
  "in_possession": ["passing", "first_touch", "vision", "composure", "dribbling"],
  "out_of_possession": ["tackling", "positioning", "anticipation", "aggression", "stamina"]
}
```

#### `team_facilities`
Team facility configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `team_id` | UUID | Reference to `teams(id)` (UNIQUE) |
| `space_type` | TEXT | Pitch type |
| `custom_space` | TEXT | Custom space description |
| `equipment` | JSONB | Available equipment |
| `other_factors` | TEXT | Other considerations |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

---

### System Tables

#### `system_defaults`
Global configuration values.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `category` | TEXT | Category grouping |
| `key` | TEXT | Unique key |
| `value` | JSONB | Value data |
| `display_order` | INTEGER | Sort order |
| `is_active` | BOOLEAN | Whether active |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

**Constraints:** `UNIQUE(category, key)`

**Categories:**
- `attributes_in_possession` - In-possession attributes
- `attributes_out_of_possession` - Out-of-possession attributes
- `attributes_physical` - Physical attributes
- `attributes_psychological` - Psychological attributes
- `positions` - Playing positions
- `age_groups` - Age group options
- `equipment` - Equipment types
- `space_options` - Pitch/space types

**Value Structure:**
```json
{
  "name": "Passing",
  "abbreviation": "PAS",
  "description": "Ability to distribute the ball accurately"
}
```

#### `club_invites`
One-time invite links.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `club_id` | UUID | Reference to `clubs(id)` |
| `email` | TEXT | Invited email |
| `token` | TEXT | Unique invite token |
| `created_by` | UUID | Inviting coach |
| `used_at` | TIMESTAMPTZ | When used (NULL if unused) |
| `created_at` | TIMESTAMPTZ | Record creation time |

---

## Database Views

### `player_idp_progress`
Aggregated IDP progress per player.

```sql
SELECT
    idp_id, player_id, attribute_key, priority,
    idp_notes, started_at, ended_at,
    training_sessions,      -- Count of sessions
    total_training_weight,  -- Sum of weights
    positive_mentions,      -- Positive feedback count
    negative_mentions,      -- Negative feedback count
    neutral_mentions        -- Neutral feedback count
FROM player_idp_progress
```

### `team_idp_gaps`
Undertrained IDPs across team.

```sql
SELECT
    team_id, attribute_key,
    players_with_idp,       -- Count of players
    avg_training_sessions,  -- Average per player
    player_ids,             -- Array of player IDs
    player_names            -- Array of player names
FROM team_idp_gaps
```

### `player_attendance_summary`
Attendance statistics per player.

```sql
SELECT
    player_id, team_id, club_id,
    sessions_attended,
    sessions_missed,
    total_sessions,
    attendance_percentage
FROM player_attendance_summary
```

### `team_training_summary`
Team-level training statistics.

```sql
SELECT
    team_id, club_id,
    sessions_completed,
    total_training_minutes,
    total_players,
    players_with_training,
    active_idps,
    unique_idp_attributes,
    attributes_trained,
    total_training_opportunities
FROM team_training_summary
```

---

## Key Indexes

### Performance Indexes

```sql
-- Session lookups
idx_sessions_team_id ON sessions(team_id)
idx_sessions_date ON sessions(session_date)
idx_sessions_syllabus_latest ON sessions(team_id, session_date DESC)
    WHERE syllabus_week_index IS NOT NULL

-- Training events
idx_pte_player_attribute ON player_training_events(player_id, attribute_key)
idx_pte_player_date ON player_training_events(player_id, created_at)
idx_pte_session ON player_training_events(session_id)

-- IDPs
idx_player_idps_active ON player_idps(player_id) WHERE ended_at IS NULL
idx_player_idps_dates ON player_idps(player_id, started_at, ended_at)

-- Block assignments
idx_sba_position ON session_block_assignments(session_id, position)
idx_session_block_assignments_position_slot ON session_block_assignments(session_id, position, slot_index)
```

### Unique Indexes

```sql
-- Prevent duplicate positions per club
idx_positional_profiles_unique_position ON positional_profiles(club_id, position_key)
    WHERE team_id IS NULL
idx_positional_profiles_unique_position_team ON positional_profiles(club_id, team_id, position_key)
    WHERE team_id IS NOT NULL
```

---

## Triggers

### `update_updated_at_column()`
Automatically updates `updated_at` on row modification.

Applied to: `coaches`, `clubs`, `teams`, `players`, `sessions`, `session_blocks`, `session_attendance`, `system_defaults`, `game_model`, `training_methodology`, `positional_profiles`, `team_facilities`, `session_block_attributes`, `player_idps`, `session_feedback`

---

## Row Level Security (RLS)

All tables have RLS enabled with policies following these patterns:

### SELECT Policies
- Coaches can view their own data
- Club members can view club data
- Public blocks viewable by all

### INSERT Policies
- Must be authenticated
- Must have appropriate club membership
- Creator must be the authenticated user

### UPDATE Policies
- Creator or admin can update
- Club-level data: admin only
- Team-level data: admin or assigned coach

### DELETE Policies
- Admin role required for most deletions
- Some self-removal allowed (leaving club, etc.)

---

## Migration History

| Migration | Date | Purpose |
|-----------|------|---------|
| `20241211000000_analysis_and_feedback_system.sql` | 2024-12-11 | Player IDPs, block attributes, training events, feedback |
| `20241212000000_add_order_type_to_block_attributes.sql` | 2024-12-12 | First/second order attribute distinction |
| `20241213000000_add_ball_rolling_time_to_blocks.sql` | 2024-12-13 | Ball rolling time tracking |
| `20241214000000_update_idp_historical_logic.sql` | 2024-12-14 | IDP historical tracking improvements |
| `20241215000000_team_analytics_views.sql` | 2024-12-15 | Team analytics views and functions |
| `20241217000000_add_player_names_to_block_recommendations.sql` | 2024-12-17 | Player names in recommendations |
| `20241220000000_recommendation_scoring.sql` | 2024-12-20 | Priority scoring system |
| `20241221000000_player_analytics_functions.sql` | 2024-12-21 | Individual player analytics |
| `20241228000000_rename_playing_methodology_to_game_model.sql` | 2024-12-28 | Rename to game_model |
| `20241228000001_fix_revert_team_game_model_signature.sql` | 2024-12-28 | Fix function signature |
| `20241229000000_training_syllabus.sql` | 2024-12-29 | Training syllabus overhaul |
| `20241230000000_session_syllabus_integration.sql` | 2024-12-30 | Session-syllabus linking |
| `20241231000000_simultaneous_practices.sql` | 2024-12-31 | Simultaneous practice support |
| `20241231000001_block_player_attendance.sql` | 2024-12-31 | Block-level player exclusions |

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Platform architecture overview
- [IDP_TRACKING.md](./IDP_TRACKING.md) - Analytics calculation documentation
- [API.md](./API.md) - API and RPC function reference

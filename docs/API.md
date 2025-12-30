# Via Session Planner - API Documentation

## Overview

The API consists of:
1. **Next.js API Routes** - HTTP endpoints for AI and special operations
2. **Supabase RPC Functions** - PostgreSQL functions called via Supabase client
3. **Library Functions** - TypeScript functions that wrap Supabase queries

---

## Next.js API Routes

### AI Coach Assistant

**Endpoint:** `POST /api/ai/coach`

Provides AI-powered coaching assistance for session planning.

**Request Body:**
```typescript
{
  message: string           // Coach's question or request
  sessionData: {
    title: string
    date: string
    duration: number
    teamName: string
    ageGroup: string
    skillLevel: string
    playerCount: number
  }
  currentContent: string    // Current session plan content
  teamRules: string[]       // Global methodology rules
  teamSpecificRules: string[] // Team-specific rules
  playerIDPs: {
    name: string
    target1: string
    target2?: string
    target3?: string
    notes?: string
  }[]
}
```

**Response:**
```typescript
{
  intent: 'question' | 'change'
  message: string           // Response message
  updated_session?: string  // Modified content (if intent = 'change')
}
```

**Behavior:**
- Analyzes coach's message to determine intent
- For questions: Provides coaching advice
- For changes: Modifies session plan while maintaining duration constraints
- Uses Claude 3.5 Sonnet via AWS Bedrock

**Error Response:**
```typescript
{
  error: string
}
```

---

### Block Content Generation

**Endpoint:** `POST /api/ai/generate-block-content`

Generates training block content from a title.

**Request Body:**
```typescript
{
  title: string             // Block title
  theme?: {                 // Optional theme context
    zoneName: string
    blockType: 'in_possession' | 'out_of_possession'
    blockName: string
  }
}
```

**Response:**
```typescript
{
  description: string       // Full drill description
  coachingPoints: string    // Key coaching points
  firstOrderOutcomes: {     // Primary attributes
    key: string
    name: string
  }[]
  secondOrderOutcomes: {    // Secondary attributes
    key: string
    name: string
  }[]
}
```

**Model:** Claude 3 Haiku (fast generation)

---

### Player Report Generation

**Endpoint:** `GET /api/players/[id]/report`

Generates a PDF report for a player.

**Response:** PDF file download

**Requires:** Authentication

---

### Invite Management

**Endpoint:** `POST /api/invites`

Creates club invite links.

**Request Body:**
```typescript
{
  clubId: string
  email: string
}
```

**Response:**
```typescript
{
  token: string
  inviteUrl: string
}
```

---

### Bedrock Test

**Endpoint:** `GET /api/test-bedrock`

Tests AWS Bedrock connectivity.

**Response:**
```typescript
{
  success: boolean
  message?: string
  error?: string
}
```

---

## Supabase RPC Functions

All RPC functions are called via Supabase client:

```typescript
const { data, error } = await supabase.rpc('function_name', { param1, param2 })
```

### Training Event Functions

#### `generate_training_events(p_session_id)`

Generates training events for a completed session.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_session_id` | UUID | Session to process |

**Returns:** `INTEGER` - Count of events created

**Logic:**
1. Validates caller has club access
2. For each present player not excluded from blocks
3. Creates events for attributes matching active IDPs
4. Returns count of new events

**Security:** DEFINER (bypasses RLS)

---

#### `update_player_idps(p_player_id, p_new_idps)`

Updates player's IDPs (ends current, creates new).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_player_id` | UUID | Player to update |
| `p_new_idps` | JSONB | Array of new IDPs |

**IDP Object:**
```json
{
  "attribute_key": "passing",
  "priority": 1,
  "notes": "Focus on weight of pass"
}
```

**Returns:** `VOID`

**Logic:**
1. Validates at least 1 IDP provided
2. Sets `ended_at = NOW()` on current active IDPs
3. Inserts new IDPs with `ended_at = NULL`

---

#### `get_accidental_idps(p_player_id)`

Finds IDPs that lasted less than 24 hours (likely mistakes).

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_player_id` | UUID | Player to check |

**Returns:** Table of:
| Column | Type |
|--------|------|
| `idp_id` | UUID |
| `attribute_key` | TEXT |
| `duration_hours` | FLOAT |

---

### Team Analytics Functions

#### `get_team_training_summary(p_team_id, p_start_date?, p_end_date?)`

Returns aggregate training statistics for a team.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_team_id` | UUID | required | Team ID |
| `p_start_date` | TIMESTAMPTZ | NULL | Start of date range |
| `p_end_date` | TIMESTAMPTZ | NULL | End of date range |

**Returns:** Single row with:
| Column | Type | Description |
|--------|------|-------------|
| `team_id` | UUID | Team ID |
| `sessions_completed` | BIGINT | Sessions with feedback |
| `total_training_minutes` | BIGINT | Total duration |
| `total_players` | BIGINT | Player count |
| `active_idps` | BIGINT | Active IDP count |
| `unique_idp_attributes` | BIGINT | Distinct attributes |
| `attributes_trained` | BIGINT | Trained attributes |
| `idp_coverage_rate` | NUMERIC | % of IDPs trained |
| `avg_attendance_percentage` | NUMERIC | Attendance rate |

---

#### `get_team_idp_gaps(p_team_id, p_start_date?, p_end_date?)`

Returns undertrained IDPs across the team.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_team_id` | UUID | required | Team ID |
| `p_start_date` | TIMESTAMPTZ | NULL | Start of date range |
| `p_end_date` | TIMESTAMPTZ | NULL | End of date range |

**Returns:** Table sorted by `priority_score` DESC:
| Column | Type | Description |
|--------|------|-------------|
| `attribute_key` | TEXT | Attribute identifier |
| `attribute_name` | TEXT | Display name |
| `players_with_idp` | BIGINT | Player count |
| `players_trained` | BIGINT | Trained player count |
| `last_trained_date` | TIMESTAMPTZ | Most recent training |
| `days_since_trained` | INTEGER | Days since trained |
| `sessions_since_trained` | INTEGER | Sessions since trained |
| `total_sessions` | INTEGER | Total team sessions |
| `player_ids` | UUID[] | Array of player IDs |
| `player_names` | TEXT[] | Array of player names |
| `gap_status` | TEXT | `urgent`/`due`/`on_track` |
| `training_sessions` | JSONB | Session details array |
| `priority_score` | NUMERIC | 0-100 weighted score |

---

#### `get_team_attribute_breakdown(p_team_id, p_start_date?, p_end_date?)`

Returns training distribution by Four Corner category.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_team_id` | UUID | required | Team ID |
| `p_start_date` | TIMESTAMPTZ | NULL | Start of date range |
| `p_end_date` | TIMESTAMPTZ | NULL | End of date range |

**Returns:** Table (one row per category):
| Column | Type | Description |
|--------|------|-------------|
| `category` | TEXT | Category key |
| `category_display_name` | TEXT | Display name |
| `total_opportunities` | NUMERIC | Sum of weights |
| `attribute_count` | BIGINT | Distinct attributes |
| `attributes` | JSONB | Per-attribute breakdown |

**Categories:** `In Possession`, `Out of Possession`, `Physical`, `Psychological`

---

#### `get_team_player_matrix(p_team_id, p_start_date?, p_end_date?)`

Returns per-player development data.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_team_id` | UUID | required | Team ID |
| `p_start_date` | TIMESTAMPTZ | NULL | Start of date range |
| `p_end_date` | TIMESTAMPTZ | NULL | End of date range |

**Returns:** Table sorted by attendance DESC:
| Column | Type | Description |
|--------|------|-------------|
| `player_id` | UUID | Player ID |
| `player_name` | TEXT | Display name |
| `position` | TEXT | Playing position |
| `sessions_attended` | BIGINT | Attendance count |
| `total_sessions` | BIGINT | Total sessions |
| `attendance_percentage` | NUMERIC | Attendance rate |
| `active_idp_count` | BIGINT | Active IDP count |
| `most_trained_idp` | TEXT | Best-trained IDP |
| `most_trained_sessions` | BIGINT | Session count |
| `mid_trained_idp` | TEXT | Mid-trained IDP |
| `mid_trained_sessions` | BIGINT | Session count |
| `least_trained_idp` | TEXT | Least-trained IDP |
| `least_trained_sessions` | BIGINT | Session count |

---

#### `get_team_block_recommendations(p_team_id, p_start_date?, p_end_date?, p_limit?)`

Returns training blocks sorted by IDP impact.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_team_id` | UUID | required | Team ID |
| `p_start_date` | TIMESTAMPTZ | NULL | Start of date range |
| `p_end_date` | TIMESTAMPTZ | NULL | End of date range |
| `p_limit` | INTEGER | 10 | Max results |

**Returns:** Table sorted by `priority_score` DESC:
| Column | Type | Description |
|--------|------|-------------|
| `block_id` | UUID | Block ID |
| `block_title` | TEXT | Block name |
| `priority_score` | NUMERIC | Calculated score |
| `idp_impact_count` | BIGINT | IDPs addressed |
| `first_order_attributes` | JSONB | Primary attributes |
| `second_order_attributes` | JSONB | Secondary attributes |
| `impacted_players` | JSONB | Affected players |
| `idp_breakdown` | JSONB | Per-IDP scores |

---

#### `get_team_session_block_usage(p_team_id, p_start_date?, p_end_date?, p_limit?)`

Returns most frequently used blocks.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_team_id` | UUID | required | Team ID |
| `p_start_date` | TIMESTAMPTZ | NULL | Start of date range |
| `p_end_date` | TIMESTAMPTZ | NULL | End of date range |
| `p_limit` | INTEGER | 10 | Max results |

**Returns:** Table sorted by `usage_count` DESC:
| Column | Type | Description |
|--------|------|-------------|
| `block_id` | UUID | Block ID |
| `block_title` | TEXT | Block name |
| `usage_count` | BIGINT | Times used |
| `active_idp_impact` | BIGINT | Players with matching IDPs |
| `first_order_attributes` | JSONB | Primary attributes |
| `second_order_attributes` | JSONB | Secondary attributes |
| `impacted_players` | JSONB | Affected players |

---

#### `get_team_training_trend(p_team_id, p_weeks?)`

Returns weekly training trend data.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_team_id` | UUID | required | Team ID |
| `p_weeks` | INTEGER | 12 | Weeks to include |

**Returns:** Table:
| Column | Type | Description |
|--------|------|-------------|
| `week_start` | DATE | Start of week |
| `week_label` | TEXT | Display label |
| `sessions_count` | BIGINT | Sessions that week |
| `total_opportunities` | NUMERIC | Training opportunities |
| `avg_attendance` | NUMERIC | Attendance percentage |

---

#### `get_player_comparison(p_player_ids, p_start_date?, p_end_date?)`

Compares multiple players side-by-side.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_player_ids` | UUID[] | required | Players to compare |
| `p_start_date` | TIMESTAMPTZ | NULL | Start of date range |
| `p_end_date` | TIMESTAMPTZ | NULL | End of date range |

**Returns:** Table:
| Column | Type | Description |
|--------|------|-------------|
| `player_id` | UUID | Player ID |
| `player_name` | TEXT | Display name |
| `position` | TEXT | Playing position |
| `sessions_attended` | BIGINT | Attendance count |
| `total_sessions` | BIGINT | Total sessions |
| `attendance_percentage` | NUMERIC | Attendance rate |
| `total_opportunities` | NUMERIC | Training total |
| `idps` | JSONB | IDPs with progress |

---

### Player Analytics Functions

#### `get_player_idp_priorities(p_player_id)`

Returns all IDPs for a player with priority scores.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_player_id` | UUID | Player ID |

**Returns:** Table sorted by active then priority_score:
| Column | Type | Description |
|--------|------|-------------|
| `idp_id` | UUID | IDP ID |
| `attribute_key` | TEXT | Attribute identifier |
| `attribute_name` | TEXT | Display name |
| `priority` | INTEGER | 1-3 priority |
| `priority_score` | NUMERIC | 0-100 score |
| `days_since_trained` | INTEGER | Days since trained |
| `last_trained_date` | TIMESTAMPTZ | Most recent training |
| `training_sessions` | BIGINT | Session count |
| `total_training_weight` | NUMERIC | Sum of weights |
| `negative_mentions` | BIGINT | Negative feedback |
| `positive_mentions` | BIGINT | Positive feedback |
| `neutral_mentions` | BIGINT | Neutral feedback |
| `gap_status` | TEXT | `urgent`/`due`/`on_track` |
| `started_at` | TIMESTAMPTZ | IDP start |
| `ended_at` | TIMESTAMPTZ | IDP end (NULL if active) |
| `idp_notes` | TEXT | Coach notes |

---

#### `get_player_feedback_insights(p_player_id, ...)`

Returns feedback insights for a player.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_player_id` | UUID | required | Player ID |
| `p_attribute_key` | TEXT | NULL | Filter by attribute |
| `p_sentiment` | TEXT | NULL | Filter by sentiment |
| `p_start_date` | TIMESTAMPTZ | NULL | Start of range |
| `p_end_date` | TIMESTAMPTZ | NULL | End of range |
| `p_limit` | INTEGER | 50 | Max results |
| `p_offset` | INTEGER | 0 | Pagination offset |

**Returns:** Table:
| Column | Type | Description |
|--------|------|-------------|
| `insight_id` | UUID | Insight ID |
| `session_feedback_id` | UUID | Feedback ID |
| `session_id` | UUID | Session ID |
| `session_title` | TEXT | Session name |
| `session_date` | TIMESTAMPTZ | Session date |
| `attribute_key` | TEXT | Attribute identifier |
| `attribute_name` | TEXT | Display name |
| `sentiment` | TEXT | positive/negative/neutral |
| `confidence` | FLOAT | 0-1 confidence |
| `extracted_text` | TEXT | Quote from feedback |
| `created_at` | TIMESTAMPTZ | Creation time |

---

#### `get_player_feedback_insights_count(p_player_id, ...)`

Returns total count for pagination.

**Parameters:** Same as `get_player_feedback_insights` except no limit/offset

**Returns:** `INTEGER`

---

#### `get_player_block_recommendations(p_player_id, p_limit?)`

Returns blocks sorted by impact on player's IDPs.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_player_id` | UUID | required | Player ID |
| `p_limit` | INTEGER | 10 | Max results |

**Returns:** Table:
| Column | Type | Description |
|--------|------|-------------|
| `block_id` | UUID | Block ID |
| `block_title` | TEXT | Block name |
| `priority_score` | NUMERIC | Calculated score |
| `idp_impact_count` | BIGINT | IDPs addressed |
| `first_order_attributes` | JSONB | Primary attributes |
| `second_order_attributes` | JSONB | Secondary attributes |
| `idp_breakdown` | JSONB | Per-IDP scores |

---

#### `get_player_training_balance(p_player_id)`

Returns Four Corner breakdown for a player.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_player_id` | UUID | Player ID |

**Returns:** Table:
| Column | Type | Description |
|--------|------|-------------|
| `category` | TEXT | Category key |
| `category_display_name` | TEXT | Display name |
| `total_opportunities` | NUMERIC | Sum of weights |
| `percentage` | NUMERIC | % of total |
| `attribute_count` | BIGINT | Distinct attributes |
| `attributes` | JSONB | Per-attribute breakdown |

---

### Scoring Functions

#### `calculate_idp_priority_score(...)`

Calculates team-level IDP priority score.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_days_since_trained` | INTEGER | Days since trained |
| `p_players_with_idp` | INTEGER | Player count |
| `p_total_players` | INTEGER | Total team players |
| `p_negative_mentions` | INTEGER | Negative feedback |
| `p_positive_mentions` | INTEGER | Positive feedback |
| `p_neutral_mentions` | INTEGER | Neutral feedback |

**Returns:** `NUMERIC` (0-100)

**Formula:**
```
Score = (0.45 × Urgency) + (0.35 × PlayerReach) + (0.20 × Sentiment)
```

---

#### `calculate_player_idp_priority_score(...)`

Calculates individual player IDP priority score.

**Parameters:**
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `p_days_since_trained` | INTEGER | required | Days since trained |
| `p_training_sessions` | INTEGER | required | Sessions trained |
| `p_expected_sessions` | INTEGER | 10 | Expected sessions |
| `p_negative_mentions` | INTEGER | 0 | Negative feedback |
| `p_positive_mentions` | INTEGER | 0 | Positive feedback |
| `p_neutral_mentions` | INTEGER | 0 | Neutral feedback |

**Returns:** `NUMERIC` (0-100)

**Formula:**
```
Score = (0.55 × Urgency) + (0.25 × TrainingFrequency) + (0.20 × Sentiment)
```

---

### Methodology Functions

#### `copy_club_methodology_to_team(p_team_id, p_club_id, p_coach_id)`

Copies club methodology to a new team.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_team_id` | UUID | Target team |
| `p_club_id` | UUID | Source club |
| `p_coach_id` | UUID | Creating coach |

**Returns:** `JSON` with `{ success: true }`

**Copies:**
- Game Model zones
- Positional profiles
- Training syllabus

---

#### `revert_team_training_syllabus(p_team_id, p_club_id)`

Reverts team syllabus to club version.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_team_id` | UUID | Team to revert |
| `p_club_id` | UUID | Source club |

**Returns:** `JSON` with `{ success: true }`

---

#### `get_latest_syllabus_session(p_team_id)`

Gets most recent session linked to syllabus.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_team_id` | UUID | Team ID |

**Returns:** Single row with session syllabus fields

---

### Feedback Functions

#### `insert_feedback_insights(p_session_feedback_id, p_insights)`

Inserts LLM-extracted insights.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `p_session_feedback_id` | UUID | Feedback ID |
| `p_insights` | JSONB | Array of insights |

**Insight Object:**
```json
{
  "player_id": "uuid or null",
  "attribute_key": "string or null",
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "extracted_text": "Quote from feedback"
}
```

**Returns:** `INTEGER` - Count of insights created

**Side Effect:** Sets `processed_at` on feedback

---

## Library Functions

### Authentication (`src/lib/auth.ts`)

```typescript
// Send OTP to email
signInWithOTP(email: string): Promise<{ error: string | null }>

// Verify OTP code
verifyOTP(email: string, token: string): Promise<{ data, error }>

// Ensure coach profile exists
ensureCoachProfile(userId: string, email: string): Promise<Coach>

// Get coach's club membership
getCoachClubMembership(coachId: string): Promise<{ club, membership }>

// Create new club
createClub(name: string, coachId: string, logoUrl?: string): Promise<Club>
```

### Sessions (`src/lib/sessions.ts`)

```typescript
// Get sessions for coach/team
getSessions(coachId: string, teamId?: string): Promise<Session[]>

// Create new session
createSession(data: CreateSessionData): Promise<Session>

// Update session
updateSession(id: string, updates: Partial<Session>): Promise<Session>

// Delete session
deleteSession(id: string): Promise<void>

// Get upcoming sessions
getUpcomingSessions(teamId: string): Promise<Session[]>
```

### Session Blocks (`src/lib/sessionBlocks.ts`)

```typescript
// Get blocks for club
getSessionBlocks(clubId: string): Promise<SessionBlock[]>

// Create block
createSessionBlock(block: CreateBlockData): Promise<SessionBlock>

// Update block
updateSessionBlock(id: string, updates: Partial<SessionBlock>): Promise<SessionBlock>

// Delete block
deleteSessionBlock(id: string): Promise<void>

// Assign block to session
assignBlockToSession(assignment: BlockAssignment): Promise<void>

// Get blocks assigned to session
getAssignedBlocks(sessionId: string): Promise<AssignedBlock[]>
```

### Players (`src/lib/players.ts`)

```typescript
// Get team players
getTeamPlayers(teamId: string): Promise<Player[]>

// Create player
createPlayer(data: CreatePlayerData): Promise<Player>

// Update player
updatePlayer(id: string, data: Partial<Player>): Promise<Player>

// Delete player
deletePlayer(id: string): Promise<void>

// Get player IDPs
getPlayerIDPs(playerId: string): Promise<PlayerIDP[]>
```

### Team Analytics (`src/lib/teamAnalytics.ts`)

```typescript
// Wrapper functions for RPC calls
getTeamTrainingSummary(teamId, startDate?, endDate?)
getTeamIDPGaps(teamId, startDate?, endDate?)
getTeamAttributeBreakdown(teamId, startDate?, endDate?)
getTeamPlayerMatrix(teamId, startDate?, endDate?)
getTeamBlockRecommendations(teamId, startDate?, endDate?, limit?)
getTeamSessionBlockUsage(teamId, startDate?, endDate?, limit?)
getTeamTrainingTrend(teamId, weeks?)
```

### Player Analytics (`src/lib/playerAnalytics.ts`)

```typescript
// Wrapper functions for RPC calls
getPlayerIDPPriorities(playerId)
getPlayerFeedbackInsights(playerId, filters)
getPlayerBlockRecommendations(playerId, limit?)
getPlayerTrainingBalance(playerId)
```

---

## Error Handling

### Standard Pattern

All functions return:
```typescript
{ data: T | null, error: string | null }
```

### Retry Logic

Session-sensitive operations use `withSessionRetry`:
```typescript
const result = await withSessionRetry(async () => {
  return await supabaseOperation()
})
```

### RPC Error Handling

```typescript
const { data, error } = await supabase.rpc('function_name', params)

if (error) {
  // Handle error
  console.error('RPC error:', error.message)
  return { data: null, error: error.message }
}

return { data, error: null }
```

---

## Authentication

All API routes require authentication via Supabase session cookie.

```typescript
// Server-side auth check
const supabase = createServerClient()
const { data: { session } } = await supabase.auth.getSession()

if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

RPC functions use `auth.uid()` for access control:
```sql
WHERE cm.coach_id = (SELECT id FROM coaches WHERE auth_user_id = auth.uid())
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Platform architecture
- [DATABASE.md](./DATABASE.md) - Database schema
- [IDP_TRACKING.md](./IDP_TRACKING.md) - Analytics calculations

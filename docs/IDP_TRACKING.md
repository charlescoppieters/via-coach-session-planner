# Via Session Planner - IDP Documentation

## Overview

The analytics system tracks player development through Individual Development Plans (IDPs), training events, and feedback insights. It provides both team-level and individual player analytics to help coaches make data-driven decisions. 

This document explains how player data is calculated, the IDP system, priority scoring, and how all metrics flow through the system.

---

## Core Concepts

### The Four Corner Model

The platform organizes attributes into four categories aligned with the FA's Four Corner Model:

| Category | Description | Examples |
|----------|-------------|----------|
| **In Possession** | Technical skills when team has ball | Passing, First Touch, Dribbling |
| **Out of Possession** | Skills when defending | Tackling, Positioning, Pressing |
| **Physical** | Athletic attributes | Pace, Stamina, Strength, Agility |
| **Psychological** | Mental attributes | Decision Making, Composure, Leadership |

Attributes are stored in `system_defaults` with categories:
- `attributes_in_possession`
- `attributes_out_of_possession`
- `attributes_physical`
- `attributes_psychological`

### Training Outcomes: First & Second Order

Each training block trains attributes at two levels:

| Order Type | Weight | Description | Example |
|------------|--------|-------------|---------|
| **First Order** | 1.0 | Primary training focus | Shooting drill → Shooting |
| **Second Order** | 0.5 | Secondary/indirect training | Shooting drill → GK Shot Stopping |

This enables accurate tracking when:
- A shooting drill primarily trains shooting but also trains goalkeepers
- A rondo trains passing primarily but also decision making
- Simultaneous practices train different players on different attributes

---

## Individual Development Plans (IDPs)

### IDP Structure

Each player can have 1-3 active IDPs:

```
Player
└── Active IDPs (ended_at IS NULL)
    ├── Priority 1 (Primary Focus)
    ├── Priority 2 (Secondary)
    └── Priority 3 (Tertiary)
```

### IDP Lifecycle

```
┌─────────────────┐
│  Coach Sets     │
│  New IDPs       │
├─────────────────┤
│ update_player_  │
│ idps() called   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Old Active IDPs │
│ get ended_at    │
│ = NOW()         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ New IDPs        │
│ inserted with   │
│ ended_at = NULL │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Training events │
│ now generate    │
│ for new IDPs    │
└─────────────────┘
```

### Historical Tracking

IDPs maintain full history:
- `started_at`: When IDP was assigned
- `ended_at`: When IDP was changed (NULL if active)
- Training events are scoped to the IDP's active period

This enables:
- Viewing historical IDP progress
- Calculating training during specific periods
- Detecting "accidental" IDPs (< 24 hours)

---

## Training Event Generation

### When Events Are Generated

Training events are created when `generate_training_events(session_id)` is called (typically on feedback submission).

### Generation Logic

```sql
INSERT INTO player_training_events
SELECT player, session, attribute, relevance
FROM session_attendance sa
JOIN session_block_assignments sba ON sba.session_id = session
JOIN session_block_attributes attr ON attr.block_id = sba.block_id
JOIN player_idps pi ON pi.player_id = sa.player_id
    AND pi.attribute_key = attr.attribute_key
    AND pi.ended_at IS NULL
WHERE sa.status = 'present'
    AND NOT EXISTS (
        SELECT 1 FROM block_player_exclusions bpe
        WHERE bpe.assignment_id = sba.id
        AND bpe.player_id = sa.player_id
    )
```

### Criteria for Event Creation

A training event is created when ALL conditions are met:

1. **Player attended session** (`status = 'present'`)
2. **Player not excluded from block** (no row in `block_player_exclusions`)
3. **Block trains an attribute** (exists in `session_block_attributes`)
4. **Attribute matches active IDP** (exists in `player_idps` with `ended_at IS NULL`)

### Weight Calculation

The `weight` field reflects training intensity:
- First-order attributes: `weight = 1.0`
- Second-order attributes: `weight = 0.5` (typically)
- Can be customized per block

---

## Priority Scoring System

### Team IDP Priority Score

Used by `get_team_idp_gaps()` and `get_team_block_recommendations()`.

**Formula:**
```
IDP_Score = (0.45 × Urgency) + (0.35 × PlayerReach) + (0.20 × SentimentSignal)
```

**Components:**

#### Urgency (45%)
How overdue is training for this attribute?

```
if never_trained:
    urgency = 100
elif days_since_trained < 7:
    urgency = 0
else:
    urgency = min(100, (1 - e^(-0.1 × (days - 7))) × 100)
```

| Days Since Trained | Urgency Score |
|-------------------|---------------|
| 0-6 | 0 |
| 7 | ~0 |
| 14 | ~50 |
| 21 | ~75 |
| 30+ | ~90-100 |
| Never | 100 |

#### Player Reach (35%)
What percentage of the team has this IDP active?

```
player_reach = (players_with_idp / total_players) × 100
```

#### Sentiment Signal (20%)
What does feedback say about this attribute?

```
if no_mentions:
    sentiment = 50  # Neutral
else:
    sentiment = 50 + ((negative - positive) / total) × 50
    # Range: 0 (all positive) to 100 (all negative)
```

Higher negative feedback = higher priority (needs more work).

### Individual Player IDP Priority Score

Used by `get_player_idp_priorities()` and `get_player_block_recommendations()`.

**Formula:**
```
Player_IDP_Score = (0.55 × Urgency) + (0.25 × TrainingFrequency) + (0.20 × Sentiment)
```

**Differences from Team Score:**
- Urgency weighted higher (55% vs 45%)
- PlayerReach replaced with TrainingFrequency
- TrainingFrequency is inverse: fewer sessions = higher priority

#### Training Frequency (25%)
How undertrained is this IDP relative to expectations?

```
training_frequency = (1 - (sessions_trained / expected_sessions)) × 100
# At 0 sessions: 100
# At expected sessions: 0
```

---

## Gap Status Classification

IDPs are classified into gap statuses:

| Status | Criteria | UI Treatment |
|--------|----------|--------------|
| `urgent` | Never trained OR 3+ sessions since | Red, high priority |
| `due` | 2 sessions since trained | Yellow, medium priority |
| `on_track` | Trained within last 1-2 sessions | Green, low priority |

---

## Team Analytics Functions

### `get_team_training_summary(team_id, start_date?, end_date?)`

Returns aggregate team statistics.

**Output:**
| Field | Description |
|-------|-------------|
| `sessions_completed` | Sessions with feedback |
| `total_training_minutes` | Sum of session durations |
| `total_players` | Player count |
| `active_idps` | Active IDP count |
| `unique_idp_attributes` | Distinct IDP attributes |
| `attributes_trained` | Distinct trained attributes |
| `idp_coverage_rate` | % of IDP attrs that were trained |
| `avg_attendance_percentage` | Team attendance rate |

### `get_team_idp_gaps(team_id, start_date?, end_date?)`

Returns undertrained IDPs across the team.

**Output:**
| Field | Description |
|-------|-------------|
| `attribute_key` | Attribute identifier |
| `attribute_name` | Display name |
| `players_with_idp` | Players with this IDP |
| `players_trained` | Players who received training |
| `last_trained_date` | Most recent training |
| `days_since_trained` | Days since last trained |
| `sessions_since_trained` | Sessions since trained |
| `player_ids` | Array of player UUIDs |
| `player_names` | Array of player names |
| `gap_status` | `urgent`, `due`, `on_track` |
| `priority_score` | 0-100 weighted score |
| `training_sessions` | JSON array of session details |

**Sorting:** By `priority_score` descending.

### `get_team_attribute_breakdown(team_id, start_date?, end_date?)`

Returns training distribution by Four Corner category.

**Output:**
| Field | Description |
|-------|-------------|
| `category` | Category key |
| `category_display_name` | Display name |
| `total_opportunities` | Sum of weights |
| `attribute_count` | Distinct attributes |
| `attributes` | JSON array with per-attribute breakdown |

### `get_team_player_matrix(team_id, start_date?, end_date?)`

Returns per-player development data.

**Output:**
| Field | Description |
|-------|-------------|
| `player_id` | Player UUID |
| `player_name` | Display name |
| `position` | Playing position |
| `sessions_attended` | Attendance count |
| `total_sessions` | Total sessions |
| `attendance_percentage` | Attendance rate |
| `active_idp_count` | Active IDP count |
| `most_trained_idp` | Best-trained IDP name |
| `most_trained_sessions` | Session count for best |
| `mid_trained_idp` | Mid-trained IDP |
| `mid_trained_sessions` | Session count |
| `least_trained_idp` | Least-trained IDP |
| `least_trained_sessions` | Session count |

### `get_team_block_recommendations(team_id, start_date?, end_date?, limit?)`

Returns training blocks sorted by IDP impact.

**Block Score Calculation:**
```
Block_Score = Σ (IDP_Priority_Score × Block_Relevance)
```

For each attribute the block trains that matches a team IDP, multiply the IDP's priority score by the block's relevance for that attribute.

**Output:**
| Field | Description |
|-------|-------------|
| `block_id` | Block UUID |
| `block_title` | Block name |
| `priority_score` | Calculated score |
| `idp_impact_count` | Number of IDPs addressed |
| `first_order_attributes` | Primary attributes (JSON) |
| `second_order_attributes` | Secondary attributes (JSON) |
| `impacted_players` | Players who would benefit (JSON) |
| `idp_breakdown` | Per-IDP score breakdown (JSON) |

### `get_team_session_block_usage(team_id, start_date?, end_date?, limit?)`

Returns most frequently used blocks.

**Output:**
| Field | Description |
|-------|-------------|
| `block_id` | Block UUID |
| `block_title` | Block name |
| `usage_count` | Times used |
| `active_idp_impact` | Players with matching IDPs |
| `first_order_attributes` | Primary attributes (JSON) |
| `second_order_attributes` | Secondary attributes (JSON) |
| `impacted_players` | Affected players (JSON) |

### `get_team_training_trend(team_id, weeks?)`

Returns weekly training trend data.

**Output:**
| Field | Description |
|-------|-------------|
| `week_start` | Start of week |
| `week_label` | Display label (e.g., "Dec 23") |
| `sessions_count` | Sessions that week |
| `total_opportunities` | Training opportunities |
| `avg_attendance` | Attendance percentage |

---

## Player Analytics Functions

### `get_player_idp_priorities(player_id)`

Returns all IDPs for a player with scores.

**Output:**
| Field | Description |
|-------|-------------|
| `idp_id` | IDP UUID |
| `attribute_key` | Attribute identifier |
| `attribute_name` | Display name |
| `priority` | 1-3 priority level |
| `priority_score` | 0-100 weighted score |
| `days_since_trained` | Days since last training |
| `last_trained_date` | Most recent training |
| `training_sessions` | Session count |
| `total_training_weight` | Sum of weights |
| `negative_mentions` | Negative feedback count |
| `positive_mentions` | Positive feedback count |
| `neutral_mentions` | Neutral feedback count |
| `gap_status` | `urgent`, `due`, `on_track` |
| `started_at` | IDP start date |
| `ended_at` | IDP end date (NULL if active) |
| `idp_notes` | Coach notes |

### `get_player_feedback_insights(player_id, ...filters)`

Returns feedback insights with extracted quotes.

**Filters:**
- `attribute_key` - Filter by attribute
- `sentiment` - Filter by sentiment type
- `start_date`, `end_date` - Date range
- `limit`, `offset` - Pagination

**Output:**
| Field | Description |
|-------|-------------|
| `insight_id` | Insight UUID |
| `session_id` | Source session |
| `session_title` | Session name |
| `session_date` | Session date |
| `attribute_key` | Related attribute |
| `attribute_name` | Display name |
| `sentiment` | `positive`, `negative`, `neutral` |
| `confidence` | 0-1 confidence score |
| `extracted_text` | Quote from feedback |

### `get_player_block_recommendations(player_id, limit?)`

Returns blocks sorted by impact on player's IDPs.

Uses same scoring as team recommendations but scoped to individual player's active IDPs.

**Output:** Same structure as `get_team_block_recommendations()` but without `impacted_players`.

### `get_player_training_balance(player_id)`

Returns Four Corner category breakdown for player.

**Output:**
| Field | Description |
|-------|-------------|
| `category` | Category key |
| `category_display_name` | Display name |
| `total_opportunities` | Sum of weights |
| `percentage` | % of total training |
| `attribute_count` | Distinct attributes |
| `attributes` | JSON array with breakdown |

---

## Data Flow Diagrams

### Session to Analytics Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. SESSION SETUP                            │
├─────────────────────────────────────────────────────────────────┤
│  Coach creates session                                          │
│  ├── Adds blocks (session_block_assignments)                    │
│  ├── Each block has attributes (session_block_attributes)       │
│  │   ├── first order (relevance = 1.0)                         │
│  │   └── second order (relevance = 0.5)                        │
│  └── Optionally links to syllabus                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     2. SESSION EXECUTION                        │
├─────────────────────────────────────────────────────────────────┤
│  Coach records:                                                 │
│  ├── Attendance (session_attendance)                            │
│  │   └── status: present / absent / excused                    │
│  └── Block exclusions (block_player_exclusions)                 │
│      └── Players not participating in specific blocks           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     3. FEEDBACK SUBMISSION                      │
├─────────────────────────────────────────────────────────────────┤
│  Coach submits feedback:                                        │
│  ├── Team feedback (session_feedback.team_feedback)             │
│  └── Player notes (player_feedback_notes)                       │
│                                                                 │
│  System generates training events:                              │
│  └── generate_training_events(session_id)                       │
│      ├── For each present player                                │
│      ├── Not excluded from block                                │
│      ├── Block attribute matches active IDP                     │
│      └── Creates player_training_events record                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     4. ANALYTICS AGGREGATION                    │
├─────────────────────────────────────────────────────────────────┤
│  Views aggregate raw data:                                      │
│  ├── player_idp_progress - Training per IDP                    │
│  ├── team_idp_gaps - Undertrained IDPs                         │
│  └── player_attendance_summary - Attendance rates               │
│                                                                 │
│  RPC functions calculate scores:                                │
│  ├── calculate_idp_priority_score() - Team-level               │
│  ├── calculate_player_idp_priority_score() - Individual        │
│  └── Block scores = Σ(IDP_Score × Relevance)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     5. UI DISPLAY                               │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard shows:                                               │
│  ├── Overview cards (sessions, hours, attendance)               │
│  ├── IDP gap analysis (sorted by priority_score)               │
│  ├── Block recommendations (sorted by block_score)             │
│  ├── Training balance (Four Corners chart)                     │
│  └── Player matrix (per-player breakdown)                      │
└─────────────────────────────────────────────────────────────────┘
```

### IDP Change Flow

```
┌─────────────────┐
│ Coach Updates   │
│ Player IDPs     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ update_player_idps(player_id, new_idps) │
├─────────────────────────────────────────┤
│ 1. Validate at least 1 IDP             │
│ 2. UPDATE player_idps                   │
│    SET ended_at = NOW()                │
│    WHERE player_id = ? AND ended_at IS NULL │
│ 3. INSERT new IDPs                      │
│    (priority, attribute_key, notes)     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Future Sessions                         │
├─────────────────────────────────────────┤
│ Training events now generate for        │
│ NEW active IDPs only                    │
│                                         │
│ Historical data preserved:              │
│ - Old IDPs still have training history │
│ - player_idp_progress scopes by dates  │
└─────────────────────────────────────────┘
```

---

## Simultaneous Practice Handling

When two blocks run simultaneously:

```
Position 0, Slot 0: "Shooting Drill"
Position 0, Slot 1: "Rondo"
```

### Player Assignment

Use `block_player_exclusions` to track who does which drill:

```
Players: [A, B, C, D, E, F]

Shooting Drill (slot 0):
  - Include: A, B, C
  - block_player_exclusions: D, E, F

Rondo (slot 1):
  - Include: D, E, F
  - block_player_exclusions: A, B, C
```

### Training Event Generation

When `generate_training_events()` runs:

```
Player A (Shooting):
  - Gets "Shooting" training event (first order)
  - Does NOT get "Passing" from Rondo (excluded)

Player D (Rondo):
  - Gets "Passing" training event (first order)
  - Does NOT get "Shooting" from drill (excluded)
```

---

## Feedback Insights (Future)

### LLM Processing

When feedback is submitted, the system can extract insights:

1. **Parse feedback text** for player mentions
2. **Identify attributes** mentioned (positive/negative)
3. **Extract quotes** as evidence
4. **Store as `feedback_insights`**

### Insight Structure

```json
{
  "player_id": "uuid",
  "attribute_key": "passing",
  "sentiment": "positive",
  "confidence": 0.85,
  "extracted_text": "Jake's passing was excellent today"
}
```

### Impact on Scoring

Insights affect the `SentimentSignal` component:
- More negative mentions → higher priority score
- More positive mentions → lower priority score
- Helps identify struggling vs improving players

---

## Dashboard Sections

### Team Dashboard (`/team/analysis`)

| Section | Data Source | Purpose |
|---------|-------------|---------|
| Overview Cards | `get_team_training_summary()` | Quick stats snapshot |
| IDP Gap Analysis | `get_team_idp_gaps()` | Identify undertrained areas |
| Training Coverage | `get_team_attribute_breakdown()` | Four Corners balance |
| Player Matrix | `get_team_player_matrix()` | Per-player overview |
| Session Patterns | `get_team_training_trend()` | Weekly trends |
| Block Usage | `get_team_session_block_usage()` | Most used blocks |
| Recommendations | `get_team_block_recommendations()` | Suggested blocks |

### Player Detail (`/team/players/[id]`)

| Tab | Data Source | Purpose |
|-----|-------------|---------|
| Overview | Player + IDPs | Basic info |
| Development | `get_player_idp_priorities()` | IDP progress |
| Sessions | Attendance records | Session history |
| Feedback | `get_player_feedback_insights()` | Coach feedback |
| Balance | `get_player_training_balance()` | Four Corners chart |

---

## Best Practices

### For Coaches

1. **Set 1-3 IDPs per player** - Too many dilutes focus
2. **Tag blocks with attributes** - Enables tracking
3. **Record attendance accurately** - Affects analytics
4. **Use block exclusions** - For split-squad tracking
5. **Submit feedback regularly** - Triggers event generation

### For Developers

1. **Always filter by date range** - Use function parameters
2. **Check `ended_at IS NULL`** - For active IDPs only
3. **Use RPC functions** - Don't replicate complex queries
4. **Consider weights** - First vs second order matters
5. **Handle NULL dates** - 999 days = never trained

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Platform architecture
- [DATABASE.md](./DATABASE.md) - Database schema
- [API.md](./API.md) - API reference

# Team Analytics Dashboard Plan

Based on research into UK youth football development practices (FA's Four Corner Model, EPPP guidelines, IDP best practices) and our existing data model, here's a comprehensive plan for `/team/analysis`.

---

## Data We Have Available

| Source | Data Points |
|--------|-------------|
| `team_idp_gaps` view | Attributes with player counts, avg training sessions, player lists |
| `player_idp_progress` view | Per-player IDP metrics: training_sessions, total_weight, sentiment |
| `player_attendance_summary` view | Sessions attended/missed, attendance % |
| `player_training_events` | Individual training opportunities with weights |
| `session_feedback` | Completed sessions (feedback = completion marker) |
| `sessions` + `session_blocks` | Session details, block usage |

---

## Proposed Dashboard Sections

### 1. Team Overview Cards (Top Row)

Quick snapshot stats coaches can glance at:

| Metric | Source | Why Coaches Want This |
|--------|--------|----------------------|
| **Sessions Completed** | Count of `session_feedback` | Track training volume |
| **Total Training Hours** | Sum of `sessions.duration` where feedback exists | Meets FA/EPPP tracking requirements |
| **Team Attendance Rate** | Avg of `player_attendance_summary.attendance_percentage` | Key welfare/engagement metric |
| **Active IDPs** | Count from `player_idps` where `ended_at IS NULL` | Ensures all players tracked |
| **Attributes Covered** | Distinct `attribute_key` from recent training events | Training breadth indicator |

---

### 2. IDP Gap Analysis (Priority Section)

**This is the core value proposition - helps coaches plan better sessions**

Shows which IDPs are undertrained across the team:

```
┌─────────────────────────────────────────────────────────────────┐
│ IDP TRAINING GAPS                                               │
├─────────────────────────────────────────────────────────────────┤
│ ⚠ First Touch     │ 4 players │ 0.8 avg opportunities │ LOW    │
│   Players: Jake, Mia, Tom, Sam                                  │
│   [Suggest Blocks] [Create Session]                             │
├─────────────────────────────────────────────────────────────────┤
│ ⚠ Decision Making │ 3 players │ 1.2 avg opportunities │ LOW    │
│   Players: Jake, Tom, Lucy                                      │
│   [Suggest Blocks] [Create Session]                             │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Passing         │ 6 players │ 4.5 avg opportunities │ GOOD   │
│ ✓ Shooting        │ 4 players │ 3.8 avg opportunities │ GOOD   │
└─────────────────────────────────────────────────────────────────┘
```

**Metrics per attribute:**
- Number of players with this IDP
- Average training opportunities (sum of weights / players)
- Status: LOW (< 2.0 avg), MODERATE (2.0-4.0), GOOD (> 4.0)
- List of players affected
- Action buttons to help address gaps

---

### 3. Training Coverage Heatmap

Visual showing training load by **attribute category** (FA's Four Corners):

```
┌─────────────────────────────────────────────────────────────────┐
│ TRAINING LOAD BY CATEGORY                      Last 30 days ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TECHNICAL  ████████████████████░░░░░░░░░░  68%               │
│    Passing      █████████  42 opportunities                    │
│    First Touch  ████       18 opportunities                    │
│    Shooting     ████       15 opportunities                    │
│    Dribbling    ███        12 opportunities                    │
│                                                                 │
│  MENTAL     ██████████░░░░░░░░░░░░░░░░░░░░  35%               │
│    Decision Making  ████   14 opportunities                    │
│    Positioning      ███    10 opportunities                    │
│    Communication    ██      8 opportunities                    │
│                                                                 │
│  PHYSICAL   █████░░░░░░░░░░░░░░░░░░░░░░░░░  18%               │
│    Agility   ███    9 opportunities                            │
│    Pace      ██     6 opportunities                            │
│                                                                 │
│  GOALKEEPING ███░░░░░░░░░░░░░░░░░░░░░░░░░░  12%               │
│    Shot Stopping  ██   5 opportunities                         │
└─────────────────────────────────────────────────────────────────┘
```

Parents love seeing the Four Corners model in action - it's what FA promotes.

---

### 4. Player Development Matrix

Detailed table with per-player stats (coaches love this level of detail):

```
┌───────────────────────────────────────────────────────────────────────────┐
│ PLAYER DEVELOPMENT MATRIX                                    Export CSV ▼│
├───────────┬──────────┬─────────┬──────────────┬─────────────┬────────────┤
│ Player    │ Attend % │ Sessions│ Primary IDP  │ Opportunities│ Trend     │
├───────────┼──────────┼─────────┼──────────────┼─────────────┼────────────┤
│ Jake S.   │   92%    │  23/25  │ Passing      │     8.5     │  ↑ Improving│
│ Mia T.    │   88%    │  22/25  │ First Touch  │     4.2     │  → Stable  │
│ Tom R.    │   76%    │  19/25  │ Shooting     │     3.0     │  ↓ Needs Focus│
│ Sam W.    │   96%    │  24/25  │ Decision Making│   6.8     │  ↑ Improving│
└───────────────────────────────────────────────────────────────────────────┘
```

**Columns:**
- Player name (links to player detail page)
- Attendance % (color-coded: green >85%, yellow 70-85%, red <70%)
- Sessions attended / total
- Primary IDP (their top priority focus)
- Training opportunities (total weighted opportunities for primary IDP)
- Trend indicator based on recent vs earlier sessions

---

### 5. Session Analysis

Summary of session patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│ SESSION PATTERNS                               Last 8 weeks ▼  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sessions Completed: 12                                         │
│  Avg Duration: 75 mins                                          │
│  Avg Blocks per Session: 4.2                                    │
│  Avg Attributes Trained: 6.8                                    │
│                                                                 │
│  ┌─ Sessions per Week ─────────────────────────────────────┐   │
│  │   Week 1  ██        2                                   │   │
│  │   Week 2  █         1                                   │   │
│  │   Week 3  ██        2                                   │   │
│  │   Week 4  █         1  (school holiday)                 │   │
│  │   Week 5  ██        2                                   │   │
│  │   Week 6  ██        2                                   │   │
│  │   Week 7  █         1                                   │   │
│  │   Week 8  █         1                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Most Used Blocks:                                              │
│    1. 4v4+4 Rondo (8 sessions)                                  │
│    2. 1v1 Finishing (6 sessions)                                │
│    3. Possession Square (5 sessions)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6. Training Opportunity Breakdown

Detailed view of first-order vs second-order training:

```
┌─────────────────────────────────────────────────────────────────┐
│ TRAINING OPPORTUNITY BREAKDOWN                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  First-Order (Direct Training) ███████████████  72 total       │
│    Weight: 1.0 per session                                      │
│                                                                 │
│  Second-Order (Indirect Training) ████████  38 total           │
│    Weight: 0.5 per session (e.g., GK in shooting drill)        │
│                                                                 │
│  Total Weighted Opportunities: 91.0                             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  By Attribute Type:                                             │
│    Technical: 58.5 (64%)                                        │
│    Mental: 22.0 (24%)                                           │
│    Physical: 7.5 (8%)                                           │
│    Goalkeeping: 3.0 (4%)                                        │
└─────────────────────────────────────────────────────────────────┘
```

This explains our "opportunities" metric clearly - parents and coaches understand what the numbers mean.

---

### 7. Player Comparison Tool (Interactive)

Select 2-4 players to compare side-by-side:

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPARE PLAYERS                                                 │
│ [Jake Smith ▼] vs [Tom Richards ▼] vs [+ Add Player]           │
├─────────────────────────────────────────────────────────────────┤
│                   │   Jake Smith    │  Tom Richards  │          │
├───────────────────┼─────────────────┼────────────────┤          │
│ Attendance        │      92%        │      76%       │          │
│ Sessions          │      23         │      19        │          │
├───────────────────┼─────────────────┼────────────────┤          │
│ Primary IDP       │   Passing       │   Shooting     │          │
│   Opportunities   │      8.5        │      3.0       │          │
│   Trend           │   ↑ Improving   │  ↓ Needs Focus │          │
├───────────────────┼─────────────────┼────────────────┤          │
│ Secondary IDP     │   Vision        │   Composure    │          │
│   Opportunities   │      4.2        │      2.5       │          │
├───────────────────┼─────────────────┼────────────────┤          │
│ Total Training    │     14.8        │      7.0       │          │
└─────────────────────────────────────────────────────────────────┘
```

---

## New Database Views/Functions Needed

### 1. Team Training Summary View

```sql
CREATE OR REPLACE VIEW team_training_summary AS
SELECT
    t.id AS team_id,
    COUNT(DISTINCT sf.session_id) AS sessions_completed,
    SUM(s.duration) AS total_training_minutes,
    COUNT(DISTINCT pte.player_id) AS players_trained,
    COUNT(DISTINCT pte.attribute_key) AS attributes_covered,
    SUM(pte.weight) AS total_training_opportunities
FROM teams t
LEFT JOIN sessions s ON s.team_id = t.id
LEFT JOIN session_feedback sf ON sf.session_id = s.id
LEFT JOIN player_training_events pte ON pte.session_id = s.id
GROUP BY t.id;
```

### 2. Attribute Category Mapping

We need to add a `category` field to our attributes in `system_defaults` or create a mapping function:

| Category | Attributes |
|----------|------------|
| Technical | Passing, Dribbling, First Touch, Crossing, Shooting, Heading, Tackling, Ball Control |
| Physical | Pace, Strength, Stamina, Agility, Balance, Jumping |
| Mental | Vision, Positioning, Decision Making, Leadership, Communication, Composure, Tactical Awareness, Work Rate |
| Goalkeeping | Shot Stopping, Distribution, Aerial Ability, Handling |

### 3. Training Trend Function

```sql
-- Get training opportunities by week for trend analysis
CREATE OR REPLACE FUNCTION get_team_training_trend(
    p_team_id UUID,
    p_weeks INTEGER DEFAULT 8
)
RETURNS TABLE (
    week_start DATE,
    sessions_count INTEGER,
    total_opportunities FLOAT
)
```

---

## Implementation Components

| Component | Purpose |
|-----------|---------|
| `TeamAnalyticsView.tsx` | Main container with tabs/sections |
| `OverviewCards.tsx` | Top row summary cards |
| `IDPGapAnalysis.tsx` | The priority gap analysis section |
| `TrainingHeatmap.tsx` | Four Corners category breakdown |
| `PlayerDevelopmentMatrix.tsx` | Detailed player table |
| `SessionAnalysis.tsx` | Session pattern charts |
| `PlayerComparison.tsx` | Side-by-side comparison tool |
| `teamAnalytics.ts` | Library for data fetching |

---

## What Coaches Will Love

1. **IDP Gap Analysis** - Directly actionable, shows what to train next
2. **Four Corners Breakdown** - Aligns with FA methodology, looks professional
3. **Player Matrix with Trends** - See who's progressing at a glance
4. **Training Opportunities explained** - Clear metric (1.0 first-order, 0.5 second-order)

## What Parents Will Appreciate

1. **Clear attendance tracking** - "My child attended 92% of sessions"
2. **IDP progress visible** - "They're working on Passing and it's improving"
3. **Professional presentation** - FA Four Corners model looks legitimate
4. **Trend indicators** - Easy to understand ↑ ↓ → symbols

---

## Open Questions

1. **Time Period Filter** - Should we default to "All Time", "Last 30 days", or "Current Season"?
2. **Export Options** - CSV export for the player matrix? PDF summary?
3. **Recommendations Integration** - Should the IDP gaps section link to block suggestions immediately, or is that Phase 9?
4. **Player Comparison Limit** - 2-4 players seems reasonable?

---

## Research Sources

- [The Coaching Manual - IDP Research](https://content.thecoachingmanual.com/blog/research-projectindividual-development-plans)
- [Hudl - Individual Development Plans in Football](https://www.hudl.com/blog/hudl-lens-individual-development-plans)
- [FA Bootroom - Youth Development Phase DNA](https://www.thefa.com/bootroom/resources/coaching/introducing-the-youth-development-phase-dna)
- [EPPP Guidelines](https://www.goalreports.com/EPLPlan.pdf)
- [Data Sports Analytics in Grassroots](https://www.linkedin.com/pulse/data-sports-analytics-grassroots-schools-academies-tapikar)
- [FA Grassroots Strategy 2024](https://www.thefa.com/news/2024/oct/28/a-new-landmark-strategy-20241028)

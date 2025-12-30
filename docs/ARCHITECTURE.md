# Via Session Planner - Architecture Documentation

## Overview

Via Session Planner is a comprehensive football coaching platform designed for youth academies and grassroots clubs. It enables coaches to plan training sessions, track player development through Individual Development Plans (IDPs), and analyze team performance using data-driven insights.

The platform is built around the FA's Four Corner Model (Technical, Tactical, Physical, Psychological) and supports multi-tenant club architecture with role-based access control.

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.7 | React framework with App Router |
| React | 19.1.0 | UI library |
| TypeScript | 5.0 | Type safety |
| Framer Motion | 12.23.21 | Animations |
| dnd-kit | latest | Drag and drop functionality |
| Konva / React Konva | 10.0.12 / 19.2.1 | Canvas-based tactics board |
| React Icons | 5.5.0 | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database, authentication, storage |
| AWS Bedrock | AI/LLM integration (Claude models) |
| Puppeteer | PDF generation for player reports |

### Deployment
- **Platform**: Vercel
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage (images, audio)

---

## Directory Structure

```
via-session-planner/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Authentication routes (public)
│   │   │   ├── login/            # Email login
│   │   │   ├── verify/           # OTP verification
│   │   │   ├── onboarding/       # Multi-step onboarding wizard
│   │   │   ├── join/             # Join team via link
│   │   │   └── invite/[token]/   # Club invite redemption
│   │   ├── (dashboard)/          # Protected dashboard routes
│   │   │   ├── page.tsx          # Main dashboard with analytics
│   │   │   ├── session-planning/ # Session creation & management
│   │   │   ├── team/             # Team management
│   │   │   │   ├── players/      # Player list & details
│   │   │   │   ├── analysis/     # Team analytics dashboard
│   │   │   │   └── settings/     # Team settings
│   │   │   ├── methodology/      # Team-level methodology
│   │   │   │   ├── game-model/   # Zone-based game model
│   │   │   │   ├── profiling/    # Positional profiles
│   │   │   │   └── training/     # Training syllabus
│   │   │   ├── club-methodology/ # Club-level methodology
│   │   │   └── settings/         # Coach settings
│   │   ├── api/                  # API routes
│   │   │   ├── ai/               # AI endpoints
│   │   │   ├── invites/          # Invite management
│   │   │   └── players/          # Player reports
│   │   └── auth/callback/        # Supabase auth callback
│   ├── components/               # React components
│   │   ├── analysis/             # Analytics visualizations
│   │   ├── auth/                 # Auth screens
│   │   ├── dashboard/            # Dashboard components
│   │   ├── methodology/          # Methodology editors
│   │   ├── onboarding/           # Onboarding steps
│   │   ├── players/              # Player management
│   │   ├── sessions/             # Session planning
│   │   ├── tactics/              # Tactics board (Konva)
│   │   └── ui/                   # Base UI components
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx       # Global auth state
│   │   └── TeamContext.tsx       # Team selection
│   ├── lib/                      # Business logic
│   │   ├── supabase/             # Supabase clients
│   │   ├── ai/                   # AI/Bedrock integration
│   │   └── *.ts                  # Domain logic modules
│   ├── types/                    # TypeScript types
│   └── styles/                   # Styling
└── v3/                           # Database schema & migrations
    ├── schema.sql                # Full database schema
    └── migrations/               # Incremental migrations
```

---

## Core Concepts

### 1. Multi-Tenant Architecture

```
Club (Organization)
├── Club Memberships (admin/coach roles)
├── Teams
│   ├── Team Coaches (assigned coaches)
│   ├── Players
│   │   └── Player IDPs
│   ├── Sessions
│   │   ├── Session Blocks
│   │   ├── Session Attendance
│   │   └── Session Feedback
│   └── Team Facilities
├── Game Model (Club-level)
├── Positional Profiles (Club-level)
└── Training Syllabus (Club-level)
```

**Ownership Model:**
- All data belongs to clubs, not individual coaches
- Coaches join clubs via invite links
- Club-level methodology can be inherited/customized by teams
- Role-based permissions: `admin` (full) vs `coach` (limited)

### 2. Methodology System

The platform supports three interconnected methodology components:

#### Game Model (Playing Methodology)
- Divides the pitch into 3 or 4 horizontal zones
- Each zone has In-Possession and Out-of-Possession states
- Each state contains named "blocks" (tactical principles)
- Example: Zone 1 → In-Possession → "Build Up", "Play Out From Back"

#### Positional Profiles
- Define key attributes for each position
- Separate In-Possession and Out-of-Possession attributes
- Up to 5 attributes per state per position
- Used for IDP recommendations

#### Training Syllabus
- 52-week calendar of training themes
- Each day can have a theme (zone + block from Game Model)
- Sessions can be linked to syllabus slots
- Enables periodization and long-term planning

### 3. Individual Development Plans (IDPs)

IDPs are the core of player development tracking:

```
Player
└── Player IDPs (1-3 active)
    ├── attribute_key (e.g., "passing", "first_touch")
    ├── priority (1=primary, 2=secondary, 3=tertiary)
    ├── started_at
    ├── ended_at (NULL if active)
    └── notes
```

**Training Events Flow:**
1. Coach creates session with blocks
2. Each block has tagged attributes (first/second order)
3. Players attend session
4. On feedback submission, training events are generated
5. Events link players to attributes they trained
6. Analytics aggregate events to show IDP progress

### 4. Session Planning

Sessions are structured around reusable blocks:

```
Session
├── Metadata (date, duration, team, etc.)
├── Session Block Assignments
│   ├── position (ordering)
│   ├── slot_index (0=primary, 1=simultaneous)
│   └── Block
│       ├── title, description, coaching_points
│       ├── diagram_data (Konva elements)
│       └── Block Attributes (first/second order)
├── Session Attendance
│   └── player_id, status (present/absent/excused)
├── Block Player Exclusions
│   └── Players not participating in specific blocks
└── Session Feedback
    ├── team_feedback
    ├── player_feedback_notes
    └── feedback_insights (LLM-extracted)
```

**Simultaneous Practices:**
- Two blocks can share the same position with different `slot_index`
- Enables split-squad training
- Player exclusions track who participates in which block

---

## Authentication Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Login Page    │────▶│  Enter Email    │────▶│  Send OTP       │
│                 │     │                 │     │  (Supabase)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Dashboard     │◀────│  Onboarding     │◀────│  Verify OTP     │
│   (if complete) │     │  (if new user)  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Key Functions:**
- `signInWithOTP(email)` - Sends magic link/OTP
- `verifyOTP(email, token)` - Validates and creates session
- `ensureCoachProfile(userId, email)` - Creates coach record if needed

---

## Onboarding Flow

Multi-step wizard for new coaches:

1. **Welcome** - Introduction to the platform
2. **Profile Setup** - Name, position, profile picture
3. **Club Setup** - Create new club or join existing
4. **Team Creation** - Team details, age group, skill level
5. **Game Model** - Define pitch zones and tactical principles
6. **Positional Profiling** - Set attributes per position
7. **Training Methodology** - (Legacy, replaced by syllabus)
8. **Training Syllabus** - 52-week training calendar
9. **Team Facilities** - Pitch type, equipment available
10. **Completion** - Review and finish

---

## Data Flow: Session to Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│                     SESSION CREATION                            │
├─────────────────────────────────────────────────────────────────┤
│  1. Coach creates session                                       │
│  2. Adds training blocks (with attributes tagged)               │
│  3. Optionally links to syllabus slot                          │
│  4. Theme snapshot saved for historical reference               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SESSION EXECUTION                           │
├─────────────────────────────────────────────────────────────────┤
│  1. Coach records attendance (present/absent/excused)           │
│  2. Optionally sets block player exclusions                     │
│  3. Conducts training session                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SESSION FEEDBACK                            │
├─────────────────────────────────────────────────────────────────┤
│  1. Coach submits session feedback                              │
│  2. Adds player-specific notes                                  │
│  3. generate_training_events() is called                        │
│  4. Training events created for:                                │
│     - Present players                                           │
│     - Not excluded from block                                   │
│     - Attribute matches active IDP                              │
│  5. LLM extracts feedback insights (future)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ANALYTICS AGGREGATION                       │
├─────────────────────────────────────────────────────────────────┤
│  RPC Functions aggregate data:                                  │
│  - get_team_training_summary() - Overview stats                 │
│  - get_team_idp_gaps() - Undertrained IDPs                     │
│  - get_team_block_recommendations() - Suggested blocks          │
│  - get_player_idp_priorities() - Per-player IDP status         │
│  - get_player_training_balance() - Four Corners breakdown       │
└─────────────────────────────────────────────────────────────────┘
```

---

## State Management

### AuthContext
Global authentication state available throughout the app.

```typescript
interface AuthContextType {
  user: User | null              // Supabase auth user
  coach: Coach | null            // Coach profile
  session: Session | null        // Auth session
  loading: boolean
  club: Club | null              // Current club
  clubMembership: ClubMembership | null
  isAdmin: boolean               // Admin role check
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
  createClub: (name, logoUrl?) => Promise<Club>
  refreshClubData: () => Promise<void>
}
```

### TeamContext
Team selection state for multi-team coaches.

```typescript
interface TeamContextType {
  teams: Team[]                  // All teams for coach
  selectedTeam: Team | null      // Currently selected
  selectedTeamId: string | null
  setSelectedTeamId: (id) => void
  isLoadingTeams: boolean
}
```

---

## AI Integration

### AI Coach Assistant (`/api/ai/coach`)

Provides real-time coaching assistance for session planning:

**Input:**
- Session details (title, date, duration, team info)
- Current session content
- Team methodology rules
- Player IDPs
- Coach's message/question

**Processing:**
- Determines intent: `question` or `change`
- For questions: Provides coaching advice
- For changes: Modifies session plan

**Output:**
```json
{
  "intent": "change",
  "updated_session": "...modified session content...",
  "message": "I've added a 10-minute warm-up..."
}
```

**Model:** Claude 3.5 Sonnet (via AWS Bedrock)

### Block Content Generation (`/api/ai/generate-block-content`)

Generates training block content from title:

**Output:**
- Description
- Coaching points
- First-order outcomes (primary attributes)
- Second-order outcomes (secondary attributes)

**Model:** Claude 3 Haiku (fast, cost-effective)

---

## Key Design Patterns

### 1. Error Handling
```typescript
// Standard return pattern
{ data: T | null, error: string | null }

// With retry logic
withSessionRetry(async () => {
  // Supabase operation
})
```

### 2. RLS (Row Level Security)
All tables have RLS policies ensuring:
- Coaches can only access their club's data
- Admin role required for destructive operations
- SECURITY DEFINER functions bypass RLS where needed

### 3. Denormalization
- `theme_snapshot` on sessions preserves historical theme data
- Views pre-aggregate complex analytics queries
- JSON columns store flexible structures (zones, syllabus)

### 4. Soft Deletes & Historical Tracking
- IDPs use `ended_at` for historical tracking
- Training events are immutable records
- Sessions preserve theme snapshots even if syllabus changes

---

## Performance Considerations

1. **Database Views** - Pre-aggregate common queries
2. **Indexed Queries** - Strategic indexes on foreign keys and common filters
3. **RPC Functions** - Complex aggregations done server-side
4. **Parallel Data Fetching** - Dashboard loads data concurrently
5. **Debounced Updates** - Prevent rapid-fire API calls

---

## Security Model

1. **Authentication** - Supabase Auth with OTP (no passwords)
2. **Authorization** - RLS policies + application-level checks
3. **API Protection** - All routes require authenticated session
4. **Role-Based Access** - Admin vs Coach permissions
5. **Data Isolation** - Club-scoped queries prevent cross-tenant access

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AWS Bedrock (server-side only)
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

---

## Related Documentation

- [DATABASE.md](./DATABASE.md) - Complete database schema documentation
- [IDP_TRACKING.md](./IDP_TRACKING.md) - Player data calculation and IDP system
- [API.md](./API.md) - API routes and RPC function reference

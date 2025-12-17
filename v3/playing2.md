# Playing Methodology v2 - Zone System Overhaul

---

## Overview

This document describes the overhaul of the Playing Methodology system from freeform drawn zones to a structured 3-zone or 4-zone system with in-possession and out-of-possession states.

### Current State

- Coaches draw freeform zones on a pitch using Konva (drag to create rectangles)
- Each zone has: `id`, `x`, `y`, `width`, `height`, `title`, `description`, `color`
- Zones stored in `playing_methodology.zones` JSONB column
- Club methodology serves as template; teams get editable copies

### New State

- Coaches choose between **3 zones** or **4 zones** (evenly divided horizontal bands)
- Each zone has **two required states**: in-possession and out-of-possession
- Each state has: `name` (text) and `details` (text)
- Visual representation shows static zone divisions on pitch
- Club → Team inheritance model preserved

---

## Why This Change

1. **Clarity**: In/out possession distinction is fundamental to how coaches think about tactical zones
2. **Consistency**: Standardized zones (3 or 4) allow for better cross-team comparison and analysis
3. **Future Integration**: Training blocks and positional profiling will be tagged with in/out possession attributes
4. **Simplicity**: Removes complexity of freeform drawing while maintaining tactical depth

---

## Data Structure

### Old Structure (Deprecated)

```json
{
  "zones": [
    {
      "id": "zone-abc123",
      "x": 50,
      "y": 100,
      "width": 200,
      "height": 150,
      "title": "Zone 1",
      "description": "Build from the back",
      "color": "#4A90A4"
    }
  ]
}
```

### New Structure

```json
{
  "zone_count": 3,
  "zones": [
    {
      "id": "zone-1",
      "order": 1,
      "in_possession": {
        "name": "Build Up",
        "details": "Patient possession, playing out from the back..."
      },
      "out_of_possession": {
        "name": "High Press",
        "details": "Aggressive pressing to win the ball high..."
      }
    },
    {
      "id": "zone-2",
      "order": 2,
      "in_possession": {
        "name": "Progression",
        "details": "Quick vertical passes to break lines..."
      },
      "out_of_possession": {
        "name": "Mid Block",
        "details": "Compact shape, deny central access..."
      }
    },
    {
      "id": "zone-3",
      "order": 3,
      "in_possession": {
        "name": "Final Third Entry",
        "details": "Width and creativity to create chances..."
      },
      "out_of_possession": {
        "name": "Low Block",
        "details": "Protect the box, force wide..."
      }
    }
  ]
}
```

### TypeScript Type

```typescript
interface ZoneState {
  name: string   // Optional - starts empty, shown as "Not set" if blank
  details: string
}

interface PlayingZone {
  id: string
  order: number
  name: string   // Zone name (e.g., "Attacking Third") - required, editable by coach
  in_possession: ZoneState
  out_of_possession: ZoneState
}

interface PlayingMethodologyZones {
  zone_count: 3 | 4
  zones: PlayingZone[]
}
```

---

## Default Zone Names

### 3 Zones

| Zone | Default In-Possession Name | Default Out-of-Possession Name |
|------|---------------------------|-------------------------------|
| 1 (Own Goal) | Defensive Third | Defensive Third |
| 2 (Middle) | Middle Third | Middle Third |
| 3 (Opponent Goal) | Attacking Third | Attacking Third |

### 4 Zones

| Zone | Default In-Possession Name | Default Out-of-Possession Name |
|------|---------------------------|-------------------------------|
| 1 (Own Goal) | Defensive Quarter | Defensive Quarter |
| 2 | Defensive-Mid Quarter | Defensive-Mid Quarter |
| 3 | Attacking-Mid Quarter | Attacking-Mid Quarter |
| 4 (Opponent Goal) | Attacking Quarter | Attacking Quarter |

**Note**: These are starting names. Coaches can rename them to match their terminology (e.g., "Build Up Zone", "Transition Zone", "Final Third").

---

## User Interface Design

### Zone Configuration Selection

When entering the Playing Methodology page for the first time (or when no zones exist):

```
┌─────────────────────────────────────────────────────────────┐
│  Playing Methodology                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  How many zones do you want to divide the pitch into?       │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │                 │    │                 │                │
│  │   ┌─────────┐   │    │   ┌─────────┐   │                │
│  │   │    3    │   │    │   │    4    │   │                │
│  │   │  ZONES  │   │    │   │  ZONES  │   │                │
│  │   │         │   │    │   │         │   │                │
│  │   │  ───────│   │    │   │  ───────│   │                │
│  │   │  ───────│   │    │   │  ───────│   │                │
│  │   │         │   │    │   │  ───────│   │                │
│  │   └─────────┘   │    │   └─────────┘   │                │
│  │                 │    │                 │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Main View (After Configuration)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Playing Methodology                              [Change Zones] [Edit] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────┐  ┌───────────────────────────────┐│
│  │                                 │  │ Zone 3: Attacking Third       ││
│  │         ATTACKING THIRD         │  │                               ││
│  │         ─────────────────       │  │ In Possession                 ││
│  │                                 │  │ Name: Final Third Entry       ││
│  │         ─────────────────       │  │ Details: Create width and...  ││
│  │          MIDDLE THIRD           │  │                               ││
│  │         ─────────────────       │  │ Out of Possession             ││
│  │                                 │  │ Name: Counter Press           ││
│  │         DEFENSIVE THIRD         │  │ Details: Immediate pressure...││
│  │                                 │  │                               ││
│  └─────────────────────────────────┘  │ [Expand]                      ││
│                                       └───────────────────────────────┘│
│  Click a zone on the pitch to view/edit its details                    │
│                                                                         │
│  ┌─ Zone 1: Defensive Third ──────────────────────────────────────────┐│
│  │ In Possession: Build Up | Out of Possession: High Press            ││
│  └────────────────────────────────────────────────────────────────────┘│
│  ┌─ Zone 2: Middle Third ─────────────────────────────────────────────┐│
│  │ In Possession: Progression | Out of Possession: Mid Block          ││
│  └────────────────────────────────────────────────────────────────────┘│
│  ┌─ Zone 3: Attacking Third ──────────────────────────────────────────┐│
│  │ In Possession: Final Third | Out of Possession: Counter Press      ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Edit Modal (Zone Detail)

```
┌─────────────────────────────────────────────────────────────┐
│  Zone 2: Middle Third                                   [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ IN POSSESSION ────────────────────────────────────────┐│
│  │                                                         ││
│  │  Name                                                   ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ Progression                                     │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  Details                                                ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ Quick vertical passes to break lines. Look for  │   ││
│  │  │ runners between the lines. Switch play to       │   ││
│  │  │ exploit space on the weak side...               │   ││
│  │  │                                                 │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─ OUT OF POSSESSION ────────────────────────────────────┐│
│  │                                                         ││
│  │  Name                                                   ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ Mid Block                                       │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  │  Details                                                ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │ Compact defensive shape. Deny central passing   │   ││
│  │  │ lanes. Force play wide and delay to allow       │   ││
│  │  │ recovery runs...                                │   ││
│  │  │                                                 │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                    [Cancel]  [Save Changes] │
└─────────────────────────────────────────────────────────────┘
```

### Change Zone Count Confirmation

```
┌─────────────────────────────────────────────────────────────┐
│  Change Zone Configuration                              [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚠️  Warning                                                │
│                                                             │
│  Changing from 3 zones to 4 zones will erase all existing  │
│  zone data. This cannot be undone.                          │
│                                                             │
│  Your current zone configuration:                           │
│  • Zone 1: Defensive Third (Build Up / High Press)          │
│  • Zone 2: Middle Third (Progression / Mid Block)           │
│  • Zone 3: Attacking Third (Final Third / Counter Press)    │
│                                                             │
│  This data will be replaced with 4 empty zones.             │
│                                                             │
│                          [Cancel]  [Change to 4 Zones]      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Types and Data Layer

**Files to modify:**
- `src/types/database.ts` - Add new TypeScript types
- `src/lib/methodology.ts` - Update zone-related functions

**Tasks:**

1. Add new TypeScript types:
   ```typescript
   // src/types/database.ts
   export interface ZoneState {
     name: string
     details: string
   }

   export interface PlayingZone {
     id: string
     order: number
     in_possession: ZoneState
     out_of_possession: ZoneState
   }

   export interface PlayingMethodologyZones {
     zone_count: 3 | 4
     zones: PlayingZone[]
   }
   ```

2. Update `src/lib/methodology.ts`:
   - Update `PitchZone` type to new `PlayingZone` type
   - Add helper functions:
     - `createDefaultZones(count: 3 | 4): PlayingMethodologyZones`
     - `getDefaultZoneName(zoneIndex: number, totalZones: 3 | 4): string`
   - Update existing functions to handle new structure

3. Create migration helper (for any existing data):
   - Function to detect old vs new zone format
   - Function to migrate old data or reset to new format

---

### Phase 2: Visual Components

**Files to create/modify:**
- `src/components/methodology/ZonePitchDisplay.tsx` - NEW (read-only pitch with zones)
- `src/components/methodology/ZoneCountSelector.tsx` - NEW (3 vs 4 zone selection)
- `src/components/methodology/ZoneEditModal.tsx` - NEW (edit zone in/out possession)
- `src/components/methodology/ZoneCard.tsx` - NEW (zone summary card in list)

**Files to remove:**
- `src/components/methodology/ZonePitchEditor.tsx` - DELETE (freeform drawing)
- `src/components/methodology/ZoneElement.tsx` - DELETE (Konva rectangle)
- `src/components/methodology/ZoneDescriptionModal.tsx` - DELETE (old modal)
- `src/components/methodology/ZoneTooltip.tsx` - DELETE (hover tooltip)

**Tasks:**

1. Create `ZonePitchDisplay.tsx`:
   - Static pitch visualization (can be canvas or SVG)
   - Evenly divided horizontal zones (3 or 4)
   - Zone labels displayed on pitch
   - Clickable zones to open edit modal
   - Highlight selected/hovered zone
   - Show goal posts at top and bottom

2. Create `ZoneCountSelector.tsx`:
   - Two large clickable cards (3 zones / 4 zones)
   - Visual preview of zone division
   - Used on first setup and when changing zones

3. Create `ZoneEditModal.tsx`:
   - Full modal for editing a single zone
   - Two sections: In Possession / Out of Possession
   - Each section: Name input + Details textarea
   - Save/Cancel buttons
   - Validation (both states required)

4. Create `ZoneCard.tsx`:
   - Collapsible card showing zone summary
   - Shows: Zone name, in-possession name, out-of-possession name
   - Expandable to show full details
   - Click to edit

---

### Phase 3: Page Updates

**Files to modify:**
- `src/app/(dashboard)/club-methodology/playing/page.tsx`
- `src/app/(dashboard)/methodology/playing/page.tsx`

**Tasks:**

1. Update club playing methodology page:
   - Remove `ZonePitchEditor` usage
   - Add zone count selection (if no zones exist)
   - Add `ZonePitchDisplay` component
   - Add zone cards list below pitch
   - Add "Change Zones" button (with confirmation)
   - Handle create/edit/save flow

2. Update team playing methodology page:
   - Same UI as club but with team context
   - Keep "Revert to Club" functionality
   - Ensure inheritance works with new structure

3. State management for both pages:
   - `zones: PlayingMethodologyZones | null`
   - `selectedZone: PlayingZone | null`
   - `isEditingZone: boolean`
   - `showChangeZonesConfirm: boolean`

---

### Phase 4: Onboarding Updates

**Files to check/modify:**
- `src/app/(auth)/onboarding/page.tsx`

**Tasks:**

1. Check if onboarding touches playing methodology
2. If yes, update to use new zone system or allow skip
3. Ensure skipping is clearly communicated

---

### Phase 5: Cleanup and Testing

**Tasks:**

1. Remove deprecated files:
   - `ZonePitchEditor.tsx`
   - `ZoneElement.tsx`
   - `ZoneDescriptionModal.tsx`
   - `ZoneTooltip.tsx`

2. Remove any Konva-related imports/dependencies if no longer needed

3. Test scenarios:
   - Fresh club setup (no existing zones)
   - Existing club with old zone format
   - Club creates 3 zones
   - Club changes from 3 to 4 zones
   - Team inherits club zones
   - Team edits inherited zones
   - Team reverts to club zones
   - Zone count change confirmation works

4. Verify no TypeScript errors

5. Verify no console errors

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/components/methodology/ZonePitchDisplay.tsx` | Static pitch with zone visualization |
| `src/components/methodology/ZoneCountSelector.tsx` | 3 vs 4 zone selection UI |
| `src/components/methodology/ZoneEditModal.tsx` | Modal for editing zone details |
| `src/components/methodology/ZoneCard.tsx` | Zone summary card component |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/database.ts` | Add new zone types |
| `src/lib/methodology.ts` | Update types, add helper functions |
| `src/app/(dashboard)/club-methodology/playing/page.tsx` | New zone UI |
| `src/app/(dashboard)/methodology/playing/page.tsx` | New zone UI |
| `src/app/(auth)/onboarding/page.tsx` | Check/update if needed |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/methodology/ZonePitchEditor.tsx` | Freeform drawing no longer needed |
| `src/components/methodology/ZoneElement.tsx` | Konva rectangle no longer needed |
| `src/components/methodology/ZoneDescriptionModal.tsx` | Replaced by ZoneEditModal |
| `src/components/methodology/ZoneTooltip.tsx` | No longer needed |

---

## Database Considerations

### No Schema Changes Required

The `playing_methodology` table already has a `zones` JSONB column. We're just changing the JSON structure stored in it.

### Data Migration

For any existing clubs/teams with old zone format:

**Option A (Recommended)**: Treat old format as "no zones configured"
- When loading, check if `zones.zone_count` exists
- If not, show zone count selector (fresh start)
- Old data is effectively orphaned but not deleted

**Option B**: Explicit migration
- Add a migration script
- Convert old zones to new format (lossy - can't map freeform to fixed zones)
- More complex, probably not worth it

**Recommendation**: Go with Option A. Users will need to reconfigure their zones, but this is a significant UX change anyway. The old freeform data doesn't cleanly map to the new structure.

---

## Edge Cases

### 1. No Zones Configured

**Behavior**: Show zone count selector (3 vs 4)

### 2. Old Zone Format Detected

**Behavior**: Show zone count selector (treat as fresh start)

### 3. Team with No Zones, Club Has Zones

**Behavior**:
- Team inherits club zones on first load (existing functionality)
- Uses same zone count and data as club

### 4. Team Reverts to Club

**Behavior**:
- Replace team zones with current club zones
- Same zone count as club

### 5. Club Changes Zone Count

**Behavior**:
- Only affects club
- Existing teams keep their zones until they revert

---

## Future Considerations

This document focuses only on the Playing Methodology changes. Future work mentioned but **not in scope**:

1. **Training Block Tagging**: Blocks tagged with in/out-possession + physical/psychological attributes
2. **Session Recommendations**: Suggest blocks based on zone focus
3. **Player Analysis**: Relate player training to specific zones
4. **Team Analysis**: Track zone-based training distribution

These will be documented separately when implemented.

---

## Implementation Checklist

- [x] Phase 1: Types and Data Layer
  - [x] Add TypeScript types to `database.ts`
  - [x] Update `methodology.ts` with new functions
  - [x] Create default zone helpers

- [x] Phase 2: Visual Components
  - [x] Create `ZonePitchDisplay.tsx`
  - [x] Create `ZoneCountSelector.tsx`
  - [x] Create `ZoneEditModal.tsx`
  - [x] Create `ZoneCard.tsx`

- [x] Phase 3: Page Updates
  - [x] Update club playing methodology page
  - [x] Update team playing methodology page
  - [x] Ensure inheritance/revert works

- [x] Phase 4: Onboarding
  - [x] Check onboarding for playing methodology references
  - [x] Update or ensure skip works

- [x] Phase 5: Cleanup
  - [x] Delete deprecated components (ZonePitchEditor, ZoneElement, ZoneDescriptionModal, ZoneTooltip)
  - [x] Remove unused imports
  - [x] Verify build passes

**Implementation completed: 2025-12-14**

---

## Post-Implementation Refinements

Additional changes made after initial implementation:

1. **Added editable zone name** - Each zone now has a customizable `name` field (e.g., "Attacking Third", "Build-Up Zone") that coaches can edit
2. **In/out possession names start empty** - Instead of default values, fields start blank with placeholder text (e.g., "e.g., Final Third Entry")
3. **"Not set" display** - ZoneCard shows "Not set" in italic when in/out possession names are empty
4. **Removed expand/collapse chevron** - Simplified ZoneCard to just show summary with Edit button
5. **Fixed zone alignment** - Corrected CSS calc() for aligning zone cards with pitch zones
6. **Onboarding Back button** - Back goes to zone count picker, not previous step

**No database migrations required** - The `zones` JSONB column structure changed but the column itself already existed.

import React, { useState } from 'react';
import { MdGroup } from 'react-icons/md';
import { FaSearch } from 'react-icons/fa';
import { theme } from '@/styles/theme';
import type { Player } from '@/types/database';
import { PlayerCard } from './PlayerCard';

interface PlayerListProps {
  players: Player[];
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
  onAddPlayer: () => void;
}

type PositionFilter = 'ALL' | 'FORWARDS' | 'MIDFIELDERS' | 'DEFENDERS' | 'GOALKEEPERS';

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  selectedPlayerId,
  onPlayerSelect,
  onAddPlayer,
}) => {
  const [positionFilter, setPositionFilter] = useState<PositionFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Position category mapping
  const positionCategories = {
    GOALKEEPERS: ['GK'],
    DEFENDERS: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW'],
    MIDFIELDERS: ['CDM', 'CM', 'CAM', 'LM', 'RM', 'DM', 'AM'],
    FORWARDS: ['ST', 'CF', 'LW', 'RW', 'SS', 'F'],
  };

  // Filter players by position and search term
  const filteredPlayers = players.filter((player) => {
    // Position filter
    if (positionFilter !== 'ALL') {
      const position = player.position?.toUpperCase() || '';

      const categoryPositions = positionCategories[positionFilter as keyof typeof positionCategories];
      if (!categoryPositions.includes(position)) {
        return false;
      }
    }

    // Search filter
    if (searchTerm && !player.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });


  return (
    <div style={{
      width: '30%',
      minWidth: '300px',
      height: '100vh',
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing.lg,
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing.lg,
      borderRight: `1px solid ${theme.colors.border.primary}`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}>
          <MdGroup size={28} color={theme.colors.text.primary} />
          <h2 style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            margin: 0,
          }}>
            Players
          </h2>
        </div>

        <button
          onClick={onAddPlayer}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            backgroundColor: 'transparent',
            color: theme.colors.gold.main,
            border: `2px dashed ${theme.colors.gold.main}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            cursor: 'pointer',
            opacity: 0.7,
            transition: theme.transitions.fast,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          + Add Player
        </button>
      </div>

      {/* Description */}
      <div style={{
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.borderRadius.md,
        borderLeft: `3px solid ${theme.colors.gold.main}`,
      }}>
        <p style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          margin: 0,
          lineHeight: '1.6',
        }}>
          Manage your team's player roster and Individual Development Plans (IDPs). Player targets guide the AI when generating personalized session plans.
        </p>
      </div>

      {/* Search Bar and Position Filter */}
      <div style={{
        display: 'flex',
        gap: theme.spacing.sm,
        alignItems: 'center',
      }}>
        {/* Search Bar */}
        <div style={{
          position: 'relative',
          flex: 1,
        }}>
          <FaSearch
            size={16}
            style={{
              position: 'absolute',
              left: theme.spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.text.secondary,
            }}
          />
          <input
            type="text"
            placeholder="Search players"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              paddingLeft: '40px',
              backgroundColor: theme.colors.background.primary,
              color: theme.colors.text.primary,
              border: `1px solid ${theme.colors.border.primary}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.colors.gold.main;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = theme.colors.border.primary;
            }}
          />
        </div>

        {/* Position Filter Dropdown */}
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value as PositionFilter)}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            backgroundColor: theme.colors.background.primary,
            color: theme.colors.text.primary,
            border: `1px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.7rem center',
            backgroundSize: '1.2em',
            paddingRight: '2.5rem',
            minWidth: '140px',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.gold.main;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border.primary;
          }}
        >
          <option value="ALL">All Positions</option>
          <option value="GOALKEEPERS">Goalkeepers</option>
          <option value="DEFENDERS">Defenders</option>
          <option value="MIDFIELDERS">Midfielders</option>
          <option value="FORWARDS">Forwards</option>
        </select>
      </div>

      {/* Player List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing.sm,
      }}>
        {filteredPlayers.length === 0 ? (
          <div style={{
            padding: theme.spacing.xl,
            textAlign: 'center',
            color: theme.colors.text.secondary,
            fontSize: theme.typography.fontSize.base,
          }}>
            {players.length === 0 ? 'No players yet. Click "Add Player" to get started.' : 'No players match your filters.'}
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={selectedPlayerId === player.id}
              onClick={() => onPlayerSelect(player.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

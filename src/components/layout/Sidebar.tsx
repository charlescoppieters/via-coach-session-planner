'use client'

import React, { useState, useEffect } from 'react';
import { MdDashboard, MdGroup } from "react-icons/md";
import { GiSoccerBall } from "react-icons/gi";
import { IoSettingsSharp, IoLogOut } from "react-icons/io5";
import { theme } from "@/styles/theme";
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
import { getTeams } from '@/lib/teams';
import { getProfilePictureUrl } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import type { Team } from '@/types/database';
import { FaBook } from 'react-icons/fa';
import Image from 'next/image';

interface SidebarProps {
  currentScreen: string;
  selectedTeamId: string;
  setSelectedTeamId: (teamId: string) => void;
  currentView: 'sessions' | 'settings' | 'dashboard' | 'methodology' | 'players';
  setCurrentView: (view: 'sessions' | 'settings' | 'dashboard' | 'methodology' | 'players') => void;
  onLogout: () => void;
  onTeamsLoad?: (teams: Team[]) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedTeamId,
  setSelectedTeamId,
  currentView,
  setCurrentView,
  onLogout,
  onTeamsLoad,
}) => {
  const { coach, isAdmin } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Track window width for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate responsive sizes
  const getResponsiveSizes = () => {
    if (windowWidth >= 1200) {
      return {
        sidebarWidth: '260px',
        logoSize: 60,
        avatarSize: '80px',
        spacing: theme.spacing,
        fontSize: theme.typography.fontSize,
      };
    } else if (windowWidth >= 900) {
      return {
        sidebarWidth: '220px',
        logoSize: 50,
        avatarSize: '70px',
        spacing: {
          ...theme.spacing,
          lg: '14px',
          md: '10px',
        },
        fontSize: {
          ...theme.typography.fontSize,
          base: '14px',
          sm: '12px',
        },
      };
    } else {
      return {
        sidebarWidth: '180px',
        logoSize: 45,
        avatarSize: '60px',
        spacing: {
          ...theme.spacing,
          lg: '12px',
          md: '8px',
          sm: '6px',
        },
        fontSize: {
          ...theme.typography.fontSize,
          base: '13px',
          sm: '11px',
          '2xl': '18px',
        },
      };
    }
  };

  const responsive = getResponsiveSizes();

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      if (!coach?.id) return;

      setIsLoadingTeams(true);
      const { data, error } = await getTeams(coach.id);

      if (!error && data) {
        setTeams(data);
        onTeamsLoad?.(data);

        // Auto-select first team if none selected
        if (!selectedTeamId && data.length > 0) {
          setSelectedTeamId(data[0].id);
        }
      }

      setIsLoadingTeams(false);
    };

    fetchTeams();
  }, [coach?.id]);

  // Subscribe to team changes
  useEffect(() => {
    if (!coach?.id) return;

    const channel = supabase
      .channel(`sidebar-team-changes-${coach.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `coach_id=eq.${coach.id}`,
      }, () => {
        // Refetch teams on any change
        getTeams(coach.id).then(({ data }) => {
          if (data) {
            setTeams(data);
            onTeamsLoad?.(data);
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coach?.id]);

  const NavItem = ({
    icon: Icon,
    label,
    view,
    isSelected
  }: {
    icon: React.ComponentType<{ size: number }>,
    label: string,
    view: typeof currentView,
    isSelected: boolean
  }) => (
    <div
      onClick={() => setCurrentView(view)}
      style={{
        padding: `${responsive.spacing.md} ${responsive.spacing.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: responsive.spacing.md,
        cursor: 'pointer',
        borderRadius: theme.borderRadius.md,
        border: isSelected ? `2px solid ${theme.colors.gold.main}` : '2px solid transparent',
        backgroundColor: isSelected ? 'rgba(239, 191, 4, 0.1)' : 'transparent',
        transition: theme.transitions.fast,
        color: theme.colors.text.primary,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <Icon size={windowWidth >= 900 ? 20 : 18} />
      <span style={{
        fontSize: responsive.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
      }}>
        {label}
      </span>
    </div>
  );

  const Divider = () => (
    <div style={{
      height: '1px',
      backgroundColor: theme.colors.border.secondary,
      margin: `${theme.spacing.md} 0`,
    }} />
  );

  return (
    <div
      style={{
        width: responsive.sidebarWidth,
        height: '100%',
        backgroundColor: theme.colors.background.primary,
        display: 'flex',
        flexDirection: 'column',
        padding: responsive.spacing.lg,
        gap: responsive.spacing.lg,
        borderRight: `1px solid ${theme.colors.border.primary}`,
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: `${responsive.spacing.md} 0`,
      }}>
        <Image
          src="/logo.png"
          alt="Via Logo"
          width={responsive.logoSize}
          height={responsive.logoSize}
          priority
        />
      </div>

      <Divider />

      {/* Profile Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: responsive.avatarSize,
          height: responsive.avatarSize,
          borderRadius: '50%',
          backgroundColor: theme.colors.background.tertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: responsive.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.muted,
          overflow: 'hidden',
          border: 'none',
        }}>
          {coach?.profile_picture ? (
            <img
              src={getProfilePictureUrl(coach.profile_picture)}
              alt={coach.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            // Generate initials from coach name
            coach?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'C'
          )}
        </div>

        {/* Name */}
        <div style={{
          fontSize: responsive.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          textAlign: 'center',
          marginTop: responsive.spacing.lg,
        }}>
          {coach?.name || 'Coach'}
        </div>

        {/* Position */}
        {coach?.position && (
          <div style={{
            fontSize: responsive.fontSize.sm,
            color: theme.colors.text.secondary,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginTop: responsive.spacing.xs,
          }}>
            {coach.position}
          </div>
        )}
      </div>

      {/* Team Selector */}
      <div style={{ marginTop: responsive.spacing.sm }}>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          disabled={isLoadingTeams || teams.length === 0}
          style={{
            width: '100%',
            paddingTop: responsive.spacing.sm,
            paddingBottom: responsive.spacing.sm,
            paddingLeft: responsive.spacing.md,
            paddingRight: '2.5rem',
            backgroundColor: theme.colors.background.primary,
            color: theme.colors.text.primary,
            border: `2px solid ${theme.colors.border.primary}`,
            borderRadius: theme.borderRadius.md,
            fontSize: responsive.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            cursor: isLoadingTeams ? 'not-allowed' : 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.7rem center',
            backgroundSize: '1.2em',
          }}
        >
          {isLoadingTeams ? (
            <option>Loading teams...</option>
          ) : teams.length === 0 ? (
            <option>No teams yet</option>
          ) : (
            teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Main Navigation */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
        marginTop: responsive.spacing.md,
      }}>
        <NavItem
          icon={MdDashboard}
          label="Dashboard"
          view="dashboard"
          isSelected={currentView === 'dashboard'}
        />
        <NavItem
          icon={GiSoccerBall}
          label="Sessions"
          view="sessions"
          isSelected={currentView === 'sessions'}
        />
        <NavItem
          icon={MdGroup}
          label="Players"
          view="players"
          isSelected={currentView === 'players'}
        />
      </div>

      {/* Spacer to push bottom items down */}
      <div style={{ flex: 1 }} />

      <Divider />

      {/* Bottom Navigation */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
      }}>
        {isAdmin && (
          <NavItem
            icon={FaBook}
            label="Club Methodology"
            view="methodology"
            isSelected={currentView === 'methodology'}
          />
        )}
        <NavItem
          icon={IoSettingsSharp}
          label="Club Settings"
          view="settings"
          isSelected={currentView === 'settings'}
        />
        <div
          onClick={onLogout}
          style={{
            padding: `${responsive.spacing.md} ${responsive.spacing.lg}`,
            display: 'flex',
            alignItems: 'center',
            gap: responsive.spacing.md,
            cursor: 'pointer',
            borderRadius: theme.borderRadius.md,
            border: '2px solid transparent',
            backgroundColor: 'transparent',
            transition: theme.transitions.fast,
            color: theme.colors.text.primary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <IoLogOut size={windowWidth >= 900 ? 20 : 18} />
          <span style={{
            fontSize: responsive.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
          }}>
            Log Out
          </span>
        </div>
      </div>
    </div>
  );
};

'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { theme } from '@/styles/theme';
import { mainVariants } from '@/constants/animations';
import { MethodologySidebar } from './MethodologySidebar';
import { GlobalRules } from '@/components/rules/GlobalRules';
import { TeamRules } from '@/components/rules/TeamRules';
import type { Team } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface MethodologyViewProps {
  coachId: string;
  teamId: string;
  team?: Team;
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({
  coachId,
  teamId,
  team: propTeam,
}) => {
  const [selectedView, setSelectedView] = useState<'global' | 'team' | null>(null);
  const [team, setTeam] = useState<Team | null>(propTeam || null);
  const [triggerAddRule, setTriggerAddRule] = useState<(() => void) | null>(null);

  // Fetch full team data if not provided
  useEffect(() => {
    const fetchTeam = async () => {
      if (!propTeam) {
        const { data } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        if (data) {
          setTeam(data as Team);
        }
      }
    };

    fetchTeam();
  }, [teamId, propTeam]);

  const handleViewChange = (view: 'global' | 'team') => {
    setSelectedView(view);
  };

  const handleRegisterAddHandler = useCallback((handler: () => void) => {
    setTriggerAddRule(() => handler);
  }, []);

  return (
    <motion.div
      variants={mainVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: theme.colors.background.primary,
      }}
    >
      {/* Left Side - Methodology Selector */}
      <MethodologySidebar
        selectedView={selectedView}
        onViewChange={handleViewChange}
        teamName={team?.name}
      />

      {/* Right Side - Rules Display */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing.xl,
      }}>
        {selectedView ? (
          <div style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.xl,
              paddingBottom: theme.spacing.lg,
              borderBottom: `1px solid ${theme.colors.border.primary}`,
            }}>
              <h1 style={{
                flex: 1,
                fontSize: theme.typography.fontSize['3xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
              }}>
                {selectedView === 'global' ? 'Global Rules' : `${team?.name || 'Team'} Rules`}
              </h1>

              {/* Add Rule Button */}
              <button
                onClick={() => {
                  if (triggerAddRule) {
                    triggerAddRule();
                  }
                }}
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
                {selectedView === 'global' ? '+ Add Global Rule' : '+ Add Team Rule'}
              </button>
            </div>

            {/* Rules Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: theme.spacing.sm,
            }}>
              {selectedView === 'global' ? (
                <GlobalRules
                  coachId={coachId}
                  hideHeader={true}
                  onRegisterAddHandler={handleRegisterAddHandler}
                />
              ) : (
                team && <TeamRules
                  teamId={teamId}
                  teamName={team.name}
                  hideHeader={true}
                  onRegisterAddHandler={handleRegisterAddHandler}
                />
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              textAlign: 'center',
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.lg,
            }}>
              Select a set of rules to view and edit
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

'use client'

import React, { useState, useEffect } from 'react';
import { theme } from "@/styles/theme";
import { supabase } from '@/lib/supabase';
import { RuleItem } from './RuleItem';
import { CgSpinnerAlt } from "react-icons/cg";

interface CoachingRule {
  id: string;
  content: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CoachingRuleWithEditing extends CoachingRule {
  isEditing?: boolean;
}

interface TeamRulesProps {
  teamId: string;
  teamName: string;
  hideHeader?: boolean;
  onRegisterAddHandler?: (handler: () => void) => void;
}

export const TeamRules: React.FC<TeamRulesProps> = ({
  teamId,
  teamName,
  hideHeader = false,
  onRegisterAddHandler,
}) => {
  const [rules, setRules] = useState<CoachingRuleWithEditing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleContent, setNewRuleContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Register the add handler with parent
  useEffect(() => {
    if (onRegisterAddHandler) {
      onRegisterAddHandler(() => setIsAddingRule(true));
    }
  }, [onRegisterAddHandler]);

  // Fetch team rules
  useEffect(() => {
    const fetchRules = async () => {
      if (!teamId) {
        setRules([]);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('coaching_rules')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (data) {
        setRules(data.map((rule: CoachingRule) => ({ ...rule, isEditing: false })));
      }
      if (error) {
        console.error('Error fetching team rules:', error);
      }
      setIsLoading(false);
    };

    fetchRules();
  }, [teamId]);

  // Subscribe to rule changes with tab-switch fix
  useEffect(() => {
    if (!teamId) return;

    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 1000;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isSubscribed = false;

    const handleRuleChange = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Team rules fetch timeout after 5 seconds')), 5000);
        });

        const fetchPromise = supabase
          .from('coaching_rules')
          .select('*')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false });

        const { data } = await Promise.race([fetchPromise, timeoutPromise]);

        if (data) {
          setRules(prev =>
            data.map((rule: CoachingRule) => ({
              ...rule,
              isEditing: prev.find(p => p.id === rule.id)?.isEditing || false
            }))
          );
        }
        retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error('Team rules subscription handler failed:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            if (isSubscribed) {
              handleRuleChange();
            }
          }, baseDelay * retryCount);
        }
      }
    };

    const createSubscription = () => {
      try {
        channel = supabase
          .channel(`team-rules-${teamId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'coaching_rules',
              filter: `team_id=eq.${teamId}`,
            },
            handleRuleChange
          )
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              isSubscribed = true;
              retryCount = 0;
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('Team rules subscription failed, retrying...');
              isSubscribed = false;
              if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(createSubscription, baseDelay * retryCount);
              }
            }
          });
      } catch (error) {
        console.error('Failed to create team rules subscription:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(createSubscription, baseDelay * retryCount);
        }
      }
    };

    createSubscription();

    return () => {
      isSubscribed = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [teamId]);

  const handleAddRule = async () => {
    if (!newRuleContent.trim() || !teamId) return;

    setIsSaving(true);
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Add rule timeout after 10 seconds')), 10000);
      });

      // Get the coach_id from the team
      const teamPromise = supabase
        .from('teams')
        .select('coach_id')
        .eq('id', teamId)
        .single();

      const { data: teamData } = await Promise.race([teamPromise, timeoutPromise]);

      if (!teamData) {
        setIsSaving(false);
        return;
      }

      const insertPromise = supabase
        .from('coaching_rules')
        .insert({
          team_id: teamId,
          coach_id: teamData.coach_id,
          content: newRuleContent,
          is_active: true,
        })
        .select()
        .single();

      const { data, error } = await Promise.race([insertPromise, timeoutPromise]);

      if (data) {
        setRules(prev => [{ ...data, isEditing: false }, ...prev]);
        setNewRuleContent('');
        setIsAddingRule(false);
      }
      if (error) {
        console.error('Error adding team rule:', error);
      }
    } catch (error) {
      console.error('Team rule add operation failed:', error);
    }
    setIsSaving(false);
  };

  const handleEditRule = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, isEditing: true } : rule
    ));
  };

  const handleSaveRule = async (ruleId: string, content: string) => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Save rule timeout after 10 seconds')), 10000);
      });

      const updatePromise = supabase
        .from('coaching_rules')
        .update({ content })
        .eq('id', ruleId)
        .select()
        .single();

      const { data, error } = await Promise.race([updatePromise, timeoutPromise]);

      if (data) {
        setRules(prev => prev.map(rule =>
          rule.id === ruleId ? { ...data, isEditing: false } : rule
        ));
      }
      if (error) {
        console.error('Error updating team rule:', error);
      }
    } catch (error) {
      console.error('Team rule save operation failed:', error);
    }
  };

  const handleCancelEdit = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, isEditing: false } : rule
    ));
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Delete rule timeout after 10 seconds')), 10000);
      });

      const deletePromise = supabase
        .from('coaching_rules')
        .delete()
        .eq('id', ruleId);

      const { error } = await Promise.race([deletePromise, timeoutPromise]);

      if (!error) {
        setRules(prev => prev.filter(rule => rule.id !== ruleId));
      } else {
        console.error('Error deleting team rule:', error);
      }
    } catch (error) {
      console.error('Team rule delete operation failed:', error);
    }
  };

  const handleToggleActive = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Toggle rule timeout after 10 seconds')), 10000);
      });

      const updatePromise = supabase
        .from('coaching_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', ruleId)
        .select()
        .single();

      const { data, error } = await Promise.race([updatePromise, timeoutPromise]);

      if (data) {
        setRules(prev => prev.map(rule =>
          rule.id === ruleId ? { ...data, isEditing: rule.isEditing } : rule
        ));
      }
      if (error) {
        console.error('Error toggling team rule:', error);
      }
    } catch (error) {
      console.error('Team rule toggle operation failed:', error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Team Rules Header */}
      {!hideHeader && (
        <div
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.xs,
            }}
          >
            <h4
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                margin: 0,
              }}
            >
              Team-Specific Coaching Rules
            </h4>
            {!isAddingRule && (
              <button
                onClick={() => setIsAddingRule(true)}
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
                + Add Team Rule
              </button>
            )}
          </div>
          <p
            style={{
              color: theme.colors.text.muted,
              fontSize: theme.typography.fontSize.sm,
              margin: 0,
            }}
          >
            Rules that apply only to this team
          </p>
        </div>
      )}

      {/* Add Rule Form - Only shown when adding */}
      {isAddingRule && (
        <div
          style={{
            padding: `${theme.spacing.md} ${theme.spacing.lg}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: theme.spacing.lg,
              backgroundColor: theme.colors.background.tertiary,
              borderRadius: theme.borderRadius.md,
              border: 'none',
            }}
          >
            <textarea
              value={newRuleContent}
              onChange={(e) => setNewRuleContent(e.target.value)}
              placeholder={`Enter a rule specific to ${teamName}...`}
              autoFocus
              style={{
                width: '100%',
                minHeight: '80px',
                padding: theme.spacing.md,
                backgroundColor: theme.colors.background.secondary,
                border: `1px solid ${theme.colors.gold.main}`,
                borderRadius: theme.borderRadius.sm,
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.sm,
                fontFamily: theme.typography.fontFamily.primary,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: theme.spacing.sm,
                marginTop: theme.spacing.md,
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setNewRuleContent('');
                  setIsAddingRule(false);
                }}
                disabled={isSaving}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.background.primary,
                  color: theme.colors.text.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.tertiary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.background.primary;
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRule}
                disabled={!newRuleContent.trim() || isSaving}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.gold.main,
                  color: theme.colors.background.primary,
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: (newRuleContent.trim() && !isSaving) ? 'pointer' : 'not-allowed',
                  opacity: (newRuleContent.trim() && !isSaving) ? 1 : 0.5,
                  transition: theme.transitions.fast,
                }}
                onMouseEnter={(e) => {
                  if (newRuleContent.trim() && !isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.light;
                  }
                }}
                onMouseLeave={(e) => {
                  if (newRuleContent.trim() && !isSaving) {
                    e.currentTarget.style.backgroundColor = theme.colors.gold.main;
                  }
                }}
              >
                {isSaving ? (
                  <CgSpinnerAlt
                    style={{
                      animation: 'spin 1s linear infinite',
                      fontSize: '14px',
                    }}
                  />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: `0 ${theme.spacing.lg} ${theme.spacing.lg} ${theme.spacing.lg}`,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.sm,
          maxHeight: '100%',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: theme.spacing.lg,
            }}
          >
            <CgSpinnerAlt
              style={{
                animation: 'spin 1s linear infinite',
                fontSize: '20px',
                color: theme.colors.text.muted,
              }}
            />
          </div>
        ) : rules.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: theme.spacing.xl,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.base,
            }}
          >
            No team rules yet. Add your first rule above.
          </div>
        ) : (
          rules.map((rule) => (
            <RuleItem
              key={rule.id}
              rule={rule}
              onEdit={handleEditRule}
              onSave={handleSaveRule}
              onCancel={handleCancelEdit}
              onDelete={handleDeleteRule}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
      </div>
    </div>
  );
};
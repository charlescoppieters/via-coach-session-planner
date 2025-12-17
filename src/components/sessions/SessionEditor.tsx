'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CgSpinnerAlt } from "react-icons/cg";
import { FiUsers, FiClock } from "react-icons/fi";
import { theme } from "@/styles/theme";
import { createClient } from '@/lib/supabase/client';
import { BlockEditor } from './BlockEditor';
import { type AssignedBlock } from '@/lib/sessionBlocks';

const supabase = createClient();
import { updateSession } from '@/lib/sessions';
import type { Session } from '@/types/database';

// Generate arrays for picker options
const playerOptions = Array.from({ length: 99 }, (_, i) => i + 1);
const durationOptions = Array.from({ length: 180 }, (_, i) => i + 1);

// ScrollPicker component - defined outside to prevent recreation on each render
interface ScrollPickerProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  options: number[];
  unit: string;
  value: number;
  onChange: (val: number) => void;
}

const ScrollPicker: React.FC<ScrollPickerProps> = ({
  show,
  onClose,
  onConfirm,
  title: modalTitle,
  options,
  unit,
  value,
  onChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44;
  const visibleItems = 5;
  const containerHeight = itemHeight * visibleItems;
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const justFinishedDragging = useRef(false);
  const startY = useRef(0);
  const startScroll = useRef(0);
  const hasInitialized = useRef(false);

  // Physics/momentum tracking
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const dragMultiplier = 2.5; // Increase sensitivity
  const friction = 0.92; // How quickly momentum decays (closer to 1 = longer spin)
  const minVelocity = 0.5; // Stop animating below this velocity

  // Scroll to selected value when modal opens (only on open, not on value change)
  useEffect(() => {
    if (show && scrollRef.current && !hasInitialized.current) {
      hasInitialized.current = true;
      const index = options.indexOf(value);
      if (index >= 0) {
        scrollRef.current.scrollTop = index * itemHeight;
      }
    }
    if (!show) {
      hasInitialized.current = false;
    }
  }, [show, value, options]);

  // Handle scroll end to snap to nearest item
  const handleScrollEnd = useCallback(() => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
      onChange(options[clampedIndex]);
      scrollRef.current.scrollTo({
        top: clampedIndex * itemHeight,
        behavior: 'smooth'
      });
    }
  }, [options, onChange]);

  // Momentum animation loop
  const animateMomentum = useCallback(() => {
    if (!scrollRef.current || Math.abs(velocity.current) < minVelocity) {
      // Stop animation and snap to nearest
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      handleScrollEnd();
      return;
    }

    scrollRef.current.scrollTop += velocity.current;
    velocity.current *= friction;

    animationFrame.current = requestAnimationFrame(animateMomentum);
  }, [handleScrollEnd, friction, minVelocity]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Cancel any ongoing momentum animation
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }

    isDragging.current = true;
    hasDragged.current = false;
    startY.current = e.clientY;
    lastY.current = e.clientY;
    lastTime.current = Date.now();
    velocity.current = 0;
    startScroll.current = scrollRef.current?.scrollTop || 0;
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;

    const now = Date.now();
    const deltaY = lastY.current - e.clientY;
    const deltaTime = now - lastTime.current;

    // Calculate velocity (pixels per frame, roughly)
    if (deltaTime > 0) {
      velocity.current = (deltaY * dragMultiplier) / Math.max(deltaTime / 16, 1);
    }

    // Only mark as dragged if moved more than 5px
    const totalDelta = startY.current - e.clientY;
    if (Math.abs(totalDelta) > 5) {
      hasDragged.current = true;
    }

    scrollRef.current.scrollTop += deltaY * dragMultiplier;

    lastY.current = e.clientY;
    lastTime.current = now;
  }, [dragMultiplier]);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      // If we were dragging, set flag to prevent backdrop close
      if (hasDragged.current) {
        justFinishedDragging.current = true;
        // Reset after a brief moment (to catch the click event)
        setTimeout(() => {
          justFinishedDragging.current = false;
        }, 50);

        // Start momentum animation if we have velocity
        if (Math.abs(velocity.current) > minVelocity) {
          animateMomentum();
        } else {
          handleScrollEnd();
        }
      } else {
        handleScrollEnd();
      }
    }
  }, [handleScrollEnd, animateMomentum, minVelocity]);

  // Handle backdrop click - ignore if we just finished dragging
  const handleBackdropClick = useCallback(() => {
    if (justFinishedDragging.current) {
      return;
    }
    onClose();
  }, [onClose]);

  // Add global mouse listeners for drag
  useEffect(() => {
    if (show) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        // Cancel momentum animation on unmount
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
          animationFrame.current = null;
        }
      };
    }
  }, [show, handleMouseMove, handleMouseUp]);

  // Click on item to select (only if we didn't drag)
  const handleItemClick = (val: number) => {
    // Ignore if this click came from a drag
    if (hasDragged.current) {
      return;
    }
    onChange(val);
    const index = options.indexOf(val);
    if (scrollRef.current && index >= 0) {
      scrollRef.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.colors.background.secondary,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              minWidth: '280px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <h3
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                margin: 0,
                marginBottom: theme.spacing.md,
                textAlign: 'center',
              }}
            >
              {modalTitle}
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.md,
              }}
            >
              {/* Scroll container */}
              <div
                style={{
                  position: 'relative',
                  height: containerHeight,
                  width: '100px',
                  overflow: 'hidden',
                }}
              >
                {/* Selection highlight */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: itemHeight,
                    transform: 'translateY(-50%)',
                    background: theme.colors.background.tertiary,
                    borderRadius: theme.borderRadius.md,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
                {/* Gradient overlays */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: itemHeight * 2,
                    background: `linear-gradient(to bottom, ${theme.colors.background.secondary}, transparent)`,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: itemHeight * 2,
                    background: `linear-gradient(to top, ${theme.colors.background.secondary}, transparent)`,
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                />
                {/* Scrollable list */}
                <div
                  ref={scrollRef}
                  onMouseDown={handleMouseDown}
                  style={{
                    height: '100%',
                    overflowY: 'scroll',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    cursor: 'grab',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Top padding */}
                  <div style={{ height: itemHeight * 2 }} />
                  {options.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => handleItemClick(opt)}
                      style={{
                        height: itemHeight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: opt === value ? theme.colors.gold.main : theme.colors.text.muted,
                        fontSize: opt === value ? '24px' : '18px',
                        fontWeight: opt === value ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        userSelect: 'none',
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                  {/* Bottom padding */}
                  <div style={{ height: itemHeight * 2 }} />
                </div>
              </div>

              <span
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                {unit}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: theme.spacing.md,
                marginTop: theme.spacing.lg,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  background: theme.colors.background.tertiary,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  background: theme.colors.gold.main,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.background.primary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  cursor: 'pointer',
                }}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface SessionEditorProps {
  sessionId: string | null;
  coachId: string | null;
  onContentUpdate?: (content: string) => void;
  onSessionLoad?: (session: Session) => void;
  externalContent?: string;
  isAILoading?: boolean;
}

export const SessionEditor: React.FC<SessionEditorProps> = ({
  sessionId,
  coachId,
  onSessionLoad,
  isAILoading = false,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [duration, setDuration] = useState<number>(60);
  const [isLoading, setIsLoading] = useState(false);

  // Picker modal states
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [tempPickerValue, setTempPickerValue] = useState<number>(1);

  // Track original values to detect changes
  const originalValues = useRef({ title: '', date: '', playerCount: 1, duration: 60 });

  // Fetch session data when sessionId changes
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setSession(null);
        setTitle('');
        setDate('');
        setPlayerCount(1);
        setDuration(60);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (data) {
        setSession(data);
        setTitle(data.title);
        setDate(data.session_date);
        setPlayerCount(data.player_count || 1);
        setDuration(data.duration || 60);

        // Store original values
        originalValues.current = {
          title: data.title,
          date: data.session_date,
          playerCount: data.player_count || 1,
          duration: data.duration || 60,
        };

        // Pass session data to parent
        if (onSessionLoad) {
          onSessionLoad(data);
        }
      }
      if (error) {
        console.error('Failed to fetch session:', error);
      }
      setIsLoading(false);
    };

    fetchSession();
  }, [sessionId]);

  // Generic save function for any field
  const saveField = async (field: string, value: string | number) => {
    if (!sessionId) return;

    const updates = { [field]: value };
    const { data, error } = await updateSession(sessionId, updates);

    if (data) {
      setSession(data);
      // Update original values
      if (field === 'title') originalValues.current.title = value as string;
      if (field === 'session_date') originalValues.current.date = value as string;
      if (field === 'player_count') originalValues.current.playerCount = value as number;
      if (field === 'duration') originalValues.current.duration = value as number;

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sessionUpdated', {
          detail: { session: data, action: 'update' }
        }));
      }, 100);
    } else if (error) {
      console.error('Save error:', error);
    }
  };

  // Blur handlers for auto-save
  const handleTitleBlur = () => {
    if (title !== originalValues.current.title && title.trim()) {
      saveField('title', title);
    }
  };

  const handleDateBlur = () => {
    if (date !== originalValues.current.date && date) {
      saveField('session_date', date);
    }
  };

  // Handle date change - also save immediately since picker closes
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (newDate && newDate !== originalValues.current.date) {
      saveField('session_date', newDate);
    }
  };

  // Open player picker
  const openPlayerPicker = () => {
    setTempPickerValue(playerCount);
    setShowPlayerPicker(true);
  };

  // Open duration picker
  const openDurationPicker = () => {
    setTempPickerValue(duration);
    setShowDurationPicker(true);
  };

  // Confirm player selection
  const confirmPlayerSelection = () => {
    setPlayerCount(tempPickerValue);
    if (tempPickerValue !== originalValues.current.playerCount) {
      saveField('player_count', tempPickerValue);
    }
    setShowPlayerPicker(false);
  };

  // Confirm duration selection
  const confirmDurationSelection = () => {
    setDuration(tempPickerValue);
    if (tempPickerValue !== originalValues.current.duration) {
      saveField('duration', tempPickerValue);
    }
    setShowDurationPicker(false);
  };

  // Handle blocks change - update session duration if blocks total exceeds it
  const handleBlocksChange = useCallback((blocks: AssignedBlock[]) => {
    const totalBlocksDuration = blocks.reduce((sum, block) => sum + (block.duration || 0), 0);
    if (totalBlocksDuration > duration) {
      setDuration(totalBlocksDuration);
      saveField('duration', totalBlocksDuration);
      originalValues.current.duration = totalBlocksDuration;
    }
  }, [duration, saveField]);

  if (!sessionId) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          boxShadow: theme.shadows.xl,
          color: theme.colors.text.muted,
          fontSize: theme.typography.fontSize.lg,
        }}
      >
        Select a session to edit
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.colors.background.secondary,
          borderRadius: theme.borderRadius.lg,
          boxShadow: theme.shadows.xl,
        }}
      >
        <CgSpinnerAlt
          style={{
            animation: 'spin 1s linear infinite',
            fontSize: '24px',
            color: theme.colors.text.muted,
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      key={sessionId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: theme.colors.background.secondary,
        borderRadius: theme.borderRadius.lg,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          position: 'relative',
          padding: '20px',
          background: theme.colors.background.secondary,
          minHeight: 'auto',
          flexShrink: 0,
        }}
      >
        {/* Top Row: Title and Meta Fields */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing.lg,
          }}
        >
          {/* Left: Title */}
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={title || ''}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                margin: 0,
                letterSpacing: '-0.025em',
                width: '100%',
                outline: 'none',
                fontFamily: theme.typography.fontFamily.primary,
                padding: '2px 4px',
              }}
              placeholder="Enter session title..."
            />

            {/* Date Picker */}
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                cursor: 'pointer',
              }}
              onClick={() => {
                const input = document.querySelector(`input[data-session-date="${sessionId}"]`) as HTMLInputElement;
                input?.showPicker?.();
              }}
            >
              <input
                type="datetime-local"
                data-session-date={sessionId}
                value={date ? date.slice(0, 16) : ''}
                onChange={(e) => handleDateChange(e.target.value)}
                onBlur={handleDateBlur}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  color: theme.colors.gold.main,
                  fontSize: theme.typography.fontSize.sm,
                  margin: `${theme.spacing.xs} 0 0 0`,
                  fontFamily: theme.typography.fontFamily.primary,
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: '2px 4px',
                }}
              >
                {date ? new Date(date).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                }) : 'Set date & time'}
              </div>
            </div>
          </div>

          {/* Right: Player Count & Duration Buttons */}
          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              alignItems: 'center',
            }}
          >
            {/* Player Count Button */}
            <button
              onClick={openPlayerPicker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                background: theme.colors.background.tertiary,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                borderRadius: theme.borderRadius.md,
                border: 'none',
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            >
              <FiUsers
                size={18}
                style={{ color: theme.colors.text.muted }}
              />
              <span
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                }}
              >
                {playerCount}
              </span>
              <span
                style={{
                  color: theme.colors.text.muted,
                  fontSize: theme.typography.fontSize.base,
                }}
              >
                players
              </span>
            </button>

            {/* Duration Button */}
            <button
              onClick={openDurationPicker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                background: theme.colors.background.tertiary,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                borderRadius: theme.borderRadius.md,
                border: 'none',
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            >
              <FiClock
                size={18}
                style={{ color: theme.colors.text.muted }}
              />
              <span
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                }}
              >
                {duration}
              </span>
              <span
                style={{
                  color: theme.colors.text.muted,
                  fontSize: theme.typography.fontSize.base,
                }}
              >
                min
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Block Editor */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <BlockEditor
          sessionId={sessionId}
          coachId={coachId}
          clubId={session?.club_id || null}
          teamId={session?.team_id || null}
          readOnly={false}
          onBlocksChange={handleBlocksChange}
        />

        {/* AI Loading Overlay */}
        {isAILoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(19, 25, 26, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <CgSpinnerAlt
              style={{
                animation: 'spin 1s linear infinite',
                fontSize: '48px',
                color: theme.colors.gold.main,
              }}
            />
          </div>
        )}
      </div>

      {/* Picker Modals */}
      <ScrollPicker
        show={showPlayerPicker}
        onClose={() => setShowPlayerPicker(false)}
        onConfirm={confirmPlayerSelection}
        title="Number of Players"
        options={playerOptions}
        unit="players"
        value={tempPickerValue}
        onChange={setTempPickerValue}
      />
      <ScrollPicker
        show={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        onConfirm={confirmDurationSelection}
        title="Session Duration"
        options={durationOptions}
        unit="min"
        value={tempPickerValue}
        onChange={setTempPickerValue}
      />
    </motion.div>
  );
};

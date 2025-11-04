'use client'

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CgSpinnerAlt } from "react-icons/cg";
import { theme } from "@/styles/theme";
import { supabase } from '@/lib/supabase';
import { updateSession } from '@/lib/sessions';
import type { Session } from '@/types/database';

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
  onContentUpdate,
  onSessionLoad,
  externalContent,
  isAILoading = false,
}) => {
  const [, setSession] = useState<Session | null>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const isExternalUpdateRef = useRef(false);

  // Handle external content updates from AI
  useEffect(() => {
    if (externalContent !== undefined && externalContent !== content) {
      isExternalUpdateRef.current = true;
      setContent(externalContent);
      setSaveStatus('idle'); // Mark as unsaved when AI updates content
    }
  }, [externalContent, content]);

  // Notify parent when content changes (but not when it's from external source)
  useEffect(() => {
    if (onContentUpdate && content && !isExternalUpdateRef.current) {
      onContentUpdate(content);
    }
    // Reset the flag after processing
    isExternalUpdateRef.current = false;
  }, [content, onContentUpdate]);

  // Fetch session data when sessionId changes
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setSession(null);
        setContent('');
        setTitle('');
        setDate('');
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
        setContent(data.content);
        setTitle(data.title);
        setDate(data.session_date);
        setSaveStatus('saved');

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


  const handleSave = async () => {
    if (!sessionId) return;

    setSaveStatus('saving');

    const updates = {
      content,
      title,
      session_date: date
    };

    const { data, error } = await updateSession(sessionId, updates);

    if (data) {
      setSaveStatus('saved');
      // Update local session object with saved data
      setSession(data);

      // Force trigger parent components to refresh since real-time might not be working
      // This is a fallback to ensure UI consistency
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('sessionUpdated', {
          detail: { session: data, action: 'update' }
        }));
      }, 100);
    } else if (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (saveStatus === 'saved') {
      setSaveStatus('idle');
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (saveStatus === 'saved') {
      setSaveStatus('idle');
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (saveStatus === 'saved') {
      setSaveStatus('idle');
    }
  };

  if (!sessionId) {
    return (
      <div
        style={{
          width: '50%',
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
          width: '50%',
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
        width: '50%',
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
          borderBottom: `1px solid ${theme.colors.border.secondary}`,
          minHeight: 'auto',
        }}
      >
        {/* Title Input */}
        <input
          type="text"
          value={title || ''}
          onChange={(e) => handleTitleChange(e.target.value)}
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
            type="date"
            data-session-date={sessionId}
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
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
              color: theme.colors.text.muted,
              fontSize: theme.typography.fontSize.sm,
              margin: `${theme.spacing.xs} 0 0 0`,
              fontFamily: theme.typography.fontFamily.primary,
              cursor: 'pointer',
              userSelect: 'none',
              padding: '2px 4px',
            }}
          >
            {date ? new Date(date).toLocaleDateString() : ''}
          </div>
        </div>

        {/* Save Button */}
        {coachId && (
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            style={{
              position: 'absolute',
              top: '50%',
              right: theme.spacing.md,
              transform: 'translateY(-50%)',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor:
                saveStatus === 'saving' ? theme.colors.text.muted :
                saveStatus === 'error' ? theme.colors.status.error :
                saveStatus === 'saved' ? theme.colors.text.disabled :
                theme.colors.gold.main,
              color: theme.colors.background.primary,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: (saveStatus === 'saving' || saveStatus === 'saved') ? 'not-allowed' : 'pointer',
              transition: theme.transitions.fast,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              opacity: (saveStatus === 'saving' || saveStatus === 'saved') ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (saveStatus !== 'saving' && saveStatus !== 'saved') {
                e.currentTarget.style.backgroundColor = theme.colors.gold.light;
              }
            }}
            onMouseLeave={(e) => {
              if (saveStatus !== 'saving' && saveStatus !== 'saved') {
                e.currentTarget.style.backgroundColor =
                  saveStatus === 'error' ? theme.colors.status.error : theme.colors.gold.main;
              }
            }}
          >
            {saveStatus === 'saving' && (
              <>
                <CgSpinnerAlt
                  style={{
                    animation: 'spin 1s linear infinite',
                    fontSize: '14px'
                  }}
                />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && <span>Saved</span>}
            {saveStatus === 'error' && <span>⚠ Retry</span>}
            {saveStatus === 'idle' && <span>Save</span>}
          </button>
        )}
      </div>

      {/* Content Editor */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          disabled={isAILoading}
          style={{
            flex: 1,
            padding: theme.spacing.xl,
            backgroundColor: 'transparent',
            border: 'none',
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.base,
            fontFamily: theme.typography.fontFamily.primary,
            lineHeight: 1.7,
            resize: 'none',
            outline: 'none',
            cursor: isAILoading ? 'not-allowed' : 'text',
          }}
          placeholder="Enter your session plan here..."
        />

        {/* AI Loading Overlay - only over the editor content area */}
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


    </motion.div>
  );
};
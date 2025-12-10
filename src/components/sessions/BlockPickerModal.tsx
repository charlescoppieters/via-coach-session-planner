'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiPlus, FiSearch } from 'react-icons/fi';
import { CgSpinnerAlt } from 'react-icons/cg';
import { theme } from '@/styles/theme';
import { type SessionBlock, getBlocksForPicker } from '@/lib/sessionBlocks';
import { BlockPickerItem } from './BlockPickerItem';

interface BlockPickerModalProps {
  onSelectBlock: (block: SessionBlock) => void;
  onCreateNew: () => void;
  onCancel: () => void;
  coachId: string;
  clubId: string | null;
}

interface BlockCategory {
  title: string;
  blocks: SessionBlock[];
  emptyMessage: string;
}

export const BlockPickerModal: React.FC<BlockPickerModalProps> = ({
  onSelectBlock,
  onCreateNew,
  onCancel,
  coachId,
  clubId,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [myBlocks, setMyBlocks] = useState<SessionBlock[]>([]);
  const [clubBlocks, setClubBlocks] = useState<SessionBlock[]>([]);
  const [defaultBlocks, setDefaultBlocks] = useState<SessionBlock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Fetch blocks on mount
  useEffect(() => {
    const loadBlocks = async () => {
      setIsLoading(true);
      const { data, error } = await getBlocksForPicker(coachId, clubId);
      if (error) {
        console.error('Failed to load blocks:', error);
      }
      if (data) {
        setMyBlocks(data.myBlocks);
        setClubBlocks(data.clubBlocks);
        setDefaultBlocks(data.defaultBlocks);
      }
      setIsLoading(false);
    };

    loadBlocks();
  }, [coachId, clubId]);

  // Filter blocks by search query
  const filterBlocks = (blocks: SessionBlock[]): SessionBlock[] => {
    if (!searchQuery.trim()) return blocks;
    const query = searchQuery.toLowerCase();
    return blocks.filter(
      (block) =>
        block.title.toLowerCase().includes(query) ||
        (block.description && block.description.toLowerCase().includes(query))
    );
  };

  const categories: BlockCategory[] = useMemo(() => [
    {
      title: 'My Blocks',
      blocks: filterBlocks(myBlocks),
      emptyMessage: searchQuery ? 'No blocks match your search' : 'Your created blocks will appear here',
    },
    {
      title: 'Club Blocks',
      blocks: filterBlocks(clubBlocks),
      emptyMessage: searchQuery ? 'No blocks match your search' : 'More club blocks coming soon',
    },
    {
      title: 'Default Blocks',
      blocks: filterBlocks(defaultBlocks),
      emptyMessage: searchQuery ? 'No blocks match your search' : 'More default blocks coming soon',
    },
  ], [myBlocks, clubBlocks, defaultBlocks, searchQuery]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.borderRadius.lg,
            width: '95%',
            maxWidth: '1200px',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.spacing.lg,
              borderBottom: `1px solid ${theme.colors.border.primary}`,
            }}
          >
            <h2
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                margin: 0,
              }}
            >
              Add a Block
            </h2>
            <button
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.muted,
                cursor: 'pointer',
                padding: theme.spacing.xs,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: theme.spacing.lg,
            }}
          >
            {/* Create New Button */}
            <button
              onClick={onCreateNew}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                backgroundColor: theme.colors.gold.main,
                color: theme.colors.background.primary,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.md,
                transition: theme.transitions.fast,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.gold.light;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.gold.main;
              }}
            >
              <FiPlus size={20} />
              Create Training Block
            </button>

            {/* Search Input */}
            <div
              style={{
                marginBottom: theme.spacing.lg,
                position: 'relative',
              }}
            >
              <FiSearch
                size={18}
                style={{
                  position: 'absolute',
                  left: theme.spacing.md,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme.colors.text.muted,
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blocks..."
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  paddingLeft: '44px',
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.primary,
                  backgroundColor: theme.colors.background.primary,
                  border: `1px solid ${theme.colors.border.primary}`,
                  borderRadius: theme.borderRadius.md,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = theme.colors.gold.main;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.colors.border.primary;
                }}
              />
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: theme.spacing.xl,
                  color: theme.colors.text.muted,
                }}
              >
                <CgSpinnerAlt
                  style={{
                    animation: 'spin 1s linear infinite',
                    fontSize: '24px',
                    marginRight: theme.spacing.sm,
                  }}
                />
                Loading blocks...
              </div>
            ) : (
              /* Three Column Layout */
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: theme.spacing.lg,
                  minHeight: 0,
                }}
              >
                {categories.map((category) => (
                  <div
                    key={category.title}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 0,
                      backgroundColor: theme.colors.background.primary,
                      borderRadius: theme.borderRadius.md,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Column Header */}
                    <div
                      style={{
                        padding: theme.spacing.md,
                        borderBottom: `1px solid ${theme.colors.border.primary}`,
                        backgroundColor: theme.colors.background.tertiary,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.semibold,
                          color: theme.colors.text.secondary,
                          margin: 0,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {category.title}
                        {category.blocks.length > 0 && (
                          <span
                            style={{
                              marginLeft: theme.spacing.sm,
                              color: theme.colors.text.muted,
                              fontWeight: theme.typography.fontWeight.normal,
                            }}
                          >
                            ({category.blocks.length})
                          </span>
                        )}
                      </h3>
                    </div>

                    {/* Scrollable Block List */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: theme.spacing.md,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: theme.spacing.sm,
                      }}
                    >
                      {category.blocks.length > 0 ? (
                        category.blocks.map((block) => (
                          <BlockPickerItem
                            key={block.id}
                            block={block}
                            onClick={() => onSelectBlock(block)}
                          />
                        ))
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: '120px',
                            textAlign: 'center',
                            color: theme.colors.text.muted,
                            fontSize: theme.typography.fontSize.sm,
                            fontStyle: 'italic',
                            padding: theme.spacing.md,
                          }}
                        >
                          {category.emptyMessage}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

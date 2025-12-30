'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiPlus, FiSearch, FiZap, FiGrid } from 'react-icons/fi';
import { CgSpinnerAlt } from 'react-icons/cg';
import { theme } from '@/styles/theme';
import { type SessionBlock, getBlocksForPicker } from '@/lib/sessionBlocks';
import { BlockPickerItem } from './BlockPickerItem';
import { RecommendedBlocksTab } from './RecommendedBlocksTab';

type PickerTab = 'recommended' | 'browse';

interface BlockPickerModalProps {
  onSelectBlock: (block: SessionBlock) => void;
  onCreateNew: () => void;
  onCancel: () => void;
  coachId: string;
  clubId: string | null;
  teamId?: string | null;
  excludeBlockIds?: string[];
  mode?: 'new' | 'simultaneous';
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
  teamId,
  excludeBlockIds = [],
  mode = 'new',
}) => {
  const isSimultaneousMode = mode === 'simultaneous';
  const modalTitle = isSimultaneousMode ? 'Add Simultaneous Practice' : 'Add a Block';
  const createButtonText = isSimultaneousMode ? 'Create New Practice' : 'Create Training Block';
  const [activeTab, setActiveTab] = useState<PickerTab>(teamId ? 'recommended' : 'browse');
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

  // Filter blocks by search query and exclude already-assigned blocks
  const filterBlocks = (blocks: SessionBlock[]): SessionBlock[] => {
    // First exclude already-assigned blocks
    let filtered = blocks.filter((block) => !excludeBlockIds.includes(block.id));

    // Then filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (block) =>
          block.title.toLowerCase().includes(query) ||
          (block.description && block.description.toLowerCase().includes(query))
      );
    }

    return filtered;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [myBlocks, clubBlocks, defaultBlocks, searchQuery, excludeBlockIds]);

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
              {modalTitle}
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
              {createButtonText}
            </button>

            {/* Tab Bar */}
            {teamId && (
              <div
                style={{
                  display: 'flex',
                  gap: theme.spacing.xs,
                  marginBottom: theme.spacing.md,
                  backgroundColor: theme.colors.background.primary,
                  padding: theme.spacing.xs,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <button
                  onClick={() => setActiveTab('recommended')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.sm,
                    backgroundColor: activeTab === 'recommended' ? theme.colors.background.tertiary : 'transparent',
                    color: activeTab === 'recommended' ? theme.colors.text.primary : theme.colors.text.secondary,
                    border: 'none',
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: activeTab === 'recommended' ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal,
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                  }}
                >
                  <FiZap size={16} style={{ color: activeTab === 'recommended' ? theme.colors.gold.main : 'inherit' }} />
                  Recommended
                </button>
                <button
                  onClick={() => setActiveTab('browse')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.sm,
                    backgroundColor: activeTab === 'browse' ? theme.colors.background.tertiary : 'transparent',
                    color: activeTab === 'browse' ? theme.colors.text.primary : theme.colors.text.secondary,
                    border: 'none',
                    borderRadius: theme.borderRadius.sm,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: activeTab === 'browse' ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal,
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                  }}
                >
                  <FiGrid size={16} />
                  Browse All
                </button>
              </div>
            )}

            {/* Search Input - Only show in browse tab */}
            {(activeTab === 'browse' || !teamId) && (
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
            )}

            {/* Recommended Tab Content */}
            {activeTab === 'recommended' && teamId && (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <RecommendedBlocksTab
                  teamId={teamId}
                  onSelectBlock={onSelectBlock}
                  excludeBlockIds={excludeBlockIds}
                />
              </div>
            )}

            {/* Browse Tab Content */}
            {(activeTab === 'browse' || !teamId) && (
              <>
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
              </>
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

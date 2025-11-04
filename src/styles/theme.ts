export const theme = {
  colors: {
    background: {
      primary: '#13191A',      // Charcoal background
      secondary: '#081111',    // Darker background for content areas
      tertiary: '#13191A',     // Unified charcoal for elevated elements
    },
    gold: {
      light: '#EFBF04',        // Bright gold for highlights
      main: '#EFBF04',         // Bright gold for main accents
      dark: '#EFBF04',         // Bright gold for secondary accents
    },
    text: {
      primary: '#FFFFFF',      // Pure white text
      secondary: '#717171',    // Gray text for secondary elements
      muted: '#FFFFFF',        // Pure white for less important text
      disabled: '#666666',     // For disabled elements
    },
    accent: {
      gold: '#EFBF04',         // Bright gold for buttons, borders, input focus
      goldHover: '#FFD700',    // Lighter gold for hover states
      goldPressed: '#D4A700',  // Darker gold for pressed/active states
    },
    status: {
      success: '#28a745',      // Success messages
      error: '#dc3545',        // Error messages
      warning: '#ffc107',      // Warning messages
      info: '#17a2b8',         // Info messages
    },
    border: {
      primary: '#444444',      // Default borders
      secondary: '#333333',    // Subtle borders
      accent: '#EFBF04',       // Gold borders for focus/active
    }
  },

  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"Fira Code", "JetBrains Mono", Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    }
  },

  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    full: '9999px',   // Fully rounded
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    gold: '0 4px 14px 0 rgba(212, 175, 55, 0.2)',    // Gold glow effect
    goldLarge: '0 8px 32px 0 rgba(212, 175, 55, 0.15)', // Larger gold glow
  },

  transitions: {
    fast: 'all 0.15s ease-in-out',
    normal: 'all 0.25s ease-in-out',
    slow: 'all 0.35s ease-in-out',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1010,
    fixed: 1020,
    modal: 1030,
    popover: 1040,
    tooltip: 1050,
  },

  // Component-specific theme tokens
  components: {
    button: {
      primary: {
        background: '#EFBF04',
        backgroundHover: '#FFD700',
        backgroundPressed: '#D4A700',
        text: '#13191A',
        border: '#EFBF04',
      },
      secondary: {
        background: 'transparent',
        backgroundHover: '#13191A',
        backgroundPressed: '#13191A',
        text: '#EFBF04',
        border: '#EFBF04',
      },
    },
    input: {
      background: '#13191A',
      backgroundFocus: '#13191A',
      border: '#444444',
      borderFocus: '#EFBF04',
      text: '#FFFFFF',
      placeholder: '#FFFFFF',
    },
    chat: {
      userMessage: {
        background: '#EFBF04',
        text: '#13191A',
      },
      assistantMessage: {
        background: '#13191A',
        text: '#FFFFFF',
      },
      inputArea: {
        background: '#13191A',
        border: '#444444',
        borderFocus: '#EFBF04',
      }
    },
  }
} as const

export type Theme = typeof theme
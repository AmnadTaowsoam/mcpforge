import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Enterprise neutral base
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E7EB',
          800: '#1F2937',
          900: '#111827',
        },
        // Premium accent palette (frontend-enterprise.md)
        primary: {
          DEFAULT: '#1D4ED8',  // polished blue
          hover: '#1E40AF',
        },
        graphite: {
          DEFAULT: '#374151',
          dark: '#111827',
        },
        success: '#059669',   // restrained emerald
        warning: '#D97706',   // amber
        danger: '#DC2626',    // red (blocking risk only)
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '8px',  // max per spec
      },
      fontSize: {
        xs: ['12px', '16px'],   // metadata
        sm: ['14px', '20px'],   // body
        base: ['16px', '24px'], // table primary
        lg: ['20px', '28px'],   // page heading min
        xl: ['24px', '32px'],
        '2xl': ['28px', '36px'], // page heading max
      },
      spacing: {
        // 4px base grid with 16px section rhythm
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
      },
    },
  },
  plugins: [],
}

export default config

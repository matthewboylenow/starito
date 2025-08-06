import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBF3FE',
          100: '#D7E7FD', 
          DEFAULT: '#4A90E2', // Main brand blue from README
          500: '#4A90E2',
          600: '#3A7BC8', // Darker for hover states
          700: '#2A66AE',
          800: '#1A5194',
          900: '#0A3C7A',
        },
        accent: {
          yellow: '#FFD166', // Gold from README
          pink: '#EF476F',   // Red-pink from README
          orange: '#FB923C',
          purple: '#A855F7',
        },
        success: {
          50: '#ECFDF5',
          DEFAULT: '#06D6A0', // Light green from README
          500: '#06D6A0',
          600: '#059669',
        },
        background: {
          DEFAULT: '#FAFAFF',
          secondary: '#F8FAFF',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          dark: '#0F172A',
          'dark-secondary': '#1E293B',
        },
        text: '#1E1E1E',
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        heading: ['var(--font-bricolage-grotesque)', 'sans-serif'],
        body: ['var(--font-nunito-sans)', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'bounce-gentle': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FB923C 0%, #EC4899 100%)',
        'gradient-cool': 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
      },
    },
  },
  plugins: [],
}

export default config
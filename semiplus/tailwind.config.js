/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 사이드바/GNB 딥 네이비 팔레트
        navy: {
          950: '#050A14',
          900: '#0F172A',
          800: '#1A253D',
          700: '#1E2E4A',
          600: '#263554',
          500: '#2E3F61',
        },
        // 브랜드 인디고 액센트
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // 시맨틱 상태 색상 (PRD 기반)
        status: {
          draft:    '#808080',
          approved: '#28A745',
          rejected: '#DC3545',
          progress: '#0EA5E9',
          pending:  '#F59E0B',
        },
        // 서피스 색상
        surface: {
          base:  '#F8FAFC',
          card:  '#FFFFFF',
          hover: '#F1F5F9',
        }
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'card-lg': '0 8px 24px 0 rgba(0,0,0,0.10), 0 4px 8px -4px rgba(0,0,0,0.06)',
        'glow':    '0 0 20px rgba(99,102,241,0.25)',
        'glow-sm': '0 0 10px rgba(99,102,241,0.20)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      backgroundSize: {
        '300%': '300% 300%',
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

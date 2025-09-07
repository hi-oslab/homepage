import type { Config } from 'tailwindcss'

export default {
  mode: 'jit',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontSize: {
      xxxs: '0.6rem', // 10px
      xxs: '0.65rem', // 11px
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
      '6xl': '4rem', // 64px
      '7xl': '5rem', // 80px
      '8xl': '6rem', // 96px
      '9xl': '8rem', // 128px
    },
    extend: {
      colors: {
        primary: '#1A49F1',
      },
      fontFamily: {
        // 한글용 폰트
        korean: ['var(--font-pretendard)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      aspectRatio: {},
    },
  },
  plugins: [],
} satisfies Config

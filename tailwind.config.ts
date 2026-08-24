import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      keyframes: {
        // Steam wisps drifting up off the pot
        steam: {
          '0%': { opacity: '0', transform: 'translateY(4px) scaleX(0.8)' },
          '35%': { opacity: '0.85' },
          '100%': { opacity: '0', transform: 'translateY(-14px) scaleX(1.35)' },
        },
        // Bubbles rising inside the pot
        bubble: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0.5)' },
          '30%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(-9px) scale(1.15)' },
        },
        // The pot rocking gently on the heat
        simmer: {
          '0%, 100%': { transform: 'rotate(-1.4deg)' },
          '50%': { transform: 'rotate(1.4deg)' },
        },
        // Indeterminate progress sweep
        sweep: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(320%)' },
        },
      },
      animation: {
        steam: 'steam 2.4s ease-out infinite',
        bubble: 'bubble 1.6s ease-in-out infinite',
        simmer: 'simmer 2.8s ease-in-out infinite',
        sweep: 'sweep 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config

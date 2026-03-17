import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper:    '#FDFAF5',
        card:     '#FFFFFF',
        navy:     '#1A1A2E',
        'navy-light': '#2D2D4E',
        grey:     '#6B7280',
        'grey-light': '#9CA3AF',
        human:    '#2D6A4F',
        'human-light': '#3D8A65',
        middle:   '#F4A261',
        ai:       '#E63946',
        highlight:'#FFE8C8',
        'border-warm': '#E8E0D5',
        'border-light': '#F0EBE3',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['DM Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(26,26,46,0.08)',
        'card-hover': '0 6px 24px rgba(26,26,46,0.14)',
        'input': '0 1px 3px rgba(26,26,46,0.06)',
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;

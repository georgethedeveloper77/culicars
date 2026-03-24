import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cc-bg':      '#0E0E0E',
        'cc-surface': '#141414',
        'cc-surface2':'#1A1A1A',
        'cc-accent':  '#D4A843',
      },
    },
  },
  plugins: [],
};

export default config;

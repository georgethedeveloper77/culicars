"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    content: ['./src/**/*.{ts,tsx,js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-sora)', 'sans-serif'],
                mono: ['var(--font-mono)', 'monospace'],
            },
            colors: {
                'cc-bg': '#0a0c10',
                'cc-surface': '#111318',
                'cc-surface-2': '#181c24',
                'cc-border': '#1e2330',
                'cc-border-2': '#252c3a',
                'cc-text': '#e8eaf0',
                'cc-muted': '#8892a4',
                'cc-faint': '#4a5568',
                'cc-accent': '#f5a623',
                'cc-accent-dim': '#c4841c',
                'cc-green': '#22c55e',
                'cc-red': '#ef4444',
                'cc-blue': '#3b82f6',
                'cc-yellow': '#eab308',
            },
            backgroundImage: {
                'grid-pattern': `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            },
            backgroundSize: {
                'grid-40': '40px 40px',
            },
        },
    },
    plugins: [],
};
exports.default = config;

'use strict';
// tailwind.config.js
// ─────────────────────────────────────────────────────────────────────────────
// Unified build-time Tailwind config (replaces 432 KB CDN per-page load).
// Merged from 15 distinct inline configs found across src/pages/**/*.html
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  content: [
    './src/router-test.html',
    './src/**/*.html',
    // JS files are intentionally excluded from content scanning to reduce CSS
    // output. All JS-only Tailwind classes are listed in the safelist below.
    // This avoids false-positive matches (e.g. path data, JSON keys) in JS.
  ],
  darkMode: 'class',
  corePlugins: {
    // Preflight (Tailwind reset) is redundant with styles.css which has its
    // own * { box-sizing, margin, padding } reset + html/body styling.
    preflight: false,
  },
  theme: {
    extend: {
      animation: {
        'bounce-once': 'bounce-once 0.6s ease-out',
      },
      keyframes: {
        'bounce-once': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
      },
      colors: {
        // ── Core brand tokens (used by 39+ pages) ────────────────────────────
        'primary':            '#2E7D32',   // BrewYuKoLi forest green
        'background-light':   '#f8f6f6',
        'background-dark':    '#221610',

        // ── Supplementary tokens (used by specific page variants) ─────────────
        'industrial-gray':    '#4a4a4a',
        'industrial-gray-900':'#1A1A1A',
        'industrial-gray-800':'#2D2D2D',
        'industrial-gray-100':'#F4F4F4',
        'slate-dark':         '#0f172a',
        'obsidian':           '#111111',
        'slate-zinc':         '#27272a',
        'tech-silver':        '#e2e8f0',
        'silver':             '#e2e8f0',
        'steel-blue':         '#2D3436',

        // ── Legacy landing-page tokens ──────────────────────────────────────────
        'vitality-orange':    '#2E7D32',
        'yukoli-orange':      '#2E7D32',
        'yukoli-obsidian':    '#121417',
        'yukoli-dark-grey':   '#1A1D21',
        'yukoli-muted-grey':  '#2A2E35',
        'industrial-dark':    '#121212',
        'slate-gray':         '#2D2D2D',
      },
      fontFamily: {
        'display': ['Public Sans', 'sans-serif'],
        'sans':    ['Inter', 'Public Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'lg':      '0.5rem',
        'xl':      '0.75rem',
        '2xl':     '1rem',
        '3xl':     '1.5rem',
        'full':    '9999px',
      },
    },
  },
  plugins: [],
  safelist: [
    // ── Padding (exact classes used across HTML/JS) ────────────
    'p-0', 'p-1', 'p-2', 'p-2.5', 'p-3', 'p-3.5', 'p-4', 'p-5', 'p-6', 'p-8',
    'p-10', 'p-12',
    'px-2', 'px-2.5', 'px-3', 'px-4', 'px-5', 'px-6', 'px-7', 'px-8',
    'px-10',
    'py-0.5', 'py-1', 'py-1.5', 'py-2', 'py-2.5', 'py-3', 'py-3.5',
    'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12', 'py-16', 'py-20',
    'py-24',
    'pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-6', 'pt-8', 'pt-12',
    'pb-0', 'pb-1', 'pb-2', 'pb-3', 'pb-4', 'pb-6', 'pb-8', 'pb-10',
    'pb-20', 'pb-24',
    'pl-3', 'pl-4', 'pl-8',
    'pr-2',
    // ── Margin (exact classes used across HTML/JS) ────────────
    'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-24',
    'mx-1', 'mx-1.5', 'mx-4', 'mx-auto',
    'my-0', 'my-1', 'my-2', 'my-3', 'my-4', 'my-5', 'my-6', 'my-8',
    'my-10', 'my-12', 'my-16', 'my-20', 'my-24',
    'mt-0.5', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8',
    'mt-10', 'mt-12', 'mt-16', 'mt-24', 'mt-32', 'mt-auto',
    'mb-0', 'mb-0.5', 'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6',
    'mb-8', 'mb-10', 'mb-12', 'mb-16', 'mb-24',
    'ml-1', 'ml-2', 'ml-8', 'ml-18', 'ml-24', 'ml-auto',
    'mr-16', 'mr-24', 'mr-32',
    // ── Negative margin ────────────────────────────────────
    '-mx-4',
    '-ml-2', '-ml-18', '-ml-24',
    '-mr-16', '-mr-24', '-mr-32',
    '-mt-16', '-mt-24', '-mt-32',
    '-mb-18', '-mb-24',
    // ── Gap ────────────────────────────────────────────────
    'gap-0.5', 'gap-1', 'gap-1.5', 'gap-2', 'gap-2.5', 'gap-3',
    'gap-4', 'gap-5', 'gap-6', 'gap-8', 'gap-10', 'gap-12',
    // ── Width / Height / Max-Width ──────────────────────────
    'w-1/2', 'w-1/3', 'w-2/3', 'w-3/4', 'w-fit', 'w-full', 'w-auto',
    'w-2', 'w-5', 'w-6', 'w-7', 'w-8', 'w-9', 'w-10', 'w-12',
    'w-14', 'w-16', 'w-20', 'w-24', 'w-28', 'w-32', 'w-48',
    'h-auto', 'h-full', 'h-screen',
    'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-7', 'h-8', 'h-9',
    'h-10', 'h-11', 'h-12', 'h-14', 'h-16', 'h-20', 'h-24',
    'h-28', 'h-32', 'h-36', 'h-40', 'h-48', 'h-72',
    'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl',
    'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-7xl',
    // ── JS-only position classes ───────────────────────────
    'bottom-3', 'bottom-4',
    'left-1', 'left-2', 'left-3',
    'top-1', 'top-3', 'top-4', 'top-20', 'top-24',
    'z-50',
    // ── JS-only miscellaneous ──────────────────────────────
    'opacity-40', 'shrink-0',
    'border-2',
    // ── Common utility classes dynamically used ──────────────
    'bg-white',
    // ── Grid dynamic classes (footer, product cards, etc.) ──
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',
    'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4',
    'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4',
    'xl:grid-cols-4',
    // ── Case-grid dynamic classes ──────────────────────────
    'bg-blue-100','bg-blue-500','bg-blue-600',
    'bg-green-100','bg-green-500','bg-green-600',
    'bg-orange-100','bg-orange-500','bg-orange-600',
    'bg-purple-100','bg-purple-500','bg-purple-600',
    'bg-primary-100','bg-primary-500','bg-primary-600',
    'text-blue-600','text-green-600','text-orange-600','text-purple-600','text-primary-600',
    'border-blue-500','border-green-500','border-orange-500','border-purple-500','border-primary-500',
    'border-blue-400','border-green-400','border-orange-400','border-purple-400',
    'dark:bg-blue-900','dark:bg-green-900','dark:bg-orange-900','dark:bg-purple-900','dark:bg-primary-900',
    'dark:bg-blue-900/30','dark:bg-green-900/30','dark:bg-orange-900/30','dark:bg-purple-900/30','dark:bg-primary-900/30',
    'dark:bg-slate-900/50',
    'lg:flex-row','lg:w-2/5','lg:h-auto','lg:p-8','lg:text-2xl','lg:text-3xl',
    'flex-col','flex-row','justify-center','min-h-[220px]','backdrop-blur-sm','border-l-4','pl-4',
    'bg-slate-50','bg-slate-200','bg-slate-700','bg-slate-800','bg-slate-900',
    'text-slate-200','text-slate-300','text-slate-400','text-slate-500','text-slate-600','text-slate-700','text-slate-900',
    'group-hover:scale-105','group-hover:gap-2','group-hover:shadow-xl',
    'hover:shadow-lg','hover:shadow-xl',
    'group-hover:border-blue-500/50','group-hover:border-green-500/50',
    'group-hover:border-orange-500/50','group-hover:border-purple-500/50','group-hover:border-primary-500/50',
    'rounded-xl','rounded-2xl','rounded-lg','rounded-full',
  ],
};

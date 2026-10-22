import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F2F5F1',
        sheet: '#FFFFFF',
        grid: '#9DC4AE',
        'grid-soft': '#DCEAE1',
        ink: '#22313F',
        'ink-muted': '#5A6A77',
        proof: '#C8382E',
        mark: '#FFE36E',
        ok: '#2E7A52',
      },
      fontFamily: {
        kai: ['"LXGW WenKai TC"', '"Noto Sans TC"', '"PingFang TC"', '"Microsoft JhengHei"', 'sans-serif'],
        sans: ['"Noto Sans TC"', '"PingFang TC"', '"Microsoft JhengHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

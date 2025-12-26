// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default <Config>{
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Warna custom untuk tema terminal
        'hacker-black': '#0a0a0a',
        'hacker-gray': '#1a1a1a',
        'hacker-green': '#00ff41',
      },
      fontFamily: {
        // Paksa font monospace agar terlihat seperti coding
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      }
    },
  },
  plugins: [],
}
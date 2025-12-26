// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Daftarkan file CSS utama
  css: ['~/assets/css/main.css'],

  // Konfigurasi PostCSS untuk Tailwind
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // MATIKAN SSR (Server Side Rendering)
  // Ini wajib agar Wasmoon jalan full di browser client
  ssr: false,

  app: {
    head: {
      title: 'Prometheus Auto-Web',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Web-based Lua Obfuscator powered by Prometheus & Wasmoon' }
      ]
    }
  }
})
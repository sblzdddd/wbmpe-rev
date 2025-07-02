import tailwindcss from "@tailwindcss/vite";

const sw = false

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI, // Expose MONGODB_URI to runtime config
  },
  
  app: {
      pageTransition: {name: 'page', mode: 'out-in'},
      layoutTransition: {name: 'page', mode: 'out-in'},
      head: {
        link: [
          { rel: 'icon', sizes: '64x64', href: '/favicon.ico' },
          { rel: 'icon', type: 'image/svg+xml', sizes: 'any', href: '/favicon.svg' },
          { rel: 'apple-touch-icon', sizes: '180x180', href: '/images/icon/icon_180.png' },
          { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/images/icon/icon_32.png' },
          { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/images/icon/icon_64.png' },
          { rel: 'icon', type: 'image/png', sizes: '128x128', href: '/images/icon/icon_128.png' },
          { rel: 'icon', type: 'image/png', sizes: '180x180', href: '/images/icon/icon_180.png' },
          { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/images/icon/icon_192.png' },
          { rel: 'icon', type: 'image/png', sizes: '256x256', href: '/images/icon/icon_256.png' },
          { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/images/icon/icon_512.png' },
        ]
      }
  },
  devtools: { enabled: true, timeline: { enabled: true } },

  srcDir: 'src',
  
  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  modules: [
    'shadcn-nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@vite-pwa/nuxt',
    'nuxt-auth-utils'
  ],

  // pwa: {
  //   strategies: sw ? 'injectManifest' : 'generateSW',
  //   srcDir: sw ? 'service-worker' : undefined,
  //   filename: sw ? 'sw.ts' : undefined,
  //   registerType: 'autoUpdate',
  //   manifest: {
  //     name: 'WBMPE Rev',
  //     short_name: 'NuxtVitePWA',
  //     theme_color: '#ffffff',
  //     icons: [
  //       {
  //         src: '/images/icon/icon_64.png',
  //         sizes: '64x64',
  //         type: 'image/png'
  //       },
  //       {
  //         src: '/images/icon/icon_192.png',
  //         sizes: '192x192',
  //         type: 'image/png',
  //       },
  //       {
  //         src: '/images/icon/icon_512.png',
  //         sizes: '512x512',
  //         type: 'image/png',
  //       },
  //       {
  //         src: '/images/icon/icon_512.png',
  //         sizes: '512x512',
  //         type: 'image/png',
  //         purpose: 'any maskable',
  //       },
  //     ],
  //   },
  //   workbox: {
  //     globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
  //   },
  //   injectManifest: {
  //     globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
  //   },
  //   client: {
  //     installPrompt: true,
  //     periodicSyncForUpdates: 3600,
  //   },
  //   devOptions: {
  //     enabled: true,
  //     suppressWarnings: true,
  //     navigateFallback: '/',
  //     navigateFallbackAllowlist: [/^\/$/],
  //     type: 'module',
  //   },
  // },

  colorMode: {
    classSuffix: ''
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     */
    componentDir: './src/components/ui'
  }
})
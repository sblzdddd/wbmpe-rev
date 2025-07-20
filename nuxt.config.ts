import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI, // Expose MONGODB_URI to runtime config
    oauth: {
      // provider in lowercase (github, google, etc.)
      heroku: {
        clientId: process.env.NUXT_OAUTH_HEROKU_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_HEROKU_CLIENT_SECRET
      },
      github: {
        clientId: process.env.NUXT_OAUTH_GITHUB_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GITHUB_CLIENT_SECRET
      },
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
      }
    },
    session: {
      maxAge: 60 * 60 * 24 * 7 // 1 week (7 days) in seconds
    }
  },

  app: {
      pageTransition: {name: 'page', mode: 'out-in'},
      layoutTransition: {name: 'layout', mode: 'out-in'},
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
    // '@vite-pwa/nuxt',
    'nuxt-auth-utils',
    'nuxt-security',
    '@sentry/nuxt/module'
  ],

  security: {
    nonce: true, // Enables HTML nonce support in SSR mode
    ssg: {
      meta: true, // Enables CSP as a meta tag in SSG mode
      hashScripts: true, // Enables CSP hash support for scripts in SSG mode
      hashStyles: false // Disables CSP hash support for styles in SSG mode (recommended)
    },
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', 'https://avatars.githubusercontent.com', 'https://lh3.googleusercontent.com']
      }
    }
  },

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

  nitro: {
    experimental: {
      openAPI: true,
      tasks: true,
    },
    openAPI: {
      route: "/_docs/openapi.json",
      meta: {
        title: 'BakaAPI',
        description: 'BakaAPI is the RESTful API for WBMPE.',
        version: '1.0',
      },
      production: "runtime",
      ui: {
        scalar: {
          route: "/_docs/scalar",
          theme: 'default'
        },
        swagger: {
          route: "/_docs/swagger",
        }
      }
    },
    scheduledTasks: {
      // Run `cleanup:password-reset-token` task every hour
      '0 * * * *': ['cleanup:tokens']
    }
  },

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
  },

  sentry: {
    sourceMapsUploadOptions: {
      org: 'sblzdddd',
      project: 'wbmp-rev'
    }
  },

  sourcemap: {
    client: 'hidden'
  }
})
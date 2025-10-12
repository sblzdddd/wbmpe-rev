// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI, // Expose MONGODB_URI to runtime config
    oauth: {
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
      maxAge: 60 * 60 * 24 * 7, // 1 week (7 days) in seconds
      password: process.env.NUXT_SESSION_PASSWORD || 'YouHaveNoSessionPasswordBaka',
      name: 'baka-session'
    }
  },

  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxtjs/color-mode',
    'nuxt-auth-utils',
    'motion-v/nuxt',
    '@vueuse/nuxt'
  ],

  image: {
    aliyun: {
      baseURL: process.env.NUXT_IMAGE_ALIYUN_BASE_URL || 'https://no-cdn-you-baka.site'
    },
    providers: {
      proxy: {
        name: 'proxy',
        provider: '~/providers/proxy-provider.ts'
      },
      netease: {
        name: 'netease',
        provider: '~/providers/netease-provider.ts'
      }
    },
  },

  
  app: {
      pageTransition: {name: 'page', mode: 'out-in'},
      layoutTransition: {name: 'layout', mode: 'out-in'},
      head: {
        title: 'WBMPE Rev',
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
  css: ['~/assets/css/tailwind.css'],

  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },

  colorMode: {
    classSuffix: '',
    storage: 'cookie',
    storageKey: 'baka-theme',
  },
  
  alias: {
    '#types': '../types',
    '#composables': '../app/composables',
    '#utils': '~/utils',
    '#models': '~/models',
  },
  
  imports: {
    dirs: [
      'composables/**',
      '../types/**',
      '../shared/validators/**',
      './components/ui/sidebar',
    ],
    presets: [
      {
        from: 'animejs',
        imports: ['animate', 'spring', 'createTimeline', {name: 'Timeline', type: true}]
      },
      {
        from: 'nitropack',
        imports: [{name: 'InternalApi', type: true}]
      },
      {
        from: 'vue',
        imports: [{name: 'HTMLAttributes', type: true}]
      }
    ]
  },

  nitro: {
    imports: {
      dirs: [
        './server/models',
        './types/**',
        './shared/validators/**',
      ]
    },
    experimental: {
      openAPI: true,
      websocket: true,
      tasks: true,
    },
    openAPI: {
      route: "/_hidden/openapi.json",
      meta: {
        title: 'BakaAPI',
        description: 'BakaAPI is the RESTful API for WBMPE.',
        version: '1.0',
      },
      production: "runtime",
      ui: {
        scalar: {
          route: "/_hidden/scalar",
          theme: 'default'
        },
        swagger: {
          route: "/_hidden/swagger",
        }
      }
    },
    scheduledTasks: {
      // Run `cleanup:password-reset-token` task every hour
      '0 * * * *': ['cleanup:tokens']
    },
  },

  components: [],
})
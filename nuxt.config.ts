import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  app: {
      pageTransition: {name: 'page', mode: 'out-in'},
      layoutTransition: {name: 'page', mode: 'out-in'}
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
  ],

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
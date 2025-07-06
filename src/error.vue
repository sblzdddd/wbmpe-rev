<script setup lang="ts">
import type { NuxtError } from '#app'
import { Button } from '@/components/ui/button'

defineProps({
  error: {type:Object as () => NuxtError, required: true}
})

const canGoBack = computed(() => window.history.length > 1)

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>
    <div class="flex flex-col items-center justify-center min-h-[60vh]">
      <div class="text-center space-y-4">
        <h2 class="text-6xl font-bold text-muted-foreground">{{ error?.statusCode || '404' }}</h2>
        <h1 class="text-2xl font-semibold">{{ error?.statusMessage || 'Page Not Found' }}</h1>
        <p class="text-muted-foreground max-w-md mb-1">
          {{ error?.message || 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.' }}
        </p>
        <div class="flex gap-2 justify-center">
          <Button variant="default" @click="handleError">
            <Icon name="lucide:home" class="w-4 h-4 mr-2" />
            Go Home
          </Button>
          <ClientOnly>
            <Button v-if="canGoBack" variant="outline" @click="$router.back()">
              <Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </ClientOnly>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
<script setup lang="ts">
import AuthLoginForm from '~/components/Auth/LoginForm.vue';

definePageMeta({
  layout: 'fullscreen',
  middleware: 'guest'
})
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
      <div class="bg-card border rounded-lg shadow-lg p-4">
        <Auth-LoginForm is-page />
      </div>
    </div>
  </div>
</template> 
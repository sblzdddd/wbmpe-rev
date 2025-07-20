<script setup lang="ts">
definePageMeta({
  layout: 'fullscreen'
})
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
      <div class="bg-card border rounded-lg shadow-lg p-4">
        <Auth-ForgotPasswordForm is-page />
      </div>
    </div>
  </div>
</template> 
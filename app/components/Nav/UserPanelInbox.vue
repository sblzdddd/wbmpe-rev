<script setup lang="ts">

</script>

<template>
  <div class="user-panel-inbox">
    <!-- Empty State -->
    <div class="inbox-empty">
      <Icon name="lucide:inbox" size="24" class="opacity-50" />
      <p class="text-sm opacity-75">No notifications</p>
    </div>
  </div>
</template>

<style scoped>
@reference '../../assets/css/tailwind.css';
/* User panel inbox styles */
.user-panel-inbox {
  @apply flex flex-col items-start gap-2 p-1 pt-2 border-t border-border;
}

.user-panel-inbox-header {
  @apply flex justify-between w-full items-center;
}

.user-panel-inbox-title {
  @apply text-sm inline-flex items-center gap-2;
}

.user-panel-inbox-mark-read {
  @apply bg-none cursor-pointer text-xs opacity-50 flex items-center gap-1;
}

.notification-count {
  @apply bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 ml-2;
}

.connection-status {
  @apply flex items-center justify-center w-4 h-4 rounded-full;
}

.connection-status.connected {
  @apply bg-green-500/20 text-green-500;
}

.connection-status.disconnected {
  @apply bg-red-500/20 text-red-500;
}

.user-panel-inbox-section {
  @apply w-full;
}

.inbox-section-title {
  @apply text-xs font-medium uppercase tracking-wide opacity-75 mb-2;
}

.inbox-empty {
  @apply w-full flex flex-col items-center justify-center py-6 text-center;
}

.error-message {
  @apply text-red-500 text-xs truncate;
}
</style>

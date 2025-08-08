<script setup lang="ts">
const { activeTasks, recentTasks, notificationCount, isConnected } = useTasks()
</script>

<template>
  <div class="user-panel-inbox">
    <div class="user-panel-inbox-header">
      <p class="user-panel-inbox-title">
        <Icon name="lucide:inbox" size="16" /> 
        Inbox
        <span v-if="notificationCount > 0" class="notification-count">{{ notificationCount }}</span>
      </p>
      <div class="flex items-center gap-2">
        <div v-if="isConnected" class="connection-status connected" title="Connected">
          <Icon name="lucide:wifi" size="12" />
        </div>
        <div v-else class="connection-status disconnected" title="Disconnected">
          <Icon name="lucide:wifi-off" size="12" />
        </div>
      </div>
    </div>
    
    <!-- Active Tasks -->
    <div v-if="activeTasks.length > 0" class="user-panel-inbox-section">
      <h4 class="inbox-section-title">Parsing Tasks</h4>
      <div class="inbox-task-list">
        <div v-for="task in activeTasks" :key="task._id" class="inbox-task-item">
          <div class="task-info">
            <div class="task-title">{{ task.songName }}</div>
            <div class="task-status">{{ task.progressMessage || task.status }}</div>
          </div>
          <div class="task-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: task.progress + '%' }"
                :class="{
                  'progress-downloading': task.status === 'downloading',
                  'progress-processing': task.status === 'processing',
                  'progress-pending': task.status === 'pending'
                }"
              ></div>
            </div>
            <div class="progress-text">{{ task.progress }}%</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Recent Completed Tasks -->
    <div v-if="recentTasks.length > 0" class="user-panel-inbox-section">
      <h4 class="inbox-section-title">Recent Tasks</h4>
      <div class="inbox-task-list">
        <div v-for="task in recentTasks" :key="task._id" class="inbox-task-item completed">
          <div class="task-info">
            <div class="task-title">{{ task.songName }}</div>
            <div class="task-status">
              <Icon 
                :name="task.status === 'completed' ? 'lucide:check-circle' : 'lucide:x-circle'" 
                size="12" 
                :class="task.status === 'completed' ? 'text-green-500' : 'text-red-500'"
              />
              {{ task.status === 'completed' ? 'Completed' : 'Failed' }}
              <span v-if="task.errorMessage" class="error-message">: {{ task.errorMessage }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="activeTasks.length === 0 && recentTasks.length === 0" class="inbox-empty">
      <Icon name="lucide:inbox" size="24" class="opacity-50" />
      <p class="text-sm opacity-75">No parsing tasks</p>
    </div>
  </div>
</template>

<style scoped>
@reference '../../assets/css/tailwind.css';
/* User panel inbox styles */
.user-panel-inbox {
  @apply flex flex-col items-start gap-2 py-2 px-1 border-t border-border;
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

.inbox-task-list {
  @apply space-y-1 max-h-[30vh] overflow-y-auto overflow-x-hidden;
}

.inbox-task-item {
  @apply p-2 w-full max-w-50 max-h-20 rounded-md bg-black/5 dark:bg-white/5 border border-border/50;
}

.inbox-task-item.completed {
  @apply opacity-75;
}

.task-info {
  @apply mb-1;
}

.task-title {
  @apply text-sm font-medium truncate;
}

.task-artist {
  @apply text-xs opacity-75 truncate;
}

.task-status {
  @apply text-xs opacity-60 flex items-center gap-1 mt-1 w-38;
}

.task-progress {
  @apply flex items-center gap-2;
}

.progress-bar {
  @apply flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full transition-all duration-300 ease-out;
}

.progress-pending {
  @apply bg-gray-400;
}

.progress-downloading {
  @apply bg-blue-500;
}

.progress-processing {
  @apply bg-yellow-500;
}

.progress-text {
  @apply text-xs font-mono opacity-75;
}

.inbox-empty {
  @apply w-full flex flex-col items-center justify-center py-6 text-center;
}

.error-message {
  @apply text-red-500 text-xs;
}
</style>

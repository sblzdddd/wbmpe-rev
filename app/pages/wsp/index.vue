<script setup lang="ts">
import { useWSP } from '~/composables/WSP/useWSP'
import { usePlayer } from '~/composables/Player/usePlayer'
import { useAudio } from '~/composables/Player/useAudio'

const { loggedIn, user } = useAuth()

const { connected, lastEvent } = useWSP()
const player = usePlayer()
const audio = useAudio()

const events = ref<any[]>([])

watch(lastEvent, (event) => {
  if (event) {
    events.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      ...event
    })
    if (events.value.length > 50) {
      events.value.pop()
    }
  }
})

const clearLogs = () => {
  events.value = []
}
</script>

<template>
  <div v-if="!loggedIn" class="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Icon name="lucide:lock" class="w-16 h-16 text-gray-400" />
      <h1 class="text-2xl font-bold">Authentication Required</h1>
      <p class="text-gray-500">Please log in to access the Shared Player.</p>
      <NuxtLink to="/login">
        <Button>Go to Login</Button>
      </NuxtLink>
  </div>
  <div v-else class="p-6 max-w-4xl mx-auto space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">WSP</h1>
      <div class="flex items-center gap-2">
        <div 
          class="w-3 h-3 rounded-full"
          :class="connected ? 'bg-green-500' : 'bg-red-500'"
        ></div>
        <span class="font-medium">{{ connected ? 'Connected' : 'Disconnected' }}</span>
      </div>
    </div>

    <!-- Player State -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Room: WNFOSG</h2>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-500">Status:</span>
            <span :class="audio.isPlaying.value ? 'text-green-500' : 'text-yellow-500'">
              {{ audio.isPlaying.value ? 'Playing' : 'Paused' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Song:</span>
            <span class="truncate max-w-[200px]">{{ player.currentSong.value?.name || 'None' }}</span>
          </div>
          <div class="w-full flex justify-end py-1">
            <Button size="sm" variant="destructive">
              <Icon name="lucide:log-out" /> Leave Room
            </Button>
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col justify-start gap-4">
        <h2 class="text-xl font-semibold">Participants</h2>
        <div class="flex gap-2 items-center">
          <img class="rounded-full size-8" :src="user?.data.value?.avatarUrl" />
          <span>{{ user?.data.value?.userName }}</span>
        </div>
        <!-- more users here -->
      </div>
    </div>

    <!-- Event Log -->
    <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Event Log</h2>
        <button @click="clearLogs" class="text-sm text-gray-500 hover:text-gray-700">Clear</button>
      </div>
      
      <div class="h-96 overflow-y-auto font-mono text-sm bg-black text-green-400 p-4 rounded">
        <div v-if="events.length === 0" class="text-gray-500 italic">No events received yet...</div>
        <div v-for="(event, index) in events" :key="index" class="mb-1 border-b border-gray-800 pb-1 last:border-0">
          <span class="text-gray-500">[{{ event.timestamp }}]</span>
          <span class="text-yellow-400 font-bold ml-2">{{ event.type }}</span>
          <span class="ml-2 text-gray-300" v-if="event.type === 'SEEK'">-> {{ event.time?.toFixed(2) }}s</span>
          <span class="ml-2 text-gray-300" v-if="event.type === 'CHANGE_SONG'">-> {{ event.song?.name }}</span>
           <span class="ml-2 text-gray-300" v-if="event.type === 'UPDATE_QUEUE'">-> Index: {{ event.currentIndex }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

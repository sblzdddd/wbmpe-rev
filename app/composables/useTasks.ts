import type { SongType } from '#types/Song'

interface ParseTask {
  _id: string;
  songId: string;
  songName: string;
  artistName: string;
  albumName: string;
  status: 'pending' | 'downloading' | 'processing' | 'completed' | 'failed';
  progress: number;
  progressMessage?: string;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface TaskUpdate {
  type: 'task_progress' | 'task_status' | 'task_completed';
  taskId: string;
  progress?: number;
  message?: string;
  status: string;
  errorMessage?: string;
  song?: SongType;
  streams?: {
    songId: string;
    audio: {
      normal: string | null;
      high: string | null;
      lossless: string | null;
    };
    video: string | null;
  };
}

interface DeferredPlayback {
  taskId: string;
  songId: string;
  songName: string;
  artistName: string;
  albumName: string;
}

interface SSEState {
  tasks: ParseTask[];
  isConnected: boolean;
  reconnectTimeout: NodeJS.Timeout | null;
  eventSource: EventSource | null;
  deferredPlaybacks: DeferredPlayback[];
}

export const useTasks = () => {
  const sseState = useState<SSEState>('sseState', () => ({
    tasks: [],
    isConnected: false,
    reconnectTimeout: null,
    eventSource: null,
    deferredPlaybacks: [],
  }))
  const { user } = useAuth();
  
  // Fetch initial tasks
  const fetchTasks = async () => {
    try {
      if (!user.data.value?._id) return;
      
      const response = await $fetch('/api/tasks', {
        query: {
          limit: 20,
          status: undefined // Get all tasks
        }
      });
      
      if (response.success && response.tasks) {
        sseState.value.tasks = response.tasks as unknown as ParseTask[];
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };
  


  // Connect to SSE
  const connectSSE = (force = false) => {
    if (!user.data.value?._id || sseState.value.isConnected && !force) return;
    if (sseState.value.eventSource) {
      if(!force) return
      sseState.value.eventSource.close();
      sseState.value.eventSource = null;
    }
    
    try {
      // Create EventSource for SSE
      sseState.value.eventSource = new EventSource('/api/tasks/events', {
        withCredentials: true
      });
      
      sseState.value.eventSource.onopen = () => {
        sseState.value.isConnected = true;
        console.log('SSE connected');
        
        // Clear any existing reconnect timeout
        if (sseState.value.reconnectTimeout) {
          clearTimeout(sseState.value.reconnectTimeout);
          sseState.value.reconnectTimeout = null;
        }
      };
      
      sseState.value.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'heartbeat' || data.type === 'connected') {
            // Handle heartbeat/connection messages
            return;
          }
          
          const update: TaskUpdate = data;
          handleTaskUpdate(update);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };
      
      sseState.value.eventSource.onerror = () => {
        sseState.value.isConnected = false;
        console.log('SSE disconnected');
        sseState.value.eventSource?.close();
        
        // Attempt to reconnect after 3 seconds
        if (!sseState.value.reconnectTimeout) {
          sseState.value.reconnectTimeout = setTimeout(() => {
            connectSSE();
          }, 3000);
        }
      };
      
    } catch (error) {
      console.error('Failed to connect SSE:', error);
    }
  };
  
  // Handle deferred playback with song data directly from SSE
  const handleDeferredPlaybackWithSong = async (taskId: string, song: SongType) => {
    const deferredIndex = sseState.value.deferredPlaybacks.findIndex(
      deferred => deferred.taskId === taskId
    );
    
    if (deferredIndex >= 0) {
      const deferred = sseState.value.deferredPlaybacks[deferredIndex];
      if (deferred) {
        console.log('Starting deferred playback for song (with SSE data):', song.name, 'songId:', song._id);
        
        try {
          // Get the parsed song and start playing using the song data from SSE
          const { addSong } = usePlayer();
          
          console.log('Song received via SSE, starting playback...');
          await addSong(song, true); // true = play immediately
          console.log('Deferred playback started successfully for:', song.name);
        } catch (error) {
          console.error('Failed to start deferred playback with SSE song data:', error);
        } finally {
          // Remove the deferred playback entry
          sseState.value.deferredPlaybacks.splice(deferredIndex, 1);
        }
      }
    } else {
      console.log('No deferred playback found for task:', taskId);
    }
  };

  // Handle deferred playback asynchronously (separate from main update logic)
  const handleDeferredPlayback = async (taskId: string) => {
    const deferredIndex = sseState.value.deferredPlaybacks.findIndex(
      deferred => deferred.taskId === taskId
    );
    
    if (deferredIndex >= 0) {
      const deferred = sseState.value.deferredPlaybacks[deferredIndex];
      if (deferred) {
        console.log('Starting deferred playback for song:', deferred.songName, 'songId:', deferred.songId);
        
        // Validate songId before making the request
        if (!deferred.songId || deferred.songId === 'undefined') {
          console.error('Invalid songId for deferred playback:', deferred.songId);
          sseState.value.deferredPlaybacks.splice(deferredIndex, 1);
          return;
        }
        
        try {
          // Get the parsed song and start playing
          const { addSong } = usePlayer();
          
          // Fetch the song details first
          console.log('Fetching song details from:', `/api/song/${deferred.songId}`);
          const songResponse = await $fetch(`/api/song/${deferred.songId}`) as { success: boolean; song?: SongType };
          
          if (songResponse?.success && songResponse?.song) {
            console.log('Song fetched successfully, starting playback...');
            await addSong(songResponse.song, true); // true = play immediately
            console.log('Deferred playback started successfully for:', songResponse.song.name);
          } else {
            console.error('Failed to fetch song details:', songResponse);
          }
        } catch (error) {
          console.error('Failed to start deferred playback:', error);
        } finally {
          // Remove the deferred playback entry
          sseState.value.deferredPlaybacks.splice(deferredIndex, 1);
        }
      }
    } else {
      console.log('No deferred playback found for task:', taskId);
    }
  };

  // Handle task updates from SSE (synchronous to avoid breaking SSE)
  const handleTaskUpdate = (update: TaskUpdate) => {
    const taskIndex = sseState.value.tasks.findIndex(task => task._id === update.taskId);
    
    if (taskIndex >= 0) {
      const task = sseState.value.tasks[taskIndex];
      if (!task) return;
      
      if (update.type === 'task_progress') {
        task.progress = update.progress ?? task.progress;
        task.progressMessage = update.message ?? task.progressMessage;
        task.status = update.status as ParseTask['status'];
      } else if (update.type === 'task_completed') {
        // Handle task completion with song data
        task.status = 'completed';
        task.progress = 100;
        task.completedAt = new Date().toISOString();
        
        const { openUserPanel } = useUserPanel();
        
        // Handle deferred playback using the song data from SSE
        if (update.song) {
          handleDeferredPlaybackWithSong(update.taskId, update.song);
        } else {
          // Fallback to old method if song data is missing
          handleDeferredPlayback(update.taskId);
        }
        
        openUserPanel();
      } else if (update.type === 'task_status') {
        task.status = update.status as ParseTask['status'];
        task.errorMessage = update.errorMessage;
        
        const { openUserPanel } = useUserPanel();
        
        if (update.status === 'completed') {
          // This shouldn't happen anymore with the new system, but keeping as fallback
          task.progress = 100;
          task.completedAt = new Date().toISOString();
          
          // Handle deferred playback asynchronously (don't await to avoid blocking SSE)
          handleDeferredPlayback(update.taskId);
          
          openUserPanel();
        } else if (update.status === 'failed') {
          task.completedAt = new Date().toISOString();
          
          // Remove deferred playback if task failed (synchronously)
          const deferredIndex = sseState.value.deferredPlaybacks.findIndex(
            deferred => deferred.taskId === update.taskId
          );
          if (deferredIndex >= 0) {
            console.log('Removing deferred playback for failed task:', update.taskId);
            sseState.value.deferredPlaybacks.splice(deferredIndex, 1);
          }
          
          openUserPanel();
        }
      }
      
      // Trigger reactivity
      sseState.value.tasks = [...sseState.value.tasks];
    } else {
      // If task not found, refetch tasks to get the latest
      fetchTasks();
    }
  };
  
  // Get active tasks (not completed or failed)
  const activeTasks = computed(() => 
    sseState.value.tasks.filter(task => 
      task.status !== 'completed' && task.status !== 'failed'
    )
  );
  
  // Get recent completed tasks
  const recentTasks = computed(() => 
    sseState.value.tasks
      .filter(task => task.status === 'completed' || task.status === 'failed')
      .slice(0, 5)
  );
  
  // Get unread notification count
  const notificationCount = computed(() => activeTasks.value.length);
  
  // Create a new parsing task
  const createParseTask = async (songId: string, autoPlay = false) => {
    console.log('Creating parse task for song:', songId, 'autoPlay:', autoPlay)
    try {
      const response = await $fetch('/api/tasks/parse', {
        method: 'POST',
        body: { songId }
      });
      
      if (response.success && response.task) {
        const task = response.task as unknown as ParseTask;
        
        // Add the new task to the beginning of the list
        sseState.value.tasks.unshift(task);
        
        // If autoPlay is enabled, add to deferred playbacks
        if (autoPlay) {
          const deferredPlayback: DeferredPlayback = {
            taskId: task._id,
            songId: songId, // Use the original songId parameter instead of task.songId
            songName: task.songName,
            artistName: task.artistName,
            albumName: task.albumName
          };
          sseState.value.deferredPlaybacks.push(deferredPlayback);
          console.log('Added deferred playback for task:', task._id, 'songId:', songId);
        }
        
        const { openUserPanel } = useUserPanel();
        openUserPanel();
        return task;
      }
    } catch (error) {
      console.error('Failed to create parse task:', error);
      throw error;
    }
  };
  
  // Clean up SSE connection
  const cleanup = () => {
    if (sseState.value.eventSource) {
      sseState.value.eventSource.close();
      sseState.value.eventSource = null;
    }
    
    if (sseState.value.reconnectTimeout) {
      clearTimeout(sseState.value.reconnectTimeout);
      sseState.value.reconnectTimeout = null;
    }
  };
  
  // Initialize when user is available
  watch(() => user.data.value?._id, (userId) => {
    if (userId) {
      fetchTasks();
      if (typeof window !== 'undefined') {
        connectSSE(true);
      }
    } else {
      sseState.value.tasks = [];
      cleanup();
    }
  }, { immediate: true });
  
  // Cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });
  
  // Check if a song has pending deferred playback
  const hasDeferredPlayback = (songId: string) => {
    return sseState.value.deferredPlaybacks.some(deferred => deferred.songId === songId);
  };

  // Remove deferred playback for a song (if user manually plays something else)
  const removeDeferredPlayback = (songId: string) => {
    const index = sseState.value.deferredPlaybacks.findIndex(deferred => deferred.songId === songId);
    if (index >= 0) {
      sseState.value.deferredPlaybacks.splice(index, 1);
    }
  };

  return {
    tasks: computed(() => sseState.value.tasks),
    activeTasks,
    recentTasks,
    notificationCount,
    deferredPlaybacks: computed(() => sseState.value.deferredPlaybacks),
    isConnected: computed(() => sseState.value.isConnected),
    fetchTasks,
    createParseTask,
    connectSSE,
    cleanup,
    hasDeferredPlayback,
    removeDeferredPlayback
  };
};

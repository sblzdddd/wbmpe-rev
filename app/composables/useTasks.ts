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
  type: 'task_progress' | 'task_status';
  taskId: string;
  progress?: number;
  message?: string;
  status: string;
  errorMessage?: string;
}

export const useTasks = () => {
  const tasks = ref<ParseTask[]>([]);
  const isConnected = ref(false);
  const { user } = useAuth();
  
  let ws: WebSocket | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  
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
        tasks.value = response.tasks;
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };
  
  // Connect to SSE
  const connectSSE = () => {
    if (!user.data.value?._id || isConnected.value) return;
    
    try {
      // Create EventSource for SSE
      const eventSource = new EventSource('/api/tasks/events');
      
      eventSource.onopen = () => {
        isConnected.value = true;
        console.log('SSE connected');
        
        // Clear any existing reconnect timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };
      
      eventSource.onmessage = (event) => {
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
      
      eventSource.onerror = () => {
        isConnected.value = false;
        console.log('SSE disconnected');
        eventSource.close();
        
        // Attempt to reconnect after 3 seconds
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            connectSSE();
          }, 3000);
        }
      };
      
      // Store eventSource reference for cleanup
      ws = eventSource as unknown as WebSocket;
      
    } catch (error) {
      console.error('Failed to connect SSE:', error);
    }
  };
  
  // Handle task updates from SSE
  const handleTaskUpdate = (update: TaskUpdate) => {
    const taskIndex = tasks.value.findIndex(task => task._id === update.taskId);
    
    if (taskIndex >= 0) {
      const task = tasks.value[taskIndex];
      if (!task) return;
      
      if (update.type === 'task_progress') {
        task.progress = update.progress ?? task.progress;
        task.progressMessage = update.message ?? task.progressMessage;
        task.status = update.status as ParseTask['status'];
      } else if (update.type === 'task_status') {
        task.status = update.status as ParseTask['status'];
        task.errorMessage = update.errorMessage;
        
        if (update.status === 'completed') {
          task.progress = 100;
          task.completedAt = new Date().toISOString();
        } else if (update.status === 'failed') {
          task.completedAt = new Date().toISOString();
        }
      }
      
      // Trigger reactivity
      tasks.value = [...tasks.value];
    } else {
      // If task not found, refetch tasks to get the latest
      fetchTasks();
    }
  };
  
  // Get active tasks (not completed or failed)
  const activeTasks = computed(() => 
    tasks.value.filter(task => 
      task.status !== 'completed' && task.status !== 'failed'
    )
  );
  
  // Get recent completed tasks
  const recentTasks = computed(() => 
    tasks.value
      .filter(task => task.status === 'completed' || task.status === 'failed')
      .slice(0, 5)
  );
  
  // Get unread notification count
  const notificationCount = computed(() => activeTasks.value.length);
  
  // Create a new parsing task
  const createParseTask = async (songId: string) => {
    try {
      const response = await $fetch('/api/tasks/parse', {
        method: 'POST',
        body: { songId }
      });
      
      if (response.success && response.task) {
        // Add the new task to the beginning of the list
        tasks.value.unshift(response.task as unknown as ParseTask);
        return response.task as unknown as ParseTask;
      }
    } catch (error) {
      console.error('Failed to create parse task:', error);
      throw error;
    }
  };
  
  // Clean up SSE connection
  const cleanup = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };
  
  // Initialize when user is available
  watch(() => user.data.value?._id, (userId) => {
    if (userId) {
      fetchTasks();
      if (typeof window !== 'undefined') {
        connectSSE();
      }
    } else {
      tasks.value = [];
      cleanup();
    }
  }, { immediate: true });
  
  // Cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });
  
  return {
    tasks,
    activeTasks,
    recentTasks,
    notificationCount,
    isConnected,
    fetchTasks,
    createParseTask,
    connectSSE,
    cleanup
  };
};

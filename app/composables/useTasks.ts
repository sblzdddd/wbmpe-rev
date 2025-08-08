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

interface SSEState {
  tasks: ParseTask[];
  isConnected: boolean;
  reconnectTimeout: NodeJS.Timeout | null;
  eventSource: EventSource | null;
}

export const useTasks = () => {
  const sseState = useState<SSEState>('sseState', () => ({
    tasks: [],
    isConnected: false,
    reconnectTimeout: null,
    eventSource: null,
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
  
  // Handle task updates from SSE
  const handleTaskUpdate = (update: TaskUpdate) => {
    const taskIndex = sseState.value.tasks.findIndex(task => task._id === update.taskId);
    
    if (taskIndex >= 0) {
      const task = sseState.value.tasks[taskIndex];
      if (!task) return;
      
      if (update.type === 'task_progress') {
        task.progress = update.progress ?? task.progress;
        task.progressMessage = update.message ?? task.progressMessage;
        task.status = update.status as ParseTask['status'];
      } else if (update.type === 'task_status') {
        task.status = update.status as ParseTask['status'];
        task.errorMessage = update.errorMessage;
        
        const { openUserPanel } = useUserPanel();
        
        if (update.status === 'completed') {
          task.progress = 100;
          task.completedAt = new Date().toISOString();
          openUserPanel();
        } else if (update.status === 'failed') {
          task.completedAt = new Date().toISOString();
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
  const createParseTask = async (songId: string) => {
    console.log('Creating parse task for song:', songId)
    try {
      const response = await $fetch('/api/tasks/parse', {
        method: 'POST',
        body: { songId }
      });
      
      if (response.success && response.task) {
        // Add the new task to the beginning of the list
        sseState.value.tasks.unshift(response.task as unknown as ParseTask);
        const { openUserPanel } = useUserPanel();
        openUserPanel();
        return response.task as unknown as ParseTask;
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
  
  return {
    tasks: computed(() => sseState.value.tasks),
    activeTasks,
    recentTasks,
    notificationCount,
    isConnected: computed(() => sseState.value.isConnected),
    fetchTasks,
    createParseTask,
    connectSSE,
    cleanup
  };
};

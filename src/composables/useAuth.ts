import { ref, computed } from 'vue'

interface User {
  id: string
  email: string
  userName: string
  nickName?: string
  avatarUrl?: string
}

interface AuthResponse {
  user: User
}

interface ApiError {
  data?: {
    statusCode: number
    message?: string
  }
}

const user = ref<User | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value)

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      
      user.value = response.user
      return { success: true, user: response.user }
    } catch (err: unknown) {
      const apiError = err as ApiError
      error.value = JSON.stringify([{path: [apiError.data?.statusCode || 'Error'], message: apiError.data?.message || 'Login failed'}])
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = null
    
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      user.value = null
      return { success: true }
    } catch (err: unknown) {
      const apiError = err as ApiError
      error.value = apiError.data?.message || 'Logout failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string, userName: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: { email, password, userName }
      })
      
      user.value = response.user
      return { success: true, user: response.user }
    } catch (err: unknown) {
      const apiError = err as ApiError
      error.value = apiError.data?.message || 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const checkAuth = async () => {
    try {
      const response = await $fetch<AuthResponse>('/api/user/me')
      user.value = response.user
      return { success: true, user: response.user }
    } catch (err: unknown) {
      const apiError = err as ApiError
      user.value = null
      return { success: false, error: apiError.data?.message }
    }
  }

  const initAuth = async () => {
    // Check for existing session on app initialization
    await checkAuth()
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    user: computed(() => user.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isAuthenticated,
    
    // Actions
    login,
    logout,
    register,
    checkAuth,
    initAuth,
    clearError
  }
}

import type { InternalApi } from 'nitropack'
import type { ApiError } from '#types/Utils/ApiError'

const loading = ref(false)
const error = ref<string | null>(null)

export const useAuth = () => {
  const user = useNuxtData<InternalApi['/api/user/me']['get']>('userInfo')

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    await $fetch<InternalApi['/api/auth/login']['post']>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      onResponse: () => {
        refreshNuxtData('userInfo')
        refreshNuxtData('userPlaylists')
        refreshNuxtData('userFavorites')
      },
    }).catch((err: ApiError) => {
      error.value = JSON.stringify([{path: [err.data?.statusCode || 'Error'], message: err.data?.message || 'Login failed'}])
      return { success: false, error: error.value }
    }).finally(() => {
      loading.value = false
    });
    return { success: true }
  }

  const logout = async () => {
    loading.value = true
    error.value = null
    const originalUserData = user.data.value
    const response = await $fetch<InternalApi['/api/auth/logout']['post']>('/api/auth/logout', {
      method: 'POST',
      onRequest: () => {
        user.data.value = undefined;
      },
      onResponse: () => {
        refreshNuxtData('userInfo')
        refreshNuxtData('userPlaylists')
        refreshNuxtData('userFavorites')
      },
      onResponseError: () => {
        user.data.value = originalUserData;
      }
    }).catch((err: ApiError) => {
      error.value = err.data?.message || 'Logout failed'
      return { success: false, error: error.value }
    }).finally(() => {
      loading.value = false
    });
    return { success: response.success }
  }

  const register = async (email: string, password: string, userName: string) => {
    loading.value = true
    error.value = null
    
    await $fetch<InternalApi['/api/auth/register']['post']>('/api/auth/register', {
      method: 'POST',
      body: { email, password, userName },
      onResponse: () => {
        refreshNuxtData('userInfo')
        refreshNuxtData('userPlaylists')
        refreshNuxtData('userFavorites')
      },
    }).catch((err: ApiError) => {
      error.value = err.data?.message || 'Registration failed'
      return { success: false, error: error.value }
    }).finally(() => {
      loading.value = false
    });
    return { success: true }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    user,
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    login,
    logout,
    register,
    clearError
  }
}
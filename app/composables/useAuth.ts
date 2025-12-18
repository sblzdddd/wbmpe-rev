const loading = ref(false)
const error = ref<string | null>(null)

export const useAuth = () => {
  const user = useNuxtData<InternalApi['/api/user/me']['get']>('userInfo')

  const fetchUser = async () => {
    loading.value = true
    error.value = null
    await useFetch<InternalApi['/api/user/me']['get']>('/api/user/me', {
       key: 'userInfo',
       retry: false,
    }).catch(() => {
        // failed to fetch user, likely not logged in
    }).finally(() => {
        loading.value = false
    })
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      await $fetch<InternalApi['/api/auth/login']['post']>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        onResponse: () => {
          refreshNuxtData('userInfo')
          refreshNuxtData('userPlaylists')
          refreshNuxtData('userFavorites')
        },
      })
       await fetchUser()

      return { success: true }
    } catch (err: any) {
        const apiError = err.data as { statusCode?: number; message?: string }
        error.value = JSON.stringify([{path: [apiError?.statusCode || 'Error'], message: apiError?.message || 'Login failed'}])
        return { success: false, error: error.value }
    } finally {
        loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = null
    const originalUserData = user.data.value
    
    try {
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
        })
        return { success: response.success }
    } catch (err: any) {
         error.value = err.data?.message || 'Logout failed'
         return { success: false, error: error.value }
    } finally {
         loading.value = false
    }
  }

  const popupListener = (e: StorageEvent) => {
    if (e.key === "temp-nuxt-auth-utils-popup") {
      refreshNuxtData('userInfo')
      refreshNuxtData('userPlaylists')
      refreshNuxtData('userFavorites')
      window.removeEventListener("storage", popupListener);
    }
  };

  const openInPopup = (route: string, size: { width?: number, height?: number } = {}) => {
    localStorage.setItem("temp-nuxt-auth-utils-popup", "true");
    const width = size.width ?? 960;
    const height = size.height ?? 600;
    const top = (window.top?.outerHeight ?? 0) / 2 + (window.top?.screenY ?? 0) - height / 2;
    const left = (window.top?.outerWidth ?? 0) / 2 + (window.top?.screenX ?? 0) - width / 2;
    window.open(
      route,
      "nuxt-auth-utils-popup",
      `width=${width}, height=${height}, top=${top}, left=${left}, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no`
    );
    window.addEventListener("storage", popupListener);
  };

  const register = async (email: string, password: string, userName: string) => {
    loading.value = true
    error.value = null
    
    try {
        await $fetch<InternalApi['/api/register/complete-registration']['post']>('/api/register/complete-registration', {
        method: 'POST',
        body: { email, password, userName },
        onResponse: () => {
            refreshNuxtData('userInfo')
            refreshNuxtData('userPlaylists')
            refreshNuxtData('userFavorites')
        },
        })
        return { success: true }
    } catch (err: any) {
        error.value = err.data?.message || 'Registration failed'
        return { success: false, error: error.value } 
    } finally {
        loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    user,
    loggedIn: computed(() => !!user.data.value && !!user.data.value._id),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    login,
    logout,
    register,
    openInPopup,
    clearError,
    fetchUser
  }
}

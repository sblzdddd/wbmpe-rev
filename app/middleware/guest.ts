// Guest middleware - redirects authenticated users away from auth pages
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth()
  
  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated.value) {
    return navigateTo('/')
  }
}) 
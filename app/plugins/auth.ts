export default defineNuxtPlugin(async (_nuxtApp) => {
  const { loggedIn, fetchUser } = useAuth()

  // If not logged in, try to fetch user to restore session
  if (!loggedIn.value) {
    await fetchUser()
  }
})

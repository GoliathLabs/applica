export default defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore()
  if (userStore.isLoggedIn) {
    return navigateTo('/', {
      replace: true,
    })
  }
})

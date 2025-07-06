export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.log("====error====")
    console.log(error)
    console.log(instance)
    console.log(info)
    console.log("====end error====")
  }

  // Also possible
  nuxtApp.hook('vue:error', (error, instance, info) => {
    console.log("====vue:error====")
    console.log(error)
    console.log(instance)
    console.log(info)
    console.log("====end vue:error====")
  })
})

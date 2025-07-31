
export const useContentPadding = () => {
  const paddingClass = ref('md:w-9/10 lg:w-[calc(80%+80px)] mx-auto')
  return {paddingClass: computed(() => paddingClass.value)}
}
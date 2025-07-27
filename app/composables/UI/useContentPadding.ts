import { useSidebar } from "~/components/ui/sidebar"


const paddingClass = ref('px-3 md:px-4 lg:px-10 xl:px-28')

export const useContentPadding = () => {
  const {open} = useSidebar()
  watch(open, (newVal) => {
    paddingClass.value = newVal ? 'px-2 md:px-4 lg:px-8 xl:px-10' : 'px-3 md:px-4 lg:px-10 xl:px-28'
  }, {immediate: true})
  return {paddingClass: paddingClass}
}
import { useSidebar } from "~/components/ui/sidebar"

export const marginClass = computed(() => {
  const {open} = useSidebar()
  return open ? 'mx-2 lg:mx-4 xl:mx-10' : 'mx-3 md:mx-4 lg:mx-10 xl:mx-28'
})
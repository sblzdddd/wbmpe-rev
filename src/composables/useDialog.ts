
export enum DialogType {
  LOGIN = 'login',
  REGISTER = 'register',
}

const open = ref<Record<DialogType, boolean>>({
  [DialogType.LOGIN]: false,
  [DialogType.REGISTER]: false,
})

export const useDialog = () => {
  if(typeof window === 'undefined') return {
    open: computed(() => ({ [DialogType.LOGIN]: false, [DialogType.REGISTER]: false })),
    changeOpen: () => {},
    openDialog: () => {},
    closeDialog: () => {},
  }

  const changeOpen = (type: DialogType, newOpen: boolean) => {
    open.value[type] = newOpen
    console.log('changeOpen', type, newOpen)
  }

  const openDialog = (type: DialogType) => {
    open.value[type] = true
    console.log('openDialog', type, open.value[type])
  }

  const closeDialog = (type: DialogType) => {
    open.value[type] = false
    console.log('closeDialog', type, open.value[type])
  }

  return {
    open: computed(() => open.value),
    changeOpen,
    openDialog,
    closeDialog,
  }
}
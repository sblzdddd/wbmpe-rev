<template>
  <Dialog v-model:open="open[DialogType.RESET_PASSWORD]" @update:open="(e: boolean) => changeOpen?.call(null, DialogType.RESET_PASSWORD, e)">
    <DialogContent class="sm:max-w-[425px]">
      <Auth-ResetPasswordForm />
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">

const { open, changeOpen } = useDialog()
</script>

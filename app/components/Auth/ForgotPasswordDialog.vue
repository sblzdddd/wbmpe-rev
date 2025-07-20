<template>
  <Dialog v-model:open="open[DialogType.RESET_PASSWORD]" @update:open="(e: boolean) => changeOpen?.call(null, DialogType.RESET_PASSWORD, e)">
    <DialogContent class="sm:max-w-[425px]">
      <ResetPasswordForm />
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { Dialog, DialogContent } from '@/components/ui/dialog'
import ResetPasswordForm from '~/components/Auth/ForgotPasswordForm.vue'
import { useDialog, DialogType } from '~/composables/useDialog'

const { open, changeOpen } = useDialog()
</script>

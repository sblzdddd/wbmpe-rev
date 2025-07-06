<template>
  <Dialog v-model:open="open[DialogType.RESET_PASSWORD]" @update:open="(e: boolean) => changeOpen?.call(null, DialogType.RESET_PASSWORD, e)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle><Icon name="lucide:key" size="20" class="translate-y-1 mr-3" />Reset Password</DialogTitle>
      </DialogHeader>
      <ResetPasswordForm />
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ResetPasswordForm from '@/components/ResetPasswordForm.vue'
import { useDialog, DialogType } from '~/composables/useDialog'

const { open, changeOpen } = useDialog()
</script> 
<template>
  <Dialog v-model:open="open.register" @update:open="(e: boolean) => changeOpen?.call(null, DialogType.REGISTER, e)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle><Icon name="lucide:user" size="20" class="translate-y-1 mr-3" />Register</DialogTitle>
      </DialogHeader>
      <RegisterForm />
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import RegisterForm from '@/components/RegisterForm.vue'
import { useDialog, DialogType } from '~/composables/useDialog'

const { open, changeOpen } = useDialog()
</script>
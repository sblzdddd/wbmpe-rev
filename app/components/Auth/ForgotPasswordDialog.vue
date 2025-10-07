<template>
  <Dialog v-model:open="open[DialogType.RESET_PASSWORD]" @update:open="(e: boolean) => changeOpen?.call(null, DialogType.RESET_PASSWORD, e)">
    <DialogContent class="sm:max-w-[425px]">
      <ForgotPasswordForm />
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import {Dialog, DialogContent} from '~/components/ui/dialog';
import ForgotPasswordForm from './ForgotPasswordForm.vue';

const { open, changeOpen } = useDialog()
</script>

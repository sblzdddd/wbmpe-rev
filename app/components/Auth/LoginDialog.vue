<template>
  <Dialog v-model:open="open.login" @update:open="(e: boolean) => changeOpen?.call(null, DialogType.LOGIN, e)">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle><Icon name="lucide:user" size="20" class="translate-y-1 mr-3" />Login</DialogTitle>
      </DialogHeader>
      <LoginForm />
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '~/components/ui/dialog';

import LoginForm from './LoginForm.vue';

const { open, changeOpen } = useDialog()
</script>
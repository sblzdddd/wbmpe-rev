<script setup lang="ts">
const props = defineProps<{ active?: boolean }>()
const emit = defineEmits<{ (e: 'toggle'): void }>()
const onClick = () => emit('toggle')
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    class="w-8 h-8 p-0"
    :aria-pressed="!!props.active"
    @click="onClick"
  >
    <Icon :name="props.active ? 'lucide:minimize-2' : 'lucide:maximize-2'" size="16" />
  </Button>
</template>

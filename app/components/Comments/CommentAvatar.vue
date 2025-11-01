<template>
  <component :is="asTag" :class="rootClass">
    <img
      v-if="user?.avatarUrl"
      :src="user.avatarUrl"
      :alt="user.nickName || user.userName || 'Unnamed User'"
      :class="imageClass"
    >
    <div v-else :class="fallbackClass">
      <span :class="initialClass">{{ user?.nickName?.charAt(0) || user?.userName?.charAt(0) }}</span>
    </div>
  </component>
</template>

<script setup lang="ts">
import type { SimpleUser } from "../../../types/User/";

defineOptions({ name: 'CommentAvatar' });

interface Props {
  user: SimpleUser | null | undefined;
  size?: 'sm' | 'md';
  as?: string;
  class?: string | string[] | Record<string, boolean>;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  as: 'div',
  class: ''
});

const asTag = computed(() => props.as);

const sizeToClasses = computed(() => {
  return props.size === 'sm'
    ? { image: 'w-6 h-6 rounded-full mt-1', fallback: 'w-6 h-6', initial: 'text-xs' }
    : { image: 'w-8 h-8 rounded-full mt-1', fallback: 'w-8 h-8', initial: 'text-sm' };
});

const imageClass = computed(() => sizeToClasses.value.image);
const fallbackClass = computed(() => `bg-muted rounded-full flex items-center justify-center mt-1 ${sizeToClasses.value.fallback}`);
const initialClass = computed(() => sizeToClasses.value.initial);
const rootClass = computed(() => props.class);
</script>



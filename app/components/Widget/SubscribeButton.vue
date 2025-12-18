<template>
  <Button 
    :variant="isSubscribed ? 'default' : 'outline'" 
    :size="size" 
    class="gap-2 transition-all duration-200"
    :class="{'bg-primary text-primary-foreground': isSubscribed}"
    @click.stop="toggleSubscribe"
    :disabled="loading"
  >
    <Icon :name="isSubscribed ? 'lucide:check' : 'lucide:plus'" class="w-4 h-4" />
    <span v-if="!iconOnly">{{ isSubscribed ? 'Subscribed' : 'Subscribe' }}</span>
  </Button>
</template>

<script setup lang="ts">
import Button from '../ui/button/Button.vue';

const props = defineProps({
  type: {
    type: String as PropType<'artist' | 'album' | 'playlist'>,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  initialSubscribed: {
    type: Boolean,
    default: false
  },
  size: {
    type: String as PropType<'default' | 'sm' | 'lg' | 'icon'>,
    default: 'default'
  },
  iconOnly: {
    type: Boolean,
    default: false
  }
});

const isSubscribed = ref(props.initialSubscribed);
const loading = ref(false);
const { loggedIn, fetchUser } = useAuth();
const { openDialog } = useDialog();

watch(() => props.initialSubscribed, (newVal) => {
  isSubscribed.value = newVal;
});

const toggleSubscribe = async () => {
  if (!loggedIn.value) {
    if(openDialog) openDialog(DialogType.LOGIN);
    return;
  }

  loading.value = true;
  const newState = !isSubscribed.value;
  
  try {
    await $fetch('/api/user/subscribe', {
      method: 'POST',
      body: {
        type: props.type,
        id: props.id,
        set: newState
      }
    });
    
    // Refresh user data to update global state and UI
    await fetchUser();
    
    isSubscribed.value = newState;
  } catch (error) {
  } finally {
    loading.value = false;
  }
};
</script>

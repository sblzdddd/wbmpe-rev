<script setup lang="ts">
import { BACKGROUND } from '@/lib/background_settings';
import FormField from './FormField.vue';
import CoverUpload from './CoverUpload.vue';
import Button from '../ui/button/Button.vue';
import Checkbox from '../ui/checkbox/Checkbox.vue';

const { setBackground, resetBackground } = useBackground();

// Form state
const createForm = ref({
  name: '',
  description: '',
  coverUrl: '',
  isPublic: true
});

// Add ref for the selected cover file
const selectedCoverFile = ref<File | null>(null);

const createError = ref('');
const isCreating = ref(false);

const validateForm = () => {
  if (!createForm.value.name.trim()) {
    createError.value = 'Playlist name is required';
    return false;
  }
  
  if (createForm.value.name.length > 24) {
    createError.value = 'Playlist name must be 24 characters or less';
    return false;
  }

  if (createForm.value.description.length > 500) {
    createError.value = 'Description must be 500 characters or less';
    return false;
  }

  createError.value = '';
  return true;
};

// Handle file selection from CoverUpload component
const handleFileSelected = (file: File | null) => {
  selectedCoverFile.value = file;
};

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  
  if (!validateForm()) return;
  
  try {
    // Pass the actual file object instead of coverUrl
    const response = await useUserPlaylist().createPlaylist(
      createForm.value.name, 
      createForm.value.description, 
      createForm.value.isPublic, 
      selectedCoverFile.value // Pass the File object instead of coverUrl string
    );
    await navigateTo(`/playlists/${response._id}`);
  } catch (err: unknown) {
    console.error('Failed to create playlist:', err);
    createError.value = err instanceof Error ? err.message : 'Failed to create playlist. Please try again.';
  } finally {
    isCreating.value = false;
  }
};

watch(() => createForm.value.coverUrl, (newVal) => {
  if(newVal) {
    setBackground(newVal, BACKGROUND.playlist_edit);
  } else {
    resetBackground();
  }
}, {immediate: true});
</script>
<template>
  <form class="flex flex-col gap-6" @submit="handleSubmit">
    <!-- Error message -->
    <div v-if="createError" class="text-sm text-red-500 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
      {{ createError }}
    </div>

    <!-- Cover Image Upload -->
    <CoverUpload 
      v-model="createForm.coverUrl" 
      mode="preview"
      @file-selected="handleFileSelected"
    />

    <!-- Playlist Name -->
    <FormField
      id="name"
      v-model="createForm.name"
      label="Playlist Name"
      icon="lucide:music"
      placeholder="My Awesome Playlist"
      :maxlength="24"
      :required="true"
      helper-text="Required"
    />

    <!-- Description -->
    <FormField
      id="description"
      v-model="createForm.description"
      label="Description"
      icon="lucide:file-text"
      placeholder="Tell us about your playlist..."
      :maxlength="500"
      type="textarea"
      helper-text="Optional"
    />

    <!-- Privacy Settings -->
    <div class="grid gap-3">
      <Label>
        <Icon name="lucide:eye" size="16" class="mr-2" />
        Privacy
      </Label>
      <div class="flex gap-4">
        <Checkbox id="is-public" v-model:checked="createForm.isPublic" />
        <div class="grid gap-1.5 leading-none">
          <label
            for="is-public"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Make playlist public
          </label>
          <p class="text-sm text-muted-foreground">
            Anyone can find and play this playlist from your profile or the direct link.
          </p>
        </div>
      </div>
    </div>

    <!-- Create Button -->
    <div class="flex gap-3 pt-4">
      <Button 
        type="submit" 
        :disabled="!createForm.name.trim() || isCreating"
      >
        <Icon v-if="isCreating" name="line-md:loading-twotone-loop" size="16" />
        <Icon v-else name="lucide:plus" size="16" />
        {{ isCreating ? 'Creating...' : 'Create Playlist' }}
      </Button>
    </div>

  </form>
</template>
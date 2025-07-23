<script setup lang="ts">

import { Button } from '@/components/ui/button';
import Image from '~/components/Image.vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PlaylistResponse } from '#types/Playlist';

const route = useRoute();
const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

if (!rawId) {
  throw createError({
    statusCode: 404,
    statusMessage: "Playlist not found",
    message: "Invalid playlist ID",
    fatal: false
  })
}

const id = rawId as string;

const backgroundStore = useBackground(); 

// Edit form state
const editForm = ref({
  name: '',
  description: '',
  coverUrl: '',
  isPublic: true
});

const isUpdating = ref(false);
const isDeleting = ref(false);
const updateError = ref('');

const { data: playlist } = useNuxtData<PlaylistResponse>(`playlist-page-${id}`)

// Initialize form when playlist data loads
watch(() => playlist.value?.data, (newVal) => {
  if (newVal) {
    editForm.value = {
      name: newVal.name || '',
      description: newVal.description || '',
      coverUrl: newVal.coverUrl || '',
      isPublic: newVal.isPublic || false
    };
  }
}, { immediate: true });

// Check if form has changes
const hasChanges = computed(() => {
  const original = playlist.value?.data;
  if (!original) return false;
  
  return (
    editForm.value.name !== (original.name || '') ||
    editForm.value.description !== (original.description || '') ||
    editForm.value.coverUrl !== (original.coverUrl || '') ||
    editForm.value.isPublic !== (original.isPublic || false)
  );
});

// Form handlers
const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    // TODO: Implement actual image upload to your backend
    // For now, we'll create a temporary URL
    const reader = new FileReader();
    reader.onload = (e) => {
      editForm.value.coverUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removeCover = () => {
  editForm.value.coverUrl = '';
};

const resetForm = () => {
  const original = playlist.value?.data;
  if (original) {
    editForm.value = {
      name: original.name || '',
      description: original.description || '',
      coverUrl: original.coverUrl || '',
      isPublic: original.isPublic || false
    };
  }
  updateError.value = '';
};

const updatePlaylist = async (e: Event) => {
  e.preventDefault();
  
  if (!hasChanges.value) return;
  
  isUpdating.value = true;
  updateError.value = '';
  
  try {
    // TODO: Implement actual API call to update playlist
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
    
    // Update the local data
    if (playlist.value?.data) {
      playlist.value.data.name = editForm.value.name;
      playlist.value.data.description = editForm.value.description;
      playlist.value.data.coverUrl = editForm.value.coverUrl;
      playlist.value.data.isPublic = editForm.value.isPublic;
    }
    
    // Show success message or navigate
    console.log('Playlist updated successfully');
  } catch (err) {
    console.error('Failed to update playlist:', err);
    updateError.value = 'Failed to update playlist. Please try again.';
  } finally {
    isUpdating.value = false;
  }
};

const confirmDelete = () => {
  if (confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
    deletePlaylist();
  }
};

const deletePlaylist = async () => {
  isDeleting.value = true;
  
  try {
    // TODO: Implement actual API call to delete playlist
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
    
    // Navigate back to playlists page
    await navigateTo('/playlists');
  } catch (err) {
    console.error('Failed to delete playlist:', err);
    updateError.value = 'Failed to delete playlist. Please try again.';
  } finally {
    isDeleting.value = false;
  }
};

watch(() => editForm.value.coverUrl, (newVal) => {
  if(newVal) {
    backgroundStore.setBackground(newVal, 0.35, 32, 40);
  } else {
    backgroundStore.resetBackground();
  }
})
</script>

<template>
  <form class="max-w-2xl" @submit="updatePlaylist">
    <div class="flex flex-col gap-6">
      <!-- Cover Image Upload -->
      <div class="grid gap-3">
        <Label for="cover-upload">
          <Icon name="lucide:image" size="16" class="mx-1" />
          Playlist Cover
        </Label>
        <div class="flex gap-4 items-start">
          <div class="relative">
            <Image 
              v-if="editForm.coverUrl || playlist?.data?.coverUrl" 
              :src="editForm.coverUrl || playlist?.data?.coverUrl || ''" 
              img-class="w-32 h-32 rounded-sm object-cover" 
              :alt="`Playlist ${id}`" 
            />
            <div v-else class="w-32 h-32 rounded-sm bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
              <Icon name="lucide:image" size="32" class="text-muted-foreground/50" />
            </div>
            <Button 
              v-if="editForm.coverUrl || playlist?.data?.coverUrl"
              type="button" 
              variant="outline" 
              size="sm" 
              class="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
              @click="removeCover"
            >
              <Icon name="lucide:x" size="12" />
            </Button>
          </div>
          <div class="flex flex-col gap-2">
            <Input
              id="cover-upload"
              type="file"
              accept="image/*"
              class="w-fit"
              @change="handleImageUpload"
            />
            <p class="text-xs text-muted-foreground">
              Recommended: 300x300px, JPG or PNG
            </p>
          </div>
        </div>
      </div>

      <!-- Playlist Name -->
      <div class="grid gap-3">
        <Label for="playlist-name">
          <Icon name="lucide:music" size="16" class="mx-1" />
          Playlist Name
        </Label>
        <Input
          id="playlist-name"
          v-model="editForm.name"
          type="text"
          placeholder="My Awesome Playlist"
          required
          maxlength="24"
        />
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Required</span>
          <span>{{ editForm.name?.length || 0 }}/24</span>
        </div>
      </div>

      <!-- Description -->
      <div class="grid gap-3">
        <Label for="playlist-description">
          <Icon name="lucide:file-text" size="16" class="mx-1" />
          Description
        </Label>
        <textarea
          id="playlist-description"
          v-model="editForm.description"
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder="Tell us about your playlist..."
          maxlength="500"
          rows="4"
        />
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Optional</span>
          <span>{{ editForm.description?.length || 0 }}/500</span>
        </div>
      </div>

      <!-- Privacy Settings -->
      <div class="grid gap-3">
        <Label>
          <Icon name="lucide:eye" size="16" class="mr-2" />
          Privacy
        </Label>
        <div class="flex gap-4">
          <Checkbox id="terms1" />
          <div class="grid gap-1.5 leading-none">
            <label
              for="terms1"
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

      <!-- Error message -->
      <div v-if="updateError" class="text-sm text-red-500">
        {{ updateError }}
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 pt-4">
        <Button type="submit" :disabled="!hasChanges || isUpdating">
          <Icon v-if="isUpdating" name="line-md:loading-twotone-loop" size="16" />
          <Icon v-else name="lucide:save" size="16" />
          {{ isUpdating ? 'Saving...' : 'Save Changes' }}
        </Button>
        <Button type="button" variant="outline" @click="resetForm">
          <Icon name="lucide:undo" size="16" />
          Reset
        </Button>
      </div>

      <!-- Danger Zone -->
      <div class="border-t pt-6 mt-6">
        <div class="grid gap-3">
          <Label class="text-red-600 dark:text-red-400">
            <Icon name="lucide:alert-triangle" size="16" class="mx-1" />
            Red Zone
          </Label>
          <div class="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-950/20">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-red-800 dark:text-red-200">Delete Playlist</h3>
                <p class="text-sm text-red-600 dark:text-red-400 mt-1">
                  This action cannot be undone. This will permanently delete the playlist and all its contents.
                </p>
              </div>
              <Button 
                type="button" 
                variant="destructive" 
                @click="confirmDelete"
                :disabled="isDeleting"
              >
                <Icon v-if="isDeleting" name="line-md:loading-twotone-loop" size="16" />
                <Icon v-else name="lucide:trash-2" size="16" />
                {{ isDeleting ? 'Deleting...' : 'Delete Playlist' }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>
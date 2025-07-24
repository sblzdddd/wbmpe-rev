<script setup lang="ts">
import type { PlaylistResponse } from '#types/Playlist';
import { BACKGROUND } from '@/lib/background_settings';

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

const { setBackground, resetBackground } = useBackground(); 

// Edit form state
const editForm = ref({
  name: '',
  description: '',
  coverUrl: '',
  isPublic: true
});

const isDeleting = ref(false);
const updateError = ref('');
const isUpdating = ref(false);

const { data: playlist } = useNuxtData<PlaylistResponse>(`playlist-page-${id}`)

// Store original values for fallback
const originalValues = ref({
  name: '',
  description: '',
  coverUrl: '',
  isPublic: true
});

// Simple debounce utility
const debounce = <T extends unknown[]>(func: (...args: T) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Initialize form when playlist data loads
watch(() => playlist.value?.data, (newVal) => {
  if (newVal) {
    const formData = {
      name: newVal.name || '',
      description: newVal.description || '',
      coverUrl: newVal.coverUrl || '',
      isPublic: newVal.isPublic || false
    };
    editForm.value = { ...formData };
    originalValues.value = { ...formData };
  }
}, { immediate: true });

// Generic optimistic update function
const optimisticUpdate = async (field: keyof typeof editForm.value) => {
  if (!playlist.value?.data) return;
  
  isUpdating.value = true;
  updateError.value = '';
  
  try {
    const response = await $fetch<{success: boolean, data: {_id: string, name: string, description: string, coverUrl: string, isPublic: boolean}}>(`/api/playlist/${id}`, {
      method: 'PUT',
      body: {
        name: editForm.value.name,
        description: editForm.value.description,
        coverUrl: editForm.value.coverUrl,
        isPublic: editForm.value.isPublic
      },
      onRequest: () => {
        if(!playlist.value) return;
        playlist.value.data.coverUrl = editForm.value.coverUrl;
        playlist.value.data.name = editForm.value.name;
        playlist.value.data.description = editForm.value.description;
        playlist.value.data.isPublic = editForm.value.isPublic;
      },
      onResponse: () => {
        refreshNuxtData(`playlist-page-${id}`);
      },
    });

    if (!response.success) {
      throw new Error('Update failed');
    }

  } catch (err: unknown) {
    console.error(`Failed to update ${field}:`, err);
    
    updateError.value = err instanceof Error ? err.message : `Failed to update ${field}. Please try again.`;
    
    // Clear error after 3 seconds
    setTimeout(() => {
      updateError.value = '';
    }, 3000);
  } finally {
    isUpdating.value = false;
  }
};

// Debounced optimistic update for text fields
const debouncedUpdate = debounce((field: string) => {
  optimisticUpdate(field as keyof typeof editForm.value);
}, 1000);

// Watch form fields for changes
watch(() => editForm.value.name, (newVal) => {
  if (newVal !== originalValues.value.name) {
    debouncedUpdate('name');
  }
});

watch(() => editForm.value.description, (newVal) => {
  if (newVal !== originalValues.value.description) {
    debouncedUpdate('description');
  }
});

watch(() => editForm.value.isPublic, (newVal) => {
  if (newVal !== originalValues.value.isPublic) {
    optimisticUpdate('isPublic');
  }
});

// Image upload is now handled by CoverUpload component
const isUploadingImage = ref(false);

const handleImageUploading = (uploading: boolean) => {
  isUploadingImage.value = uploading;
};

const handleCoverUpdate = (newCoverUrl: string) => {
  editForm.value.coverUrl = newCoverUrl;
  if (playlist.value?.data) {
    playlist.value.data.coverUrl = newCoverUrl;
    originalValues.value.coverUrl = newCoverUrl;
  }
};

// Cover removal is now handled by CoverUpload component

const confirmDelete = () => {
  if (confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
    deleteUserPlaylist();
  }
};

const { deletePlaylist } = useUserPlaylist();

const deleteUserPlaylist = async () => {
  isDeleting.value = true;
  
  try {
    await deletePlaylist(id);
  } catch (err: unknown) {
    console.error('Failed to delete playlist:', err);
    updateError.value = err instanceof Error ? err.message : 'Failed to delete playlist. Please try again.';
  } finally {
    isDeleting.value = false;
  }
};

watch(() => editForm.value.coverUrl, (newVal) => {
  if(newVal) {
    setBackground(newVal, BACKGROUND.playlist_edit);
  } else {
    resetBackground();
  }
})
</script>

<template>
  <div class="max-w-2xl">
    <div class="flex flex-col gap-6">
        
      <!-- Error message -->
      <div v-if="updateError" class="text-sm text-red-500 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
        {{ updateError }}
      </div>

      <!-- Cover Image Upload -->
      <Playlist-CoverUpload 
        v-model="editForm.coverUrl" 
        :playlist-id="id"
        mode="upload"
        :disabled="isUpdating"
        @uploading="handleImageUploading"
        @update:modelValue="handleCoverUpdate"
      />

      <!-- Playlist Name -->
      <Playlist-FormField
        id="playlist-name"
        v-model="editForm.name"
        label="Playlist Name"
        icon="lucide:music"
        placeholder="My Awesome Playlist"
        :maxlength="24"
        :required="true"
        helper-text="Changes save automatically"
      />

      <!-- Description -->
      <Playlist-FormField
        id="playlist-description"
        v-model="editForm.description"
        label="Description"
        icon="lucide:file-text"
        placeholder="Tell us about your playlist..."
        :maxlength="500"
        type="textarea"
        helper-text="Changes save automatically"
      />

      <!-- Privacy Settings -->
      <div class="grid gap-3">
        <Label>
          <Icon name="lucide:eye" size="16" class="mr-2" />
          Privacy
        </Label>
        <div class="flex gap-4">
          <Checkbox id="is-public" v-model="editForm.isPublic" />
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
                :disabled="isDeleting"
                @click="confirmDelete"
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
  </div>
</template>
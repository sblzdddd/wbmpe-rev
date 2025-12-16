<template>
  <div class="space-y-6 p-6">
    <form class="space-y-4" @submit.prevent="updateAlbum">
      <div class="space-y-2">
        <Label for="albumName">Album Name</Label>
        <Input
          id="albumName"
          v-model="formData.name"
          placeholder="Enter album name"
          required
        />
      </div>

      <div class="space-y-2">
        <Label for="albumDescription">Description</Label>
        <textarea
          id="albumDescription"
          v-model="formData.description"
          placeholder="Enter album description"
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows="3"
        />
      </div>

      <div class="space-y-2">
        <Label for="albumCoverUrl">Cover URL</Label>
        <Input
          id="albumCoverUrl"
          v-model="formData.coverUrl"
          placeholder="Enter cover image URL"
          type="url"
        />
      </div>

      <!-- Cover Preview -->
      <div v-if="formData.coverUrl" class="space-y-2">
        <Label>Cover Preview</Label>
        <div class="w-32 h-32 rounded-lg overflow-hidden border">
          <Picture 
            :src="formData.coverUrl" 
            alt="Album cover preview"
            class="w-full h-full"
            :img-attrs="{class: 'w-full h-full object-cover'}"
            :modifiers="{resize: {s: 200}}"
          />
        </div>
      </div>

      <div class="flex gap-2 pt-4">
        <Button 
          type="submit" 
          :disabled="isLoading || !hasChanges"
          class="flex-1"
        >
          <Icon v-if="isLoading" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
          {{ isLoading ? 'Updating...' : 'Update Album' }}
        </Button>
        
        <Button 
          type="button" 
          variant="outline" 
          :disabled="isLoading"
          @click="resetForm"
        >
          Reset
        </Button>
      </div>
    </form>

    <!-- Success/Error Messages -->
    <div v-if="message.text" :class="message.type === 'success' ? 'text-green-600' : 'text-red-600'" class="text-sm">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AlbumResponse } from '#types/Album';

const route = useRoute();
const albumId = route.params.id as string;

const album = useNuxtData<AlbumResponse>(`album-page-${albumId}`);

const formData = reactive({
  name: '',
  description: '',
  coverUrl: '',
});

const originalData = ref({
  name: '',
  description: '',
  coverUrl: '',
});

const isLoading = ref(false);
const message = reactive({
  text: '',
  type: 'success' as 'success' | 'error'
});

const hasChanges = computed(() => {
  return formData.name !== originalData.value.name ||
         formData.description !== originalData.value.description ||
         formData.coverUrl !== originalData.value.coverUrl;
});

const initializeForm = () => {
  const albumData = album.data.value?.data;
  if (albumData) {
    formData.name = albumData.name || '';
    formData.description = albumData.description || '';
    formData.coverUrl = albumData.coverUrl || '';
    
    originalData.value = {
      name: albumData.name || '',
      description: albumData.description || '',
      coverUrl: albumData.coverUrl || '',
    };
  }
};

const resetForm = () => {
  formData.name = originalData.value.name;
  formData.description = originalData.value.description;
  formData.coverUrl = originalData.value.coverUrl;
  message.text = '';
};

const updateAlbum = async () => {
  if (!hasChanges.value) return;
  
  isLoading.value = true;
  message.text = '';
  
  try {
    const updateData: Record<string, string> = {};
    
    if (formData.name !== originalData.value.name) {
      updateData.name = formData.name;
    }
    if (formData.description !== originalData.value.description) {
      updateData.description = formData.description;
    }
    if (formData.coverUrl !== originalData.value.coverUrl) {
      updateData.coverUrl = formData.coverUrl;
    }

    const response = await $fetch<InternalApi['/api/album/:id']['put']>(`/api/album/${albumId}`, {
      method: 'PUT',
      body: updateData
    });

    if (response.success) {
      message.text = 'Album updated successfully!';
      message.type = 'success';
      
      originalData.value = {
        name: formData.name,
        description: formData.description,
        coverUrl: formData.coverUrl,
      };
      
      await refreshCookie(`album-page-${albumId}`);
    }
  } catch (error: unknown) {
    message.text = (error as {data?: {message?: string}})?.data?.message || 'Failed to update album';
    message.type = 'error';
  } finally {
    isLoading.value = false;
  }
};

watch(() => album.data.value, () => {
  initializeForm();
}, { immediate: true });

onMounted(() => {
  initializeForm();
});
</script>

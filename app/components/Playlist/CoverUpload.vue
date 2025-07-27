<script setup lang="ts">
interface Props {
  modelValue: string
  playlistId?: string
  disabled?: boolean
  mode?: 'preview' | 'upload' // preview for create, upload for edit
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'uploading', value: boolean): void
  (e: 'fileSelected', value: File | null): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'preview',
  disabled: false
})

const emit = defineEmits<Emits>()

const uploadError = ref('')
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)

const handleImageUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // Validate file
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
    return
  }

  if (file.size > maxSize) {
    uploadError.value = 'File size too large. Maximum size is 5MB.'
    return
  }

  uploadError.value = ''
  selectedFile.value = file
  
  // Emit the file so parent component can access it
  emit('fileSelected', file)

  if (props.mode === 'preview') {
    // Create preview URL for create mode
    emit('update:modelValue', URL.createObjectURL(file))
  } else if (props.mode === 'upload' && props.playlistId) {
    // Upload to server for edit mode
    isUploading.value = true
    emit('uploading', true)

    try {
      const formData = new FormData()
      formData.append('cover', file)

      const response = await $fetch<{success: boolean, data: {coverUrl: string}}>(`/api/playlist/${props.playlistId}/cover`, {
        method: 'POST',
        body: formData
      })

      if (response.success) {
        emit('update:modelValue', response.data.coverUrl)
      }
    } catch (err: unknown) {
      console.error('Image upload failed:', err)
      uploadError.value = err instanceof Error ? err.message : 'Failed to upload image. Please try again.'
    } finally {
      isUploading.value = false
      emit('uploading', false)
    }
  }
}

const removeCover = async () => {
  if (props.mode === 'upload' && props.playlistId) {
    // For edit mode, we need to update the server
    try {
      await $fetch(`/api/playlist/${props.playlistId}`, {
        method: 'PUT',
        body: {
          coverUrl: ''
        }
      });
      emit('update:modelValue', '');
    } catch (err: unknown) {
      console.error('Failed to remove cover:', err);
      uploadError.value = err instanceof Error ? err.message : 'Failed to remove cover. Please try again.';
    }
  } else {
    // For preview mode, just remove locally
    emit('update:modelValue', '');
  }
  
  selectedFile.value = null;
  
  // Emit that no file is selected
  emit('fileSelected', null);
  
  // Clear file input
  const fileInput = document.getElementById('cover-upload') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
  }
}
</script>

<template>
  <div class="grid gap-3">
    <Label for="cover-upload">
      <Icon name="lucide:image" size="16" class="mx-1" />
      Playlist Cover
    </Label>
    <div class="flex gap-4 items-start">
      <div class="relative">
        <Image 
          v-if="modelValue" 
          :src="modelValue"
          class="size-32 rounded-sm object-cover overflow-hidden"
          alt="Playlist cover preview" 
        />
        <div v-else class="w-32 h-32 rounded-sm bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
          <Icon name="lucide:image" size="32" class="text-muted-foreground/50" />
        </div>
        <Button 
          v-if="modelValue"
          type="button" 
          variant="outline" 
          size="sm" 
          class="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
          :disabled="disabled || isUploading"
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
          class="w-full"
          :disabled="disabled || isUploading"
          @change="handleImageUpload"
        />
        <div v-if="isUploading" class="flex items-center gap-2 text-xs text-blue-600">
          <Icon name="line-md:loading-twotone-loop" size="12" />
          Uploading image...
        </div>
        <div v-else-if="uploadError" class="text-xs text-red-500">
          {{ uploadError }}
        </div>
        <p v-else class="text-xs text-muted-foreground">
          Recommended: 300x300px, JPG or PNG (max 5MB)
        </p>
      </div>
    </div>
  </div>
</template> 
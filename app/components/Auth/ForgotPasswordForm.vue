<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDialog, DialogType } from '~/composables/useDialog'

const props = defineProps<{
  isPage?: boolean
}>()

const { closeDialog, openDialog } = useDialog()

const canSubmit = computed(() => {
  return email.value.length > 0
})

const email = ref('')
const formError = ref('')
const successMessage = ref('')
const loading = ref(false)

const submit = async (e: Event) => {
  e.preventDefault()
  
  if (!canSubmit.value) return
  
  formError.value = ''
  successMessage.value = ''
  loading.value = true
  
  try {
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: {
        email: email.value
      }
    })
    
    if (response.success) {
      successMessage.value = response.message
      // Reset form
      email.value = ''
    } else {
      formError.value = response.message || 'Failed to send reset email'
    }
  } catch (error: unknown) {
    console.error('Reset password error:', error)
    const errorMessage = error && typeof error === 'object' && 'data' in error 
      ? (error.data as { message?: string })?.message 
      : undefined
    formError.value = errorMessage || 'Failed to send reset email'
  } finally {
    loading.value = false
  }
}

// Clear messages when form changes
watch(email, () => {
  if (formError.value || successMessage.value) {
    formError.value = ''
    successMessage.value = ''
  }
})
</script>

<template>
  <form class="py-3 px-6 md:px-8" @submit="submit">
    <div class="flex flex-col gap-6">
      <div class="flex flex-col items-center text-center">
        <h1 class="text-2xl font-bold">
          Reset Password
        </h1>
        <p class="text-muted-foreground text-balance">
          Enter your email to receive a password reset link
        </p>
      </div>
      
      <div class="grid gap-3">
        <Label for="email"><Icon name="lucide:mail" size="16" class="mx-1" />Email</Label>
        <Input
          id="email"
          v-model="email"
          type="email"
          placeholder="m@example.com"
          required
          :disabled="loading"
        />
      </div>
      
      <!-- Success message -->
      <div v-if="successMessage" class="text-sm text-green-600 text-center bg-green-50 p-3 rounded-md">
        {{ successMessage }}
      </div>
      
      <!-- Error message -->
      <div v-if="formError" class="text-sm text-red-500 text-center bg-red-50 p-3 rounded-md">
        {{ formError }}
      </div>
      
      <!-- Submit button -->
      <Button type="submit" class="w-full" :disabled="!canSubmit || loading">
        <Icon v-if="loading" name="line-md:loading-twotone-loop" size="24" />
        <span v-else>Send Reset Link</span>
      </Button>
      
      <div class="text-center text-sm">
        <NuxtLink
          v-if="props.isPage"
          to="/auth/login"
          class="underline underline-offset-4"
        >
          Back to login
        </NuxtLink>
        <a
          v-else
          href="#"
          class="underline underline-offset-4"
          @click="openDialog?.(DialogType.LOGIN); closeDialog?.(DialogType.RESET_PASSWORD)"
        >
          Back to login
        </a>
      </div>
    </div>
  </form>
</template> 
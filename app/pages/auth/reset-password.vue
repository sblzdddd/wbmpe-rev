<script setup lang="ts">
import Label from '~/components/ui/label/Label.vue';
import Input from '~/components/ui/input/Input.vue';
import Button from '~/components/ui/button/Button.vue';

definePageMeta({
  layout: 'fullscreen',
  middleware: 'guest'
})

const route = useRoute()
const router = useRouter()

const token = route.query.token as string
const password = ref('')
const confirmPassword = ref('')
const formError = ref('')
const successMessage = ref('')
const loading = ref(false)

const canSubmit = computed(() => {
  return token && password.value.length >= 8 && confirmPassword.value === password.value
})

const submit = async (e: Event) => {
  e.preventDefault()
  
  if (!canSubmit.value) return
  
  formError.value = ''
  successMessage.value = ''
  loading.value = true
  
  try {
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        password: password.value
      }
    })
    
    if (response.success) {
      successMessage.value = response.message
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } else {
      formError.value = response.message || 'Failed to reset password'
    }
  } catch (error: unknown) {
    console.error('Reset password error:', error)
    const errorMessage = error && typeof error === 'object' && 'data' in error 
      ? (error.data as { message?: string })?.message 
      : undefined
    formError.value = errorMessage || 'Failed to reset password'
  } finally {
    loading.value = false
  }
}

// Clear messages when form changes
watch([password, confirmPassword], () => {
  if (formError.value || successMessage.value) {
    formError.value = ''
    successMessage.value = ''
  }
})

// Redirect if no token
onMounted(() => {
  if (!token) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Bad Request',
      message: 'Page not found',
      fatal: true
    })
  }
})
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
      <div class="bg-card border rounded-lg shadow-lg p-8">
        <div class="flex flex-col items-center text-center mb-8">
          <h1 class="text-2xl font-bold mb-2">
            Reset Your Password
          </h1>
          <p class="text-muted-foreground">
            Enter your new password below
          </p>
        </div>
        
        <form class="space-y-6" @submit="submit">
          <div class="grid gap-3">
            <Label for="password"><Icon name="lucide:lock" size="16" class="mx-1" />New Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter new password"
              required
              minlength="8"
              :disabled="loading"
            />
          </div>
          
          <div class="grid gap-3">
            <Label for="confirmPassword"><Icon name="lucide:lock" size="16" class="mx-1" />Confirm Password</Label>
            <Input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              required
              minlength="8"
              :disabled="loading"
            />
            <div v-if="password && confirmPassword && password !== confirmPassword" class="text-sm text-red-500">
              Passwords do not match
            </div>
          </div>
          
          <!-- Success message -->
          <div v-if="successMessage" class="text-sm text-green-600 text-center bg-green-50 p-3 rounded-md">
            {{ successMessage }}
            <div class="mt-2 text-xs text-green-500">
              Redirecting to login page...
            </div>
          </div>
          
          <!-- Error message -->
          <div v-if="formError" class="text-sm text-red-500 text-center bg-red-50 p-3 rounded-md">
            {{ formError }}
          </div>
          
          <!-- Submit button -->
          <Button type="submit" class="w-full" :disabled="!canSubmit || loading">
            <Icon v-if="loading" name="line-md:loading-twotone-loop" size="24" />
            <span v-else>Reset Password</span>
          </Button>
          
          <div class="text-center text-sm">
            <a href="/" class="underline underline-offset-4">
              Back to home
              </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template> 
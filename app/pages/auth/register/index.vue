<script setup lang="ts">
import Label from '~/components/ui/label/Label.vue'
import Input from '~/components/ui/input/Input.vue'
import Button from '~/components/ui/button/Button.vue'

definePageMeta({
  layout: 'fullscreen',
  middleware: 'guest'
})

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const canSubmit = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return email.value.length > 0 && emailRegex.test(email.value)
})

const sendVerificationCode = async () => {
  if (!canSubmit.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const response = await $fetch('/api/register/send-verification', {
      method: 'POST',
      body: { email: email.value }
    })
    
    if (response.success) {
      success.value = 'Verification code sent to your email!'
      // Navigate to verification page after short delay
      setTimeout(() => {
        navigateTo(`/auth/register/verify?email=${encodeURIComponent(email.value)}`)
      }, 1500)
    }
  } catch {
    error.value = 'Failed to send verification code'
  } finally {
    loading.value = false
  }
}

// Clear error when email changes
watch(email, () => {
  if (error.value) {
    error.value = ''
  }
  if (success.value) {
    success.value = ''
  }
})
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
      <div class="bg-card border rounded-lg shadow-lg p-4">
        <div class="py-3 px-6 md:px-8">
          <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center text-center">
              <h1 class="text-2xl font-bold">
                Create account
              </h1>
              <p class="text-muted-foreground text-balance">
                Enter your email to get started
              </p>
            </div>
            
            <div class="grid gap-3">
              <Label for="email">
                <Icon name="lucide:mail" size="16" class="mx-1" />
                Email Address
              </Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="m@example.com"
                required
                :disabled="loading"
                @keyup.enter="sendVerificationCode"
              />
            </div>
            
            <!-- Success message -->
            <div v-if="success" class="text-sm text-green-600 text-center">
              {{ success }}
            </div>
            
            <!-- Error message -->
            <div v-if="error" class="text-sm text-red-500 text-center">
              {{ error }}
            </div>

            <Button 
              type="button" 
              class="w-full" 
              :disabled="!canSubmit || loading"
              @click="sendVerificationCode"
            >
              <Icon v-if="loading" name="line-md:loading-twotone-loop" size="24" />
              <span v-else>Send Verification Code</span>
            </Button>
            
            <div class="text-center text-sm">
              Already have an account?
              <NuxtLink to="/auth/login" class="underline underline-offset-4">
                Sign in
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 
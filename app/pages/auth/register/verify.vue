<script setup lang="ts">
import Button from '~/components/ui/button/Button.vue'
import { PinInput, PinInputGroup, PinInputSlot } from '~/components/ui/pin-input'

definePageMeta({
  layout: 'fullscreen',
  middleware: 'guest'
})

const route = useRoute()

// Get email from query parameters
const email = ref(route.query.email as string || '')

// Redirect to step 1 if no email provided
if (!email.value) {
  await navigateTo('/auth/register')
}

// Check email status on page load
const emailStatus = ref<string | null>(null)
const checkingEmail = ref(true)

onMounted(async () => {
  try {
    const response = await $fetch('/api/register/check-email-status', {
      method: 'POST',
      body: { email: email.value }
    })
    
    emailStatus.value = response.status
    
    if (response.status === 'registered') {
      // Email is already registered, redirect to login
      await navigateTo('/auth/login?message=Email is already registered. Please sign in.')
    } else if (response.status === 'new') {
      // No pending verification, redirect to step 1
      await navigateTo('/auth/register')
    }
    // If status is 'pending_verification', stay on this page
  } catch {
    // If check fails, redirect to step 1
    await navigateTo('/auth/register')
  } finally {
    checkingEmail.value = false
  }
})

const code = ref<string[]>(['', '', '', '', '', ''])
const loading = ref(false)
const error = ref('')
const success = ref('')

const canSubmit = computed(() => {
  return code.value.every(digit => digit !== '') && code.value.length === 6
})

const verifyCode = async () => {
  if (!canSubmit.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const codeString = code.value.join('')
    const response = await $fetch('/api/register/verify-code', {
      method: 'POST',
      body: { 
        email: email.value,
        code: codeString
      }
    })
    
    if (response.success) {
      success.value = 'Code verified successfully!'
      // Navigate to complete page with verification token
      setTimeout(() => {
        navigateTo(`/auth/register/complete?email=${encodeURIComponent(email.value)}&token=${response.verificationToken}`)
      }, 1000)
    }
  } catch {
    error.value = 'Invalid or expired verification code'
  } finally {
    loading.value = false
  }
}

const resendCode = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/register/send-verification', {
      method: 'POST',
      body: { email: email.value }
    })
    
    if (response.success) {
      success.value = 'New verification code sent!'
      // Clear the current code
      code.value = ['', '', '', '', '', '']
    }
  } catch {
    error.value = 'Failed to resend code'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  navigateTo('/auth/register')
}

// Clear messages when code changes
watch(code, () => {
  if (error.value) {
    error.value = ''
  }
  if (success.value) {
    success.value = ''
  }
}, { deep: true })
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
      <div class="bg-card border rounded-lg shadow-lg p-4">
        <!-- Loading state while checking email -->
        <div v-if="checkingEmail" class="py-3 px-6 md:px-8">
          <div class="flex flex-col items-center gap-4">
            <Icon name="line-md:loading-twotone-loop" size="32" />
            <p class="text-muted-foreground">Verifying email status...</p>
          </div>
        </div>
        
        <!-- Main form after email validation -->
        <div v-else class="py-3 px-6 md:px-8">
          <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center text-center">
              <h1 class="text-2xl font-bold">
                Verify your email
              </h1>
              <p class="text-muted-foreground text-balance">
                Enter the 6-digit code sent to<br>
                <strong>{{ email }}</strong>
              </p>
            </div>
            
            <div class="flex flex-col items-center gap-4">
              <PinInput
                v-model="code"
                :length="6"
                class="gap-2"
                :disabled="loading"
              >
                <PinInputGroup>
                  <PinInputSlot v-for="(_, index) in 6" :key="index" :index="index" />
                </PinInputGroup>
              </PinInput>
              
              <p class="text-sm text-muted-foreground">
                Didn't receive the code?
                <button 
                  type="button"
                  class="text-primary hover:underline"
                  :disabled="loading"
                  @click="resendCode"
                >
                  Resend
                </button>
              </p>
            </div>
            
            <!-- Success message -->
            <div v-if="success" class="text-sm text-green-600 text-center">
              {{ success }}
            </div>
            
            <!-- Error message -->
            <div v-if="error" class="text-sm text-red-500 text-center">
              {{ error }}
            </div>

            <div class="flex flex-col gap-3">
              <Button 
                type="button" 
                class="w-full" 
                :disabled="!canSubmit || loading"
                @click="verifyCode"
              >
                <Icon v-if="loading" name="line-md:loading-twotone-loop" size="24" />
                <span v-else>Verify Code</span>
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                class="w-full" 
                :disabled="loading"
                @click="goBack"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 
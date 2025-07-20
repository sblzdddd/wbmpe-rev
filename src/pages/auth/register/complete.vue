<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({
  layout: 'fullscreen'
})

const route = useRoute()

// Get email and verification token from query parameters
const email = ref(route.query.email as string || '')
const verificationToken = ref(route.query.token as string || '')

// Redirect to step 1 if no email or token provided
if (!email.value || !verificationToken.value) {
  await navigateTo('/auth/register')
}

// Validate the verification token
const tokenValidation = ref<boolean | null>(null)
const validatingToken = ref(true)

onMounted(async () => {
  try {
    const response = await $fetch('/api/auth/validate-token', {
      method: 'POST',
      body: {
        email: email.value,
        verificationToken: verificationToken.value
      }
    })
    
    tokenValidation.value = response.valid
    
    if (!response.valid) {
      // Token is invalid, redirect to verify page
      await navigateTo(`/auth/register/verify?email=${encodeURIComponent(email.value)}`)
    }
  } catch {
    // If validation fails, redirect to step 1
    await navigateTo('/auth/register')
  } finally {
    validatingToken.value = false
  }
})

const userName = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const canSubmit = computed(() => {
  return userName.value.length >= 3 && 
         password.value.length >= 8 && 
         password.value === confirmPassword.value
})

const completeRegistration = async () => {
  if (!canSubmit.value) return
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const response = await $fetch('/api/auth/complete-registration', {
      method: 'POST',
      body: { 
        verificationToken: verificationToken.value,
        userName: userName.value,
        password: password.value
      }
    })
    
    if (response.success) {
      success.value = 'Registration completed successfully!'
      // Navigate to login page after success
      setTimeout(() => {
        navigateTo('/auth/login?message=Registration completed! Please sign in.')
      }, 1500)
    }
  } catch {
    error.value = 'Failed to complete registration'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  navigateTo(`/auth/register/verify?email=${encodeURIComponent(email.value)}`)
}

// Clear error when form changes
watch([userName, password, confirmPassword], () => {
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
        <!-- Loading state while validating token -->
        <div v-if="validatingToken" class="py-3 px-6 md:px-8">
          <div class="flex flex-col items-center gap-4">
            <Icon name="line-md:loading-twotone-loop" size="32" />
            <p class="text-muted-foreground">Validating verification...</p>
          </div>
        </div>
        
        <!-- Main form after validation -->
        <div v-else class="py-3 px-6 md:px-8">
          <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center text-center">
              <h1 class="text-2xl font-bold">
                Complete registration
              </h1>
              <p class="text-muted-foreground text-balance">
                Set up your username and password for<br>
                <strong>{{ email }}</strong>
              </p>
            </div>
            
            <div class="grid gap-3">
              <Label for="userName">
                <Icon name="lucide:user" size="16" class="mx-1" />
                Username
              </Label>
              <Input
                id="userName"
                v-model="userName"
                type="text"
                placeholder="username"
                required
                minlength="3"
                :disabled="loading"
              />
              <div v-if="userName && userName.length < 3" class="text-sm text-muted-foreground">
                Username must be at least 3 characters long
              </div>
            </div>
            
            <div class="grid gap-3">
              <Label for="password">
                <Icon name="lucide:lock" size="16" class="mx-1" />
                Password
              </Label>
              <Input 
                id="password" 
                v-model="password" 
                type="password" 
                placeholder="********" 
                required 
                minlength="8"
                :disabled="loading"
              />
              <div v-if="password && password.length < 8" class="text-sm text-muted-foreground">
                Password must be at least 8 characters long
              </div>
            </div>
            
            <div class="grid gap-3">
              <Label for="confirmPassword">
                <Icon name="lucide:lock" size="16" class="mx-1" />
                Confirm Password
              </Label>
              <Input 
                id="confirmPassword" 
                v-model="confirmPassword" 
                type="password" 
                placeholder="confirm password" 
                required 
                minlength="8"
                :disabled="loading"
              />
              <div v-if="password && confirmPassword && password !== confirmPassword" class="text-sm text-red-500">
                Passwords do not match
              </div>
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
                @click="completeRegistration"
              >
                <Icon v-if="loading" name="line-md:loading-twotone-loop" size="24" />
                <span v-else>Create Account</span>
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
<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/composables/useAuth'
import { useDialog, DialogType } from '~/composables/useDialog'

const { register, loading, error, clearError } = useAuth()
const { closeDialog, openDialog } = useDialog()

const canSubmit = computed(() => {
  return email.value.length > 0 && 
         password.value.length >= 8 && 
         userName.value.length >= 3 &&
         password.value === confirmPassword.value
})

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const userName = ref('')
const formError = ref('')

const submit = async (e: Event) => {
  e.preventDefault()
  
  if (!canSubmit.value) return
  
  clearError()
  formError.value = ''
  
  const result = await register(email.value, password.value, userName.value)
  
  if (result.success) {
    // Close dialog on successful registration
    closeDialog?.(DialogType.REGISTER)
    // Reset form
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    userName.value = ''
  } else {
    formError.value = result.error || 'Registration failed'
  }
}

// Clear error when form changes
watch([email, password, confirmPassword, userName], () => {
  if (formError.value) {
    formError.value = ''
  }
})
</script>

<template>
  <form class="py-3 px-6 md:px-8" @submit="submit">
    <div class="flex flex-col gap-6">
      <div class="flex flex-col items-center text-center">
        <h1 class="text-2xl font-bold">
          Create account
        </h1>
        <p class="text-muted-foreground text-balance">
          Sign up for your WBMPE account
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
        />
      </div>
      
      <div class="grid gap-3">
        <Label for="userName"><Icon name="lucide:user" size="16" class="mx-1" />Username</Label>
        <Input
          id="userName"
          v-model="userName"
          type="text"
          placeholder="username"
          required
          minlength="3"
        />
      </div>
      
      <div class="grid gap-3">
        <Label for="password"><Icon name="lucide:lock" size="16" class="mx-1" />Password</Label>
        <Input 
          id="password" 
          v-model="password" 
          type="password" 
          placeholder="********" 
          required 
          minlength="8"
        />
        <Input 
          id="confirmPassword" 
          v-model="confirmPassword" 
          type="password" 
          placeholder="confirm password" 
          required 
          minlength="8"
        />
        <div v-if="password && confirmPassword && password !== confirmPassword" class="text-sm text-red-500">
          Passwords do not match
        </div>
      </div>
      
      <!-- Error message -->
      <div v-if="formError">
        <div v-for="error in JSON.parse(formError)" :key="error.validation" class="text-sm text-red-500 text-center">
          {{ error.path[0] }}: {{ error.message }}
        </div>
      </div>
      <div v-else-if="error" class="text-sm text-red-500 text-center">
        {{ error }}
      </div>

      <Button type="submit" class="w-full" :disabled="!canSubmit || loading">
        <Icon v-if="loading" name="line-md:loading-twotone-loop" size="24" />
        <span v-else>Create Account</span>
      </Button>
      
      <div class="text-center text-sm">
        Already have an account?
        <a href="#" class="underline underline-offset-4" @click="openDialog?.call(null, DialogType.LOGIN); closeDialog?.call(null, DialogType.REGISTER)">
          Sign in
        </a>
      </div>
    </div>
  </form>
</template> 
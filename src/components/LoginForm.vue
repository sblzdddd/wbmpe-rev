<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDialog, DialogType } from '~/composables/useDialog'

const { login, loading, error, clearError } = useAuth()
const { closeDialog, openDialog } = useDialog()

const canSubmit = computed(() => {
  return email.value.length > 0 && password.value.length > 0
})

const password = ref('')
const email = ref('')
const formError = ref('')

const submit = async (e: Event) => {
  e.preventDefault()
  
  if (!canSubmit.value) return
  
  clearError()
  formError.value = ''
  
  const result = await login(email.value, password.value)
  
  if (result.success) {
    // Close dialog on successful login
    closeDialog?.(DialogType.LOGIN)
    // Reset form
    email.value = ''
    password.value = ''
  } else {
    formError.value = result.error || 'Login failed'
  }
}

// Clear error when form changes
watch([email, password], () => {
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
          Welcome back
        </h1>
        <p class="text-muted-foreground text-balance">
          Login to your WBMPE account
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
        <div class="flex items-center">
          <Label for="password"><Icon name="lucide:lock" size="16" class="mx-1" />Password</Label>
          <a
            href="#"
            class="ml-auto text-sm underline-offset-2 hover:underline"
          >
            Forgot your password?
          </a>
        </div>
        <Input id="password" v-model="password" type="password" placeholder="********" required />
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
      <!-- Login button -->
      <Button type="submit" class="w-full" :disabled="!canSubmit || loading">
        <Icon v-if="loading" name="line-md:loading-twotone-loop" size="24" />
        <span v-else>Login</span>
      </Button>
      <div class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span class="bg-card text-muted-foreground relative z-10 px-2">
          Or continue with
        </span>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" class="w-full">
          <Icon name="lucide:github" size="16" />
          <span class="sr-only">Login with Apple</span>
        </Button>
        <Button variant="outline" type="button" class="w-full">
          <Icon name="mingcute:google-line" size="20" />
          <span class="sr-only">Login with Google</span>
        </Button>
      </div>
      <div class="text-center text-sm">
        Don't have an account?
        <a href="#" class="underline underline-offset-4" @click="openDialog?.(DialogType.REGISTER); closeDialog?.(DialogType.LOGIN)">
          Sign up
        </a>
      </div>
    </div>
  </form>
</template>
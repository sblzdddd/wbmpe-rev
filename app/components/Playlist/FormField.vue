<script setup lang="ts">
interface Props {
  modelValue: string
  label: string
  icon: string
  placeholder?: string
  maxlength?: number
  required?: boolean
  helperText?: string
  type?: 'input' | 'textarea'
  rows?: number
  id: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'input',
  rows: 4,
  required: false,
  placeholder: undefined,
  maxlength: undefined,
  helperText: undefined
})

const emit = defineEmits<Emits>()

// Use computed property for efficient reactive binding
const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})
</script>

<template>
  <div class="grid gap-3">
    <Label :for="id">
      <Icon :name="icon" size="16" class="mx-1" />
      {{ label }}
    </Label>
    
    <Input
      v-if="type === 'input'"
      :id="id"
      v-model="inputValue"
      type="text"
      :placeholder="placeholder"
      :required="required"
      :maxlength="maxlength"
    />
    
    <textarea
      v-else
      :id="id"
      v-model="inputValue"
      class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :rows="rows"
    />
    
    <div class="flex justify-between text-xs text-muted-foreground">
      <span>{{ helperText }}</span>
      <span v-if="maxlength">{{ inputValue?.length || 0 }}/{{ maxlength }}</span>
    </div>
  </div>
</template>
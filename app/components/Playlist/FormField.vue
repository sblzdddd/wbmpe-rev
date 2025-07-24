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

withDefaults(defineProps<Props>(), {
  type: 'input',
  rows: 4,
  required: false
})

const emit = defineEmits<Emits>()

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
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
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      :required="required"
      :maxlength="maxlength"
      @input="updateValue"
    />
    
    <textarea
      v-else
      :id="id"
      :value="modelValue"
      class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :rows="rows"
      @input="updateValue"
    />
    
    <div class="flex justify-between text-xs text-muted-foreground">
      <span>{{ helperText }}</span>
      <span v-if="maxlength">{{ modelValue?.length || 0 }}/{{ maxlength }}</span>
    </div>
  </div>
</template> 
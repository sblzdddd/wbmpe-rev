<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  variant?: 'default'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const breadcrumbItemVariants = cva(
  'inline-flex items-center gap-1.5 relative z-[2] px-1 ',
  {
    variants: {
      variant: {
        default: `hover:text-accent-foreground
          hover:before:scale-100
          hover:before:shadow-xs
          active:before:shadow-none
          before:absolute
          before:content-[""]
          before:pointer-events-none
          before:top-0
          before:left-0
          before:w-full
          before:h-full
          before:z-[-1]
          before:inset-0
          before:rounded-sm
          before:bg-accent
          before:scale-0
          before:transition-[opacity,scale]
          before:duration-200
          before:ease-in-out`,
      },
    },
  },
)
</script>

<template>
  <li
    data-slot="breadcrumb-item"
    :class="cn(breadcrumbItemVariants({ variant }), props.class)"
    :variant="variant"
  >
    <slot />
  </li>
</template>

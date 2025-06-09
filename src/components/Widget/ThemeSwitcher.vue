<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <Button
      id="themeSwitcher"
      variant="ghost"
      size="icon"
      class="w-7 h-7"
      @click.stop="toggleTheme"
  >
    <Icon name="radix-icons:moon" size="16" class="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
    <Icon name="radix-icons:sun" size="16"
          class="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
  </Button>
</template>
<script setup lang="ts">


const colorMode = useColorMode()
const isDark = computed(() => colorMode.preference === 'dark')

function swapDarkMode() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

async function toggleTheme() {
  const themeSwitcher = document.getElementById('themeSwitcher')
  if(!themeSwitcher) return

  if (!document.startViewTransition) {
    swapDarkMode()
    return;
  }
  await document.startViewTransition(async () => {
    swapDarkMode()
    await nextTick()
  }).ready;

  const { left, top, width, height } = themeSwitcher.getBoundingClientRect()
  const right = window.innerWidth - left;
  const bottom = window.innerHeight - top;
  const x = left + width / 2;
  const y = top + height / 2;
  const maxRadius = Math.hypot(
      Math.max(left, right),
      Math.max(top, bottom),
  );

  // Style both old and new states during transition
  const oldRoot = document.querySelector('::view-transition-old(root)') as HTMLElement
  const newRoot = document.querySelector('::view-transition-new(root)') as HTMLElement
  if (oldRoot) oldRoot.style.zIndex = '1'
  if (newRoot) newRoot.style.zIndex = '2'

  // Animate clip-path circle during transition
  document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: 'cubic-bezier(0.7, 0, 0.3, 1)',
        pseudoElement: '::view-transition-new(root)',
      }
  );
}
</script>
<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-old(root) {
  z-index: 1;
}

::view-transition-new(root) {
  z-index: 2;
}
</style>
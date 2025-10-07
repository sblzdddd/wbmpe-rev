<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div class="items-center gap-2 hidden lg:flex">
    <Button id="minimizeWindow"
            variant="ghost"
            size="icon"
            class="w-7 h-7"
            @click.stop=""
    >
      <Icon name="lucide:minus" size="16"/>
    </Button>
    <Button id="maximizeWindow"
            variant="ghost"
            size="icon"
            class="w-7 h-7"
            @click.stop=""
    >
      <Icon name="lucide:square" size="13"/>
    </Button>
    <Button id="closeWindow"
            variant="ghost"
            size="icon"
            class="w-7 h-7"
            @click.stop="closeWindow()"
    >
      <Icon name="lucide:x" size="16"/>
    </Button>
  </div>
</template>
<script setup lang="ts">
import Button from '../ui/button/Button.vue';

const closeWindow = () => {
  const htmlElement = document.getElementsByTagName('html')[0];
  if (htmlElement) {
    htmlElement.remove();
  }
}
</script>
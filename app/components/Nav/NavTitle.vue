<script setup lang="ts">
import { useSidebar } from '#shadcn/sidebar/utils'

const colorMode = useColorMode()
const { toggleSidebar } = useSidebar()

</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <div class="flex w-full items-center gap-4.5 overflow-hidden py-1.5 text-left outline-hidden group-data-[collapsible=icon]:size-12! [&>span:last-child]:truncate text-sm group-data-[collapsible=icon]:p-0!">
        
        <Button variant="ghost" size="icon" class="ml-0.5" @click.stop="toggleSidebar()">
          <Icon name="lucide:menu" size="20" />
        </Button>
        <Image v-if="colorMode.value === 'dark'" src="/images/logo/logo-dark_256.png" alt="logo" :img-attrs="{class: 'w-36 mr-auto group-data-[collapsible=icon]:hidden'}" />
        <Image v-else src="/images/logo/logo-light_256.png" alt="logo" :img-attrs="{class: 'w-36 mr-auto group-data-[collapsible=icon]:hidden'}" />
      </div>
    </SidebarMenuItem>
  </SidebarMenu>
</template>

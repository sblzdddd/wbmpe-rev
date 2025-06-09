<script setup lang="ts">
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const { isOnTop } = useScroll()
const route = useRoute()
</script>

<template>
  <header class="sticky top-0 flex h-16 shrink-0 items-center gap-2 z-[100] transition-[background-color,border-color] duration-200" :class="isOnTop ? '' : 'bg-sidebar border-b-[1.5px] h-[65px]'">
    <div class="flex items-center gap-1 px-4">
      <Button variant="ghost" size="icon" class="h-7 w-7">
        <Icon name="lucide:chevron-left" size="16" />
      </Button>
      <Separator
        orientation="vertical"
        class="mx-2 data-[orientation=vertical]:h-6"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem class="hidden md:block">
            <BreadcrumbLink href="#">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator class="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>...</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
    <div class="grow" />
    <div v-if="route.path !== '/search'" class="relative w-full max-w-sm">
      <Input type="text" placeholder="Search songs, artists, albums, and URL" class="w-full max-w-sm pl-10" />
      <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
        <Icon name="lucide:search" size="16" />
      </span>
    </div>
    <div class="grow" />
    <div class="flex items-center gap-2 px-4">
      <Widget-ThemeSwitcher/>
      <Widget-WindowButtons/>
    </div>
  </header>
</template>

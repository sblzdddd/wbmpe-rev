<template>
  <div>
    <!-- Tab buttons -->
    <div class="w-full flex gap-2 mb-6" v-bind="tabContainerAttrs">
      <NuxtLink 
        v-for="tab in tabs" 
        :key="tab.key" 
        :to="tab.to"
      >
        <Button size="sm" variant="ghost" class="relative" :class="{'tab-active': isActiveTab(tab.key)}">
          {{ tab.label }}
          <motion.div 
            v-if="isActiveTab(tab.key)" 
            layout
            :layout-id="layoutId" 
            :initial="false"
            class="absolute inset-0 bg-black/10 dark:bg-white/15 rounded-md" 
            :transition="{ type: 'spring', stiffness: 400, damping: 30, mass: 1 }"
          />
        </Button>
      </NuxtLink>
    </div>
    
    <!-- Tab content -->
    <Transition name="page" mode="out-in">
      <div :key="activeTabKey">
        <slot v-if="activeTabSlot" :name="activeTabSlot" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { motion } from 'motion-v';

interface TabConfig {
  key: string
  label: string
  to: string
  slot: string
}

interface Props {
  tabs: TabConfig[]
  layoutId?: string
  activeTab?: string
  defaultTab?: string
  tabContainerAttrs?: unknown
}

const props = withDefaults(defineProps<Props>(), {
  layoutId: 'tab-highlighter',
  tabContainerAttrs: () => ({})
})

const route = useRoute()

const isActiveTab = (tabKey: string) => {
  const currentTab = props.activeTab || route.query.tab as string
  return currentTab === tabKey || (currentTab === undefined && tabKey === props.defaultTab)
}

const activeTabKey = computed(() => {
  const currentTab = props.activeTab || route.query.tab as string
  return currentTab || props.defaultTab || props.tabs[0]?.key
})

const activeTabSlot = computed(() => {
  const activeTab = props.tabs.find(tab => tab.key === activeTabKey.value)
  return activeTab?.slot
})
</script>

<style scoped>
@reference '../../../assets/css/tailwind.css';
.tab-active {
  @apply !bg-none;
  &::before {
    background-color: transparent !important;
    opacity: 0 !important;
  }
}
</style> 
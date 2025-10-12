<script setup lang="ts">
import type { SEOData } from '#types/Utils/SEO';

const seoData = useState<SEOData>('seoData')

seoData.value.title = 'Search - WBMPE Rev'
seoData.value.description = 'Search - WBMPE Rev'
seoData.value.ogTitle = 'Search - WBMPE Rev'

// Use the search composable
const { 
  searchKeyword, 
  searchSuggestions, 
  showSuggestions, 
  suggestionsPending,
  performSearch, 
  selectSuggestion 
} = useSearch()

// Local state for input focus
const inputRef = ref<HTMLInputElement>()
const isInputFocused = ref(false)

// Handle form submission
const handleSubmit = () => {
  performSearch()
}

// Handle input events
const handleInputFocus = () => {
  isInputFocused.value = true
  if (searchKeyword.value.length >= 2) {
    showSuggestions.value = true
  }
}

const handleInputBlur = () => {
  // Delay hiding suggestions to allow clicking on them
  setTimeout(() => {
    isInputFocused.value = false
    showSuggestions.value = false
  }, 200)
}

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleSubmit()
  } else if (event.key === 'Escape') {
    showSuggestions.value = false
    inputRef.value?.blur()
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-1 flex-col gap-14 items-center justify-center p-4 pt-0">
    <Image src="/images/logo/logo-search_1024.png" alt="search" class="w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%]" />
    <div class="flex gap-0 w-full max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mb-[30vh]">

      <div class="relative w-full">
        <Input 
          ref="inputRef"
          v-model="searchKeyword" 
          size="lg" 
          placeholder="Search songs, artists, albums, and URL" 
          class="w-full h-12 pl-10 text-lg rounded-r-none" 
          @focus="handleInputFocus"
          @blur="handleInputBlur"
          @keydown="handleKeydown"
        />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
          <Icon name="lucide:search" size="18" />
        </span>
        
        <!-- Loading indicator -->
        <span v-if="suggestionsPending" class="absolute end-3 inset-y-0 flex items-center justify-center">
          <Icon name="lucide:loader-2" size="16" class="animate-spin" />
        </span>

        <!-- Suggestions dropdown -->
        <div 
          v-if="showSuggestions && searchSuggestions.length > 0" 
          class="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          <div class="py-1">
            <button
              v-for="(suggestion, index) in searchSuggestions"
              :key="index"
              class="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors duration-150 text-sm"
              @click="selectSuggestion(suggestion)"
              @mousedown.prevent
            >
              <Icon name="lucide:search" size="14" class="inline mr-2 text-muted-foreground" />
              {{ suggestion }}
            </button>
          </div>
        </div>
      </div>
      
      <Button class="h-full rounded-l-none" size="lg" @click="handleSubmit">
        Submit
      </Button>
    </div>
  </div>
</template>

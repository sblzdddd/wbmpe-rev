<template>
  <div class="flex flex-col my-2 lg:my-12 mx-auto w-full" :class="{'lg:!w-[90%]': !open}">
    <h1 class="text-2xl font-bold mb-6 inline-flex items-center gap-2">
      <NuxtLink :to="`/songs/${id}`">
        <Button variant="ghost" size="icon">
          <Icon name="lucide:arrow-left" size="26" />
        </Button>
      </NuxtLink>
      Edit Song
      <NuxtLink :to="`/songs/${id}`" class="text-primary">
        {{ song.data.value?.song?.name || 'Unknown' }}
      </NuxtLink>
    </h1>
    
    <div class="max-w-2xl">
      <form class="space-y-6" @submit.prevent="updateSong">
        <div class="space-y-2">
          <Label for="song-name">Song Name</Label>
          <Input 
            id="song-name"
            v-model="formData.name"
            placeholder="Enter song name"
            required
          />
        </div>

        <div class="space-y-2">
          <Label for="album-search">Album</Label>
          <div class="relative">
            <Input 
              id="album-search"
              v-model="albumSearchQuery"
              placeholder="Search for album..."
            />
            <div v-if="albumSearchResults.length > 0" class="absolute z-10 w-full bg-background border border-border rounded-md mt-1 max-h-40 overflow-y-auto">
              <div 
                v-for="album in albumSearchResults" 
                :key="album._id"
                class="p-2 hover:bg-accent cursor-pointer flex items-center gap-2"
                @click="selectAlbum(album)"
              >
                <Picture 
                  v-if="album.coverUrl"
                  :src="album.coverUrl" 
                  class="w-8 h-8 rounded overflow-hidden" 
                  :modifiers="{resize: {s: 64}}" 
                  :alt="album.name"
                  :img-attrs="{class: 'w-full h-full object-cover'}"
                />
                <div v-else class="w-8 h-8 rounded bg-muted flex items-center justify-center">
                  <Icon name="lucide:disc" class="w-3 h-3 text-muted-foreground" />
                </div>
                <div>
                  <div class="text-sm font-medium">{{ album.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ album.platform || 'local' }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="selectedAlbum" class="flex items-center gap-2 p-2 bg-accent rounded">
            <Picture 
              v-if="selectedAlbum.coverUrl"
              :src="selectedAlbum.coverUrl" 
              class="w-8 h-8 rounded overflow-hidden" 
              :modifiers="{resize: {s: 64}}" 
              :alt="selectedAlbum.name"
              :img-attrs="{class: 'w-full h-full object-cover'}"
            />
            <div v-else class="w-8 h-8 rounded bg-muted flex items-center justify-center">
              <Icon name="lucide:disc" class="w-3 h-3 text-muted-foreground" />
            </div>
            <span class="text-sm">{{ selectedAlbum.name }}</span>
            <Button type="button" variant="ghost" size="sm" @click="clearAlbum">
              <Icon name="lucide:x" class="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="artist-search">Artists</Label>
          <div class="relative">
            <Input 
              id="artist-search"
              v-model="artistSearchQuery"
              placeholder="Search for artists..."
            />
            <div v-if="artistSearchResults.length > 0" class="absolute z-10 w-full bg-background border border-border rounded-md mt-1 max-h-40 overflow-y-auto">
              <div 
                v-for="artist in artistSearchResults" 
                :key="artist._id"
                class="p-2 hover:bg-accent cursor-pointer flex items-center gap-2"
                @click="addArtist(artist)"
              >
                <Picture 
                  v-if="artist.avatarUrl"
                  :src="artist.avatarUrl" 
                  class="w-8 h-8 rounded-full overflow-hidden" 
                  :modifiers="{resize: {s: 64}}" 
                  :alt="artist.name"
                  :img-attrs="{class: 'w-full h-full object-cover'}"
                />
                <div v-else class="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Icon name="lucide:user" class="w-3 h-3 text-muted-foreground" />
                </div>
                <div>
                  <div class="text-sm font-medium">{{ artist.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ artist.platform || 'local' }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="selectedArtists.length > 0" class="flex flex-wrap gap-2">
            <div 
              v-for="artist in selectedArtists" 
              :key="artist._id"
              class="flex items-center gap-2 p-2 bg-accent rounded"
            >
              <Picture 
                v-if="artist.avatarUrl"
                :src="artist.avatarUrl" 
                class="w-6 h-6 rounded-full overflow-hidden" 
                :modifiers="{resize: {s: 48}}" 
                :alt="artist.name"
                :img-attrs="{class: 'w-full h-full object-cover'}"
              />
              <div v-else class="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <Icon name="lucide:user" class="w-2 h-2 text-muted-foreground" />
              </div>
              <span class="text-sm">{{ artist.name }}</span>
              <Button type="button" variant="ghost" size="sm" @click="removeArtist(artist._id)">
                <Icon name="lucide:x" class="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="duration">Duration (seconds)</Label>
          <Input 
            id="duration"
            v-model.number="formData.duration"
            type="number"
            min="1"
            placeholder="Enter duration in seconds"
            required
          />
          <p class="text-sm text-muted-foreground">
            Current: {{ formatDuration(formData.duration || 0) }}
          </p>
        </div>

        <div class="flex gap-4 pt-4">
          <Button type="submit" :disabled="isSubmitting">
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin mr-2" />
            <Icon v-else name="lucide:save" class="w-4 h-4 mr-2" />
            {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
          </Button>
          <Button type="button" variant="outline" @click="$router.back()">
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            :disabled="isSubmitting"
            @click="showDeleteDialog = true"
          >
            <Icon name="lucide:trash-2" class="w-4 h-4 mr-2" />
            Delete Song
          </Button>
        </div>
      </form>
    </div>

    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Song</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{{ song.data.value?.song?.name }}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">Cancel</Button>
          <Button variant="destructive" :disabled="isDeleting" @click="deleteSong">
            <Icon v-if="isDeleting" name="lucide:loader-2" class="w-4 h-4 animate-spin mr-2" />
            <Icon v-else name="lucide:trash-2" class="w-4 h-4 mr-2" />
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { BACKGROUND } from '@/lib/background_settings';

const seoData = useState<SEOData>('seoData');
const route = useRoute();
const router = useRouter();
const rawId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

const { open } = useSidebar();
const { setBackground } = useBackground();

if (!rawId) {
  throw createError({
    statusCode: 404,
    statusMessage: "Song not found",
    message: "Invalid song ID",
    fatal: false
  });
}

const id = rawId as string;

const formData = reactive({
  name: '',
  album: '',
  artists: [] as string[],
  duration: 0
});

const isSubmitting = ref(false);
const isDeleting = ref(false);
const showDeleteDialog = ref(false);

const { searchResults: albumSearchResults, searchQuery: albumSearchQuery } = useAlbumSearch();
const selectedAlbum = ref<{_id: string; name: string; coverUrl?: string; platform?: string} | null>(null);

const { searchResults: artistSearchResults, searchQuery: artistSearchQuery } = useArtistSearch();
const selectedArtists = ref<{_id: string; name: string; avatarUrl?: string; platform?: string}[]>([]);

const selectAlbum = (album: {_id: string; name: string; coverUrl?: string; platform?: string}) => {
  selectedAlbum.value = album;
  formData.album = album._id;
  albumSearchQuery.value = '';
};

const clearAlbum = () => {
  selectedAlbum.value = null;
  formData.album = '';
};

const addArtist = (artist: {_id: string; name: string; avatarUrl?: string; platform?: string}) => {
  if (!selectedArtists.value.find(a => a._id === artist._id)) {
    selectedArtists.value.push(artist);
    formData.artists.push(artist._id);
  }
  artistSearchQuery.value = '';
};

const removeArtist = (artistId: string) => {
  selectedArtists.value = selectedArtists.value.filter(a => a._id !== artistId);
  formData.artists = formData.artists.filter(id => id !== artistId);
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const { error, refresh: refreshFetch } = await useFetch(`/api/song/${id}`, {
  key: computed(() => `song-page-${rawId}`),
  onResponse({ response }) {
    if (response._data?.song?.album?.coverUrl) {
      setBackground(response._data.song.album.coverUrl, BACKGROUND.playlist_edit);
    }
    seoData.value.title = `Edit Song ${response._data?.song.name || 'Unknown'}`;
  },
  lazy: false
});

if (error.value) {
  if (import.meta.client && window.history.length > 1) {
    window.history.back();
  } else {
    throw createError({
      statusCode: error.value.statusCode || 500,
      statusMessage: error.value.statusMessage || "Internal Server Error",
      message: error.value.message || "An unknown error occurred",
      fatal: false
    });
  }
}

const song = useNuxtData<{success: boolean; song: SongType & { album: SimpleAlbum; artists: SimpleArtist[] }}>(`song-page-${rawId}`);
const { user } = useAuth();

watch(() => song.data.value, (value) => {
  const songData = value?.song;
  if (!songData) {
    refreshFetch();
    return;
  }

  if (songData.addedBy && songData.addedBy !== user.data.value?._id) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: "You are not allowed to edit this song",
      fatal: true
    });
  }

  formData.name = songData.name || '';
  formData.duration = songData.duration || 0;
  formData.album = songData.album?._id || '';
  formData.artists = songData.artists?.map((a: SimpleArtist) => a._id) || [];

  if (songData.album) {
    selectedAlbum.value = {
      _id: songData.album._id,
      name: songData.album.name,
      coverUrl: songData.album.coverUrl,
      platform: songData.album.platform
    };
  }

  if (songData.artists) {
    selectedArtists.value = songData.artists.map((a: SimpleArtist) => ({
      _id: a._id,
      name: a.name,
      avatarUrl: a.avatarUrl,
      platform: a.platform
    }));
  }

  seoData.value.title = `Edit Song ${songData.name || 'Unknown'}`;
  if (songData.album?.coverUrl) {
    setBackground(songData.album.coverUrl, BACKGROUND.playlist_edit);
  }
}, { immediate: true });

const updateSong = async () => {
  if (!formData.name.trim()) {
    alert('Song name is required');
    return;
  }

  isSubmitting.value = true;
  try {
    await $fetch(`/api/song/${id}`, {
      method: 'PUT',
      body: {
        name: formData.name.trim(),
        album: formData.album || undefined,
        artists: formData.artists,
        duration: formData.duration
      }
    });

    await refreshFetch();
    
    await router.push(`/songs/${id}`);
  } catch (error: unknown) {
    console.error('Error updating song:', error);
    alert((error as {data?: {message?: string}})?.data?.message || 'Failed to update song');
  } finally {
    isSubmitting.value = false;
  }
};

const deleteSong = async () => {
  isDeleting.value = true;
  try {
    await $fetch(`/api/song/${id}`, {
      method: 'DELETE'
    });

    await router.push('/songs');
  } catch (error: unknown) {
    console.error('Error deleting song:', error);
    alert((error as {data?: {message?: string}})?.data?.message || 'Failed to delete song');
  } finally {
    isDeleting.value = false;
    showDeleteDialog.value = false;
  }
};
</script>

<style scoped>
@reference '../../../assets/css/tailwind.css';
</style>

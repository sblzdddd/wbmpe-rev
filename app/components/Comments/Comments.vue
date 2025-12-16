<template>
  <div class="mt-8">
    <h3 class="text-xl font-semibold mb-4">Comments ({{ comments.data?.value?.data?.length || 0 }})</h3>
    
    <!-- Add Comment -->
    <div class="mb-6">
      <form v-if="loggedIn && user" class="space-y-3" @submit.prevent="addComment()">
        <textarea
          v-model="newComment"
          placeholder="Add a comment..."
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <div class="flex justify-end">
          <Button type="submit" variant="default" :disabled="submittingComment">
            <span v-if="submittingComment">Posting...</span>
            <span v-else>Post Comment</span>
          </Button>
        </div>
      </form>
      <div v-else class="text-center py-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Please log in to comment.</p>
        <Button size="lg" @click="openInPopup('/auth/google')">
          <Icon name="lucide:log-in" size="20" class="mr-2" />
          Login with Google
        </Button>
      </div>
    </div>

    <!-- Comments List -->
    <div class="space-y-4">
      <div
        v-for="comment in comments.data?.value?.data || []"
        :key="comment._id"
        class="bg-background py-2 rounded-2xl shadow-md"
      >
        <Comments-CommentItem
          :comment="comment"
          :request-id="entityId"
        />
      </div>
      
      <div v-if="!comments.data?.value?.data?.length" class="text-center text-gray-500 py-8">
        No comments yet. Be the first to comment!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button';

const { openInPopup } = useUserSession();

defineOptions({
  name: 'CommentsSection'
});

interface Props {
  entityId: string;
}

const { loggedIn, user } = useAuth();

const props = defineProps<Props>();

const newComment = ref('');
const submittingComment = ref(false);

await useFetch<
  InternalApi['/api/comments/:id']['get']
>(`/api/comments/${props.entityId}`, {
  key: `comments-${props.entityId}`,
});

const comments = useNuxtData(`comments-${props.entityId}`);

const addComment = async () => {
  if (!newComment.value.trim()) return;
  
  submittingComment.value = true;
  
  try {
    const response = await $fetch<InternalApi['/api/comments/:id']['post']>(`/api/comments/${props.entityId}`, {
      method: 'POST',
      body: {
        content: newComment.value.trim()
      }
    });
    
    if (response.success && response.data) {
      refreshNuxtData(`comments-${props.entityId}`);
      newComment.value = '';
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  } finally {
    submittingComment.value = false;
  }
}
</script>

<style scoped>
</style>

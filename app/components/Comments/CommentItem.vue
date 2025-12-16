<template>
  <div class="space-y-3">
    <!-- Main Comment -->
    <div class="flex items-start gap-3">
      <CommentAvatar :user="comment.user" size="md" />
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-medium">{{ comment.user?.nickName || comment.user?.userName }}</span>
          <span class="text-xs text-muted-foreground">{{ formatDate(comment.createdAt) }}</span>
        </div>
        <p class="text-muted-foreground">{{ comment.content }}</p>
        
        <!-- Reply button -->
        <div v-if="loggedIn && user" class="mt-2 flex gap-4">
          <a
            v-if="!showReplyForm"
            class="text-sm text-blue-500 hover:underline cursor-pointer"
            @click.prevent="showReplyForm = true"
          >
            Reply
          </a>
          <a
            v-if="canDeleteComment(user)"
            class="text-sm text-red-500 hover:underline cursor-pointer"
            @click.prevent="deleteComment"
          >
            Delete
          </a>
        </div>
      </div>
    </div>

    <!-- Reply Form -->
    <div v-if="showReplyForm" class="ml-11 space-y-3">
      <form v-if="loggedIn && user" class="space-y-3" @submit.prevent="addReply()">
        <textarea
          v-model="replyContent"
          placeholder="Write a reply..."
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          required
        />
        <div class="flex gap-2">
          <Button type="submit" variant="default" size="sm" :disabled="submittingReply">
            <span v-if="submittingReply">Posting...</span>
            <span v-else>Post Reply</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="cancelReply"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>

    <!-- Replies -->
    <div v-if="comment.replies && comment.replies.length > 0" class="ml-8 space-y-3">
      <div
        v-for="reply in comment.replies"
        :key="reply._id"
        class="p-3 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <CommentAvatar :user="reply.user" size="sm" />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-sm">{{ reply.user?.nickName || reply.user?.userName }}</span>
              <span class="text-xs text-muted-foreground">{{ formatDate(reply.createdAt) }}</span>
            </div>
            <p class="text-sm text-muted-foreground">Reply to 
              <span class="font-medium">
                {{ comment.replies.find(c => c._id === reply.parentComment)?.user?.nickName || comment.replies.find(c => c._id === reply.parentComment)?.user?.userName || comment.user?.nickName || comment.user?.userName }}
              </span>: {{ reply.content }}
            </p>
            
            <!-- Reply to reply button -->
            <div v-if="loggedIn && user" class="mt-2 flex gap-4">
              <a
                v-if="reply._id && !replyFormStates[reply._id]?.show"
                class="text-xs text-blue-500 hover:underline cursor-pointer"
                @click.prevent="showReplyToReplyForm(reply)"
              >
                Reply
              </a>
              <a
                v-if="canDeleteReply(reply, user)"
                class="text-xs text-red-500 hover:underline cursor-pointer"
                @click.prevent="deleteReply(reply._id!)"
              >
                Delete
              </a>
            </div>
          </div>
        </div>
        
        <!-- Reply to reply form -->
        <div v-if="reply._id && getReplyFormState(reply._id).show" class="ml-6 mt-3 space-y-3">
          <form v-if="loggedIn && user" class="space-y-3" @submit.prevent="addReplyToReply(user, reply)">
            <textarea
              v-model="getReplyFormState(reply._id).content"
              placeholder="Write a reply..."
              rows="2"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
              required
            />
            <div class="flex gap-2">
              <Button type="submit" variant="default" size="sm" :disabled="getReplyFormState(reply._id).submitting">
                <span v-if="getReplyFormState(reply._id).submitting">Posting...</span>
                <span v-else>Post Reply</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                @click="cancelReplyToReply(reply)"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '~/components/ui/button';
import CommentAvatar from './CommentAvatar.vue';
import type { SimpleUser } from '../../../types/User/';
import type { Comment as CommentType } from '../../../types/comment';
import type { InternalApi } from '#imports';


defineOptions({
  name: 'CommentItemComponent'
});

const { loggedIn, user } = useAuth();
type userType = typeof user;

interface Props {
  comment: CommentType;
  requestId: string;
}

const props = defineProps<Props>();

const showReplyForm = ref(false);
const replyContent = ref('');
const submittingReply = ref(false);

// Track reply form states for each reply
const replyFormStates = ref<Record<string, { show: boolean; content: string; submitting: boolean }>>({});

const getReplyFormState = (replyId: string) => {
  if (!replyFormStates.value[replyId]) {
    replyFormStates.value[replyId] = { show: false, content: '', submitting: false };
  }
  return replyFormStates.value[replyId];
};

onMounted(() => {
  if (props.comment.replies) {
    props.comment.replies.forEach(reply => {
      if (reply._id) {
        getReplyFormState(reply._id);
      }
    });
  }
});

watch(() => props.comment.replies, (newReplies) => {
  if (newReplies) {
    newReplies.forEach(reply => {
      if (reply._id) {
        getReplyFormState(reply._id);
      }
    });
  }
}, { deep: true });

const canDeleteComment = (user: userType) => {
  return user && props.comment.user._id === user.data.value?._id;
};

const canDeleteReply = (reply: CommentType, user: userType) => {
  return user && reply.user._id === user.data.value?._id;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const addReply = async () => {
  if (!replyContent.value.trim()) return;
  
  submittingReply.value = true;
  
  try {
    const response = await $fetch<InternalApi['/api/comments/:id']['post']>(`/api/comments/${props.requestId}`, {
      method: 'POST',
      body: {
        content: replyContent.value.trim(),
        parentComment: props.comment._id
      }
    });
    
    if (response.success && response.data) {
      refreshNuxtData(`comments-${props.requestId}`);
      
      replyContent.value = '';
      showReplyForm.value = false;
    }
  } catch (error) {
    console.error('Error adding reply:', error);
  } finally {
    submittingReply.value = false;
  }
};

const cancelReply = () => {
  replyContent.value = '';
  showReplyForm.value = false;
};

const deleteComment = async () => {
  if (!confirm('Are you sure you want to delete this comment?')) return;
  
  try {
    const response = await $fetch<InternalApi['/api/comments/:id/:commentId']['delete']>(`/api/comments/${props.requestId}/${props.comment._id}`, {
      method: 'DELETE'
    });
    
    if (!response.success) {
      console.error('Failed to delete comment');
    }
    refreshNuxtData(`comments-${props.requestId}`);
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
};

const deleteReply = async (replyId: string) => {
  if (!confirm('Are you sure you want to delete this reply?')) return;
  
  try {
    const response = await $fetch<InternalApi['/api/comments/:id/:commentId']['delete']>(`/api/comments/${props.requestId}/${replyId}`, {
      method: 'DELETE'
    });
    
    if (!response.success) {
      console.error('Failed to delete reply');
    }
    refreshNuxtData(`comments-${props.requestId}`);
  } catch (error) {
    console.error('Error deleting reply:', error);
  }
};

const showReplyToReplyForm = (reply: CommentType) => {
  if (reply._id) {
    const formState = getReplyFormState(reply._id);
    formState.show = true;
    formState.content = '';
  }
};

const addReplyToReply = async (user: userType, reply: CommentType) => {
  if (!reply._id) return;
  
  const formState = getReplyFormState(reply._id);
  if (!formState.content.trim()) return;
  
  formState.submitting = true;
  
  try {
    const response = await $fetch<InternalApi['/api/comments/:id']['post']>(`/api/comments/${props.requestId}`, {
      method: 'POST',
      body: {
        content: formState.content.trim(),
        parentComment: reply._id
      }
    });
    
    if (response.success && response.data) {
      refreshNuxtData(`comments-${props.requestId}`);
      
      formState.content = '';
      formState.show = false;
    }
  } catch (error) {
    console.error('Error adding reply to reply:', error);
  } finally {
    formState.submitting = false;
  }
};

const cancelReplyToReply = (reply: CommentType) => {
  if (reply._id) {
    const formState = getReplyFormState(reply._id);
    formState.content = '';
    formState.show = false;
  }
};
</script>

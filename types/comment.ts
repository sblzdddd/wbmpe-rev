import type { SimpleUser } from './User/';

export interface Comment {
  _id?: string;
  user: SimpleUser;
  content: string;
  createdAt: string;
  parentComment?: string; // ID of parent comment for replies
  replies?: Comment[]; // Array of reply comments
}

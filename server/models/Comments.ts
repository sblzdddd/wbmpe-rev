import mongoose, { Schema, type Document } from 'mongoose';

export interface IComment {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  parentComment?: mongoose.Types.ObjectId; // For replies
  replies?: mongoose.Types.ObjectId[]; // Array of reply comment IDs
}

export interface ICommentSchema extends Document {
  entityId: mongoose.Types.ObjectId;
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    required: false,
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  }],
});


const CommentsSchema = new Schema<ICommentSchema>({
  entityId: mongoose.Types.ObjectId,
  comments: [CommentSchema],
}, {
  timestamps: true,
});

export const Comments = mongoose.model<ICommentSchema>('Comment', CommentsSchema);

import mongoose from "mongoose";
import { ObjectId } from "mongodb";

const PlaylistSubscriptionItemSchema = new mongoose.Schema({
  playlist: {type: ObjectId, ref: 'Playlists', required: true},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const ArtistSubscriptionItemSchema = new mongoose.Schema({
  artist: {type: ObjectId, ref: 'Artists', required: true},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const AlbumSubscriptionItemSchema = new mongoose.Schema({
  album: {type: ObjectId, ref: 'Albums', required: true},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const UserSubscriptionItemSchema = new mongoose.Schema({
  user: {type: ObjectId, ref: 'Users', required: true},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const userSubscriptionsSchema = new mongoose.Schema({
  userId: {type: ObjectId, ref: 'Users', required: true, unique: true},
  subscribed_playlists: [PlaylistSubscriptionItemSchema],
  subscribed_artists: [ArtistSubscriptionItemSchema],
  subscribed_albums: [AlbumSubscriptionItemSchema],
  subscribed_users: [UserSubscriptionItemSchema],
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

const User_Subscriptions = mongoose.model('User_Subscriptions', userSubscriptionsSchema);
export default User_Subscriptions;
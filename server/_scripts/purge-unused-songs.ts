import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import "../models"
import Playlists from "../models/Playlists";
import Streams from "../models/Streams";
import Users from "../models/Users";
import UserAuth from "../models/UserAuth";
import Songs from "../models/Songs";
import Albums from "../models/Albums";
import Artists from "../models/Artists";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;


const collectSongsInPlaylists = async () => {
  const playlists = await Playlists.find({});
  const songs = playlists.flatMap(playlist => playlist.songs);
  const songIds = songs.map(song => song.song.toString());
  return [...new Set(songIds)];
}

const collectParsedSongs = async () => {
  const songs = await Streams.find({});
  const songIds = songs.map(song => song.songId.toString());
  return [...new Set(songIds)];
}

const purgeUnused = async () => {
  const usedPlaylistIds: string[] = [];
  const usedUserAuthIds: string[] = [];
  const users = await Users.find({});
  for(const user of users) {
    usedPlaylistIds.push(...user.createdPlaylists.map(playlist => playlist.toString()));
    if(user.favorites) {
      usedPlaylistIds.push(user.favorites.toString());
    }
    if(user.recent) {
      usedPlaylistIds.push(user.recent.toString());
    }
    usedUserAuthIds.push(user._id.toString());
  }

  // delete unused playlists
  const playlists = await Playlists.find({});
  const unusedPlaylists = playlists.filter(playlist => !usedPlaylistIds.includes(playlist._id.toString()));
  for(const playlist of unusedPlaylists) {
    await playlist.deleteOne();
  }
  console.log(`Purged ${unusedPlaylists.length} unused playlists`);

  // delete unused user auths
  const userAuths = await UserAuth.find({});
  const unusedUserAuths = userAuths.filter(userAuth => !usedUserAuthIds.includes(userAuth.userId.toString()));
  for(const userAuth of unusedUserAuths) {
    await userAuth.deleteOne();
  }
  console.log(`Purged ${unusedUserAuths.length} unused user auths`);

  // delete unused songs
  const songs = await collectSongsInPlaylists();
  const parsedSongs = await collectParsedSongs();
  console.log(songs.length);
  console.log(parsedSongs.length);
  // merge two arrays together while keeping items unique
  const allUsedSongs = [...new Set([...songs, ...parsedSongs])];
  console.log(allUsedSongs.length);
  const allSongs = await Songs.find({});
  const unusedSongs = allSongs.filter(song => !allUsedSongs.includes(song._id.toString()));
  console.log(unusedSongs.length);
  await Songs.deleteMany({_id: {$in: unusedSongs.map(song => song._id)}});
  console.log(`Purged ${unusedSongs.length} unused songs`);
  // empty all the song arrays in albums and artists
  Albums.updateMany({}, {$set: {songs: []}});
  Artists.updateMany({}, {$set: {songs: []}});
  console.log(`Emptied all the song arrays in albums and artists`);
}

try {
  await purgeUnused();
  await db.asPromise();

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}
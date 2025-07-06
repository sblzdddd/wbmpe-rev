import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import { ObjectId } from "mongodb";
import Users from "../models/Users";
import Playlists from "../models/Playlists";
import Songs from "../models/Songs";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

// Helper function to convert old song data to new format
async function convertOldUserToNew(oldUser: any) {
  try {
    const oldFav = await db.collection('Playlist').findOne({pid: oldUser.fav_id});
    if(!oldFav) {
      console.log(`Favorites playlist does not exist in old db: ${oldUser.fav_id}`);
      return null;
    }
    
    
    const newFav = await Playlists.create({
      playlistType: "favorites",
      name: oldFav.name,
      description: oldFav.description,
    });

    if(!newFav) {
      console.log(`Failed to create playlist: ${oldFav.name}`);
      return null;
    }

    for(let i = 0; i < oldFav.songs.length; i++) {
      const song = oldFav.songs[i];
      console.log("converting favorite song", song.id);
      const oldSong = await db.collection('Song').findOne({id: song.id});
      if(!oldSong) {
        console.log(`Song does not exist in old db: ${song.id}`);
        continue;
      }
      const newSong = await Songs.findOne({name: oldSong.name, duration: oldSong.duration});
      if(!newSong) {
        console.log(`Song does not exist in new db: ${song.name} ${song.duration}`);
        continue;
      }
      const added_date = new Date(parseInt(song.added_time) * 1000);
      await Playlists.updateOne({_id: newFav._id, playlistType: "favorites"}, {$push: {songs: {song: newSong._id}}});
      await Playlists.updateOne(
        {_id: newFav._id}, 
        {$set: {
          [`songs.${i}.createdAt`]: added_date, 
          [`songs.${i}.updatedAt`]: added_date
        }},
        {overwriteImmutable: true, timestamps: false, new: true}
      );
    }

    const oldRecent = await db.collection('Playlist').findOne({pid: oldUser.recent_id});
    if(!oldRecent) {
      console.log(`Recent playlist does not exist in old db: ${oldUser.recent_id}`);
      return null;
    }
    const newRecent = await Playlists.create({
      playlistType: "recent",
      name: oldRecent.name,
      description: oldRecent.description,
    });

    if(!newRecent) {
      console.log(`Failed to create playlist: ${oldRecent.name}`);
      return null;
    }

    for(let i = 0; i < oldRecent.songs.length; i++) {
      const song = oldRecent.songs[i];
      console.log("converting recent playlist song", song.id);
      const oldSong = await db.collection('Song').findOne({id: song.id});
      if(!oldSong) {
        console.log(`Song does not exist in old db: ${song.id}`);
        continue;
      }
      const newSong = await Songs.findOne({name: oldSong.name, duration: oldSong.duration});
      if(!newSong) {
        console.log(`Song does not exist in new db: ${song.name} ${song.duration}`);
        continue;
      }
      const added_date = new Date(parseInt(song.added_time) * 1000);
      await Playlists.updateOne({_id: newRecent._id, playlistType: "recent"}, {$push: {songs: {song: newSong._id}}});
      await Playlists.updateOne(
        {_id: newRecent._id}, 
        {$set: {
          [`songs.${i}.createdAt`]: added_date, 
          [`songs.${i}.updatedAt`]: added_date
        }},
        {overwriteImmutable: true, timestamps: false, new: true}
      );
    }


    let newUser = await Users.findOne({userName: oldUser.github_login_name});
    if(!newUser) {
      console.log(`User does not exist in new db: ${oldUser.github_login_name}`);
      newUser = await Users.create({
        userName: oldUser.github_login_name,
        nickName: oldUser.user_name,
        bio: "",
        avatarUrl: oldUser.avatar_url,
        createdPlaylists: [],
        favId: newFav._id,
        recentId: newRecent._id
      });
    } else {
      newUser = await Users.findOneAndUpdate({_id: newUser._id}, {$set: {favId: newFav._id, recentId: newRecent._id}}, {new: true});
      if(!newUser) {
        console.log(`Failed to update user: ${oldUser.github_login_name}`);
        return null;
      }
    }

    await Playlists.updateOne({_id: newFav._id}, {$set: {owner: newUser._id}});
    await Playlists.updateOne({_id: newRecent._id}, {$set: {owner: newUser._id}});

    const userPlaylists = oldUser.song_list;
    const newPlaylistIds: ObjectId[] = [];
    let newPlaylist: any;
    for(const playlistId of userPlaylists) {
      console.log("converting user playlist", playlistId);
      const oldPlaylist = await db.collection('Playlist').findOne({cid: playlistId});
      if(!oldPlaylist) {
        console.log(`Playlist does not exist in old db: ${playlistId}`);
        continue;
      }
      newPlaylist = await Playlists.findOne({name: oldPlaylist.name, playlistType: "playlist", description: oldPlaylist.description});
      if(!newPlaylist) {
        console.log(`Playlist does not exist in new db: ${oldPlaylist.name} ${oldPlaylist.description}`);
        continue;
      }
      newPlaylist = await Playlists.findOneAndUpdate({_id: newPlaylist._id}, {$set: {owner: newUser._id}}, {new: true});
      if(!newPlaylist) {
        console.log(`Failed to update playlist: ${oldPlaylist.name}`);
        return null;
      }
      newPlaylistIds.push(newPlaylist._id);
    }

    newUser = await Users.findOneAndUpdate({_id: newUser._id}, {$set: {createdPlaylists: newPlaylistIds}}, {new: true});
    if(!newUser) {
      console.log(`Failed to update user: ${oldUser.github_login_name}`);
      return null;
    }


    console.log(`Successfully converted user: ${newUser.userName}`);
    return newUser;

  } catch (error) {
    console.error(`Error converting user ${oldUser.name}:`, error);
    throw error;
  }
}

// Main conversion function
async function convertAllUsers() {
  try {
    const users = await db.collection('User').find({}).toArray();
    console.log(`Total users to convert: ${users.length}`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await convertOldUserToNew(user);
        successCount++;
      } catch (error) {
        console.error(`Failed to convert user ${user.name}:`, error);
        errorCount++;
      }
    }

    console.log(`\nConversion completed:`);
    console.log(`Successfully converted: ${successCount} users`);
    console.log(`Failed to convert: ${errorCount} users`);

  } catch (error) {
    console.error('Error during conversion:', error);
  }
}

async function clearDatabase() {
  
  // Now perform the delete operations
  const playlistsFavoritesResult = await Playlists.deleteMany({playlistType: "favorites"});
  console.log(`${playlistsFavoritesResult.deletedCount} favorites playlists deleted.`);
  
  const playlistsRecentResult = await Playlists.deleteMany({playlistType: "recent"});
  console.log(`${playlistsRecentResult.deletedCount} recent playlists deleted.`);
  
  const usersResult = await Users.deleteMany({});
  console.log(`${usersResult.deletedCount} users deleted.`);
}

// Run the conversion
try {

  await db.asPromise();

  await clearDatabase();
  
  await convertAllUsers();

} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}
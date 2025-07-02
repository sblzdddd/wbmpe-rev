import mongoose, { type ObjectId } from "mongoose";
import { MONGODB_URI } from "./baka";
import Users from "./models/Users";
import UserAuth from "./models/UserAuth";
import UserSubscriptions from "./models/UserSubscriptions";
import Playlists from "./models/Playlists";
import Artists from "./models/Artists";
import Albums from "./models/Albums";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

// Helper function to convert old song data to new format
async function convertOldUserToNew(oldUser: any) {
  try {
    const newUser = await Users.findOne({userName: oldUser.github_login_name, nickName: oldUser.user_name});
    if(!newUser) {
      console.log(`User does not exist in new db: ${oldUser.name}`);
      return null;
    }
    await UserAuth.create({
      userId: newUser._id,
      githubAccessToken: oldUser.github_access_token,
    });
    console.log(`Successfully converted user: ${newUser.userName}`);

    const newSubPlaylists = [];
    for(const subPlaylistId of oldUser.subscribed_playlists) {
      const oldPlaylist = await db.collection('Playlist').findOne({cid: subPlaylistId});
      if(!oldPlaylist) {
        console.log(`Playlist does not exist in old db: ${subPlaylistId}`);
        continue;
      }
      const newPlaylist = await Playlists.findOne({name: oldPlaylist.name});
      if(!newPlaylist) {
        console.log(`Playlist does not exist in new db: ${oldPlaylist.name}`);
        continue;
      }
      newSubPlaylists.push({playlistId: newPlaylist._id});
    }

    const newSubArtists = [];
    for(const subArtistId of oldUser.subscribed_artists) {
      const oldArtist = await db.collection('Artist').findOne({aid: subArtistId});
      if(!oldArtist) {
        console.log(`Artist does not exist in old db: ${subArtistId}`);
        continue;
      }
      const newArtist = await Artists.findOne({name: oldArtist.name});
      if(!newArtist) {
        console.log(`Artist does not exist in new db: ${oldArtist.name}`);
        continue;
      }
      newSubArtists.push({artistId: newArtist._id});
    }

    const newSubAlbums = [];
    for(const subAlbumId of oldUser.subscribed_albums) {
      const oldAlbum = await db.collection('Album').findOne({aid: subAlbumId});
      if(!oldAlbum) {
        console.log(`Album does not exist in old db: ${subAlbumId}`);
        continue;
      }
      const newAlbum = await Albums.findOne({name: oldAlbum.name});
      if(!newAlbum) {
        console.log(`Album does not exist in new db: ${oldAlbum.name}`);
        continue;
      }
      newSubAlbums.push({albumId: newAlbum._id});
    }

    const newSubUsers = [];
    if("subscribed_users" in oldUser) {
      for(const subUserId of oldUser.subscribed_users) {
        const oldUser = await db.collection('User').findOne({uid: subUserId});
        if(!oldUser) {
          console.log(`User does not exist in old db: ${subUserId}`);
          continue;
        }
        const newUser = await Users.findOne({userName: oldUser.github_login_name, nickName: oldUser.user_name});
        if(!newUser) {
          console.log(`User does not exist in new db: ${oldUser.github_login_name}`);
          continue;
        }
        newSubUsers.push({userId: newUser._id});
      }
    }

    await UserSubscriptions.create({
      userId: newUser._id,
      subscribed_playlists: newSubPlaylists,
      subscribed_artists: newSubArtists,
      subscribed_albums: newSubAlbums,
      subscribed_users: newSubUsers,
    });
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
  await UserAuth.deleteMany({});
  await UserSubscriptions.deleteMany({});
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
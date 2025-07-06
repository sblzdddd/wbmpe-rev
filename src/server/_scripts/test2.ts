import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import Songs from "../models/Songs";
import Playlists from "../models/Playlists";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});


// Helper function to convert old song data to new format
async function convertOldPlaylistToNew(oldPlaylist: any) {
  try {
    if(['%Favourites%', '%Recent%'].includes(oldPlaylist.name)) {
      return;
    }
    const playlistSongs = oldPlaylist.songs;
    const newSongs: any[] = [];
    for(let i = 0; i < playlistSongs.length; i++) {
      const song = playlistSongs[i];
      console.log("song", song)
      const oldSong = await db.collection('Song').findOne({id: song.id});
      if(!oldSong) {
        console.log(`Song does not exist in old db: ${song.id}`);
        continue;
      }
      const newSong = await Songs.findOne({name: oldSong.name, duration: oldSong.duration});
      if(!newSong) {
        console.log(`Song does not exist in new db: ${oldSong.name} ${oldSong.duration}`);
        continue;
      }
      console.log("adding song", oldSong.name)
      newSongs.push({_id: newSong._id, added_time: song.added_time});
    }

    let newPlaylist = await Playlists.findOne({name: oldPlaylist.name, playlistType: "playlist", description: oldPlaylist.description});
    if(newPlaylist) {
      console.log(`Playlist already exists: ${oldPlaylist.name}`);
      newPlaylist = await Playlists.findOneAndUpdate({
        name: oldPlaylist.name,
        description: oldPlaylist.description
      }, {
        $set: {
          playlistType: "playlist",
          songs: newSongs.map((song) => ({song: song._id})),
        }
      }, { overwriteImmutable: true, timestamps: false, new: true });
    } else {
      console.log(`Playlist does not exist in new db: ${oldPlaylist.name}`);
      newPlaylist = await Playlists.create({
        playlistType: "playlist",
        name: oldPlaylist.name,
        description: oldPlaylist.description,
        songs: newSongs.map((song) => ({song: song._id})),
      });
    }

    if(!newPlaylist) {
      console.log(`Failed to create playlist: ${oldPlaylist.name}`);
      return null;
    }

    for(let i = 0; i < newSongs.length; i++) {
      const song = newSongs[i];
      console.log(song.added_time)
      const added_date = new Date(parseInt(song.added_time) * 1000);
      console.log(added_date);
      await Playlists.updateOne(
        {_id: newPlaylist._id}, 
        {$set: {
          [`songs.${i}.createdAt`]: added_date, 
          [`songs.${i}.updatedAt`]: added_date
        }},
        {overwriteImmutable: true, timestamps: false, new: true}
      );
    }


    console.log(`Successfully converted playlist: ${oldPlaylist.name}`);
    return newPlaylist;

  } catch (error) {
    console.error(`Error converting playlist ${oldPlaylist.name}:`, error);
    throw error;
  }
}

// Main conversion function
async function convertAllSongs() {
  try {
    const playlists = await db.collection('Playlist').find({}).toArray();
    console.log(`Total playlists to convert: ${playlists.length}`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const playlist of playlists) {
      try {
        await convertOldPlaylistToNew(playlist);
        successCount++;
      } catch (error) {
        console.error(`Failed to convert playlist ${playlist.name}:`, error);
        errorCount++;
      }
    }

    console.log(`\nConversion completed:`);
    console.log(`Successfully converted: ${successCount} playlists`);
    console.log(`Failed to convert: ${errorCount} playlists`);

  } catch (error) {
    console.error('Error during conversion:', error);
  }
}

// Run the conversion
try {
  await convertAllSongs();
} catch (error) {
  console.error('Error in main process:', error);
} finally {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}
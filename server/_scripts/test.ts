import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import Songs from "../models/Songs";
import Albums from "../models/Albums";
import Artists from "../models/Artists";
import { ObjectId } from "mongodb";
import Streams from "../models/Streams";
import Lyrics from "../models/Lyrics";

await mongoose.connect(MONGODB_URI);
console.log('Connected to MongoDB');

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

const convertArtist = async (artistId: string, artistName: string) => {
  const oldArtist = await db.collection('Artist').findOne({aid: artistId});

  const existingArtist = await Artists.findOne({name: artistName});
  if (existingArtist) {
    console.log(`Artist already exists: ${artistName} ${existingArtist._id}`);
    return existingArtist;
  }

  let newArtistData = {}
  if (oldArtist) {
    console.log(`Artist exists in old db: ${oldArtist.name}`);
    newArtistData = {
      name: oldArtist.name,
      avatarUrl: oldArtist.pic || "default_avatar.jpg",
      description: oldArtist.description,
      songs: []
    }
  } else {
    console.log(`Artist does not exist in old db: ${artistName}`);
    newArtistData = {
      name: artistName,
      avatarUrl: "",
      description: "",
      songs: [],
    }
  }
  const newArtist = await Artists.create(newArtistData);
  console.log(`Created new artist: ${newArtist.name}`);
  return newArtist;
}

async function convertAlbum(oldAlbum: any, oldSong: any, artistIds: ObjectId[]) {
  let newAlbumData = {}
  
  if (oldAlbum) {
    console.log(`Album exists in old db: ${oldAlbum.name}`);
    const oldArtistIds: ObjectId[] = [];
    for(const singer of oldAlbum.singers) {
      const newArtist = await convertArtist(singer, "Unnamed");
      if (newArtist && newArtist._id) {
        oldArtistIds.push(newArtist._id);
      }
    }
    newAlbumData = {
      name: oldAlbum.name,
      coverUrl: oldAlbum.pic || "default_cover.jpg",
      description: `Album: ${oldAlbum.name}`,
      artists: oldArtistIds,
      songs: []
    }
  } else {
    console.log(`Album does not exist in old db: ${oldSong.album}`);
    newAlbumData = {
      name: oldSong.album,
      coverUrl: oldSong.pic || "default_cover.jpg",
      description: `Album: ${oldSong.album}`,
      artists: artistIds,
      songs: []
    }
  }

  const existingAlbum = await Albums.findOne({name: oldSong.album});
  if (existingAlbum) {
    console.log(`Album already exists: ${existingAlbum.name} ${existingAlbum._id}`);
    await Albums.updateOne({_id: existingAlbum._id}, {$set: newAlbumData});
    return existingAlbum;
  } else {
    const album = await Albums.create(newAlbumData);
    console.log(`Created new album: ${album.name}`);
    return album;
  }
}

// Helper function to convert old song data to new format
async function convertOldSongToNew(oldSong: any) {
  try {
  
    const artistIds: ObjectId[] = [];
    for(let i = 0; i < oldSong.artists.length; i++) {
      const artist = oldSong.artists[i];
      const artistName = oldSong.artistNames.split(', ')[i];
      console.log("converting artist: ", artist, artistName);
      const newArtist = await convertArtist(artist, artistName);
      if (newArtist && newArtist._id) {
        artistIds.push(newArtist._id);
      }
    }

    // Create or find the album (Collection)
    const oldAlbum = await db.collection('Album').findOne({aid: oldSong.albumId});
    const album = await convertAlbum(oldAlbum, oldSong, artistIds);

    // Check if song already exists to avoid duplicates
    let newSong = await Songs.findOne({ 
      name: oldSong.name,
      albumId: album._id 
    });

    if (newSong) {
      console.log(`Song already exists: ${oldSong.name} ${newSong._id}`);
    } else {

      const newSongData = {
        name: oldSong.name,
        src: oldSong.src,
        duration: oldSong.duration,
        albumId: album._id,
        artists: artistIds,
        addedBy: undefined
      }
      // Create new song with converted data
      newSong = await Songs.create(newSongData);
      console.log(`Created new song: ${newSong.name}`);
    }


    if(oldSong.url && oldSong.url !== "") {
      const existingStream = await Streams.findOne({songId: newSong._id});
      if(existingStream) {
        console.log(`Stream already exists: ${oldSong.name} ${existingStream._id}`);
      } else {
        const streamData = {
          songId: newSong._id,
          audio: {
            normal: oldSong.url,
            high: oldSong.url,
            lossless: oldSong.url
          },
          video: oldSong.video
        }
        const stream = await Streams.create(streamData);
        console.log(`Created new stream: ${stream.audio?.normal}`);
      }
    }

    if(oldSong.hasSubtitles) {
      console.log(`${oldSong.name} has subtitles`);
      const existingLyrics = await Lyrics.findOne({songId: newSong._id});
      if(existingLyrics) {
        console.log(`Lyrics already exists: ${oldSong.name} ${existingLyrics._id}`);
      } else {
        console.log(`${oldSong.id} ${oldSong.name}`);
        const oldLyrics = await db.collection('Lyric').findOne({sid: oldSong.id});
        const newLyrics = []
        if(oldLyrics) {
          console.log(`Lyrics exists in old db: ${oldSong.name}`);
          if(oldLyrics.lyric.lyrics) {
            newLyrics.push({language: "original", content: oldLyrics.lyric.lyrics, format: oldLyrics.ext});
          }
          if(oldLyrics.lyric.lyrics_translated) {
            newLyrics.push({language: "zh-cn", content: oldLyrics.lyric.lyrics_translated, format: oldLyrics.ext});
          }
          if(oldLyrics.lyric.lyrics_merged) {
            newLyrics.push({language: "merged", content: oldLyrics.lyric.lyrics_merged, format: oldLyrics.ext});
          }
          
          // Add any other fields from lyric object
          Object.keys(oldLyrics.lyric).forEach(key => {
            if(!['lyrics', 'lyrics_translated', 'lyrics_merged'].includes(key) && oldLyrics.lyric[key]) {
              newLyrics.push({language: key, content: oldLyrics.lyric[key], format: oldLyrics.ext});
            }
          });
          const lyrics = await Lyrics.create({
            songId: newSong._id,
            lyrics: newLyrics
          });
          console.log(`Created new lyrics: ${lyrics.songId}`);
        } else {
          console.log(`Lyrics does not exist in old db: ${oldSong.name}`);
        }
      }
    }

    console.log(`Successfully converted song: ${oldSong.name}`);
    return newSong;

  } catch (error) {
    console.error(`Error converting song ${oldSong.name}:`, error);
    throw error;
  }
}

// Main conversion function
async function convertAllSongs() {
  try {
    const songs = await db.collection('Song').find({}).toArray();
    console.log(`Total songs to convert: ${songs.length}`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const song of songs) {
      try {
        await convertOldSongToNew(song);
        successCount++;
      } catch (error) {
        console.error(`Failed to convert song ${song.name}:`, error);
        errorCount++;
      }
    }

    console.log(`\nConversion completed:`);
    console.log(`Successfully converted: ${successCount} songs`);
    console.log(`Failed to convert: ${errorCount} songs`);

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
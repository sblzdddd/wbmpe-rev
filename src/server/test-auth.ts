import mongoose from "mongoose";
import { MONGODB_URI } from "./baka";
import Users from "./models/Users";
import UserAuth from "./models/UserAuth";
import Playlists from "./models/Playlists";

async function createTestUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await Users.findOne({ userName: 'testuser' });
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Create default playlists first
    const favoritesPlaylist = await Playlists.create({
      playlistType: 'favorites',
      name: 'Favorites',
      description: 'Your favorite songs',
      coverUrl: '',
      owner: null, // Will be set after user creation
      songs: []
    });

    const recentPlaylist = await Playlists.create({
      playlistType: 'recent',
      name: 'Recently Played',
      description: 'Your recently played songs',
      coverUrl: '',
      owner: null, // Will be set after user creation
      songs: []
    });

    // Create test user
    const user = await Users.create({
      userName: 'testuser',
      nickName: 'Test User',
      avatarUrl: '',
      createdPlaylists: [],
      favId: favoritesPlaylist._id,
      recentId: recentPlaylist._id
    });

    // Update playlists with owner
    await Playlists.updateOne({ _id: favoritesPlaylist._id }, { owner: user._id });
    await Playlists.updateOne({ _id: recentPlaylist._id }, { owner: user._id });

    // Hash password
    const hashedPassword = await hashPassword('password123');

    // Create user auth
    await UserAuth.create({
      userId: user._id,
      email: 'test@example.com',
      pwdHash: hashedPassword
    });

    console.log('Test user created successfully:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('Username: testuser');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser(); 
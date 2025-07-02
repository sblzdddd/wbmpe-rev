import { z } from 'zod'
import { hashPassword } from '~/server/utils/auth'
import { Users, UserAuth, Playlists } from '~/server/models'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  userName: z.string().min(3),
})

export default defineEventHandler(async (event) => {
  const { email, password, userName } = await readValidatedBody(event, bodySchema.parse)

  try {
    // Check if email already exists
    const existingUserAuth = await UserAuth.findOne({ email })
    if (existingUserAuth) {
      throw createError({
        statusCode: 400,
        message: 'Email already registered'
      })
    }

    // Check if username already exists
    const existingUser = await Users.findOne({ userName })
    if (existingUser) {
      throw createError({
        statusCode: 400,
        message: 'Username already taken'
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

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

    // Create user
    const user = await Users.create({
      userName,
      nickName: userName,
      avatarUrl: '',
      createdPlaylists: [],
      favId: favoritesPlaylist._id,
      recentId: recentPlaylist._id
    });

    // Update playlists with owner
    await Playlists.updateOne({ _id: favoritesPlaylist._id }, { owner: user._id });
    await Playlists.updateOne({ _id: recentPlaylist._id }, { owner: user._id });

    // Create user auth
    await UserAuth.create({
      userId: user._id,
      email,
      pwdHash: hashedPassword
    })

    // Create session for newly registered user
    await setUserSession(event, {
      id: user._id.toString(),
      email,
      userName: user.userName,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl
    });
    
    console.log('After registration - session:', await getUserSession(event))

    return {
      user: {
        id: user._id.toString(),
        email,
        userName: user.userName,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    
    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      message: 'Internal server error'
    })
  }
}) 
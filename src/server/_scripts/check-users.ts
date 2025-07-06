import mongoose from "mongoose"
import { MONGODB_URI } from "./baka"
import UserAuth from "../models/UserAuth"
import Users from "../models/Users"

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Check all users
    const users = await Users.find({})
    console.log('\n--- All Users ---')
    console.log('Total users:', users.length)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.userName} (${user.nickName}) - ID: ${user._id}`)
    })

    // Check all user auth records
    const userAuths = await UserAuth.find({})
    console.log('\n--- All UserAuth Records ---')
    console.log('Total user auth records:', userAuths.length)
    userAuths.forEach((auth, index) => {
      console.log(`${index + 1}. Email: ${auth.email}`)
      console.log(`   User ID: ${auth.userId}`)
      console.log(`   Has password hash: ${!!auth.pwdHash}`)
      if (auth.pwdHash) {
        console.log(`   Hash length: ${auth.pwdHash.length}`)
        console.log(`   Hash prefix: ${auth.pwdHash.substring(0, 10)}...`)
        console.log(`   Hash format: ${auth.pwdHash.startsWith('$2a$') ? 'bcrypt $2a$' : auth.pwdHash.startsWith('$2b$') ? 'bcrypt $2b$' : auth.pwdHash.startsWith('$2y$') ? 'bcrypt $2y$' : 'unknown'}`)
      }
      console.log('')
    })

    // Try to find a specific user by email
    const testEmail = 'test@example.com'
    const testUserAuth = await UserAuth.findOne({ email: testEmail })
    if (testUserAuth) {
      console.log(`\n--- Found UserAuth for ${testEmail} ---`)
      console.log('User ID:', testUserAuth.userId)
      console.log('Password hash:', testUserAuth.pwdHash)
      
      // Find the corresponding user
      const user = await Users.findById(testUserAuth.userId)
      if (user) {
        console.log('User details:', {
          userName: user.userName,
          nickName: user.nickName,
          email: testEmail
        })
      }
    } else {
      console.log(`\n--- No UserAuth found for ${testEmail} ---`)
    }
    
  } catch (error) {
    console.error('❌ Check users failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkUsers()
    .then(() => {
      console.log('Check completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Check failed:', error)
      process.exit(1)
    })
}

export default checkUsers 
import mongoose from "mongoose"
import { MONGODB_URI } from "./baka"
import { hashPasswordCustom, verifyPasswordCustom } from "../utils/auth"

async function testPasswordHashing() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const testPassword = 'testpassword123'
    
    console.log('Testing password hashing...')
    console.log('Test password:', testPassword)
    
    // Test 1: Hash the same password multiple times
    console.log('\n--- Test 1: Multiple hashes of same password ---')
    const hash1 = await hashPasswordCustom(testPassword)
    const hash2 = await hashPasswordCustom(testPassword)
    const hash3 = await hashPasswordCustom(testPassword)
    
    console.log('Hash 1:', hash1)
    console.log('Hash 2:', hash2)
    console.log('Hash 3:', hash3)
    console.log('All hashes different?', hash1 !== hash2 && hash2 !== hash3 && hash1 !== hash3)
    
    // Test 2: Verify each hash
    console.log('\n--- Test 2: Verify each hash ---')
    const verify1 = await verifyPasswordCustom(testPassword, hash1)
    const verify2 = await verifyPasswordCustom(testPassword, hash2)
    const verify3 = await verifyPasswordCustom(testPassword, hash3)
    
    console.log('Verify hash1:', verify1)
    console.log('Verify hash2:', verify2)
    console.log('Verify hash3:', verify3)
    console.log('All verifications successful?', verify1 && verify2 && verify3)
    
    // Test 3: Verify with wrong password
    console.log('\n--- Test 3: Verify with wrong password ---')
    const wrongPassword = 'wrongpassword123'
    const verifyWrong1 = await verifyPasswordCustom(wrongPassword, hash1)
    const verifyWrong2 = await verifyPasswordCustom(wrongPassword, hash2)
    const verifyWrong3 = await verifyPasswordCustom(wrongPassword, hash3)
    
    console.log('Verify wrong password with hash1:', verifyWrong1)
    console.log('Verify wrong password with hash2:', verifyWrong2)
    console.log('Verify wrong password with hash3:', verifyWrong3)
    console.log('All wrong password verifications failed?', !verifyWrong1 && !verifyWrong2 && !verifyWrong3)
    
    // Test 4: Check hash format
    console.log('\n--- Test 4: Hash format analysis ---')
    console.log('Hash1 starts with $2a$:', hash1.startsWith('$2a$'))
    console.log('Hash1 starts with $2b$:', hash1.startsWith('$2b$'))
    console.log('Hash1 starts with $2y$:', hash1.startsWith('$2y$'))
    console.log('Hash1 length:', hash1.length)
    
    console.log('\n✅ Password hashing test completed successfully!')
    
  } catch (error) {
    console.error('❌ Password hashing test failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testPasswordHashing()
    .then(() => {
      console.log('Test completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Test failed:', error)
      process.exit(1)
    })
}

export default testPasswordHashing 
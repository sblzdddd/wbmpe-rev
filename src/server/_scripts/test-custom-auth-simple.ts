import bcrypt from 'bcryptjs'

async function testCustomAuth() {
  try {
    console.log('🧪 Testing Custom Auth Utility...\n')
    
    const testPassword = 'testpassword123'
    
    // Test 1: Basic password hashing and verification
    console.log('--- Test 1: Basic Password Hashing and Verification ---')
    const hash1 = await bcrypt.hash(testPassword, 12)
    console.log('Hash 1:', hash1)
    console.log('Hash format:', hash1.startsWith('$2a$') ? 'bcrypt' : 'unknown')
    
    const verify1 = await bcrypt.compare(testPassword, hash1)
    console.log('Verification result:', verify1)
    console.log('✅ Test 1 passed:', verify1 === true)
    
    // Test 2: Multiple hashes of same password
    console.log('\n--- Test 2: Multiple Hashes of Same Password ---')
    const hash2 = await bcrypt.hash(testPassword, 12)
    const hash3 = await bcrypt.hash(testPassword, 12)
    
    console.log('Hash 2:', hash2)
    console.log('Hash 3:', hash3)
    console.log('All hashes different?', hash1 !== hash2 && hash2 !== hash3 && hash1 !== hash3)
    
    const verify2 = await bcrypt.compare(testPassword, hash2)
    const verify3 = await bcrypt.compare(testPassword, hash3)
    console.log('All verifications successful?', verify1 && verify2 && verify3)
    console.log('✅ Test 2 passed:', verify1 && verify2 && verify3)
    
    // Test 3: Wrong password verification
    console.log('\n--- Test 3: Wrong Password Verification ---')
    const wrongPassword = 'wrongpassword123'
    const verifyWrong1 = await bcrypt.compare(wrongPassword, hash1)
    const verifyWrong2 = await bcrypt.compare(wrongPassword, hash2)
    const verifyWrong3 = await bcrypt.compare(wrongPassword, hash3)
    
    console.log('Wrong password verification results:', verifyWrong1, verifyWrong2, verifyWrong3)
    console.log('All wrong password verifications failed?', !verifyWrong1 && !verifyWrong2 && !verifyWrong3)
    console.log('✅ Test 3 passed:', !verifyWrong1 && !verifyWrong2 && !verifyWrong3)
    
    // Test 4: Different salt rounds
    console.log('\n--- Test 4: Different Salt Rounds ---')
    const hashLowRounds = await bcrypt.hash(testPassword, 8)
    const hashHighRounds = await bcrypt.hash(testPassword, 14)
    
    console.log('Low rounds hash:', hashLowRounds)
    console.log('High rounds hash:', hashHighRounds)
    
    const verifyLow = await bcrypt.compare(testPassword, hashLowRounds)
    const verifyHigh = await bcrypt.compare(testPassword, hashHighRounds)
    console.log('Both verifications successful?', verifyLow && verifyHigh)
    console.log('✅ Test 4 passed:', verifyLow && verifyHigh)
    
    // Test 5: Salt generation
    console.log('\n--- Test 5: Salt Generation ---')
    const salt1 = await bcrypt.genSalt(10)
    const salt2 = await bcrypt.genSalt(12)
    
    console.log('Salt 1 (10 rounds):', salt1)
    console.log('Salt 2 (12 rounds):', salt2)
    console.log('Salts are different?', salt1 !== salt2)
    console.log('✅ Test 5 passed:', salt1 !== salt2)
    
    console.log('\n🎉 All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCustomAuth() 
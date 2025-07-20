import bcrypt from 'bcryptjs'
import BakaLogger from './BakaLogger'

const logger = BakaLogger.child({ service: 'AuthUtils' })

/**
 * Hash a password using bcryptjs
 * @param password - The plain text password to hash
 * @param saltRounds - Number of salt rounds (default: 12)
 * @returns Promise<string> - The hashed password
 */
export async function hashPasswordCustom(password: string, saltRounds: number = 12): Promise<string> {
  try {
    logger.log("silly", 'Hashing password', { 
      passwordLength: password.length,
      saltRounds 
    })
    
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    logger.log("silly", 'Password hashed successfully', {
      hashLength: hashedPassword.length,
      hashStartsWith: hashedPassword.substring(0, 7) // Should start with "$2b$12$" or similar
    })
    
    return hashedPassword
  } catch (error) {
    logger.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify a password against a hash using bcryptjs
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * @returns Promise<boolean> - True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    logger.log("silly", 'Verifying password', {
      passwordLength: password.length,
      hashLength: hash.length,
      hashStartsWith: hash.substring(0, 7)
    })
    
    const isValid = await bcrypt.compare(password, hash)
    
    logger.log("silly", 'Password verification result', { isValid })
    
    return isValid
  } catch (error) {
    logger.error('Error verifying password:', error)
    return false
  }
}

/**
 * Generate a salt for password hashing
 * @param saltRounds - Number of salt rounds (default: 12)
 * @returns Promise<string> - The generated salt
 */
export async function generateSalt(saltRounds: number = 12): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(saltRounds)
    logger.log("silly", 'Salt generated', { saltRounds, saltLength: salt.length })
    return salt
  } catch (error) {
    logger.error('Error generating salt:', error)
    throw new Error('Failed to generate salt')
  }
}

/**
 * Get the number of salt rounds from a hash
 * @param hash - The bcrypt hash
 * @returns number - The number of salt rounds used
 */
export function getSaltRoundsFromHash(hash: string): number {
  try {
    // bcrypt hash format: $2b$12$...
    const match = hash.match(/^\$2[aby]\$(\d+)\$/)
    if (match) {
      return parseInt(match[1], 10)
    }
    return 12 // default fallback
  } catch (error) {
    logger.error('Error parsing salt rounds from hash:', error)
    return 12 // default fallback
  }
} 
import bcrypt from 'bcryptjs'

const logger = BakaLogger.child({ service: 'AuthUtils' })

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

export async function verifyPasswordCustom(password: string, hash: string): Promise<boolean> {
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

export function getSaltRoundsFromHash(hash: string): number {
  try {
    // bcrypt hash format: $2b$12$...
    const match = hash.match(/^\$2[aby]\$(\d+)\$/)
    if (match) {
      return parseInt(match[1], 10)
    }
    return 12
  } catch (error) {
    logger.error('Error parsing salt rounds from hash:', error)
    return 12
  }
}

export function makeid(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

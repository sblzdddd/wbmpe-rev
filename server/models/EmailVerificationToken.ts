import mongoose from "mongoose";
const logger = BakaLogger.child({service: 'EmailVerificationToken'})

const emailVerificationTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  verified: { type: Boolean, default: false }
}, {
  timestamps: true,
});

// Index for automatic cleanup of expired tokens
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailVerificationToken = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);
logger.debug('model loaded')
export default EmailVerificationToken;
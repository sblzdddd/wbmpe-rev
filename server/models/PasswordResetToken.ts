import mongoose from "mongoose";
const logger = BakaLogger.child({service: 'PasswordResetToken'})
const passwordResetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, {
  timestamps: true,
});

// Index for automatic cleanup of expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
logger.debug('model loaded')
export default PasswordResetToken;
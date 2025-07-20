import mongoose from "mongoose";

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
export default EmailVerificationToken;
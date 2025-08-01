import mongoose from "mongoose";

const UnparsedEntitySchema = new mongoose.Schema({
  name: {type: String, required: true},
  platform: {type: String, required: true},
  id: {type: String, required: true},
  coverUrl: {type: String, required: false},
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

export default UnparsedEntitySchema;


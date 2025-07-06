import mongoose from "mongoose";

export function isValidObjectIdString(idString: string): boolean {
  return mongoose.Types.ObjectId.isValid(idString);
}

export function isValidObjectId(id: mongoose.Types.ObjectId): boolean {
  return id instanceof mongoose.Types.ObjectId;
}

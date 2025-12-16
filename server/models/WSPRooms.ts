import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";
import type { SongType } from "../../types/Song";

// Types
interface WSPRoomState {
  isPlaying: boolean;
  currentSong: SongType | null;
  currentTime: number;
  lastUpdated: Date;
  queue: SongType[];
  queueIndex: number;
}

interface WSPRoom {
  name: string;
  owner: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  state: WSPRoomState;
}

interface WSPRoomModel extends Model<WSPRoom> {
  getOrCreateRoom(this: WSPRoomModel, name: string, ownerId: string): Promise<HydratedDocument<WSPRoom>>;
  updateState(this: WSPRoomModel, roomId: string, partialState: Partial<WSPRoomState>): Promise<HydratedDocument<WSPRoom> | null>;
  addParticipant(this: WSPRoomModel, roomId: string, userId: string): Promise<HydratedDocument<WSPRoom> | null>;
  removeParticipant(this: WSPRoomModel, roomId: string, userId: string): Promise<HydratedDocument<WSPRoom> | null>;
}

// Define schema for Room
const wspRoomSchema = new Schema<WSPRoom, WSPRoomModel>({
  name: { type: String, required: true, unique: true },
  owner: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'Users' }],

  // Shared Player State
  state: {
    isPlaying: { type: Boolean, default: false },
    currentSong: { type: Object, default: null },
    currentTime: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    queue: { type: Array, default: [] },
    queueIndex: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Statics
wspRoomSchema.statics.getOrCreateRoom = async function(name: string, ownerId: string) {
  let room = await this.findOne({ name });
  if (!room) {
    room = await this.create({
      name,
      owner: new mongoose.Types.ObjectId(ownerId),
      participants: [new mongoose.Types.ObjectId(ownerId)],
      state: {
        isPlaying: false,
        currentSong: null,
        currentTime: 0,
        lastUpdated: new Date(),
        queue: [],
        queueIndex: 0
      }
    });
  }
  return room;
};

wspRoomSchema.statics.updateState = async function(roomId: string, partialState: Partial<WSPRoomState>) {
  return this.findByIdAndUpdate(
    roomId,
    {
      $set: {
        ...Object.keys(partialState).reduce((acc, key) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc as any)[`state.${key}`] = (partialState as any)[key];
          return acc;
        }, {} as Record<string, unknown>),
        'state.lastUpdated': new Date()
      }
    },
    { new: true }
  );
};

wspRoomSchema.statics.addParticipant = async function(roomId: string, userId: string) {
  return this.findByIdAndUpdate(roomId, {
    $addToSet: { participants: new mongoose.Types.ObjectId(userId) }
  }, { new: true });
};

wspRoomSchema.statics.removeParticipant = async function(roomId: string, userId: string) {
  return this.findByIdAndUpdate(roomId, {
    $pull: { participants: new mongoose.Types.ObjectId(userId) }
  }, { new: true });
};

const WSPRooms = mongoose.model<WSPRoom, WSPRoomModel>('WSPRooms', wspRoomSchema);
export default WSPRooms;

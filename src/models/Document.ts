import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
  filename: string;
  name: string;
  description?: string;
  category?: string;
  path: string;
  hash: string;
  uploadedBy: mongoose.Types.ObjectId; // Changed from Schema.Types.ObjectId
  createdAt: Date;
  fraudStatus: 'pending' | 'suspicious' | 'verified' | 'rejected';
  fraudReason?: string;
  verifiedBy?: mongoose.Types.ObjectId; // Changed from Schema.Types.ObjectId
  verifiedAt?: Date;
  // New sharing-related fields
  isShared: boolean;
  sharedWith: mongoose.Types.ObjectId[]; // Changed from Schema.Types.ObjectId[]
  sharedBy?: mongoose.Types.ObjectId; // Changed from Schema.Types.ObjectId
  sharedAt?: Date;
  sharingNote?: string;
}

const DocumentSchema = new Schema<IDocument>({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  hash: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  fraudStatus: {
    type: String,
    enum: ["pending", "suspicious", "verified", "rejected"],
    default: "pending",
  },
  fraudReason: { type: String },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
  verifiedAt: { type: Date },
  // New sharing-related fields
  isShared: { type: Boolean, default: false },
  sharedWith: [{ type: Schema.Types.ObjectId, ref: "User" }],
  sharedBy: { type: Schema.Types.ObjectId, ref: "User" },
  sharedAt: { type: Date },
  sharingNote: { type: String },
});

export default mongoose.model<IDocument>("Document", DocumentSchema);
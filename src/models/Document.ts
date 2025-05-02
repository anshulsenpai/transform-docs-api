import mongoose, { Schema, Document } from "mongoose";

interface IDocument extends Document {
  filename: string;
  name: string;
  description?: string;
  category?: string;
  path: string; // ✅ Added missing path field
  hash: string;
  uploadedBy: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  fraudStatus: 'pending' | 'suspicious' | 'verified' | 'rejected';
  fraudReason?: string;
  verifiedBy?: mongoose.Schema.Types.ObjectId;
  verifiedAt?: Date;
}

const DocumentSchema = new Schema<IDocument>({
  filename: { type: String, required: true },
  path: { type: String, required: true }, // ✅ Ensure path is stored in DB
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
});

export default mongoose.model<IDocument>("Document", DocumentSchema);

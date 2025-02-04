import mongoose, { Schema, Document } from "mongoose";

interface IDocument extends Document {
  filename: string;
  name: string;
  description?: string;
  path: string; // ✅ Added missing path field
  hash: string;
  status: "Pending" | "Verified" | "Rejected";
  uploadedBy: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  filename: { type: String, required: true },
  path: { type: String, required: true }, // ✅ Ensure path is stored in DB
  hash: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: ["Pending", "Verified", "Rejected"],
    default: "Pending",
  },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IDocument>("Document", DocumentSchema);

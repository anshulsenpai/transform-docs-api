import mongoose, { Schema, Document } from "mongoose";

interface IDocument extends Document {
  filename: string;
  hash: string;
  status: "Pending" | "Verified" | "Rejected";
  uploadedBy: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  filename: { type: String, required: true },
  hash: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ["Pending", "Verified", "Rejected"],
    default: "Pending",
  },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IDocument>("Document", DocumentSchema);

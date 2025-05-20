import mongoose, { Schema, Document } from "mongoose";

interface IActivity extends Document {
  type: "upload" | "verification" | "share" | "unshare";
  user: mongoose.Schema.Types.ObjectId;
  document: mongoose.Schema.Types.ObjectId;
  status: string;
  details?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  type: {
    type: String,
    enum: ["upload", "verification", "share", "unshare"],
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  document: {
    type: Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  details: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IActivity>("Activity", ActivitySchema);

import mongoose, { Schema, model, models } from "mongoose";

const HistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    ingredients: {
      type: [String],
      required: true,
    },
    recipe: {
      type: [String],
      required: true,
    },
    imageUrl: {
      type: String, // Base64 image
    },
  },
  { timestamps: true }
);

const History = models.History || model("History", HistorySchema);

export default History;

import mongoose from "mongoose";

const RecipeVariantSchema = new mongoose.Schema({
  title: String,
  ingredients: [String],
  recipe: [String],
}, { _id: false });

const SearchHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  ingredients: [String],
  recipe: [String],
  recipes: [RecipeVariantSchema],   // ← all model predictions
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const SearchHistory = mongoose.models.SearchHistory || mongoose.model("SearchHistory", SearchHistorySchema);

import mongoose from "mongoose";

const MONGODB_URI = process.env.DATABASE_URL!;

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!MONGODB_URI) {
    // Only throw if we are actually at runtime on Render
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
       console.error("DATABASE_URL is missing!");
    }
    return null;
  }
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

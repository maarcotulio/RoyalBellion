import mongoose, { type Mongoose } from "mongoose";

const defaultMongoUri = "mongodb://bellion:bellion@127.0.0.1:27017/bellion?authSource=admin";

type MongooseCache = {
  connection: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  var bellionMongooseCache: MongooseCache | undefined;
}

const cache = globalThis.bellionMongooseCache ?? {
  connection: null,
  promise: null,
};

globalThis.bellionMongooseCache = cache;

export function getMongoUri() {
  return process.env.MONGODB_URI ?? defaultMongoUri;
}

export async function connectToMongo() {
  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(getMongoUri(), {
      dbName: process.env.MONGODB_DB ?? "bellion",
      serverSelectionTimeoutMS: 5_000,
    });
  }

  cache.connection = await cache.promise;

  return cache.connection;
}

export async function disconnectFromMongo() {
  if (!cache.connection) {
    return;
  }

  await mongoose.disconnect();
  cache.connection = null;
  cache.promise = null;
}

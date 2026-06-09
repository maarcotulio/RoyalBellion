import { connectToMongo, disconnectFromMongo, getMongoUri } from "../src/lib/db/mongoose";

async function main() {
  const connection = await connectToMongo();
  const result = await connection.connection.db?.admin().ping();

  if (result?.ok !== 1) {
    throw new Error("MongoDB ping did not return ok: 1.");
  }

  console.log(`Connected to MongoDB: ${getMongoUri()}`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromMongo();
  });

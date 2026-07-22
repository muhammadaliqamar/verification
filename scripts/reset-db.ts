import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as path from "path";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore
}

// Simple .env parser
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim();
    }
  });
}

async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith("mongodb+srv://")) return uri;
  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);
    const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(.*)/);
    if (!match) return uri;
    const [, user, pass, host, rest] = match;
    const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
    if (!srvRecords || srvRecords.length === 0) return uri;
    const hostList = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
    const queryDelimiter = rest.includes("?") ? "&" : "?";
    return `mongodb://${user}:${pass}@${hostList}${rest}${queryDelimiter}ssl=true`;
  } catch {
    return uri;
  }
}

async function resetDatabase() {
  const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGODB_DB || "devlogix_verification";
  const collectionName = process.env.MONGODB_COLLECTION || "letters";

  console.log(`Connecting to MongoDB Atlas...`);
  const uri = await resolveMongoUri(rawUri);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    console.log(`Clearing all documents in collection '${dbName}.${collectionName}'...`);
    const result = await collection.deleteMany({});
    console.log(`✓ Deleted ${result.deletedCount} sample documents.`);

    console.log("Database reset complete!");
  } catch (error) {
    console.error("Database reset failed:", error);
  } finally {
    await client.close();
  }
}

resetDatabase();

import { MongoClient, MongoClientOptions } from "mongodb";
import dns from "dns";

// Fallback DNS resolution to Google/Cloudflare DNS to fix Windows/ISP querySrv ECONNREFUSED issues with MongoDB Atlas
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if custom DNS fails to set
}

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout quickly if MongoDB is unreachable
  connectTimeoutMS: 5000,
};

let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Returns a connected MongoDB client singleton.
 * Safe for serverless environments and hot-reloading in Next.js development.
 */
export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      const client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
    return clientPromise;
  }
}

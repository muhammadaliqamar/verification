import { MongoClient, MongoClientOptions } from "mongodb";
import dns from "dns";
import fs from "fs";
import path from "path";

// Fallback .env.local reader if process.env is not yet populated
function loadEnvLocal() {
  if (!process.env.MONGODB_URI) {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const [key, ...vals] = trimmed.split("=");
            const envKey = key.trim();
            if (!process.env[envKey]) {
              process.env[envKey] = vals.join("=").trim();
            }
          }
        });
      }
    } catch {
      // Ignore if file cannot be read
    }
  }
}

loadEnvLocal();

/**
 * Resolves mongodb+srv:// URIs to standard mongodb:// seedlists using 8.8.8.8/1.1.1.1 DNS.
 * This bypasses Windows / Node.js c-ares querySrv ECONNREFUSED issues seamlessly.
 */
async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

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
  } catch (err) {
    console.warn("[MongoDB SRV Resolver]: Fallback to default URI", err);
    return uri;
  }
}

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 5000,
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
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  const resolvedUri = await resolveMongoUri(rawUri);

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(resolvedUri, options);
      global._mongoClientPromise = client.connect().catch((err) => {
        global._mongoClientPromise = undefined;
        throw err;
      });
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      const client = new MongoClient(resolvedUri, options);
      clientPromise = client.connect().catch((err) => {
        clientPromise = null;
        throw err;
      });
    }
    return clientPromise;
  }
}

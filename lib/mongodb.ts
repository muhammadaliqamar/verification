import { MongoClient, MongoClientOptions } from "mongodb";
import dns from "dns";
import fs from "fs";
import path from "path";

// Fallback .env.local reader for local dev if process.env is not yet populated
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
      // Ignore
    }
  }
}

loadEnvLocal();

async function resolveMongoUriFallback(uri: string): Promise<string> {
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
    console.warn("[MongoDB SRV Fallback Failed]:", err);
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

export async function getMongoClient(): Promise<MongoClient> {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    console.error("[MongoDB Error]: MONGODB_URI environment variable is missing!");
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  // Helper to connect with fallback DNS for local Windows querySrv issues
  const connectWithFallback = async (uriToUse: string): Promise<MongoClient> => {
    try {
      const client = new MongoClient(uriToUse, options);
      return await client.connect();
    } catch (err: any) {
      if (err?.code === "ECONNREFUSED" || err?.message?.includes("querySrv")) {
        console.log("[MongoDB]: ECONNREFUSED detected, attempting DNS resolver fallback...");
        const fallbackUri = await resolveMongoUriFallback(uriToUse);
        const fallbackClient = new MongoClient(fallbackUri, options);
        return await fallbackClient.connect();
      }
      throw err;
    }
  };

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = connectWithFallback(rawUri).catch((err) => {
        global._mongoClientPromise = undefined;
        throw err;
      });
    }
    return global._mongoClientPromise;
  } else {
    if (!clientPromise) {
      clientPromise = connectWithFallback(rawUri).catch((err) => {
        clientPromise = null;
        throw err;
      });
    }
    return clientPromise;
  }
}

import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as path from "path";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if custom DNS fails
}

// Simple .env parser to avoid extra external dependencies
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

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const MONGODB_DB = process.env.MONGODB_DB || "devlogix_internships";
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION || "candidates";

const sampleRecords = [
  {
    token: "sample-valid-token-123",
    ref_number: "DEV-2026-INT-0941",
    name: "Jane Doe",
    date: "July 15, 2026",
    signatory_name: "Dr. Alex Vance",
    designation: "Director of Engineering",
    verify_url: "https://verify.devlogix.online/sample-valid-token-123",
    created_at: new Date(),
  },
  {
    token: "token-john-smith-456",
    ref_number: "DEV-2026-CERT-0112",
    name: "John Smith",
    date: "June 28, 2026",
    signatory_name: "Sarah Jenkins",
    designation: "VP of Operations",
    verify_url: "https://verify.devlogix.online/token-john-smith-456",
    created_at: new Date(),
  },
];

async function seed() {
  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const collection = db.collection(MONGODB_COLLECTION);

    console.log(`Seeding sample records into ${MONGODB_DB}.${MONGODB_COLLECTION}...`);

    for (const record of sampleRecords) {
      await collection.updateOne(
        { token: record.token },
        { $set: record },
        { upsert: true }
      );
      console.log(`✓ Seeded record for ${record.name} (Token: ${record.token})`);
    }

    console.log("\nSeed completed successfully!");
    console.log("Test local URLs:");
    console.log("  http://localhost:3000/sample-valid-token-123");
    console.log("  http://localhost:3000/token-john-smith-456");
    console.log("  http://localhost:3000/invalid-token-test");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await client.close();
  }
}

seed();

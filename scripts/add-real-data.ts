import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as path from "path";
import dns from "dns";
import crypto from "crypto";
import QRCode from "qrcode";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore
}

// Simple .env parser to handle .env.local reliably
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

async function insertRealRecord() {
  const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGODB_DB || "devlogix_verification";
  const collectionName = process.env.MONGODB_COLLECTION || "letters";

  console.log("Connecting to MongoDB Atlas...");
  const uri = await resolveMongoUri(rawUri);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Generate random token
    const token = crypto.randomBytes(16).toString("hex");

    const record = {
      token: token,
      name: "International Institute of Science, Art and Technology, Gujranwala",
      date: "13th July, 2026",
      ref_number: "DL-2026-230",
      signatory_name: "Muhammad Ali Qamar",
      designation: "Chief Executive Officer",
      document_type: "Letter of Intent",
      created_at: new Date(),
    };

    console.log(`Inserting record for ${record.name}...`);
    const result = await collection.insertOne(record);
    console.log(`\n✅ Record inserted successfully with ID: ${result.insertedId}`);

    const verifyUrl = `https://verify.devlogix.online/${token}`;
    const qrPath = path.resolve(process.cwd(), "test-qr.png");

    await QRCode.toFile(qrPath, verifyUrl, {
      color: { dark: "#000000", light: "#FFFFFF" },
      width: 400,
      margin: 2,
    });

    console.log(`\n======================================================`);
    console.log(`VERIFICATION TOKEN: ${token}`);
    console.log(`LIVE URL          : ${verifyUrl}`);
    console.log(`QR CODE SAVED TO  : ${qrPath}`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error("❌ Insertion failed:", error);
  } finally {
    await client.close();
  }
}

insertRealRecord();

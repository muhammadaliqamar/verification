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

async function seedElafAzizRecord() {
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

    const refNumber = "DL-HRM-OFL-26-0233";

    // Check if record exists
    const existing = await collection.findOne({ ref_number: refNumber });
    const token = existing?.token || crypto.randomBytes(16).toString("hex");

    const record = {
      token: token,
      name: "Elaf Aziz",
      date: "23rd July, 2026",
      ref_number: refNumber,
      signatory_name: "Muhammad Ali Qamar",
      designation: "Chief Executive Officer",
      document_type: "Job Offer Letter",
      annexures: [
        "Annexure I – Terms and Conditions",
        "Annexure II – Job Description"
      ],
      updated_at: new Date(),
    };

    console.log(`Upserting record for ${record.name} (${record.ref_number})...`);
    await collection.updateOne(
      { ref_number: refNumber },
      { $set: record, $setOnInsert: { created_at: new Date() } },
      { upsert: true }
    );
    console.log(`\n✅ Record updated successfully in DB with Annexures!`);

    const verifyUrl = `https://verify.devlogix.online/${token}`;

    // Output paths for QR code
    const qrPublicPath = path.resolve(process.cwd(), "public", "qr-elaf-aziz.png");
    const artifactDir = "C:\\Users\\Muhammad Ali Qamar\\.gemini\\antigravity-ide\\brain\\184970a5-a3be-41cd-a86f-b3b407b6e8e6";
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    const qrArtifactPath = path.resolve(artifactDir, "qr-elaf-aziz.png");

    // Generate QR Code files
    await QRCode.toFile(qrPublicPath, verifyUrl, {
      color: { dark: "#000000", light: "#FFFFFF" },
      width: 400,
      margin: 2,
    });

    await QRCode.toFile(qrArtifactPath, verifyUrl, {
      color: { dark: "#000000", light: "#FFFFFF" },
      width: 400,
      margin: 2,
    });

    // Also get terminal string QR code
    const terminalQr = await QRCode.toString(verifyUrl, { type: "terminal", small: true });

    console.log(`\n======================================================`);
    console.log(`VERIFICATION TOKEN: ${token}`);
    console.log(`VERIFICATION URL  : ${verifyUrl}`);
    console.log(`ANNEXURES         : ${record.annexures}`);
    console.log(`PUBLIC QR CODE    : ${qrPublicPath}`);
    console.log(`ARTIFACT QR CODE  : ${qrArtifactPath}`);
    console.log(`======================================================\n`);
    console.log("QR Code Terminal View:");
    console.log(terminalQr);

  } catch (error) {
    console.error("❌ Upsert failed:", error);
  } finally {
    await client.close();
  }
}

seedElafAzizRecord();

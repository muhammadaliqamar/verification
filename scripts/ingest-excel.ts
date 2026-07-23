import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as path from "path";
import dns from "dns";
import * as XLSX from "xlsx";
import crypto from "crypto";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore
}

// Load .env.local
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

// Normalize row keys to match MongoDB target schema
function normalizeRecord(row: Record<string, any>) {
  const findVal = (...keys: string[]) => {
    for (const k of keys) {
      for (const rowKey of Object.keys(row)) {
        if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, "")) {
          return row[rowKey];
        }
      }
    }
    return undefined;
  };

  const rawToken = findVal("token", "verificationtoken", "verifytoken", "id");
  const token = rawToken ? String(rawToken).trim() : crypto.randomBytes(16).toString("hex");

  const name = String(findVal("name", "issuedto", "candidate", "candidatename", "recipient") || "").trim();
  const ref_number = String(findVal("refnumber", "refno", "referencenumber", "referenceno", "ref") || "").trim();
  const date = String(findVal("date", "issuancedate", "issuedate", "dateofissuance") || "").trim();
  const signatory_name = String(findVal("signatoryname", "signingauthority", "signatory", "authority") || "").trim();
  const designation = String(findVal("designation", "title", "signatorydesignation", "role") || "").trim();
  const document_type = String(
    findVal("documenttype", "doctype", "type", "lettertype", "certificatetype", "document") || "Experience Letter"
  ).trim();
  const rawAnnexures = findVal("annexures", "annexure", "annexuresattached", "attachments");
  const annexures = rawAnnexures ? String(rawAnnexures).trim() : undefined;

  return {
    token,
    ref_number,
    name,
    date,
    signatory_name,
    designation,
    document_type,
    ...(annexures ? { annexures } : {}),
    verify_url: `https://verify.devlogix.online/${token}`,
    created_at: new Date(),
  };
}

async function ingestExcel(filePath: string) {
  if (!filePath || !fs.existsSync(filePath)) {
    console.error("Please provide a valid Excel file path.");
    console.log("Usage: npx tsx scripts/ingest-excel.ts <path-to-excel-file.xlsx>");
    process.exit(1);
  }

  console.log(`Reading Excel file: ${filePath}...`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`Parsed ${rawRows.length} rows from Excel sheet '${sheetName}'.`);

  if (rawRows.length === 0) {
    console.log("No data rows found in Excel file.");
    process.exit(0);
  }

  const records = rawRows.map(normalizeRecord);

  console.log("\nSample parsed record preview:");
  console.log(records[0]);

  const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGODB_DB || "devlogix_verification";
  const collectionName = process.env.MONGODB_COLLECTION || "letters";

  console.log(`\nConnecting to MongoDB Atlas...`);
  const uri = await resolveMongoUri(rawUri);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    console.log(`Ingesting ${records.length} records into ${dbName}.${collectionName}...`);

    let insertedCount = 0;
    for (const doc of records) {
      await collection.updateOne(
        { token: doc.token },
        { $set: doc },
        { upsert: true }
      );
      insertedCount++;
    }

    console.log(`\n Successfully ingested ${insertedCount} candidate records into MongoDB!`);
  } catch (error) {
    console.error("Ingestion failed:", error);
  } finally {
    await client.close();
  }
}

const targetFile = process.argv[2];
if (targetFile) {
  ingestExcel(targetFile);
} else {
  console.log("Ingestion script ready!");
  console.log("Usage: npx tsx scripts/ingest-excel.ts <path-to-excel-file.xlsx>");
}

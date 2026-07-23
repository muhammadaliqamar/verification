import { getMongoClient } from "./mongodb";
import dns from "dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore
}

export interface VerifiedCandidate {
  signatory_name: string;
  designation: string;
  name: string;
  date: string;
  ref_number: string;
  document_type: string;
  annexures?: string | string[];
}

/**
 * Reads token from parameters and queries MongoDB directly.
 * 
 * Rules:
 * - Read-only lookup.
 * - Extracts ONLY public fields: signatory_name, designation, name, date, ref_number, document_type, annexures.
 * - NEVER leaks internal fields (_id, token, bcrypt hashes, verify_url, created_at).
 * - Catches any DB error, missing token, or connection timeout and returns `null`
 *   to ensure a uniform generic unverified response for end users.
 */
export async function getVerifiedDocument(
  rawToken: string
): Promise<VerifiedCandidate | null> {
  if (!rawToken || typeof rawToken !== "string") {
    return null;
  }

  const sanitizedToken = rawToken.trim();
  if (sanitizedToken.length === 0 || sanitizedToken.length > 256) {
    return null;
  }

  try {
    const client = await getMongoClient();
    const dbName = process.env.MONGODB_DB || "devlogix_verification";
    const collectionName = process.env.MONGODB_COLLECTION || "letters";

    console.log(`[Verification Query] DB: ${dbName} | Collection: ${collectionName} | Token: ${sanitizedToken}`);

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Query read-only by token
    const doc = await collection.findOne(
      { token: sanitizedToken },
      {
        projection: {
          _id: 0,
          signatory_name: 1,
          designation: 1,
          name: 1,
          date: 1,
          ref_number: 1,
          document_type: 1,
          annexures: 1,
          annexure: 1,
        },
      }
    );

    if (!doc) {
      return null;
    }

    let annexures: string | string[] | undefined = undefined;
    const rawAnnexures = doc.annexures || doc.annexure;

    if (Array.isArray(rawAnnexures)) {
      annexures = rawAnnexures.map((item: any) => String(item).trim()).filter(Boolean);
    } else if (typeof rawAnnexures === "string" && rawAnnexures.trim().length > 0) {
      annexures = rawAnnexures.trim();
    }

    // Explicit field extraction with fallback defaults for missing attributes
    return {
      signatory_name: String(doc.signatory_name || doc.signatoryName || "N/A"),
      designation: String(doc.designation || "N/A"),
      name: String(doc.name || doc.issuedTo || "N/A"),
      date: String(doc.date || doc.issuanceDate || "N/A"),
      ref_number: String(doc.ref_number || doc.refNumber || doc.reference_number || "N/A"),
      document_type: String(doc.document_type || doc.documentType || doc.doc_type || doc.letter_type || "Official Letter"),
      annexures,
    };
  } catch (error) {
    // Log actual DB or connection error on server side for debugging
    console.error("[Verification Server Error]:", error);
    // Return null to trigger uniform generic unverified response
    return null;
  }
}

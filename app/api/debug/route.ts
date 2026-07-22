import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env_mongodb_uri_set: !!process.env.MONGODB_URI,
    env_mongodb_uri_prefix: process.env.MONGODB_URI?.substring(0, 20) + "...",
    env_mongodb_db: process.env.MONGODB_DB || "(not set, using default)",
    env_mongodb_collection: process.env.MONGODB_COLLECTION || "(not set, using default)",
  };

  try {
    const client = await getMongoClient();
    diagnostics.connection = "SUCCESS";

    const dbName = process.env.MONGODB_DB || "devlogix_verification";
    const collectionName = process.env.MONGODB_COLLECTION || "letters";
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const count = await collection.countDocuments();
    diagnostics.document_count = count;

    // Try to find our test record
    const testDoc = await collection.findOne(
      { token: "29c1e0b61bd5d4b0be97aeb170703adc" },
      { projection: { _id: 0, token: 1, name: 1, ref_number: 1 } }
    );
    diagnostics.test_token_found = !!testDoc;
    diagnostics.test_token_data = testDoc;

    // List all tokens in the collection
    const allDocs = await collection
      .find({}, { projection: { _id: 0, token: 1, name: 1 } })
      .limit(10)
      .toArray();
    diagnostics.all_documents = allDocs;
  } catch (error: any) {
    diagnostics.connection = "FAILED";
    diagnostics.error_message = error?.message;
    diagnostics.error_code = error?.code;
  }

  return NextResponse.json(diagnostics, { status: 200 });
}

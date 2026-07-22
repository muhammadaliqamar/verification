import { getVerifiedDocument } from "@/lib/verification";
import VerificationCard from "@/components/VerificationCard";
import UnverifiedCard from "@/components/UnverifiedCard";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ token: string }>;
}

// Dynamic metadata generation based on token status
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const candidate = await getVerifiedDocument(token);

  if (candidate) {
    return {
      title: `Verified: ${candidate.name} (${candidate.ref_number}) | Devlogix Verification`,
      description: `Official document authentication for ${candidate.name}, issued by ${candidate.signatory_name}. Verified via devlogix.online.`,
    };
  }

  return {
    title: "Document Not Verified | Devlogix Verification Portal",
    description: "The requested token could not be authenticated against official Devlogix records.",
  };
}

export default async function TokenVerificationPage({ params }: PageProps) {
  const { token } = await params;

  // Server Component queries MongoDB directly server-side
  const candidate = await getVerifiedDocument(token);

  // If candidate is found, show verified card with 5 explicit fields
  if (candidate) {
    return <VerificationCard candidate={candidate} />;
  }

  // If candidate is null (wrong token, missing token, DB connection failure, or error),
  // return single uniform generic unverified state
  return <UnverifiedCard />;
}

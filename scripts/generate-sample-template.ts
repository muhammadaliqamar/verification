import * as XLSX from "xlsx";
import * as path from "path";

const sampleData = [
  {
    "Reference Number": "DL-HRM-OFL-26-0233",
    "Issued To": "Elaf Aziz",
    "Issuance Date": "23rd July, 2026",
    "Signing Authority": "Muhammad Ali Qamar",
    "Designation": "Chief Executive Officer",
    "Document Type": "Job Offer Letter",
    "Annexures": "Annexure I – Terms and Conditions\nAnnexure II – Job Description",
  },
  {
    "Reference Number": "DL-HRM-OFL-26-0234",
    "Issued To": "Sara Ahmed",
    "Issuance Date": "24th July, 2026",
    "Signing Authority": "Muhammad Ali Qamar",
    "Designation": "Chief Executive Officer",
    "Document Type": "Job Offer Letter",
    "Annexures": "Annexure I – Terms and Conditions\nAnnexure II – Salary Breakup",
  },
  {
    "Reference Number": "DL-HRM-EXP-26-0105",
    "Issued To": "Usman Malik",
    "Issuance Date": "15th June, 2026",
    "Signing Authority": "Muhammad Ali Qamar",
    "Designation": "Chief Executive Officer",
    "Document Type": "Experience Letter",
    "Annexures": "",
  },
];

const sheet = XLSX.utils.json_to_sheet(sampleData);

// Set column widths for readability
sheet["!cols"] = [
  { wch: 22 }, // Reference Number
  { wch: 20 }, // Issued To
  { wch: 18 }, // Issuance Date
  { wch: 22 }, // Signing Authority
  { wch: 25 }, // Designation
  { wch: 20 }, // Document Type
  { wch: 45 }, // Annexures
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, sheet, "Verification Template");

const outputPath = path.resolve(process.cwd(), "sample_verification_template.xlsx");
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Sample Excel template generated at: ${outputPath}`);

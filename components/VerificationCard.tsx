"use client";

import React, { useState } from "react";
import { VerifiedCandidate } from "@/lib/verification";
import {
  ShieldCheck,
  Award,
  UserCheck,
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Share2,
} from "lucide-react";

interface Props {
  candidate: VerifiedCandidate;
}

export default function VerificationCard({ candidate }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="verification-card-wrapper animate-fade-in">
      {/* Top Status Header */}
      <div className="status-banner status-verified">
        <div className="status-badge">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 animate-pulse-subtle" />
          <div>
            <span className="status-title text-emerald-700">✅ VERIFIED & AUTHENTIC</span>
            <p className="status-subtitle">Official Record Confirmed by Devlogix</p>
          </div>
        </div>
        <div className="status-pill">Official Document</div>
      </div>

      {/* Main Certificate Card Content */}
      <div className="card-body">
        {/* Security Crest & Header */}
        <div className="card-header">
          <div className="seal-icon-wrapper">
            <ShieldCheck className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h2 className="card-title">Certificate & Letter Verification</h2>
            <p className="card-subtitle">
              Authenticity verified against Devlogix Records Database
            </p>
          </div>
        </div>

        <div className="divider" />

        {/* 5 Required Fields Grid */}
        <div className="fields-grid">
          {/* 1. Issued To */}
          <div className="field-box field-highlight">
            <div className="field-header">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <span className="field-label">Issued To</span>
            </div>
            <div className="field-value text-xl font-bold text-slate-900">
              {candidate.name}
            </div>
          </div>

          {/* 2. Reference Number */}
          <div className="field-box">
            <div className="field-header">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span className="field-label">Reference Number</span>
            </div>
            <div className="field-value font-mono bg-slate-100 px-2.5 py-1 rounded inline-block text-slate-800 text-sm font-semibold border border-slate-200">
              {candidate.ref_number}
            </div>
          </div>

          {/* 3. Signing Authority Name */}
          <div className="field-box">
            <div className="field-header">
              <Award className="w-5 h-5 text-emerald-600" />
              <span className="field-label">Signing Authority Name</span>
            </div>
            <div className="field-value text-slate-800 font-semibold">
              {candidate.signatory_name}
            </div>
          </div>

          {/* 4. Designation */}
          <div className="field-box">
            <div className="field-header">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span className="field-label">Designation</span>
            </div>
            <div className="field-value text-slate-700">
              {candidate.designation}
            </div>
          </div>

          {/* 5. Issuance Date */}
          <div className="field-box col-span-full md:col-span-1">
            <div className="field-header">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span className="field-label">Issuance Date</span>
            </div>
            <div className="field-value text-slate-800 font-medium">
              {candidate.date}
            </div>
          </div>
        </div>

        {/* Security Watermark / Trust Notice */}
        <div className="security-notice">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tamper-Proof Cryptographic Verification
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This verification record was retrieved directly from the Devlogix secured database. 
            No third-party modification or altering of this document is possible.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="card-actions no-print">
          <button
            onClick={handleCopyLink}
            className="action-btn action-btn-secondary"
            title="Copy verification URL"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="action-btn action-btn-secondary"
            title="Print or save PDF verification summary"
          >
            <Printer className="w-4 h-4" />
            <span>Print Verification</span>
          </button>
        </div>
      </div>
    </div>
  );
}

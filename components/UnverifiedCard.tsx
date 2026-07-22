"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UnverifiedCard() {
  return (
    <div className="verification-card-wrapper animate-fade-in">
      {/* Top Status Header - Unverified Alert */}
      <div className="status-banner status-unverified">
        <div className="status-badge">
          <ShieldAlert className="w-7 h-7 text-red-600" />
          <div>
            <span className="status-title text-red-700">❌ NOT VERIFIED</span>
            <p className="status-subtitle">Validation Failed</p>
          </div>
        </div>
        <div className="status-pill status-pill-red">Invalid Record</div>
      </div>

      {/* Main Content */}
      <div className="card-body">
        <div className="unverified-hero">
          <div className="unverified-icon-bg">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          
          <h2 className="unverified-main-heading">
            Not Verified — this letter could not be authenticated
          </h2>

          <p className="unverified-description">
            The verification token provided does not match any official, issued record in the DevLogix Database.
          </p>
        </div>

        <div className="unverified-info-box">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            Why might this happen?
          </h3>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>The token in the URL or scanned QR code is incorrect or corrupted.</li>
            <li>The document has expired, been revoked, or was not officially issued by DevLogix.</li>
            <li>The URL has been manually altered or truncated.</li>
          </ul>
        </div>

        {/* Action button */}
        <div className="card-actions no-print justify-center pt-2">
          <Link href="/" className="action-btn action-btn-primary">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Verification Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

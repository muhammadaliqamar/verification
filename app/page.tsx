"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, QrCode, Lock, ArrowRight, CheckCircle } from "lucide-react";

export default function HomePage() {
  const [tokenInput, setTokenInput] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (cleanToken) {
      router.push(`/${encodeURIComponent(cleanToken)}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Official Public Authentication Engine</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Verify Document Authenticity
        </h1>

        <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Scan the QR code printed on your Devlogix letter or certificate, or enter your document verification token below.
        </p>
      </div>

      {/* Manual Token Lookup Box */}
      <div className="verification-card-wrapper p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <label htmlFor="token-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Enter Verification Token
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="token-input"
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. 7f8a9b0c1d2e3f4a..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="action-btn action-btn-primary py-3 px-6 justify-center text-sm font-semibold rounded-xl flex items-center gap-2 shrink-0"
            >
              <span>Verify Document</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Tokens are 64-character unguessable cryptographic keys embedded in official QR links.
          </p>
        </form>
      </div>

      {/* How it Works Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">1. Scan QR Code</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Scan the QR code printed on the official document using any mobile camera app.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">2. Secure Verification</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our server validates the token against encrypted database records in real time.
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">3. Instant Status</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            View the verified recipient, reference number, issuance date, and signing authority.
          </p>
        </div>
      </div>
    </div>
  );
}

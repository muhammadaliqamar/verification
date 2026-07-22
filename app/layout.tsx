import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ShieldCheck, Lock, ExternalLink } from "lucide-react";
import Link from "next/link";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Official Verification Portal | Devlogix",
  description:
    "Verify the authenticity of official letters and certificates issued by Devlogix Online.",
  keywords: ["Devlogix", "Verification", "Certificate", "Letter Authentication", "verify.devlogix.online"],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="app-container">
          {/* Official Sticky Top Navigation Header */}
          <header className="portal-header no-print">
            <div className="header-container">
              <Link href="/" className="brand-logo">
                <div className="brand-badge">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>DEVLOGIX</span>
                </div>
                <span className="brand-name hidden sm:inline-block">
                  Verification Portal
                </span>
              </Link>

              <div className="header-security-badge">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-Bit SSL Encrypted Verification</span>
              </div>
            </div>
          </header>

          {/* Main Body Content */}
          <main className="main-content">{children}</main>

          {/* Official Footer with Brand Trust Note */}
          <footer className="portal-footer no-print">
            <div className="footer-content">
              <div className="footer-brand">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Devlogix Official Authentication System</span>
              </div>
              <p className="footer-note">
                Verified via <span className="footer-domain-badge">verify.devlogix.online</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                &copy; {new Date().getFullYear()} Devlogix. All rights reserved. Read-only verification engine.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

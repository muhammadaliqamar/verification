import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Official Verification Portal | DevLogix",
  description:
    "Verify the authenticity of official letters and certificates issued by DevLogix Online.",
  keywords: ["DevLogix", "Verification", "Certificate", "Letter Authentication", "verify.devlogix.online"],
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
                <Image
                  src="/devlogix-logo.svg"
                  alt="DevLogix Logo"
                  width={140}
                  height={32}
                  priority
                  className="header-logo-img"
                />
              </Link>

              <div className="header-security-badge">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Secure Verification</span>
              </div>
            </div>
          </header>

          {/* Main Body Content */}
          <main className="main-content">{children}</main>

          {/* Official Footer with Brand Trust Note */}
          <footer className="portal-footer no-print">
            <div className="footer-content">
              <Image
                src="/devlogix-logo.svg"
                alt="DevLogix Logo"
                width={120}
                height={28}
                className="footer-logo-img"
              />
              <p className="footer-note">
                Verified via <span className="footer-domain-badge">verify.devlogix.online</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                &copy; {new Date().getFullYear()} DevLogix. All rights reserved. Read-only verification engine.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

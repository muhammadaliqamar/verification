"use client";

import React, { useState, useRef } from "react";
import { QrCode, Camera, ImageIcon, X, Loader2, ShieldCheck, ScanLine } from "lucide-react";
import Image from "next/image";
import jsQR from "jsqr";

export default function HomePage() {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const extractTokenFromUrl = (url: string): string | null => {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.replace(/^\//, "").replace(/\/$/, "");
      if (path && path.length > 0) {
        return path;
      }
      return null;
    } catch {
      // If it's not a valid URL, treat the whole string as a token
      const trimmed = url.trim();
      if (trimmed.length > 0 && !trimmed.includes(" ")) {
        return trimmed;
      }
      return null;
    }
  };

  const handleQRResult = (data: string) => {
    const token = extractTokenFromUrl(data);
    if (token) {
      window.location.href = `/${token}`;
    } else {
      setError("Invalid QR code. Please scan a DevLogix verification QR code.");
    }
  };

  const processImage = (file: File) => {
    setProcessing(true);
    setError(null);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Could not process image.");
        setProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRResult(code.data);
      } else {
        setError("No QR code found in the image. Please try another image.");
        setProcessing(false);
      }
    };

    img.onerror = () => {
      setError("Could not load image. Please try a different file.");
      setProcessing(false);
    };

    img.src = URL.createObjectURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setError(null);
    setScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        scanFrame();
      }
    } catch {
      setError("Camera access denied. Please allow camera permission or upload from gallery instead.");
      setScanning(false);
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      stopCamera();
      handleQRResult(code.data);
      return;
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  };

  return (
    <div className="home-hero">
      <div className="hero-inner">
        {/* Top Branding */}
        <div className="hero-top-brand">
          <Image
            src="/devlogix-logo.svg"
            alt="DevLogix Logo"
            width={180}
            height={42}
            priority
            className="hero-logo-img"
          />
        </div>

        <div className="hero-badge">
          <ShieldCheck className="w-4 h-4" />
          <span>Official Verification Portal</span>
        </div>

        <h1 className="hero-title">
          Scan to <span className="hero-title-accent">Verify</span>
        </h1>

        <p className="hero-subtitle">
          Scan the QR code on your DevLogix issued letter or certificate
          to instantly verify its authenticity.
        </p>

        {/* Camera Viewfinder */}
        {scanning && (
          <div className="camera-viewfinder">
            <div className="viewfinder-close">
              <button onClick={stopCamera} className="close-camera-btn" aria-label="Close camera">
                <X className="w-5 h-5" />
              </button>
            </div>
            <video ref={videoRef} className="camera-video" muted playsInline />
            <canvas ref={canvasRef} className="camera-canvas" />
            <div className="viewfinder-overlay">
              <div className="viewfinder-border">
                <ScanLine className="scan-line-icon" />
              </div>
              <p className="viewfinder-hint">Align QR code within the frame</p>
            </div>
          </div>
        )}

        {/* Scan Actions */}
        {!scanning && (
          <div className="scan-actions">
            <button
              onClick={startCamera}
              className="scan-btn scan-btn-primary"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Scan QR Code</span>
                </>
              )}
            </button>

            <div className="scan-divider">
              <span className="divider-line" />
              <span className="divider-text">or</span>
              <span className="divider-line" />
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="scan-btn scan-btn-secondary"
              disabled={processing}
            >
              <ImageIcon className="w-5 h-5" />
              <span>Upload from Gallery</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden-input"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden-input"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="scan-error">
            <p>{error}</p>
          </div>
        )}

        {/* Trust Features */}
        <div className="trust-features">
          <div className="trust-item">
            <QrCode className="w-5 h-5 text-sky-500" />
            <span>QR Secured</span>
          </div>
          <div className="trust-item">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Tamper-Proof</span>
          </div>
        </div>
      </div>
    </div>
  );
}

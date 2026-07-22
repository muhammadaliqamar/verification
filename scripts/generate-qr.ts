import QRCode from 'qrcode';
import fs from 'fs';

const TOKEN = "DL-INTENT-2026-TEST";
const URL = `https://verify.devlogix.online/${TOKEN}`;
const outputPath = "d:\\project\\verification\\test-qr.png";

async function generateQR() {
  try {
    await QRCode.toFile(outputPath, URL, {
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 400,
      margin: 2
    });
    console.log(`✅ QR Code generated successfully at ${outputPath}`);
    console.log(`This QR code points to: ${URL}`);
  } catch (err) {
    console.error('Error generating QR code:', err);
  }
}

generateQR();

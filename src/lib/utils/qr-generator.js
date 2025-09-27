// QR code generation utility - use .js extension to avoid TypeScript compilation issues

export async function generateQRCode(text, options = {}) {
  try {
    // Use dynamic import to avoid Jest worker issues
    const QRCode = await import('qrcode');

    const defaultOptions = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 256,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    const qrOptions = { ...defaultOptions, ...options };

    return await QRCode.default.toDataURL(text, qrOptions);
  } catch (error) {
    console.error('QR generation failed:', error);
    throw new Error('Failed to generate QR code: ' + error.message);
  }
}
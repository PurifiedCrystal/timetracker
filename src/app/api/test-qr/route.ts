import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if basic API works without QR library
    return NextResponse.json({
      message: 'API endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Try importing QRCode library
    const QRCode = await import('qrcode');

    // Generate a simple QR code
    const qrCodeDataURL = await QRCode.default.toDataURL('https://example.com', {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 256
    });

    return NextResponse.json({
      success: true,
      qr_code_data: qrCodeDataURL,
      message: 'QR code generated successfully'
    });
  } catch (error: any) {
    console.error('QR test error:', error);
    return NextResponse.json({
      error: 'QR generation failed',
      details: error.message
    }, { status: 500 });
  }
}
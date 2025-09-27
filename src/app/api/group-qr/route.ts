import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get group ID from query parameters
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({
        error: 'Missing groupId parameter',
        code: 'MISSING_GROUP_ID'
      }, { status: 400 });
    }

    // Parse request body for options
    let requestBody: any = {};
    try {
      const body = await request.text();
      if (body.trim()) {
        requestBody = JSON.parse(body);
      }
    } catch (parseError) {
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    // Generate unique invitation code
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let invitationCode = '';
    for (let i = 0; i < 12; i++) {
      invitationCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Calculate expiration time
    const expiresInHours = requestBody.expires_in_hours || 24;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Create invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const invitationUrl = `${baseUrl}/invite/${invitationCode}`;

    // Generate QR code
    const QRCode = await import('qrcode');
    const qrCodeDataURL = await QRCode.default.toDataURL(invitationUrl, {
      errorCorrectionLevel: requestBody.error_correction_level || 'M',
      type: 'image/png',
      width: 256
    });

    const response = {
      id: 'qr-' + Date.now(),
      group_id: groupId,
      invitation_code: invitationCode,
      qr_code_data: qrCodeDataURL,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      invitation_url: invitationUrl
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('QR generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate QR code',
      code: 'QR_GENERATION_ERROR',
      details: { reason: error.message }
    }, { status: 500 });
  }
}
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import admin, { ensureFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

// Ensure this route always runs on the Node.js runtime since it depends on
// firebase-admin and other Node-only APIs.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UploadReceiptResponse =
  | { success: true; downloadUrl: string; path: string }
  | { success: false; error: string };

export async function POST(request: NextRequest) {
  console.log('[upload-receipt] POST request received');
  try {
    ensureFirebaseAdminInitialized();
  } catch (error: any) {
    console.error('Firebase Admin not initialized for receipt upload (app route):', error);
    return NextResponse.json<UploadReceiptResponse>(
      {
        success: false,
        error: 'Server configuration error. Please contact support.',
      },
      { status: 500 },
    );
  }

  try {
    const body = await request.json().catch(() => ({} as any));
    const {
      base64,
      fileName,
      contentType,
      userId,
      source = 'mobile-app',
    } = body || {};

    if (!base64 || typeof base64 !== 'string') {
      return NextResponse.json<UploadReceiptResponse>(
        {
          success: false,
          error: 'Missing receipt data',
        },
        { status: 400 },
      );
    }

    const safeFileName =
      typeof fileName === 'string' && fileName.trim().length > 0
        ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
        : `points_receipt_${Date.now()}.jpg`;

    // Store receipts in receipts_images folder
    // Handle both old paths (images/) and new paths (receipts_images/)
    let storagePath: string;
    if (safeFileName.startsWith('receipts_images/')) {
      storagePath = safeFileName;
    } else if (safeFileName.startsWith('images/')) {
      // Convert old images/ path to receipts_images/
      storagePath = safeFileName.replace(/^images\//, 'receipts_images/');
    } else {
      // New uploads go to receipts_images/
      storagePath = `receipts_images/${safeFileName}`;
    }

    const DEFAULT_BUCKET =
      process.env.FIREBASE_STORAGE_BUCKET || 'foodbooking-3ccec.firebasestorage.app';

    const bucket = admin.storage().bucket(DEFAULT_BUCKET);
    const file = bucket.file(storagePath);

    const buffer = Buffer.from(base64, 'base64');
    const downloadToken = crypto.randomUUID();

    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType: typeof contentType === 'string' ? contentType : 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          uploadedBy: userId || 'unknown',
          uploadSource: source,
        },
      },
    });

    const encodedPath = encodeURIComponent(storagePath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

    return NextResponse.json<UploadReceiptResponse>(
      {
        success: true,
        downloadUrl,
        path: storagePath,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('Failed to upload receipt via app route:', error);
    return NextResponse.json<UploadReceiptResponse>(
      {
        success: false,
        error: error?.message || 'Failed to upload receipt',
      },
      { status: 500 },
    );
  }
}

// Explicitly handle unsupported methods so that clients receive a clear 405
// instead of a generic HTML error page. This also helps avoid the mobile app
// seeing a non-JSON 405 response.
export async function GET() {
  return NextResponse.json<UploadReceiptResponse>(
    { success: false, error: 'Method not allowed' },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    },
  );
}

export async function OPTIONS() {
  // Allow CORS preflight or other OPTIONS checks with a 204 response.
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}



import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Mobile app connectivity test successful',
    timestamp: new Date().toISOString(),
    server: 'Next.js API',
    version: '1.0.0'
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    message: 'Mobile app POST test successful',
    receivedData: body,
    timestamp: new Date().toISOString(),
    server: 'Next.js API',
    version: '1.0.0'
  });
} 
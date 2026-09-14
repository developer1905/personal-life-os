import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Personal Life OS - Telegram Mini App',
    version: '2.0.0',
    message: 'Ping successful. Service is awake and active!',
  });
}

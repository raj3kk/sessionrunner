import { NextRequest, NextResponse } from 'next/server';
import { decodeSessionCode, mintToken } from '@/lib/surfCrypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '');
    if (!code.trim()) {
      return NextResponse.json({ error: 'Session code khaali hai.' }, { status: 400 });
    }
    const sess = decodeSessionCode(code);
    // session JSON ko as-is token me band karo (cookies server pe store nahi hote)
    const sessionJson = JSON.stringify({
      domain: sess.domain, cookies: sess.cookies, ts: Date.now(),
    });
    const token = mintToken(sessionJson);
    return NextResponse.json({ token, domain: sess.domain, cookieCount: sess.cookies.length });
  } catch (e: any) {
    const msg = e?.message || 'Session code samajh nahi aaya.';
    const status = msg.includes('SESSION_PROXY_SECRET') ? 500 : 400;
    return NextResponse.json({ error: status === 500 ? 'Server setup adhura hai (secret missing).' : msg }, { status });
  }
}

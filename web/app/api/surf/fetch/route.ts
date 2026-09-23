import { NextRequest, NextResponse } from 'next/server';
import { readToken } from '@/lib/surfCrypto';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function err(msg: string, status: number) {
  return new NextResponse(`<body style="font-family:sans-serif;padding:40px"><h3>⚠️ ${msg}</h3></body>`, {
    status, headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/** HTML me href/src/action ko proxy ke through rewrite karo taaki navigation proxy me hi rahe */
function rewriteHtml(html: string, base: URL, token: string): string {
  const px = (abs: string) => `/api/surf/fetch?t=${encodeURIComponent(token)}&u=${encodeURIComponent(abs)}`;
  return html.replace(/\s(href|src|action)=(["'])([^"'#]+)\2/gi, (m, attr, q, val) => {
    const v = val.trim();
    if (!v || v.startsWith('data:') || v.startsWith('javascript:') || v.startsWith('mailto:') || v.startsWith('#')) return m;
    try {
      const abs = new URL(v, base);
      if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return m;
      return ` ${attr}=${q}${px(abs.toString())}${q}`;
    } catch {
      return m;
    }
  });
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const sp = new URL(req.url).searchParams;
  const t = sp.get('t');
  const u = sp.get('u');
  if (!t || !u) return err('Link adhura hai (token ya URL missing).', 400);

  let sess: { domain: string; cookies: { n: string; val: string }[] };
  try {
    sess = JSON.parse(readToken(t));
  } catch (e: any) {
    return err(e?.message || 'Token invalid.', 401);
  }

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return err('URL samajh nahi aayi.', 400);
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') return err('Sirf http/https sites.', 400);

  // Domain guard: session jis domain ka hai, proxy sirf wahi (aur uske subdomains) kholega
  const sdom = sess.domain.toLowerCase().replace(/^\.+/, '');
  const host = target.hostname.toLowerCase();
  if (!(host === sdom || host.endsWith('.' + sdom))) {
    return err(`Ye session ${sess.domain} ka hai — ${host} kholne ki permission nahi.`, 403);
  }

  const headers = new Headers();
  const cookieHeader = sess.cookies
    .filter(c => c.n && typeof c.val === 'string')
    .map(c => `${c.n}=${c.val}`)
    .join('; ');
  if (cookieHeader) headers.set('Cookie', cookieHeader);
  headers.set('User-Agent', UA);
  headers.set('Accept', req.headers.get('accept') || 'text/html,*/*');
  const lang = req.headers.get('accept-language');
  if (lang) headers.set('Accept-Language', lang);

  const init: RequestInit = { method: req.method, headers, redirect: 'manual' };
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const ct = req.headers.get('content-type');
    if (ct) headers.set('Content-Type', ct);
    init.body = await req.arrayBuffer();
  }

  let res: Response;
  try {
    res = await fetch(target.toString(), init);
  } catch (e: any) {
    return err(`Site tak pahunch nahi paye: ${target.hostname}`, 502);
  }

  // Redirect ko proxy ke andar rakho
  const loc = res.headers.get('location');
  if (loc && res.status >= 300 && res.status < 400) {
    try {
      const abs = new URL(loc, target).toString();
      const px = `/api/surf/fetch?t=${encodeURIComponent(t)}&u=${encodeURIComponent(abs)}`;
      return NextResponse.redirect(new URL(px, req.url), res.status);
    } catch { /* girne do neeche */ }
  }

  const out = new Headers();
  const ct = res.headers.get('content-type') || 'application/octet-stream';
  out.set('Content-Type', ct);
  // iframe me khulne ke liye framing guards hatao (ye user ka apna session view hai)
  // X-Frame-Options / Content-Security-Policy copy nahi karte

  if (ct.includes('text/html')) {
    let html = await res.text();
    try { html = rewriteHtml(html, target, t); } catch { /* as-is */ }
    return new NextResponse(html, { status: res.status === 200 ? 200 : res.status, headers: out });
  }
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, { status: res.status, headers: out });
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
export async function PUT(req: NextRequest) { return handle(req); }
export async function PATCH(req: NextRequest) { return handle(req); }

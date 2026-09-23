// Website page <-> extension content-script bridge (window.postMessage).
let reqSeq = 0;
const pending = new Map<string, { res: (v: any) => void; rej: (e: any) => void }>();

if (typeof window !== 'undefined') {
  window.addEventListener('message', (e: MessageEvent) => {
    const d: any = e.data;
    if (!d || d.source !== 'sr-ext' || !d.reqId) return;
    const p = pending.get(d.reqId);
    if (!p) return;
    pending.delete(d.reqId);
    if (d.ok) p.res(d.result);
    else p.rej(new Error(d.error || 'extension error'));
  });
}

export function extCall(type: string, payload: any = {}, timeoutMs = 12000): Promise<any> {
  return new Promise((resolve, reject) => {
    const reqId = 'r' + ++reqSeq + '_' + Date.now();
    pending.set(reqId, { res: resolve, rej: reject });
    window.postMessage({ source: 'sr-page', type, payload, reqId }, '*');
    setTimeout(() => {
      if (pending.has(reqId)) {
        pending.delete(reqId);
        reject(new Error('Extension se jawab nahi aaya (timeout)'));
      }
    }, timeoutMs);
  });
}

export async function extAvailable(): Promise<boolean> {
  try {
    await extCall('SR_PING', {}, 2500);
    return true;
  } catch {
    return false;
  }
}

export const fmtT = (ts: number) =>
  new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

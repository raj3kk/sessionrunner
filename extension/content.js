// SessionRunner — website dashboard aur extension ke beech ka bridge.
// Page window.postMessage bhejti hai -> content script background ko forward karta hai -> jawab wapas.
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  const m = event.data;
  if (!m || m.source !== 'sr-page' || !m.reqId) return;
  try {
    const r = await chrome.runtime.sendMessage({ type: m.type, payload: m.payload || {} });
    window.postMessage(
      { source: 'sr-ext', reqId: m.reqId, ok: !!(r && r.ok), result: r && r.result, error: r && r.error },
      '*'
    );
  } catch (e) {
    window.postMessage(
      { source: 'sr-ext', reqId: m.reqId, ok: false, error: String((e && e.message) || e) },
      '*'
    );
  }
});

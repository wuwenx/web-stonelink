/**
 * 市场 24hr Ticker Web Worker
 * 在独立线程中解析并转换 wholeRealTime WS 消息，避免阻塞主线程
 */

function normalizeSymbol(s) {
  if (!s || typeof s !== 'string') return s;
  return s.replace(/_/g, '-');
}

function wsRowToTicker(msg) {
  const d = msg.data || {};
  const s = normalizeSymbol(d.s);
  return {
    t: msg.sendTime ?? d.E ?? Date.now(),
    a: d.a ?? null,
    b: d.b ?? null,
    s: s || d.s,
    c: d.c ?? '',
    o: d.o ?? '',
    h: d.h ?? '',
    l: d.l ?? '',
    v: d.v ?? '0',
    qv: d.qv ?? '0',
    pc: d.p ?? '0',
    pcp: d.P ?? '0',
    op: d.op ?? '',
  };
}

self.onmessage = function(event) {
  const { type, raw } = event.data;

  if (type !== 'message' || !raw) return;

  try {
    const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const isWholeRealTime =
      (msg.topic === 'wholeRealTime' || msg.event === 'wholeRealTime') &&
      msg.data;

    if (isWholeRealTime) {
      const row = wsRowToTicker(msg);
      self.postMessage({ event: 'wholeRealTime', row });
    }
  } catch (e) {
    // 解析失败则忽略
  }
};

// Worker 就绪
self.postMessage({ type: 'ready' });

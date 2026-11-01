/** Bound application buffering even when Content-Length is absent or inaccurate. */
export const PUBLIC_MCP_BODY_BYTES = 4096;
export const PUBLIC_MCP_BODY_TIMEOUT_MS = 5000;

type BodyResult = { ok: true; text: string } | { ok: false; status: number; error: string };

export async function readPublicMcpBody(req: Request, timeoutMs = PUBLIC_MCP_BODY_TIMEOUT_MS): Promise<BodyResult> {
  const length = req.headers.get('content-length');
  const encoding = req.headers.get('content-encoding');
  const reject = (status: number, error: string): BodyResult => {
    // Do not wait for a hostile or stalled stream's cancellation promise.
    void req.body?.cancel().catch(() => {});
    return { ok: false, status, error };
  };
  if (encoding && encoding.toLowerCase() !== 'identity') return reject(415, 'Compressed request bodies are not supported');
  if (length !== null && !/^\d+$/.test(length)) return reject(400, 'Invalid Content-Length');
  if (length !== null && Number(length) > PUBLIC_MCP_BODY_BYTES) return reject(413, 'Request too large');
  if (req.signal.aborted) return reject(400, 'Request aborted');
  if (!req.body) return { ok: true, text: '' };

  const reader = req.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let text = '';
  let stop: (result: BodyResult) => void;
  const interrupted = new Promise<BodyResult>(resolve => { stop = resolve; });
  const interrupt = (status: number, error: string) => {
    stop({ ok: false, status, error });
    void reader.cancel().catch(() => {});
  };
  const timer = setTimeout(() => interrupt(408, 'Request body timed out'), timeoutMs);
  const aborted = () => interrupt(400, 'Request aborted');
  req.signal.addEventListener('abort', aborted, { once: true });
  // An abort between the initial check and listener registration must also fail.
  if (req.signal.aborted) aborted();
  const read = async (): Promise<BodyResult> => {
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > PUBLIC_MCP_BODY_BYTES) {
          void reader.cancel().catch(() => {});
          return { ok: false, status: 413, error: 'Request too large' };
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
      if (length !== null && bytes !== Number(length)) return { ok: false, status: 400, error: 'Content-Length mismatch' };
      return { ok: true, text };
    } catch {
      void reader.cancel().catch(() => {});
      return { ok: false, status: 400, error: 'Invalid request body' };
    } finally {
      reader.releaseLock();
    }
  };
  try { return await Promise.race([interrupted, read()]); }
  finally {
    clearTimeout(timer);
    req.signal.removeEventListener('abort', aborted);
  }
}

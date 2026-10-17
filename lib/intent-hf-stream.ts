// Gradio's /call API sends cumulative outputs as server-sent events.
export async function* gradioEvents(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let event = '';
  let data: string[] = [];
  try {
    while (true) {
      const chunk = await reader.read();
      pending += decoder.decode(chunk.value, { stream: !chunk.done });
      if (pending.length > 100_000) throw new Error('Oversized inference event.');
      // Normalize complete lines, including CRLF split across network chunks.
      let end: number;
      while ((end = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, end).replace(/\r$/, '');
        pending = pending.slice(end + 1);
        if (!line) {
          if (event || data.length) yield { event, data: data.join('\n') };
          event = ''; data = [];
        } else if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
        if (data.join('').length > 100_000) throw new Error('Oversized inference event.');
      }
      if (chunk.done) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export function inferenceError(detail: string, status?: number) {
  if (status === 401 || status === 403) return 'Hugging Face authentication failed. Check the server HF_TOKEN and its Space permissions.';
  if (status === 429 || /quota|rate.?limit|runs limit/i.test(detail)) return 'The Hugging Face account’s ZeroGPU quota is exhausted. Try again after its quota resets.';
  return 'Hugging Face inference is temporarily unavailable. Please try again shortly.';
}

export function inferenceInput(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid request.');
  const b = body as Record<string, unknown>;
  if (typeof b.message !== 'string' || !b.message.trim() || b.message.length > 8000) throw new Error('Enter a prompt of 1–8000 characters.');
  if (b.checkpoint !== 'facts500' && b.checkpoint !== 'sft1000') throw new Error('Choose a supported checkpoint.');
  const temperature = b.temperature ?? 0.45, topK = b.topK ?? 25, maxTokens = b.maxTokens ?? 96;
  if (typeof temperature !== 'number' || !Number.isFinite(temperature) || temperature < 0 || temperature > 10) throw new Error('Temperature must be between 0 and 10.');
  if (typeof topK !== 'number' || !Number.isInteger(topK) || topK < 1 || topK > 100) throw new Error('Top-K must be an integer from 1 to 100.');
  if (typeof maxTokens !== 'number' || !Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 128) throw new Error('Output length must be an integer from 1 to 128.');
  return [b.message.trim(), temperature, topK, maxTokens, b.checkpoint];
}

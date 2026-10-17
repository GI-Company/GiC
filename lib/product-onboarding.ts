import type { IntentCheckpoint } from '@/lib/intent-models';

export const ENTRY_PROMPT_KEY = 'gic-entry-prompt-v1';
export type EntryModel = 'standard' | IntentCheckpoint;
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;
const TTL = 10 * 60 * 1000;

export function saveEntryPrompt(storage: Storage, model: EntryModel, prompt: string, now = Date.now()) {
  const text = prompt.trim();
  if (!text || text.length > 8000) throw new Error('Use a prompt of 1–8000 characters.');
  storage.setItem(ENTRY_PROMPT_KEY, JSON.stringify({ model, text, at: now }));
}

export function takeEntryPrompt(storage: Storage, model: EntryModel, now = Date.now()): string {
  try {
    const raw = storage.getItem(ENTRY_PROMPT_KEY);
    if (!raw) return '';
    const item = JSON.parse(raw);
    if (!item || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 8000 || typeof item.at !== 'number' || now - item.at < 0 || now - item.at > TTL) {
      storage.removeItem(ENTRY_PROMPT_KEY); return '';
    }
    if (item.model !== model) return '';
    storage.removeItem(ENTRY_PROMPT_KEY);
    return item.text;
  } catch { return ''; }
}

export function miniRequest(checkpoint: IntentCheckpoint, message = 'The capital of France is', temperature = 0.25, topK = 80, maxTokens = 32) {
  return { message, checkpoint, temperature, topK, maxTokens };
}

// Shell single-quote escaping preserves quotes, $, backticks, and newlines as data.
export const shellQuote = (value: string) => "'" + value.replaceAll("'", "'\\''") + "'";
export function inferenceExamples(payload: ReturnType<typeof miniRequest>) {
  const url = 'https://www.globalintentcompany.space/api/intent/mini';
  const json = JSON.stringify(payload);
  return {
    curl: [
      `curl -N ${shellQuote(url)}`,
      "  -H 'Origin: https://www.globalintentcompany.space'",
      "  -H 'Content-Type: application/json'",
      `  --data-raw ${shellQuote(json)}`,
    ].join(' \\\n'),
    python: [
      'import json', 'import urllib.request', '',
      '# Standard library only. Outputs are cumulative, not token deltas.',
      `payload = json.loads(${JSON.stringify(json)})`,
      'request = urllib.request.Request(',
      `    ${JSON.stringify(url)},`,
      '    data=json.dumps(payload).encode(),',
      '    headers={"Origin": "https://www.globalintentcompany.space",',
      '             "Content-Type": "application/json"},',
      '    method="POST",', ')',
      'with urllib.request.urlopen(request, timeout=260) as response:',
      '    for line in response:',
      '        event = json.loads(line)',
      '        if "error" in event:',
      '            raise RuntimeError(event["error"])',
      '        if "text" in event:',
      '            print(event["text"], flush=True)',
    ].join('\n'),
  };
}

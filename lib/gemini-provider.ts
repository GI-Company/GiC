/**
 * Server-only Gemini inference configuration. Do not import this into client components.
 * The OpenAI-compatible endpoint supports chat and function calls; built-in Google
 * Search grounding uses the native Gemini generateContent API instead.
 */
export const GEMINI_CHAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_NATIVE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export type HostedMode = 'fast' | 'medium' | 'enhanced';

const DEFAULT_MODELS: Record<HostedMode, string> = {
  fast: 'gemini-3.5-flash-lite',
  medium: 'gemini-3.8-flash',
  enhanced: 'gemini-3.1-pro-preview',
};

const ENV_BY_MODE: Record<HostedMode, string | undefined> = {
  fast: process.env.GIC_GEMINI_FAST_MODEL,
  medium: process.env.GIC_GEMINI_MEDIUM_MODEL,
  enhanced: process.env.GIC_GEMINI_ENHANCED_MODEL,
};

export function geminiModelForMode(mode: HostedMode): string {
  const candidate = ENV_BY_MODE[mode]?.trim() || DEFAULT_MODELS[mode];
  if (!/^[a-zA-Z0-9._-]{1,80}$/.test(candidate)) {
    throw new Error('Invalid Gemini model configuration.');
  }
  return candidate;
}

export function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

export type GeminiSearchResult = {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
};

type GroundingResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
      webSearchQueries?: string[];
    };
  }>;
  error?: { message?: string };
};

/** Search requests must use genuine Google Search grounding, never a fake browser tool. */
export async function groundedGeminiAnswer({
  key, model, system, prompt, maxOutputTokens, signal,
}: {
  key: string; model: string; system: string; prompt: string;
  maxOutputTokens: number; signal: AbortSignal;
}): Promise<{ answer: string; sources: GeminiSearchResult[] }> {
  const url = `${GEMINI_NATIVE_URL}/${encodeURIComponent(model)}:generateContent`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.35, maxOutputTokens },
    }),
    cache: 'no-store',
    signal,
  });
  const data = await upstream.json() as GroundingResponse;
  if (!upstream.ok) {
    // Deliberately avoid disclosing upstream diagnostic content to anonymous clients.
    throw new Error(upstream.status === 429
      ? 'Gemini rate limit reached. Please try again later.'
      : 'Gemini grounded search is temporarily unavailable.');
  }
  const candidate = data.candidates?.[0];
  const answer = candidate?.content?.parts?.map((p) => p.text || '').join('').trim() || '';
  if (!answer) throw new Error('Gemini did not return an answer.');
  const sources = (candidate?.groundingMetadata?.groundingChunks || []).flatMap((chunk) => {
    const web = chunk.web;
    if (!web?.uri || !/^https:\/\//i.test(web.uri)) return [];
    return [{ title: web.title || 'Google Search result', url: web.uri, content: '' }];
  });
  return { answer, sources };
}

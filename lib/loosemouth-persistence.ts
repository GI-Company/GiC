import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase-public';

export type LooseMouthModel = 'fast' | 'medium' | 'enhanced';

export type PersistedConversation = {
  id: string;
  user_id: string;
  title: string;
  model: LooseMouthModel;
  inference_session_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PersistedMessage = {
  id: number;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_name: string | null;
  sources: Array<{ title: string; snippet: string; date: string; url: string }>;
  warning: string | null;
  created_at: string;
};

export type LooseMouthPreferences = {
  user_id: string;
  preferred_model: LooseMouthModel;
  web_search_enabled: boolean;
  data_collection_enabled: boolean;
  updated_at: string;
};

function authHeaders(accessToken: string, extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken}`,
    ...extra,
  };
}

async function checked<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let payload: { message?: string; details?: string } | null = null;
    if (text) {
      try {
        payload = JSON.parse(text) as { message?: string; details?: string };
      } catch {
        // Keep the HTTP status fallback when an upstream error is not JSON.
      }
    }
    throw new Error(payload?.message || payload?.details || `Persistence request failed (${response.status}).`);
  }

  // PostgREST can return a successful 200/201 with an empty response body for
  // writes using Prefer: return=minimal. Do not attempt JSON parsing when
  // there is no representation to decode.
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text.trim()) return undefined as T;
  return JSON.parse(text) as T;
}

function normalizeStoredModel(value: unknown): LooseMouthModel {
  return value === 'medium' || value === 'enhanced' ? value : 'fast';
}

export async function listConversations(accessToken: string, userId: string) {
  const url = new URL('/rest/v1/loosemouth_conversations', SUPABASE_URL);
  url.searchParams.set('select', 'id,user_id,title,model,inference_session_id,created_at,updated_at');
  url.searchParams.set('user_id', `eq.${userId}`);
  url.searchParams.set('order', 'updated_at.desc');
  url.searchParams.set('limit', '30');
  const rows = await checked<Array<Omit<PersistedConversation, 'model'> & { model: string }>>(await fetch(url, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  }));
  return rows.map((row) => ({ ...row, model: normalizeStoredModel(row.model) }));
}

export async function loadMessages(accessToken: string, userId: string, conversationId: string) {
  const url = new URL('/rest/v1/loosemouth_messages', SUPABASE_URL);
  url.searchParams.set('select', 'id,conversation_id,user_id,role,content,image_name,sources,warning,created_at');
  url.searchParams.set('user_id', `eq.${userId}`);
  url.searchParams.set('conversation_id', `eq.${conversationId}`);
  url.searchParams.set('order', 'id.asc');
  return checked<PersistedMessage[]>(await fetch(url, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  }));
}

export async function createConversation(
  accessToken: string,
  userId: string,
  values: { title: string; model: LooseMouthModel },
) {
  const url = new URL('/rest/v1/loosemouth_conversations', SUPABASE_URL);
  url.searchParams.set('select', 'id,user_id,title,model,inference_session_id,created_at,updated_at');
  const rows = await checked<Array<Omit<PersistedConversation, 'model'> & { model: string }>>(await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify({ user_id: userId, ...values }),
  }));
  if (!rows[0]) throw new Error('Conversation was not created.');
  return { ...rows[0], model: normalizeStoredModel(rows[0].model) };
}

export async function updateConversation(
  accessToken: string,
  userId: string,
  conversationId: string,
  values: Partial<Pick<PersistedConversation, 'title' | 'model' | 'inference_session_id'>>,
) {
  const url = new URL('/rest/v1/loosemouth_conversations', SUPABASE_URL);
  url.searchParams.set('id', `eq.${conversationId}`);
  url.searchParams.set('user_id', `eq.${userId}`);
  await checked<void>(await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    body: JSON.stringify({ ...values, updated_at: new Date().toISOString() }),
  }));
}

export async function saveMessage(
  accessToken: string,
  userId: string,
  conversationId: string,
  message: {
    role: 'user' | 'assistant';
    content: string;
    image_name?: string | null;
    sources?: PersistedMessage['sources'];
    warning?: string | null;
  },
) {
  const url = new URL('/rest/v1/loosemouth_messages', SUPABASE_URL);
  await checked<void>(await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    body: JSON.stringify({
      conversation_id: conversationId,
      user_id: userId,
      role: message.role,
      content: message.content,
      image_name: message.image_name ?? null,
      sources: message.sources ?? [],
      warning: message.warning ?? null,
    }),
  }));
}

export async function saveExchange(
  accessToken: string,
  userId: string,
  conversationId: string,
  values: {
    userContent: string;
    userImageName?: string | null;
    assistantContent: string;
    assistantSources?: PersistedMessage['sources'];
    assistantWarning?: string | null;
  },
) {
  const url = new URL('/rest/v1/loosemouth_messages', SUPABASE_URL);
  await checked<void>(await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    // PostgREST bulk inserts execute as a single database transaction. Either
    // both sides of the turn persist or neither does.
    body: JSON.stringify([
      {
        conversation_id: conversationId,
        user_id: userId,
        role: 'user',
        content: values.userContent,
        image_name: values.userImageName ?? null,
        sources: [],
        warning: null,
      },
      {
        conversation_id: conversationId,
        user_id: userId,
        role: 'assistant',
        content: values.assistantContent,
        image_name: null,
        sources: values.assistantSources ?? [],
        warning: values.assistantWarning ?? null,
      },
    ]),
  }));
}

export async function getPreferences(accessToken: string, userId: string) {
  const url = new URL('/rest/v1/loosemouth_user_preferences', SUPABASE_URL);
  url.searchParams.set('select', 'user_id,preferred_model,web_search_enabled,data_collection_enabled,updated_at');
  url.searchParams.set('user_id', `eq.${userId}`);
  url.searchParams.set('limit', '1');
  const rows = await checked<Array<Omit<LooseMouthPreferences, 'preferred_model'> & { preferred_model: string }>>(await fetch(url, {
    headers: authHeaders(accessToken),
    cache: 'no-store',
  }));
  if (!rows[0]) return null;
  return { ...rows[0], preferred_model: normalizeStoredModel(rows[0].preferred_model) };
}

export async function savePreferences(
  accessToken: string,
  userId: string,
  values: { preferred_model: LooseMouthModel; web_search_enabled: boolean; data_collection_enabled: boolean },
) {
  const url = new URL('/rest/v1/loosemouth_user_preferences', SUPABASE_URL);
  url.searchParams.set('on_conflict', 'user_id');
  await checked<void>(await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken, {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }),
    body: JSON.stringify({ user_id: userId, ...values, updated_at: new Date().toISOString() }),
  }));
}

export async function deleteConversation(accessToken: string, userId: string, conversationId: string) {
  const url = new URL('/rest/v1/loosemouth_conversations', SUPABASE_URL);
  url.searchParams.set('id', `eq.${conversationId}`);
  url.searchParams.set('user_id', `eq.${userId}`);
  await checked<void>(await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(accessToken, { Prefer: 'return=minimal' }),
  }));
}

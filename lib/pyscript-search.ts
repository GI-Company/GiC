export type SearchEnrichmentSource = {
  title: string;
  snippet: string;
  date: string;
  url: string;
};

const INPUT_ID = 'gic-search-enrichment-input';
const OUTPUT_ID = 'gic-search-enrichment-output';
const RUN_ID = 'gic-search-enrichment-run';

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function enrichSourcesWithPyScript<T extends SearchEnrichmentSource>(
  query: string,
  sources: T[],
): Promise<T[]> {
  if (typeof document === 'undefined' || sources.length < 2) return sources;

  const input = document.getElementById(INPUT_ID) as HTMLTextAreaElement | null;
  const output = document.getElementById(OUTPUT_ID) as HTMLTextAreaElement | null;
  const run = document.getElementById(RUN_ID) as HTMLButtonElement | null;

  if (!input || !output || !run || run.dataset.pyscriptReady !== '1') return sources;

  const requestId = crypto.randomUUID();
  input.value = JSON.stringify({
    request_id: requestId,
    query,
    sources: sources.map(({ title, snippet, date, url }) => ({ title, snippet, date, url })),
  });
  output.value = '';
  output.dataset.requestId = '';
  run.click();

  const deadline = performance.now() + 300;
  while (performance.now() < deadline) {
    if (output.dataset.requestId === requestId && output.value) {
      try {
        const payload = JSON.parse(output.value) as { order?: number[] };
        if (!Array.isArray(payload.order)) return sources;
        const reordered = payload.order
          .filter((index) => Number.isInteger(index) && index >= 0 && index < sources.length)
          .map((index) => sources[index]);
        return reordered.length ? reordered : sources;
      } catch {
        return sources;
      }
    }
    await sleep(10);
  }

  return sources;
}

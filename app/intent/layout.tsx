const PYSCRIPT_VERSION = '2026.7.3';

export default function IntentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={`https://pyscript.net/releases/${PYSCRIPT_VERSION}/core.css`} />
      <script type="module" src={`https://pyscript.net/releases/${PYSCRIPT_VERSION}/core.js`} />

      {children}

      <div hidden aria-hidden="true">
        <textarea id="gic-search-enrichment-input" readOnly />
        <textarea id="gic-search-enrichment-output" readOnly />
        <button id="gic-search-enrichment-run" type="button" tabIndex={-1}>enrich</button>
      </div>
      <script type="mpy" src="/pyscript/search_enrichment.py" />
    </>
  );
}

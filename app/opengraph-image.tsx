import { ImageResponse } from 'next/og';

export const alt = 'Global Intent Company — Try the tools. Inspect the research.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f8fafc',
          color: '#0f172a',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: '#ffffff' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.08em' }}>GLOBAL INTENT COMPANY</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1000 }}>
          <div style={{ fontSize: 70, lineHeight: 1.02, letterSpacing: '-0.04em', fontWeight: 700 }}>
            Try the tools. Inspect the research.
          </div>
          <div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.35, color: '#475569' }}>
            AI chat · Experimental GIC models · Browser-local learning systems
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1', paddingTop: 24, fontSize: 20, color: '#475569' }}>
          <div>Free playgrounds · Subscription Virtual Lab</div>
          <div>www.globalintentcompany.space</div>
        </div>
      </div>
    ),
    size,
  );
}

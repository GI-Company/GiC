import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

const ALLOWED_SIZES = new Set([180, 192, 512]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: rawSize } = await params;
  const size = Number(rawSize);

  if (!ALLOWED_SIZES.has(size)) {
    return new Response('Unsupported icon size.', { status: 404 });
  }

  const large = size >= 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          borderRadius: size * 0.22,
          color: '#ffffff',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: '76%',
            height: '76%',
            borderRadius: '50%',
            border: `${Math.max(4, Math.round(size * 0.025))}px solid #60a5fa`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(145deg, #111827, #1e3a8a)',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: large ? 174 : Math.round(size * 0.34),
              fontWeight: 800,
              letterSpacing: '-0.08em',
              transform: 'translateX(-0.04em)',
            }}
          >
            LM
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: large ? 42 : Math.round(size * 0.075),
            display: 'flex',
            fontSize: large ? 30 : Math.round(size * 0.06),
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: '#bfdbfe',
          }}
        >
          GIC
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
    },
  );
}

import Image from 'next/image';

export default function BrandLoader({ label = 'Loading', size = 48 }: { label?: string; size?: number }) {
  return (
    <span role="status" className="inline-flex items-center gap-3 text-sm text-slate-200">
      <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden="true">
        <Image src="/images/global-intent-company-icon.png" alt="" fill sizes={`${size}px`} className="object-contain" />
        <video
          className="absolute inset-0 h-full w-full object-contain motion-reduce:hidden"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/images/global-intent-loader.mp4" type="video/mp4" />
        </video>
      </span>
      <span>{label}</span>
    </span>
  );
}

import BrandLoader from '@/components/BrandLoader';

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <BrandLoader label="Loading Global Intent Company…" size={72} />
    </main>
  );
}

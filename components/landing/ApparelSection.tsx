import React from 'react';

const SHOP_URL = 'https://f0z00k-pu.myshopify.com/products/global-intent-company-intent-hoodie-family-collection';
const IMAGE_URL = 'https://cdn.shopify.com/s/files/1/0848/5096/6743/files/gic-intent-family-hoodie-product-guide.png?v=1791150510';

export default function ApparelSection() {
  return (
    <section id="apparel" className="border-y border-slate-200 bg-slate-950 py-20 text-white sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Global Intent Company / Apparel</p>
          <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">Different generations. Same Global Intent.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            The INTENT Hoodie family collection brings the Global Intent identity to men&apos;s, women&apos;s, and youth fits. Each piece is made to order with the GIC globe, INTENT sleeve treatment, and People · Purpose · Progress mark.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200">
              Shop the INTENT Hoodie
            </a>
            <span className="text-sm text-slate-400">Adults $49.99 · Youth $34.99 · Allow up to 30 days for shipping</span>
          </div>
          <p className="mt-4 text-xs text-slate-500">Checkout and order processing are handled through the Global Intent Company Shopify store.</p>
        </div>
        <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
          <img src={IMAGE_URL} alt="Global Intent Company INTENT hoodie collection for men, women, and kids" className="h-auto w-full transition duration-300 group-hover:scale-[1.01]" loading="lazy" />
        </a>
      </div>
    </section>
  );
}

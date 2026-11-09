import React, { useState, useEffect } from 'react';
import { ShoppingBag, Star, ShieldCheck, Truck, ArrowLeft, RefreshCw } from 'lucide-react';
import type { ShopifyCartPayload } from '../../types/configurator';

interface ShopifyHostMockProps {
  onExitIframeMode: () => void;
}

export const ShopifyHostMock: React.FC<ShopifyHostMockProps> = ({ onExitIframeMode }) => {
  const [cartCount, setCartCount] = useState<number>(0);
  const [lastReceivedPayload, setLastReceivedPayload] = useState<ShopifyCartPayload | null>(null);

  // Listen for postMessage from the embedded configurator inside the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHOPIFY_ADD_TO_CART') {
        const payload = event.data.payload as ShopifyCartPayload;
        setCartCount((prev) => prev + (payload.items?.[0]?.quantity || 1));
        setLastReceivedPayload(payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Simulation Banner */}
      <div className="bg-amber-500 text-zinc-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
          <span>SIMULATION: Host Shopify Storefront Embedding Configurator via &lt;iframe&gt;</span>
        </div>
        <button
          onClick={onExitIframeMode}
          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-950 text-white rounded text-[11px] hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Standalone Studio</span>
        </button>
      </div>

      {/* Mock Shopify Theme Navigation Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="font-black text-xl tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm font-bold">MVP</span>
            <span>VISUALS</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span className="text-blue-600 font-bold border-b-2 border-blue-600 pb-1">Canopy Tents</span>
            <span>Table Covers</span>
            <span>Event Banners</span>
            <span>Inflatables</span>
            <span>Design Services</span>
          </nav>
        </div>

        {/* Shopify Cart Pill */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-semibold">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>Cart</span>
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">
              {cartCount}
            </span>
          </div>
        </div>
      </header>

      {/* Mock Product Details & Embed Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Breadcrumb & PDP Title */}
        <div className="space-y-1">
          <div className="text-xs text-zinc-400">Home / Commercial Canopy Tents / Custom 10x10 Series</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Custom Logo Canopy Tent (Interactive 3D Builder)
          </h1>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">4.9 / 5.0</span>
            <span>(218 verified commercial reviews)</span>
          </div>
        </div>

        {/* Embedded Iframe Container */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden h-[750px] relative">
          <iframe
            src={window.location.origin}
            title="3D Configurator Embed"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; camera; gyroscope"
          />
        </div>

        {/* Parent Page Event Log Display */}
        {lastReceivedPayload && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-2 animate-in fade-in">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <span>✅ Shopify Host Window Received &quot;SHOPIFY_ADD_TO_CART&quot; postMessage</span>
            </div>
            <p className="text-emerald-700 dark:text-emerald-400">
              Parent page successfully intercepted line item properties from iframe. In production, this triggers{' '}
              <code className="font-mono bg-white dark:bg-zinc-900 px-1 py-0.5 rounded">fetch(&apos;/cart/add.js&apos;)</code> and refreshes the cart slide-out drawer.
            </p>
          </div>
        )}

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Lifetime Warranty on Hex Aluminum Frames</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>2-Day Guaranteed Factory Production</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <RefreshCw className="w-5 h-5 text-purple-600 shrink-0" />
            <span>Unlimited Free Digital Art Proofs</span>
          </div>
        </div>
      </main>
    </div>
  );
};

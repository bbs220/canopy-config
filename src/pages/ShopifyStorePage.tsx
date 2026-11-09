import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Star,
  ShieldCheck,
  Truck,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import type { ShopifyCartPayload } from "../types/configurator";
import { useNavigate } from "react-router";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export function ShopifyStorePage() {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState<number>(0);
  const [lastReceivedPayload, setLastReceivedPayload] =
    useState<ShopifyCartPayload | null>(null);

  // listen for post message from the embedded configurator inside the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SHOPIFY_ADD_TO_CART") {
        const payload = event.data.payload as ShopifyCartPayload;
        setCartCount((prev) => prev + (payload.items?.[0]?.quantity || 1));
        setLastReceivedPayload(payload);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div className="min-h-dvh bg-base-200 font-sans text-base-content flex flex-col overflow-x-hidden w-full max-w-full">
      {/* simulation banner */}
      <div className="bg-warning text-warning-content px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="badge badge-neutral badge-xs animate-ping" />
          <span>
            SIMULATION: Host Shopify Storefront Embedding Configurator via
            &lt;iframe src=&quot;/embed&quot;&gt;
          </span>
        </div>
        <button
          onClick={() => navigate("/")}
          className="btn btn-neutral btn-xs gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Standalone Studio</span>
        </button>
      </div>

      {/* mock shopify theme navigation header */}
      <header className="navbar bg-base-100 border-b border-base-300 px-6 py-2 justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-8">
          <div className="font-black text-xl tracking-tight text-base-content flex items-center gap-1.5">
            <span className="badge badge-primary font-bold text-xs py-3 px-2">
              MVP
            </span>
            <span>VISUALS</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-base-content/70">
            <span className="text-primary border-b-2 border-primary pb-1">
              Canopy Tents
            </span>
            <span className="hover:text-base-content cursor-pointer">
              Table Covers
            </span>
            <span className="hover:text-base-content cursor-pointer">
              Event Banners
            </span>
            <span className="hover:text-base-content cursor-pointer">
              Inflatables
            </span>
            <span className="hover:text-base-content cursor-pointer">
              Design Services
            </span>
          </nav>
        </div>

        {/* header right actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="btn btn-ghost btn-sm rounded-full gap-2 font-bold">
            <ShoppingBag className="w-4 h-4 text-primary" />
            <span>Cart</span>
            <span className="badge badge-primary badge-sm font-bold">
              {cartCount}
            </span>
          </div>
        </div>
      </header>

      {/* mock product details and embed section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* breadcrumb and pdp title */}
        <div className="space-y-1">
          <div className="text-xs text-base-content/50">
            Home / Commercial Canopy Tents / Custom 10x10 Series
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
            Custom Logo Canopy Tent (Interactive 3D Builder)
          </h1>
          <div className="flex items-center gap-2 text-xs text-base-content/60">
            <div className="flex text-warning">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="font-bold text-base-content">4.9 / 5.0</span>
            <span>(218 verified commercial reviews)</span>
          </div>
        </div>

        {/* embedded iframe container loading embed route */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-xl overflow-hidden h-187.5 relative">
          <iframe
            src="/embed"
            title="3D Configurator Embed"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; camera; gyroscope"
          />
        </div>

        {/* parent page event log display */}
        {lastReceivedPayload && (
          <div className="alert alert-success text-xs shadow-md">
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>
                  ✅ Shopify Host Window Intercepted
                  &quot;SHOPIFY_ADD_TO_CART&quot; postMessage
                </span>
              </div>
              <p className="mt-1 opacity-90">
                Parent page successfully intercepted line item properties from
                iframe. In production, this triggers{" "}
                <code className="badge badge-ghost badge-xs font-mono">
                  fetch(&apos;/cart/add.js&apos;)
                </code>{" "}
                and refreshes the cart slide-out drawer.
              </p>
            </div>
          </div>
        )}

        {/* trust badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-base-300 text-xs text-base-content/70">
          <div className="flex items-center gap-2.5 p-3 bg-base-100 rounded-xl border border-base-300 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <span>Lifetime Warranty on Hex Aluminum Frames</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-base-100 rounded-xl border border-base-300 shadow-xs">
            <Truck className="w-5 h-5 text-success shrink-0" />
            <span>2-Day Guaranteed Factory Production</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-base-100 rounded-xl border border-base-300 shadow-xs">
            <RefreshCw className="w-5 h-5 text-secondary shrink-0" />
            <span>Unlimited Free Digital Art Proofs</span>
          </div>
        </div>
      </main>
    </div>
  );
}

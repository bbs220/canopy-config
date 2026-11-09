import React, { useState } from 'react';
import type { PricingBreakdown } from '../../types/configurator';
import { ShoppingCart, FileDown, ChevronUp, ChevronDown } from 'lucide-react';

interface PriceActionBarProps {
  pricing: PricingBreakdown;
  isLoadingPrice?: boolean;
  onAddToCart: () => void;
  onDownloadPDF: () => void;
  isGeneratingPDF?: boolean;
}

export const PriceActionBar: React.FC<PriceActionBarProps> = ({
  pricing,
  isLoadingPrice,
  onAddToCart,
  onDownloadPDF,
  isGeneratingPDF,
}) => {
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  return (
    <div className="relative border-t border-base-300 bg-base-100 px-4 py-3 shadow-lg z-30">
      {/* Itemized Price Breakdown Drawer */}
      {showBreakdown && (
        <div className="absolute bottom-full left-0 right-0 p-4 bg-base-100 border-t border-base-300 shadow-2xl space-y-2.5 max-h-64 overflow-y-auto animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-base-content uppercase tracking-wider">
            <span>Itemized Order Price Summary</span>
            <span className="badge badge-neutral badge-xs">Dynamic Pricing API</span>
          </div>

          <div className="divide-y divide-base-200 text-xs">
            {pricing.itemizedSummary.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-base-content/80">
                <span>{item.label}</span>
                <span className="font-semibold text-base-content">
                  {item.amount === 0 ? (
                    <span className="badge badge-success badge-xs">INCLUDED</span>
                  ) : (
                    `$${item.amount.toFixed(2)}`
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-base-300 flex items-center justify-between text-sm font-bold text-base-content">
            <span>Estimated Total</span>
            <span className="text-primary text-base">
              ${pricing.subtotal.toFixed(2)} {pricing.currency}
            </span>
          </div>
        </div>
      )}

      {/* Main Bar Actions */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Dynamic Total & Toggle Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div>
            <div className="text-[11px] font-medium text-base-content/60 flex items-center gap-1">
              <span>Dynamic Total</span>
              <button
                onClick={() => setShowBreakdown((prev) => !prev)}
                className="btn btn-ghost btn-xs text-primary font-bold px-1 h-5 min-h-5"
              >
                <span>Details</span>
                {showBreakdown ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
            <div className="text-2xl font-black text-base-content tracking-tight flex items-baseline gap-1.5">
              <span>${pricing.subtotal.toFixed(2)}</span>
              <span className="text-xs font-semibold text-base-content/50">{pricing.currency}</span>
              {isLoadingPrice && (
                <span className="loading loading-spinner loading-xs text-primary ml-1" />
              )}
            </div>
          </div>

          {/* Quick status badge */}
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-base-300 text-[11px] text-base-content/70">
            <span className="badge badge-success badge-xs" />
            <span>2-Day Turnaround • Free Digital Proof</span>
          </div>
        </div>

        {/* Buttons: PDF Export & Add to Cart */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onDownloadPDF}
            disabled={isGeneratingPDF}
            className="btn btn-outline btn-sm font-semibold flex-1 sm:flex-initial"
            title="Download Manufacturing PDF Specification Proof"
          >
            {isGeneratingPDF ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <FileDown className="w-4 h-4 text-base-content/70" />
            )}
            <span>{isGeneratingPDF ? 'Generating...' : 'PDF Proof'}</span>
          </button>

          <button
            onClick={onAddToCart}
            className="btn btn-primary btn-sm font-bold flex-1 sm:flex-initial gap-2 px-5 shadow-md shadow-primary/20"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};

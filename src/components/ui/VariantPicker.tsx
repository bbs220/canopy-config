import React from 'react';
import type { ProductVariant } from '../../types/configurator';
import { Check, ShieldCheck, Ruler, Weight } from 'lucide-react';

type VariantPickerProps = {
  variants: ProductVariant[];
  selectedVariantId: string;
  onSelectVariant: (variantId: string) => void;
};

export const VariantPicker: React.FC<VariantPickerProps> = ({
  variants,
  selectedVariantId,
  onSelectVariant,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
          Select Tent Size Variant
        </label>
        <div className="badge badge-primary badge-outline badge-xs gap-1 py-2 font-semibold">
          <ShieldCheck className="w-3 h-3" />
          <span>Lifetime Warranty</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {variants.map((variant) => {
          const isSelected = selectedVariantId === variant.id;

          return (
            <button
              key={variant.id}
              onClick={() => onSelectVariant(variant.id)}
              className={`card bg-base-100 border text-left transition-all p-3 cursor-pointer ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 shadow-md bg-primary/5'
                  : 'border-base-300 hover:border-base-content/30 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="text-sm font-extrabold text-base-content">
                  {variant.name.split(' ')[0]} {variant.name.split(' ')[1]} {variant.name.split(' ')[2]}
                </div>

                {isSelected && (
                  <span className="badge badge-primary badge-xs p-1">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-primary mt-1">
                ${variant.basePrice.toFixed(2)}
              </div>

              <div className="mt-2 pt-2 border-t border-base-200 space-y-1 text-[11px] text-base-content/70">
                <div className="flex items-center gap-1.5">
                  <Ruler className="w-3 h-3 text-base-content/40" />
                  <span>{variant.dimensions.coverageSqFt} sq ft coverage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Weight className="w-3 h-3 text-base-content/40" />
                  <span>{variant.weightLbs} lbs hardware</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

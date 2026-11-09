import React from 'react';
import type { HardwareOption } from '../../types/configurator';
import { Shield, PackagePlus } from 'lucide-react';

type HardwareSelectorProps = {
  options: HardwareOption[];
  selectedIds: string[];
  onToggleOption: (id: string) => void;
};

export const HardwareSelector: React.FC<HardwareSelectorProps> = ({
  options,
  selectedIds,
  onToggleOption,
}) => {
  const frameOptions = options.filter((o) => o.category === 'frame');
  const accessoryOptions = options.filter((o) => o.category === 'accessory');

  return (
    <div className="space-y-4">
      {/* frame selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-base-content/70">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>Frame Hardware Tier</span>
        </div>

        <div className="space-y-2">
          {frameOptions.map((opt) => {
            const isSelected = selectedIds.includes(opt.id);

            return (
              <button
                key={opt.id}
                onClick={() => onToggleOption(opt.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all bg-base-100 ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-base-300 hover:border-base-content/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="frame-tier"
                    checked={isSelected}
                    onChange={() => {}}
                    className="radio radio-primary radio-sm mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-bold text-base-content">{opt.name}</div>
                    <div className="text-[11px] text-base-content/60 leading-tight mt-0.5">
                      {opt.description}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold shrink-0 ml-3">
                  {opt.price === 0 ? (
                    <span className="badge badge-success badge-sm font-bold">Included</span>
                  ) : (
                    <span className="text-base-content">+${opt.price.toFixed(2)}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* accessories selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-base-content/70">
          <PackagePlus className="w-3.5 h-3.5 text-secondary" />
          <span>Recommended Event Accessories</span>
        </div>

        <div className="space-y-2">
          {accessoryOptions.map((opt) => {
            const isSelected = selectedIds.includes(opt.id);

            return (
              <button
                key={opt.id}
                onClick={() => onToggleOption(opt.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all bg-base-100 ${
                  isSelected
                    ? 'border-secondary bg-secondary/5 ring-1 ring-secondary/20'
                    : 'border-base-300 hover:border-base-content/30'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="checkbox checkbox-secondary checkbox-sm mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-bold text-base-content">{opt.name}</div>
                    <div className="text-[11px] text-base-content/60 leading-tight">
                      {opt.description}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold shrink-0 ml-3 text-base-content">
                  +${opt.price.toFixed(2)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

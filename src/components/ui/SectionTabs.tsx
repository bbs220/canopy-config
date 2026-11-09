import React from 'react';
import type { PrintableSection, SectionCustomization } from '../../types/configurator';
import { CheckCircle2 } from 'lucide-react';

interface SectionTabsProps {
  sections: PrintableSection[];
  activeSectionId: string;
  sectionCustomizations: Record<string, SectionCustomization>;
  onSelectSection: (sectionId: string) => void;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({
  sections,
  activeSectionId,
  sectionCustomizations,
  onSelectSection,
}) => {
  const peaks = sections.filter((s) => s.category === 'peak');
  const valances = sections.filter((s) => s.category === 'valance');

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
          Printable Canopy Zones
        </label>
      </div>

      {/* Peaks (Sloped Roof) */}
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-base-content/60">
          Roof Peaks (Long-Range Visibility)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {peaks.map((section) => {
            const isActive = activeSectionId === section.id;
            const hasCustomContent =
              sectionCustomizations[section.id]?.layers &&
              sectionCustomizations[section.id].layers.length > 0;

            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={`btn btn-sm text-xs font-bold transition-all justify-between px-2.5 ${
                  isActive
                    ? 'btn-primary shadow-sm'
                    : 'btn-outline border-base-300 hover:border-primary/50 bg-base-100 text-base-content'
                }`}
              >
                <span>{section.shortName}</span>
                {hasCustomContent && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-primary-content' : 'text-success'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Valances (Eye-Level Perimeter Skirts) */}
      <div className="space-y-1 pt-1">
        <div className="text-[11px] font-semibold text-base-content/60">
          Valance Skirts (Eye-Level Brand / URL)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {valances.map((section) => {
            const isActive = activeSectionId === section.id;
            const hasCustomContent =
              sectionCustomizations[section.id]?.layers &&
              sectionCustomizations[section.id].layers.length > 0;

            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={`btn btn-sm text-xs font-bold transition-all justify-between px-2.5 ${
                  isActive
                    ? 'btn-primary shadow-sm'
                    : 'btn-outline border-base-300 hover:border-primary/50 bg-base-100 text-base-content'
                }`}
              >
                <span>{section.shortName}</span>
                {hasCustomContent && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-primary-content' : 'text-success'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

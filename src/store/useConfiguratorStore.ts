import { create } from 'zustand';
import type {
  CustomerConfiguration,
  PricingBreakdown,
  ProductDefinition,
  SectionCustomization,
} from '../types/configurator';
import { TENT_PRODUCT } from '../config/tentProduct';
import { PricingService } from '../services/pricingService';

interface ConfiguratorState {
  product: ProductDefinition;
  selectedVariantId: string;
  baseColor: string;
  selectedHardwareIds: string[];
  activeSectionId: string;
  sections: Record<string, SectionCustomization>;
  pricing: PricingBreakdown;
  isLoadingPrice: boolean;

  // Actions
  setVariant: (variantId: string) => void;
  setBaseColor: (hex: string) => void;
  toggleHardware: (hardwareId: string) => void;
  setActiveSection: (sectionId: string) => void;
  updateSectionCustomization: (sectionId: string, customization: SectionCustomization) => void;
  resetSection: (sectionId: string) => void;
  resetAll: () => void;
  calculatePricing: () => Promise<void>;
  getConfiguration: () => CustomerConfiguration;
}

const INITIAL_PRICING: PricingBreakdown = {
  variantBasePrice: 429.0,
  hardwareAddonsTotal: 0,
  customPrintSectionsTotal: 0,
  printCostPerSection: 35.0,
  customSectionsCount: 0,
  subtotal: 429.0,
  currency: 'USD',
  itemizedSummary: [
    { label: "5' x 5' Compact Pop-up Base Frame & Canopy", amount: 429.0 },
  ],
};

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  product: TENT_PRODUCT,
  selectedVariantId: 'tent-5x5',
  baseColor: '#FFFFFF',
  selectedHardwareIds: ['frame-steel'],
  activeSectionId: 'front_peak',
  sections: {},
  pricing: INITIAL_PRICING,
  isLoadingPrice: false,

  setVariant: (variantId: string) => {
    set({ selectedVariantId: variantId });
    get().calculatePricing();
  },

  setBaseColor: (hex: string) => {
    set({ baseColor: hex });
    get().calculatePricing();
  },

  toggleHardware: (hardwareId: string) => {
    const { product, selectedHardwareIds } = get();
    const option = product.hardwareOptions.find((h) => h.id === hardwareId);
    if (!option) return;

    if (option.category === 'frame') {
      // Single select for frame tier
      set({
        selectedHardwareIds: [
          ...selectedHardwareIds.filter((item) => {
            const opt = product.hardwareOptions.find((h) => h.id === item);
            return opt?.category !== 'frame';
          }),
          hardwareId,
        ],
      });
    } else {
      // Multi-select for accessories
      set({
        selectedHardwareIds: selectedHardwareIds.includes(hardwareId)
          ? selectedHardwareIds.filter((item) => item !== hardwareId)
          : [...selectedHardwareIds, hardwareId],
      });
    }

    get().calculatePricing();
  },

  setActiveSection: (sectionId: string) => {
    set({ activeSectionId: sectionId });
  },

  updateSectionCustomization: (sectionId: string, customization: SectionCustomization) => {
    set((state) => ({
      sections: {
        ...state.sections,
        [sectionId]: customization,
      },
    }));
    get().calculatePricing();
  },

  resetSection: (sectionId: string) => {
    set((state) => {
      const nextSections = { ...state.sections };
      delete nextSections[sectionId];
      return { sections: nextSections };
    });
    get().calculatePricing();
  },

  resetAll: () => {
    set({
      selectedVariantId: 'tent-5x5',
      baseColor: '#FFFFFF',
      selectedHardwareIds: ['frame-steel'],
      activeSectionId: 'front_peak',
      sections: {},
    });
    get().calculatePricing();
  },

  calculatePricing: async () => {
    set({ isLoadingPrice: true });
    try {
      const config = get().getConfiguration();
      const newPricing = await PricingService.calculatePrice(config, get().product);
      set({ pricing: newPricing, isLoadingPrice: false });
    } catch (err) {
      console.error('Pricing calculation error:', err);
      set({ isLoadingPrice: false });
    }
  },

  getConfiguration: () => {
    const { product, selectedVariantId, baseColor, selectedHardwareIds, sections } = get();
    return {
      productId: product.id,
      variantId: selectedVariantId,
      baseColor,
      selectedHardwareIds,
      sections,
    };
  },
}));

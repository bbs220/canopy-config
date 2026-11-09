export type SectionCategory = 'peak' | 'valance' | 'wall';

export interface UVRegion {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
}

export interface CameraViewConfig {
  position: [number, number, number];
  target: [number, number, number];
}

export interface PrintableSection {
  id: string;
  name: string;
  shortName: string;
  category: SectionCategory;
  uvRegion: UVRegion;
  aspectRatio: number; // width / height for 2D editor canvas
  cameraView: CameraViewConfig;
  printCost: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  description: string;
  modelUrl: string;
  basePrice: number;
  dimensions: {
    width: string;
    depth: string;
    height: string;
    coverageSqFt: number;
  };
  weightLbs: number;
}

export interface HardwareOption {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'frame' | 'accessory';
  defaultSelected?: boolean;
}

export interface ColorOption {
  name: string;
  hex: string;
  pantone?: string;
}

export interface ProductDefinition {
  id: string;
  name: string;
  tagline: string;
  basePrice: number;
  variants: ProductVariant[];
  availableColors: ColorOption[];
  hardwareOptions: HardwareOption[];
  sections: PrintableSection[];
}

export type LayerType = 'text' | 'image';

export interface BaseLayer {
  id: string;
  type: LayerType;
  x: number; // Center percentage (0-100) or pixel
  y: number;
  scale: number;
  rotation: number; // Degrees
  opacity: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  isBold?: boolean;
  isItalic?: boolean;
  align?: 'left' | 'center' | 'right';
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  fileName: string;
  aspectRatio: number;
}

export type CustomizationLayer = TextLayer | ImageLayer;

export interface SectionCustomization {
  backgroundColor?: string;
  layers: CustomizationLayer[];
}

export interface CustomerConfiguration {
  productId: string;
  variantId: string;
  baseColor: string;
  selectedHardwareIds: string[];
  sections: Record<string, SectionCustomization>;
}

export interface PricingBreakdown {
  variantBasePrice: number;
  hardwareAddonsTotal: number;
  customPrintSectionsTotal: number;
  printCostPerSection: number;
  customSectionsCount: number;
  subtotal: number;
  currency: string;
  itemizedSummary: {
    label: string;
    amount: number;
  }[];
}

export interface ShopifyLineItemProperties {
  _config_id: string;
  _pdf_summary_url?: string;
  _preview_thumbnail?: string;
  'Size & Variant': string;
  'Base Color': string;
  'Hardware Tier': string;
  'Accessories Included': string;
  'Custom Print Sections': string;
  [key: string]: string | undefined;
}

export interface ShopifyCartPayload {
  items: {
    id: number;
    quantity: number;
    properties: ShopifyLineItemProperties;
  }[];
}

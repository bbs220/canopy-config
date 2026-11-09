export type SectionCategory = 'peak' | 'valance' | 'wall';

export type UVRegion = {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
};

export type CameraViewConfig = {
  position: [number, number, number];
  target: [number, number, number];
};

export type PrintableSection = {
  id: string;
  name: string;
  shortName: string;
  category: SectionCategory;
  uvRegion: UVRegion;
  // width divided by height for twod editor canvas
  aspectRatio: number;
  cameraView: CameraViewConfig;
  printCost: number;
};

export type ProductVariant = {
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
};

export type HardwareOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'frame' | 'accessory';
  defaultSelected?: boolean;
};

export type ColorOption = {
  name: string;
  hex: string;
  pantone?: string;
};

export type ProductDefinition = {
  id: string;
  name: string;
  tagline: string;
  basePrice: number;
  variants: ProductVariant[];
  availableColors: ColorOption[];
  hardwareOptions: HardwareOption[];
  sections: PrintableSection[];
};

export type LayerType = 'text' | 'image';

export type BaseLayer = {
  id: string;
  type: LayerType;
  // center percentage zero to one hundred or pixel
  x: number;
  y: number;
  scale: number;
  // degrees
  rotation: number;
  opacity: number;
};

export type TextLayer = BaseLayer & {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  isBold?: boolean;
  isItalic?: boolean;
  align?: 'left' | 'center' | 'right';
};

export type ImageLayer = BaseLayer & {
  type: 'image';
  src: string;
  fileName: string;
  aspectRatio: number;
};

export type CustomizationLayer = TextLayer | ImageLayer;

export type SectionCustomization = {
  backgroundColor?: string;
  layers: CustomizationLayer[];
};

export type CustomerConfiguration = {
  productId: string;
  variantId: string;
  baseColor: string;
  selectedHardwareIds: string[];
  sections: Record<string, SectionCustomization>;
};

export type PricingBreakdown = {
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
};

export type ShopifyLineItemProperties = {
  _config_id: string;
  _pdf_summary_url?: string;
  _preview_thumbnail?: string;
  'Size & Variant': string;
  'Base Color': string;
  'Hardware Tier': string;
  'Accessories Included': string;
  'Custom Print Sections': string;
  [key: string]: string | undefined;
};

export type ShopifyCartPayload = {
  items: {
    id: number;
    quantity: number;
    properties: ShopifyLineItemProperties;
  }[];
};

import type { CustomerConfiguration, PricingBreakdown, ProductDefinition, ShopifyCartPayload } from '../types/configurator';

export class ShopifyService {
  /**
   * Generates standard Shopify Line Item Properties and cart payload formatted for `/cart/add.js`
   */
  static buildCartPayload(
    config: CustomerConfiguration,
    product: ProductDefinition,
    pricing: PricingBreakdown,
    previewThumbnailUrl?: string
  ): ShopifyCartPayload {
    const variant = product.variants.find((v) => v.id === config.variantId) || product.variants[0];
    const selectedColor = product.availableColors.find((c) => c.hex === config.baseColor);

    const hardwareNames = config.selectedHardwareIds
      .map((id) => product.hardwareOptions.find((h) => h.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    const customizedSectionNames = Object.entries(config.sections)
      .filter(([, data]) => data.layers && data.layers.length > 0)
      .map(([id]) => product.sections.find((s) => s.id === id)?.name || id)
      .join(', ');

    // Generate unique configuration ID for factory traceability
    const configId = 'CFG-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    // Mock Shopify variant numeric ID (in production, mapped to Shopify Admin variant inventory IDs)
    const mockShopifyVariantId = variant.id === 'tent-5x5' ? 440192019 : variant.id === 'tent-6.5x6.5' ? 440192020 : 440192021;

    return {
      items: [
        {
          id: mockShopifyVariantId,
          quantity: 1,
          properties: {
            _config_id: configId,
            _preview_thumbnail: previewThumbnailUrl || '',
            'Size & Variant': `${variant.name} (${variant.dimensions.width} x ${variant.dimensions.depth})`,
            'Base Color': `${selectedColor?.name || 'Custom'} (${config.baseColor})`,
            'Hardware Tier': hardwareNames || 'Standard',
            'Accessories Included': config.selectedHardwareIds.length ? hardwareNames : 'None',
            'Custom Print Sections': customizedSectionNames || 'Blank / Unprinted',
            'Dynamic Total': `$${pricing.subtotal.toFixed(2)} ${pricing.currency}`,
          },
        },
      ],
    };
  }

  /**
   * Dispatches the cart payload to parent window if running inside an iframe (e.g. embedded on Shopify PDP)
   */
  static dispatchToHostStore(payload: ShopifyCartPayload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'SHOPIFY_ADD_TO_CART',
          payload,
          timestamp: Date.now(),
        },
        '*'
      );
      console.info('[Shopify Bridge] Dispatched cart payload to host window via postMessage:', payload);
    }
  }

  /**
   * Listens for inbound messages from parent Shopify window (e.g. host updating product variant or theme)
   */
  static listenToHostMessages(onMessage: (data: unknown) => void) {
    const handler = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object' && 'type' in event.data) {
        onMessage(event.data);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }
}

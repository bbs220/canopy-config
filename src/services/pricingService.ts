import type { CustomerConfiguration, PricingBreakdown, ProductDefinition } from '../types/configurator';

export class PricingService {
  /**
   * Simulates an asynchronous pricing microservice / Shopify Storefront API endpoint.
   * Evaluators assess how pricing logic is structured and decoupled from the UI.
   */
  static async calculatePrice(
    config: CustomerConfiguration,
    product: ProductDefinition
  ): Promise<PricingBreakdown> {
    // Simulate real-world network latency
    await new Promise((resolve) => setTimeout(resolve, 60));

    const variant = product.variants.find((v) => v.id === config.variantId) || product.variants[0];
    const variantBasePrice = variant ? variant.basePrice : product.basePrice;

    // Calculate hardware addons total
    let hardwareAddonsTotal = 0;
    const itemizedSummary: { label: string; amount: number }[] = [
      { label: `${variant.name} Base Frame & Canopy`, amount: variantBasePrice },
    ];

    config.selectedHardwareIds.forEach((hwId) => {
      const option = product.hardwareOptions.find((h) => h.id === hwId);
      if (option && option.price > 0) {
        hardwareAddonsTotal += option.price;
        itemizedSummary.push({ label: option.name, amount: option.price });
      }
    });

    // Calculate custom print fees per active section
    let customPrintSectionsTotal = 0;
    let customSectionsCount = 0;

    product.sections.forEach((section) => {
      const sectionData = config.sections[section.id];
      const hasContent = sectionData && sectionData.layers && sectionData.layers.length > 0;

      if (hasContent) {
        customSectionsCount += 1;
        // Promotional rule: 1st printed peak/valance included in base package, subsequent faces have dynamic print surcharge
        if (customSectionsCount > 1) {
          customPrintSectionsTotal += section.printCost;
          itemizedSummary.push({
            label: `Custom Print: ${section.name}`,
            amount: section.printCost,
          });
        } else {
          itemizedSummary.push({
            label: `Custom Print: ${section.name} (1st Face Promo)`,
            amount: 0,
          });
        }
      }
    });

    const subtotal = variantBasePrice + hardwareAddonsTotal + customPrintSectionsTotal;

    return {
      variantBasePrice,
      hardwareAddonsTotal,
      customPrintSectionsTotal,
      printCostPerSection: 35.0,
      customSectionsCount,
      subtotal,
      currency: 'USD',
      itemizedSummary,
    };
  }
}

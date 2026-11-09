import { jsPDF } from 'jspdf';
import type { CustomerConfiguration, PricingBreakdown, ProductDefinition } from '../types/configurator';

export class PDFService {
  // compiles a high resolution production pdf spec sheet containing
  // order details and shopify reference
  // threed webgl render snapshots
  // twod print layouts and typography specifications
  // bill of materials and pricing breakdown
  // factory production approval sign off
  static async generateProductionSummary(
    config: CustomerConfiguration,
    product: ProductDefinition,
    pricing: PricingBreakdown,
    snapshots: { isometric?: string; front?: string; back?: string }
  ): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const variant = product.variants.find((v) => v.id === config.variantId) || product.variants[0];
    const baseColorObj = product.availableColors.find((c) => c.hex.toLowerCase() === config.baseColor.toLowerCase());

    const orderId = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // header bar
    // slate color
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CUSTOM CANOPY TENT — PRODUCTION SPECIFICATION PROOF', 14, 15);

    // order metadata box
    let currentY = 31;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. Product Configuration & Hardware', 14, currentY);

    const selectedHardware = config.selectedHardwareIds
      .map((id) => product.hardwareOptions.find((h) => h.id === id)?.name)
      .filter((name): name is string => Boolean(name))
      .map((name) => name.replace(/^Commercial\s+/, '').replace(/^Heavy-Duty\s+/, ''));

    const hardwareItems = selectedHardware.length > 0 ? selectedHardware : ['Standard Steel Frame'];
    const extraRows = Math.max(0, hardwareItems.length - 1);
    const boxHeight = 34 + extraRows * 5;

    currentY += 3.5;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, boxHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Reference ID:', 18, currentY + 5);
    doc.text('Order Date:', 18, currentY + 10);
    doc.text('Selected Variant:', 18, currentY + 15);
    doc.text('Dimensions:', 18, currentY + 20);
    doc.text('Canopy Base Color:', 18, currentY + 25);
    doc.text('Selected Hardware:', 18, currentY + 30);

    doc.setFont('helvetica', 'normal');
    doc.text(orderId, 55, currentY + 5);
    doc.text(dateStr, 55, currentY + 10);
    doc.text(`${variant.name} (SKU: CANOPY-${variant.id.toUpperCase()})`, 55, currentY + 15);
    doc.text(`${variant.dimensions.width} x ${variant.dimensions.depth} • Height: ${variant.dimensions.height}`, 55, currentY + 20);
    doc.text(`${baseColorObj?.name || 'Custom'} (${config.baseColor}) ${baseColorObj?.pantone ? `[${baseColorObj.pantone}]` : ''}`, 55, currentY + 25);

    hardwareItems.forEach((item, index) => {
      doc.text(`• ${item}`, 55, currentY + 30 + index * 5, { maxWidth: 135 });
    });

    // multi angle threed product snapshots
    currentY += boxHeight + 9.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. 3D Visual Rendering (Multi-Angle Preview)', 14, currentY);

    currentY += 3.5;
    const heroImgWidth = 110;
    const heroImgHeight = 70;

    if (snapshots.isometric) {
      doc.addImage(snapshots.isometric, 'PNG', 14, currentY, heroImgWidth, heroImgHeight);
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, currentY, heroImgWidth, heroImgHeight);
    }

    // side smaller snapshots
    const thumbWidth = 68;
    const thumbHeight = 33;
    if (snapshots.front) {
      doc.addImage(snapshots.front, 'PNG', 128, currentY, thumbWidth, thumbHeight);
      doc.rect(128, currentY, thumbWidth, thumbHeight);
      doc.setFontSize(8);
      doc.text('Front Elevation', 130, currentY + thumbHeight - 2);
    }
    if (snapshots.back) {
      doc.addImage(snapshots.back, 'PNG', 128, currentY + 37, thumbWidth, thumbHeight);
      doc.rect(128, currentY + 37, thumbWidth, thumbHeight);
      doc.setFontSize(8);
      doc.text('Back Elevation', 130, currentY + 37 + thumbHeight - 2);
    }

    // custom artwork and face breakdown
    currentY += heroImgHeight + 9.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. Custom Print Locations & Artwork Manifest', 14, currentY);

    const sec3BoxHeight = 32;
    currentY += 3.5;
    doc.setFillColor(248, 250, 252);
    doc.rect(14, currentY, 182, sec3BoxHeight, 'FD');

    let printY = currentY + 6;
    doc.setFontSize(9);

    const customizedSections = Object.entries(config.sections).filter(
      ([, data]) => data.layers && data.layers.length > 0
    );

    if (customizedSections.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.text('No custom text or logos uploaded (Solid unprinted canopy top)', 18, printY);
    } else {
      customizedSections.forEach(([secId, data]) => {
        const secDef = product.sections.find((s) => s.id === secId);
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${secDef?.name || secId}:`, 18, printY);

        doc.setFont('helvetica', 'normal');
        const layerDescriptions = data.layers
          .map((l) => (l.type === 'text' ? `Text: "${l.text}" (${l.color}, ${l.fontFamily})` : `Logo: "${l.fileName}" (Scale: ${Math.round(l.scale * 100)}%)`))
          .join(' | ');

        doc.text(layerDescriptions.substring(0, 75), 52, printY);
        printY += 6;
      });
    }

    // bill of materials and pricing table
    currentY += sec3BoxHeight + 9.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. Bill of Materials & Pricing Handoff', 14, currentY);

    currentY += 3.5;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY, 182, 6, 'F');
    doc.setFontSize(8);
    doc.text('ITEM DESCRIPTION', 18, currentY + 4);
    doc.text('PRICE', 170, currentY + 4);

    let bomY = currentY + 10;
    pricing.itemizedSummary.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.text(item.label, 18, bomY);
      doc.text(item.amount === 0 ? 'INCLUDED' : `$${item.amount.toFixed(2)}`, 170, bomY);
      bomY += 5;
    });

    doc.line(14, bomY, 196, bomY);
    bomY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PRE-TAX ORDER AMOUNT:', 18, bomY);
    doc.text(`$${pricing.subtotal.toFixed(2)} ${pricing.currency}`, 170, bomY);

    // sign off approval box
    const footerY = 270;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, footerY, 196, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Customer Proof Sign-off: _______________________________   Approval Date: ___________________', 14, footerY + 7);
    doc.text('MVP Visuals Certified Dye-Sublimation Print Quality • CPAI-84 Fire-Retardant Fabric Compliant', 14, footerY + 12);

    return doc.output('blob');
  }
}

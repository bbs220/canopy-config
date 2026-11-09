import type { CustomizationLayer, SectionCustomization, PrintableSection } from '../types/configurator';

export const MASTER_TEXTURE_SIZE = 2048;

/**
 * Manages the offscreen master 2048x2048 canvas atlas that is bound to Three.js CanvasTexture.
 */
export class TextureAtlasEngine {
  private masterCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private loadedImages: Map<string, HTMLImageElement> = new Map();

  constructor() {
    this.masterCanvas = document.createElement('canvas');
    this.masterCanvas.width = MASTER_TEXTURE_SIZE;
    this.masterCanvas.height = MASTER_TEXTURE_SIZE;
    const context = this.masterCanvas.getContext('2d');
    if (!context) throw new Error('Failed to create master canvas 2d context');
    this.ctx = context;

    // Fill with default white
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, MASTER_TEXTURE_SIZE, MASTER_TEXTURE_SIZE);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.masterCanvas;
  }

  /**
   * Pre-loads an image source so it can be drawn synchronously during render
   */
  public async preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.loadedImages.has(src)) {
      return this.loadedImages.get(src)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.loadedImages.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Renders layers for a single section onto an isolated virtual canvas (1024x1024)
   */
  public renderSectionToCanvas(
    customization: SectionCustomization,
    baseColor: string,
    width = 1024,
    height = 1024
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background color
    ctx.fillStyle = customization.backgroundColor || baseColor;
    ctx.fillRect(0, 0, width, height);

    // Draw layers from bottom to top
    for (const layer of customization.layers) {
      this.drawLayer(ctx, layer, width, height);
    }

    return canvas;
  }

  /**
   * Draws a single vector/raster layer
   */
  public drawLayer(
    ctx: CanvasRenderingContext2D,
    layer: CustomizationLayer,
    canvasWidth: number,
    canvasHeight: number
  ) {
    ctx.save();

    // Map percentage position (0-100) to canvas coordinates
    const posX = (layer.x / 100) * canvasWidth;
    const posY = (layer.y / 100) * canvasHeight;

    ctx.translate(posX, posY);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.globalAlpha = layer.opacity ?? 1.0;

    if (layer.type === 'text') {
      const fontSize = (layer.fontSize / 100) * canvasHeight;
      const weight = layer.isBold ? 'bold' : 'normal';
      const style = layer.isItalic ? 'italic' : 'normal';
      ctx.font = `${style} ${weight} ${fontSize}px ${layer.fontFamily || 'Inter, sans-serif'}`;
      ctx.fillStyle = layer.color || '#FFFFFF';
      ctx.textAlign = layer.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(layer.text, 0, 0);
    } else if (layer.type === 'image') {
      const img = this.loadedImages.get(layer.src);
      if (img && img.complete) {
        // Base image width based on scale
        const baseWidth = (canvasWidth * 0.4) * layer.scale;
        const baseHeight = baseWidth / (layer.aspectRatio || 1);
        ctx.drawImage(img, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);
      }
    }

    ctx.restore();
  }

  /**
   * Bakes all sections into the master 2048x2048 UV texture atlas
   */
  public async bakeAtlas(
    sections: PrintableSection[],
    sectionCustomizations: Record<string, SectionCustomization>,
    baseColor: string
  ): Promise<HTMLCanvasElement> {
    const ctx = this.ctx;

    // Fill entire base canopy fabric
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, MASTER_TEXTURE_SIZE, MASTER_TEXTURE_SIZE);

    // Preload any pending image layers first
    for (const data of Object.values(sectionCustomizations)) {
      if (data.layers) {
        for (const layer of data.layers) {
          if (layer.type === 'image' && layer.src && !this.loadedImages.has(layer.src)) {
            try {
              await this.preloadImage(layer.src);
            } catch (err) {
              console.warn('Failed to preload logo layer image:', err);
            }
          }
        }
      }
    }

    // Project each customized section onto its UV bounds
    for (const section of sections) {
      const customData = sectionCustomizations[section.id];
      const hasLayers = customData && customData.layers && customData.layers.length > 0;

      if (!hasLayers && !customData?.backgroundColor) {
        continue;
      }

      const { uMin, uMax, vMin, vMax } = section.uvRegion;

      // In Three.js with flipY=false, canvas coords match UV:
      // X = u * width
      // Y = v * height
      const targetX = uMin * MASTER_TEXTURE_SIZE;
      const targetY = vMin * MASTER_TEXTURE_SIZE;
      const targetW = (uMax - uMin) * MASTER_TEXTURE_SIZE;
      const targetH = (vMax - vMin) * MASTER_TEXTURE_SIZE;

      // Render section to a virtual high-res buffer
      const sectionCanvas = this.renderSectionToCanvas(customData, baseColor, 1024, 1024);

      // Blit section canvas into atlas
      ctx.drawImage(sectionCanvas, targetX, targetY, targetW, targetH);
    }

    return this.masterCanvas;
  }
}

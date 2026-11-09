import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { CustomizationLayer, SectionCustomization, PrintableSection, TextLayer, ImageLayer } from '../../types/configurator';
import {
  Type,
  Image as ImageIcon,
  Trash2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FaceEditor2DProps {
  section: PrintableSection;
  customization?: SectionCustomization;
  baseColor: string;
  onUpdateCustomization: (customization: SectionCustomization) => void;
}

const FONT_OPTIONS = [
  { label: 'Clean Sans (Inter)', value: 'Inter, sans-serif' },
  { label: 'Bold Athletic (Impact)', value: 'Impact, sans-serif' },
  { label: 'Modern Geometric (Montserrat)', value: 'Montserrat, sans-serif' },
  { label: 'Tall Condensed (Oswald)', value: 'Oswald, sans-serif' },
  { label: 'Classic Serif (Georgia)', value: 'Georgia, serif' },
];

export const FaceEditor2D: React.FC<FaceEditor2DProps> = ({
  section,
  customization = { layers: [] },
  baseColor,
  onUpdateCustomization,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const layers = useMemo(() => customization.layers || [], [customization.layers]);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  // Render 2D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = customization.backgroundColor || baseColor;
    ctx.fillRect(0, 0, width, height);

    // Subtle guide grid & margin boundary
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Render layers
    layers.forEach((layer) => {
      ctx.save();
      const posX = (layer.x / 100) * width;
      const posY = (layer.y / 100) * height;

      ctx.translate(posX, posY);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.globalAlpha = layer.opacity ?? 1.0;

      if (layer.type === 'text') {
        const fontSize = (layer.fontSize / 100) * height;
        const weight = layer.isBold ? 'bold' : 'normal';
        const style = layer.isItalic ? 'italic' : 'normal';
        ctx.font = `${style} ${weight} ${fontSize}px ${layer.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillStyle = layer.color || '#FFFFFF';
        ctx.textAlign = layer.align || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.text, 0, 0);

        // Highlight selection border
        if (layer.id === selectedLayerId) {
          const metrics = ctx.measureText(layer.text);
          const w = metrics.width + 16;
          const h = fontSize + 12;
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-w / 2, -h / 2, w, h);
        }
      } else if (layer.type === 'image') {
        const img = new Image();
        img.src = layer.src;
        if (img.complete) {
          const baseW = (width * 0.45) * layer.scale;
          const baseH = baseW / (layer.aspectRatio || 1);
          ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);

          if (layer.id === selectedLayerId) {
            ctx.strokeStyle = '#2563EB';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(-baseW / 2 - 4, -baseH / 2 - 4, baseW + 8, baseH + 8);
          }
        } else {
          img.onload = () => {
            onUpdateCustomization({ ...customization });
          };
        }
      }

      ctx.restore();
    });
  }, [customization, baseColor, layers, selectedLayerId, onUpdateCustomization]);

  // Add new Text Layer
  const handleAddText = () => {
    const newText: TextLayer = {
      id: 'txt_' + Math.random().toString(36).substring(2, 7),
      type: 'text',
      text: 'YOUR BRAND',
      fontFamily: 'Inter, sans-serif',
      fontSize: section.category === 'valance' ? 40 : 18,
      color: '#FFFFFF',
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      isBold: true,
      align: 'center',
    };

    const nextLayers = [...layers, newText];
    onUpdateCustomization({ ...customization, layers: nextLayers });
    setSelectedLayerId(newText.id);
    toast.success('Text added to ' + section.name);
  };

  // Add Image / Logo Layer
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image (PNG, JPG, SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const newImageLayer: ImageLayer = {
          id: 'img_' + Math.random().toString(36).substring(2, 7),
          type: 'image',
          src,
          fileName: file.name,
          aspectRatio,
          x: 50,
          y: 50,
          scale: 1.0,
          rotation: 0,
          opacity: 1,
        };

        const nextLayers = [...layers, newImageLayer];
        onUpdateCustomization({ ...customization, layers: nextLayers });
        setSelectedLayerId(newImageLayer.id);
        toast.success(`Logo "${file.name}" added`);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Update properties on the currently selected layer
  const updateSelectedLayer = (updates: Partial<CustomizationLayer>) => {
    if (!selectedLayerId) return;

    const nextLayers = layers.map((layer) => {
      if (layer.id === selectedLayerId) {
        return { ...layer, ...updates } as CustomizationLayer;
      }
      return layer;
    });

    onUpdateCustomization({ ...customization, layers: nextLayers });
  };

  // Delete layer
  const handleDeleteLayer = (id: string) => {
    const nextLayers = layers.filter((l) => l.id !== id);
    onUpdateCustomization({ ...customization, layers: nextLayers });
    if (selectedLayerId === id) setSelectedLayerId(null);
    toast.success('Layer deleted');
  };

  // Move layer order
  const handleMoveLayer = (direction: 'up' | 'down') => {
    if (!selectedLayerId) return;
    const index = layers.findIndex((l) => l.id === selectedLayerId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    const nextLayers = [...layers];
    const [moved] = nextLayers.splice(index, 1);
    nextLayers.splice(targetIndex, 0, moved);

    onUpdateCustomization({ ...customization, layers: nextLayers });
  };

  // Canvas Mouse Dragging Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedLayer) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDragging(true);
    setDragStart({ x: mouseX - selectedLayer.x, y: mouseY - selectedLayer.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !selectedLayer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const newX = Math.max(5, Math.min(95, currentX - dragStart.x));
    const newY = Math.max(5, Math.min(95, currentY - dragStart.y));

    updateSelectedLayer({ x: Math.round(newX), y: Math.round(newY) });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <div className="card bg-base-200/50 border border-base-300 p-3 space-y-3">
      {/* Section Header & Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-base-content flex items-center gap-1.5">
            <span>{section.name} 2D Editor</span>
            <span className="badge badge-primary badge-xs">Live 3D Sync</span>
          </div>
          <div className="text-[11px] text-base-content/60">
            {section.category === 'peak' ? 'High visibility peak banner' : 'Eye-level perimeter skirt'}
          </div>
        </div>

        {/* Action Buttons using DaisyUI btn */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddText}
            className="btn btn-sm btn-outline btn-primary gap-1 text-xs"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-sm btn-outline btn-secondary gap-1 text-xs"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload Logo</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            className="hidden"
          />
        </div>
      </div>

      {/* 2D Canvas Stage */}
      <div className="relative flex items-center justify-center p-3 bg-base-300/60 rounded-xl overflow-hidden border border-base-300">
        <canvas
          ref={canvasRef}
          width={section.category === 'valance' ? 700 : 400}
          height={section.category === 'valance' ? 140 : 350}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="max-w-full max-h-56 shadow-lg rounded-lg cursor-move border border-black/10"
        />

        {layers.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-base-content/40 gap-1">
            <Sparkles className="w-5 h-5 text-primary/40" />
            <span className="text-xs font-medium">Click "Add Text" or "Upload Logo" to design this face</span>
          </div>
        )}
      </div>

      {/* Selected Layer Customization Controls */}
      {selectedLayer ? (
        <div className="card bg-base-100 p-3 border border-base-300 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-base-content border-b border-base-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Editing: {selectedLayer.type === 'text' ? (selectedLayer as TextLayer).text : (selectedLayer as ImageLayer).fileName}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveLayer('up')}
                className="btn btn-ghost btn-xs"
                title="Bring Forward"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMoveLayer('down')}
                className="btn btn-ghost btn-xs"
                title="Send Backward"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteLayer(selectedLayer.id)}
                className="btn btn-ghost btn-xs text-error"
                title="Delete Layer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Text-Specific Properties */}
          {selectedLayer.type === 'text' && (
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-bold text-base-content/60 uppercase">Text String</label>
                <input
                  type="text"
                  value={(selectedLayer as TextLayer).text}
                  onChange={(e) => updateSelectedLayer({ text: e.target.value })}
                  className="input input-bordered input-sm w-full mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-base-content/60 uppercase">Font Family</label>
                  <select
                    value={(selectedLayer as TextLayer).fontFamily}
                    onChange={(e) => updateSelectedLayer({ fontFamily: e.target.value })}
                    className="select select-bordered select-sm w-full mt-1"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-base-content/60 uppercase">Text Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={(selectedLayer as TextLayer).color}
                      onChange={(e) => updateSelectedLayer({ color: e.target.value })}
                      className="w-8 h-8 rounded border border-base-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono">{(selectedLayer as TextLayer).color}</span>
                  </div>
                </div>
              </div>

              {/* Text formatting shortcuts */}
              <div className="flex items-center gap-1 pt-1">
                <button
                  onClick={() => updateSelectedLayer({ isBold: !(selectedLayer as TextLayer).isBold })}
                  className={`btn btn-xs ${
                    (selectedLayer as TextLayer).isBold ? 'btn-primary' : 'btn-outline'
                  }`}
                  title="Toggle Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSelectedLayer({ isItalic: !(selectedLayer as TextLayer).isItalic })}
                  className={`btn btn-xs ${
                    (selectedLayer as TextLayer).isItalic ? 'btn-primary' : 'btn-outline'
                  }`}
                  title="Toggle Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-base-300 mx-1" />

                <button
                  onClick={() => updateSelectedLayer({ align: 'left' })}
                  className={`btn btn-xs ${
                    (selectedLayer as TextLayer).align === 'left' ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSelectedLayer({ align: 'center' })}
                  className={`btn btn-xs ${
                    (selectedLayer as TextLayer).align === 'center' ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateSelectedLayer({ align: 'right' })}
                  className={`btn btn-xs ${
                    (selectedLayer as TextLayer).align === 'right' ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Transform Controls (Scale & Rotation) */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-base-200">
            <div>
              <div className="flex justify-between text-[10px] text-base-content/60 font-bold uppercase">
                <span>Scale</span>
                <span>{selectedLayer.type === 'text' ? `${(selectedLayer as TextLayer).fontSize}px` : `${Math.round(selectedLayer.scale * 100)}%`}</span>
              </div>
              <input
                type="range"
                min={selectedLayer.type === 'text' ? '8' : '0.2'}
                max={selectedLayer.type === 'text' ? '80' : '2.5'}
                step={selectedLayer.type === 'text' ? '1' : '0.05'}
                value={selectedLayer.type === 'text' ? (selectedLayer as TextLayer).fontSize : selectedLayer.scale}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (selectedLayer.type === 'text') {
                    updateSelectedLayer({ fontSize: val });
                  } else {
                    updateSelectedLayer({ scale: val });
                  }
                }}
                className="range range-primary range-xs w-full mt-1"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-base-content/60 font-bold uppercase">
                <span>Rotation</span>
                <span>{selectedLayer.rotation}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="5"
                value={selectedLayer.rotation}
                onChange={(e) => updateSelectedLayer({ rotation: parseInt(e.target.value) })}
                className="range range-primary range-xs w-full mt-1"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Layer List Selection Pills */
        layers.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-base-content/50">Select Layer:</span>
            {layers.map((l, idx) => (
              <button
                key={l.id}
                onClick={() => setSelectedLayerId(l.id)}
                className="badge badge-outline hover:badge-primary text-xs cursor-pointer py-2"
              >
                {l.type === 'text' ? `Text: "${(l as TextLayer).text.substring(0, 10)}..."` : `Logo ${idx + 1}`}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
};

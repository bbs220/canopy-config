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
  Check,
  Pencil,
  Pipette,
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import toast from 'react-hot-toast';

type FaceEditor2DProps = {
  section: PrintableSection;
  customization?: SectionCustomization;
  baseColor: string;
  onUpdateCustomization: (customization: SectionCustomization) => void;
};

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
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const layers = useMemo(() => customization.layers || [], [customization.layers]);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const currentTextColor =
    selectedLayer?.type === 'text'
      ? (selectedLayer as TextLayer).color || '#000000'
      : '#000000';

  // canvas dimensions matching section aspect ratio
  const canvasWidth = section.category === 'valance' ? 700 : 420;
  const canvasHeight = Math.round(
    canvasWidth / (section.aspectRatio || (section.category === 'valance' ? 5.9 : 1.4))
  );

  // render twod canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // background
    ctx.fillStyle = customization.backgroundColor || baseColor;
    ctx.fillRect(0, 0, width, height);

    // subtle guide grid and margin boundary
    if (section.category === 'valance') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, width - 20, height - 20);
    }

    // render layers
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
        ctx.fillStyle = layer.color || '#000000';
        ctx.textAlign = layer.align || 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.text, 0, 0);

        // highlight selection border
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

    // triangular safe print boundary for canopy peak
    if (section.category === 'peak') {
      const apexX = width * 0.5;
      const apexY = 0;

      // shaded clipped corner overlay for peak
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fill();

      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      for (let p = -height; p < width; p += 16) {
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p + height, height);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(width, 0);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fill();

      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      for (let p = -height; p < width * 2; p += 16) {
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p + height, height);
        ctx.stroke();
      }
      ctx.restore();

      // dotted boundary line along peak edges
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#F59E0B';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(apexX, apexY);
      ctx.lineTo(width, height);
      ctx.stroke();

      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillText('CLIPPED', width * 0.16, height * 0.35);
      ctx.fillText('CLIPPED', width * 0.84, height * 0.35);

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(apexX, 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('APEX', apexX, 16);
      ctx.restore();
    }
  }, [customization, baseColor, layers, selectedLayerId, onUpdateCustomization, section]);

  // add new text layer
  const handleAddText = () => {
    const newText: TextLayer = {
      id: 'txt_' + Math.random().toString(36).substring(2, 7),
      type: 'text',
      text: 'YOUR BRAND',
      fontFamily: 'Inter, sans-serif',
      fontSize: section.category === 'valance' ? 40 : 18,
      color: '#000000',
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

  // add image logo layer
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

  // update properties on the currently selected layer
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

  // delete layer
  const handleDeleteLayer = (id: string) => {
    const nextLayers = layers.filter((l) => l.id !== id);
    onUpdateCustomization({ ...customization, layers: nextLayers });
    if (selectedLayerId === id) setSelectedLayerId(null);
    toast.success('Layer deleted');
  };

  // move layer order
  const handleMoveLayer = (direction: 'up' | 'down', layerId?: string) => {
    const id = layerId || selectedLayerId;
    if (!id) return;
    const index = layers.findIndex((l) => l.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    const nextLayers = [...layers];
    const [moved] = nextLayers.splice(index, 1);
    nextLayers.splice(targetIndex, 0, moved);

    onUpdateCustomization({ ...customization, layers: nextLayers });
  };

  // canvas mouse dragging handlers
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
    <div className="card bg-base-200/50 border border-base-300 p-3 space-y-3 w-full max-w-full overflow-hidden">
      {/* section header and toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-bold text-base-content truncate">{section.name}</span>
          <span
            className={`badge badge-xs font-semibold shrink-0 ${
              section.category === 'peak' ? 'badge-warning' : 'badge-primary'
            }`}
          >
            {section.category === 'peak' ? 'Safe Zone' : 'Valance'}
          </span>
        </div>

        {/* action buttons using daisyui btn */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAddText}
            className="btn btn-xs sm:btn-sm btn-outline btn-primary gap-1 font-semibold"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-xs sm:btn-sm btn-outline btn-secondary gap-1 font-semibold"
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

      {/* twod canvas stage */}
      <div className="relative flex items-center justify-center p-3 bg-base-300/60 rounded-xl overflow-hidden border border-base-300 w-full max-w-full">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="max-w-full max-h-56 shadow-lg rounded-lg cursor-move border border-black/10 w-auto object-contain block"
        />
      </div>

      {/* empty layer design instruction */}
      {layers.length === 0 && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-base-content/60 py-1 select-none">
          <Sparkles className="w-3.5 h-3.5 text-primary/60" />
          <span>Click Add Text or Upload Logo to design this face</span>
        </div>
      )}

      {/* selected layer customization controls */}
      {selectedLayer ? (
        <div className="card bg-base-100 p-3 border border-base-300 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-base-content border-b border-base-200 pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">Editing: {selectedLayer.type === 'text' ? (selectedLayer as TextLayer).text : (selectedLayer as ImageLayer).fileName}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
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
              <button
                onClick={() => setSelectedLayerId(null)}
                className="btn btn-xs btn-primary gap-1 font-bold ml-1"
                title="Done editing layer"
              >
                <Check className="w-3 h-3" />
                <span>Done</span>
              </button>
            </div>
          </div>

          {/* text specific properties */}
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
                  <button
                    type="button"
                    onClick={() => setIsColorPickerOpen((prev) => !prev)}
                    className="flex items-center justify-between w-full h-8 mt-1 px-2.5 rounded-lg border border-base-300 bg-base-100 hover:border-primary/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                        style={{ backgroundColor: currentTextColor }}
                      />
                      <span className="text-xs font-mono font-bold uppercase truncate">
                        {currentTextColor}
                      </span>
                    </div>
                    <Pipette className="w-3.5 h-3.5 text-base-content/60 shrink-0" />
                  </button>
                </div>
              </div>

              {/* text color picker panel */}
              {isColorPickerOpen && (
                <div className="p-3 rounded-xl border border-base-300 bg-base-200/60 flex flex-col items-center gap-2.5 transition-all">
                  <div className="w-full flex justify-center">
                    <HexColorPicker
                      color={currentTextColor}
                      onChange={(hex) => updateSelectedLayer({ color: hex })}
                      style={{ width: '100%', maxWidth: '100%', height: '140px' }}
                    />
                  </div>
                  <div className="w-full flex items-center justify-between gap-1 pt-2 border-t border-base-300">
                    {['#000000', '#FFFFFF', '#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#9333EA'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateSelectedLayer({ color: preset })}
                        className={`w-5 h-5 rounded-full border border-black/20 shadow-xs transition-transform hover:scale-110 cursor-pointer ${
                          currentTextColor.toLowerCase() === preset.toLowerCase()
                            ? 'ring-2 ring-primary ring-offset-1'
                            : ''
                        }`}
                        style={{ backgroundColor: preset }}
                        title={preset}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* text formatting shortcuts */}
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

          {/* transform controls scale and rotation */}
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

          {/* done editing action button */}
          <button
            onClick={() => setSelectedLayerId(null)}
            className="btn btn-sm btn-outline btn-primary w-full gap-1.5 mt-2 font-bold"
          >
            <Check className="w-4 h-4" />
            <span>Done Editing Layer</span>
          </button>
        </div>
      ) : (
        /* layer list selection pills */
        layers.length > 0 && (
          <div className="card bg-base-100 p-3 border border-base-300 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-base-content border-b border-base-200 pb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Custom Layers ({layers.length})</span>
              </div>
              <span className="text-[10px] text-base-content/60 font-normal">
                Click any layer to edit
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {layers.map((l, idx) => {
                const isText = l.type === 'text';
                const textLayer = isText ? (l as TextLayer) : null;
                const imageLayer = !isText ? (l as ImageLayer) : null;

                return (
                  /* individual layer row item */
                  <div
                    key={l.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-base-200/60 hover:bg-base-200 transition-colors border border-base-300/50 cursor-pointer group"
                    onClick={() => setSelectedLayerId(l.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-base-300/80 flex items-center justify-center shrink-0">
                        {isText ? (
                          <Type className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-secondary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-base-content truncate">
                          {isText ? `"${textLayer?.text}"` : (imageLayer?.fileName || `Logo ${idx + 1}`)}
                        </p>
                        <p className="text-[10px] text-base-content/60 truncate">
                          {isText
                            ? `${textLayer?.fontFamily?.split(',')[0]} • ${textLayer?.fontSize}px`
                            : `Scale ${Math.round((imageLayer?.scale || 1) * 100)}% • ${imageLayer?.rotation || 0}°`}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleMoveLayer('up', l.id)}
                        disabled={idx === layers.length - 1}
                        className="btn btn-ghost btn-xs px-1 text-base-content/70 hover:text-base-content disabled:opacity-30"
                        title="Bring Forward"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveLayer('down', l.id)}
                        disabled={idx === 0}
                        className="btn btn-ghost btn-xs px-1 text-base-content/70 hover:text-base-content disabled:opacity-30"
                        title="Send Backward"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedLayerId(l.id)}
                        className="btn btn-xs btn-outline btn-primary gap-1 font-semibold px-2"
                        title="Edit Layer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteLayer(l.id)}
                        className="btn btn-ghost btn-xs px-1 text-error hover:bg-error/10"
                        title="Delete Layer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
};

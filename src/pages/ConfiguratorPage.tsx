import { useState, useEffect, useRef, useCallback } from "react";
import { useConfiguratorStore } from "../store/useConfiguratorStore";
import { Canvas3D, type Canvas3DRef } from "../components/3d/Canvas3D";
import { VariantPicker } from "../components/ui/VariantPicker";
import { ColorPicker } from "../components/ui/ColorPicker";
import { HardwareSelector } from "../components/ui/HardwareSelector";
import { SectionTabs } from "../components/ui/SectionTabs";
import { FaceEditor2D } from "../components/2d/FaceEditor2D";
import { PriceActionBar } from "../components/ui/PriceActionBar";
import { ShopifyPayloadModal } from "../components/ui/ShopifyPayloadModal";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { ShopifyService } from "../services/shopifyService";
import { PDFService } from "../services/pdfService";
import { TextureAtlasEngine } from "../utils/textureAtlas";
import type { ShopifyCartPayload } from "../types/configurator";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { ShieldCheck, LayoutTemplate } from "lucide-react";
import { useNavigate } from "react-router";

type ConfiguratorPageProps = {
  isEmbed?: boolean;
};

export function ConfiguratorPage({ isEmbed = false }: ConfiguratorPageProps) {
  const navigate = useNavigate();
  const canvas3DRef = useRef<Canvas3DRef>(null);
  const atlasEngineRef = useRef<TextureAtlasEngine>(new TextureAtlasEngine());

  // zustand store selectors
  const {
    product,
    selectedVariantId,
    baseColor,
    selectedHardwareIds,
    activeSectionId,
    sections,
    pricing,
    isLoadingPrice,
    setVariant,
    setBaseColor,
    toggleHardware,
    setActiveSection,
    updateSectionCustomization,
    getConfiguration,
  } = useConfiguratorStore();

  const [activeTab, setActiveTab] = useState<
    "size" | "color" | "print" | "hardware"
  >("print");
  const [shopifyModalPayload, setShopifyModalPayload] =
    useState<ShopifyCartPayload | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  const currentVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];
  const activeSection =
    product.sections.find((s) => s.id === activeSectionId) ||
    product.sections[0];

  // texture atlas bake and threed webgl synchronization
  const bakeDebounceTimerRef = useRef<number | null>(null);

  const triggerTextureBake = useCallback(() => {
    if (bakeDebounceTimerRef.current) {
      window.clearTimeout(bakeDebounceTimerRef.current);
    }

    bakeDebounceTimerRef.current = window.setTimeout(async () => {
      try {
        const atlasCanvas = await atlasEngineRef.current.bakeAtlas(
          product.sections,
          sections,
          baseColor,
        );
        if (canvas3DRef.current) {
          canvas3DRef.current.updateFabricTexture(atlasCanvas);
          canvas3DRef.current.updateBaseColor(baseColor);
        }
      } catch (err) {
        console.error("Failed to bake texture atlas:", err);
      }
    }, 40);
  }, [sections, baseColor, product.sections]);

  useEffect(() => {
    triggerTextureBake();
  }, [triggerTextureBake, selectedVariantId]);

  // add to cart action
  const handleAddToCart = async () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.8 },
      colors: ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6"],
    });

    const config = getConfiguration();

    let thumbnail = "";
    if (canvas3DRef.current) {
      thumbnail = await canvas3DRef.current.takeSnapshot("isometric");
    }

    const payload = ShopifyService.buildCartPayload(
      config,
      product,
      pricing,
      thumbnail,
    );
    ShopifyService.dispatchToHostStore(payload);

    setShopifyModalPayload(payload);
    toast.success("Configuration added to Shopify Cart!");
  };

  // download pdf production summary
  const handleDownloadPDF = async () => {
    if (!canvas3DRef.current) return;
    setIsGeneratingPDF(true);
    toast.loading("Capturing multi-angle 3D renders & generating proof...", {
      id: "pdf-toast",
    });

    try {
      const isometric = await canvas3DRef.current.takeSnapshot("isometric");
      const front = await canvas3DRef.current.takeSnapshot("front");
      const back = await canvas3DRef.current.takeSnapshot("back");

      const config = getConfiguration();
      const pdfBlob = await PDFService.generateProductionSummary(
        config,
        product,
        pricing,
        { isometric, front, back },
      );

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Canopy_Tent_Proof_${currentVariant.id.toUpperCase()}_${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Production PDF downloaded!", { id: "pdf-toast" });
    } catch (err) {
      console.error("PDF Generation failed:", err);
      toast.error("Failed to generate PDF", { id: "pdf-toast" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-base-200 text-base-content overflow-hidden font-sans">
      {/* daisyui navbar header hidden in embed mode */}
      {!isEmbed && (
        <header className="navbar bg-base-100 border-b border-base-300 px-4 min-h-14 h-14 shrink-0 z-40 justify-between shadow-xs">
          <div className="navbar-start gap-3 w-auto">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary font-black text-xs py-3 px-2 shadow-sm">
                3D
              </span>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-base-content">
                MVP Visuals Configurator
              </span>
            </div>

            <div className="hidden sm:inline-flex badge badge-outline badge-sm gap-1 text-[11px] font-medium opacity-80">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>600D Dye-Sublimation</span>
            </div>
          </div>

          <div className="navbar-end gap-2 w-auto">
            {/* theme controller selector */}
            <ThemeToggle />

            {/* shopify iframe preview route button */}
            <button
              onClick={() => navigate("/shopify-preview")}
              className="btn btn-outline btn-primary btn-sm gap-1.5 text-xs font-semibold"
              title="Preview inside a mock Shopify storefront via <iframe>"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shopify Preview</span>
            </button>
          </div>
        </header>
      )}

      {/* main studio viewport split layout threed left controls right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* threed webgl canvas container */}
        <div className="flex-1 relative bg-base-300/40 overflow-hidden h-1/2 lg:h-full">
          <Canvas3D
            ref={canvas3DRef}
            modelUrl={currentVariant.modelUrl}
            baseColor={baseColor}
            activeSectionId={activeSectionId}
          />
        </div>

        {/* right customization drawer with daisyui card tabs */}
        <div className="w-full lg:w-120 xl:w-130 bg-base-100 border-l border-base-300 flex flex-col shrink-0 h-1/2 lg:h-full overflow-hidden shadow-xl z-20">
          {/* daisyui tabs header */}
          <div className="p-2 border-b border-base-300 bg-base-200/50 shrink-0">
            <div className="tabs tabs-box w-full grid grid-cols-4">
              <button
                onClick={() => setActiveTab("print")}
                className={`tab tab-sm font-bold text-xs ${activeTab === "print" ? "tab-active" : ""}`}
              >
                1. Artwork
              </button>
              <button
                onClick={() => setActiveTab("size")}
                className={`tab tab-sm font-bold text-xs ${activeTab === "size" ? "tab-active" : ""}`}
              >
                2. Size
              </button>
              <button
                onClick={() => setActiveTab("color")}
                className={`tab tab-sm font-bold text-xs ${activeTab === "color" ? "tab-active" : ""}`}
              >
                3. Color
              </button>
              <button
                onClick={() => setActiveTab("hardware")}
                className={`tab tab-sm font-bold text-xs ${activeTab === "hardware" ? "tab-active" : ""}`}
              >
                4. Hardware
              </button>
            </div>
          </div>

          {/* active tab content panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {activeTab === "print" && (
              <div className="space-y-4">
                <SectionTabs
                  sections={product.sections}
                  activeSectionId={activeSectionId}
                  sectionCustomizations={sections}
                  onSelectSection={(id) => {
                    setActiveSection(id);
                    canvas3DRef.current?.focusSection(id);
                  }}
                />

                <FaceEditor2D
                  key={activeSection.id}
                  section={activeSection}
                  customization={sections[activeSection.id]}
                  baseColor={baseColor}
                  onUpdateCustomization={(c) =>
                    updateSectionCustomization(activeSection.id, c)
                  }
                />
              </div>
            )}

            {activeTab === "size" && (
              <VariantPicker
                variants={product.variants}
                selectedVariantId={selectedVariantId}
                onSelectVariant={(id) => {
                  setVariant(id);
                  toast.success(
                    `Switched to ${product.variants.find((v) => v.id === id)?.name}`,
                  );
                }}
              />
            )}

            {activeTab === "color" && (
              <ColorPicker
                colors={product.availableColors}
                selectedColor={baseColor}
                onSelectColor={(hex) => setBaseColor(hex)}
              />
            )}

            {activeTab === "hardware" && (
              <HardwareSelector
                options={product.hardwareOptions}
                selectedIds={selectedHardwareIds}
                onToggleOption={toggleHardware}
              />
            )}
          </div>
        </div>
      </div>

      {/* sticky bottom pricing and action bar */}
      <PriceActionBar
        pricing={pricing}
        isLoadingPrice={isLoadingPrice}
        onAddToCart={handleAddToCart}
        onDownloadPDF={handleDownloadPDF}
        isGeneratingPDF={isGeneratingPDF}
      />

      {/* shopify cart payload inspector modal */}
      <ShopifyPayloadModal
        isOpen={Boolean(shopifyModalPayload)}
        onClose={() => setShopifyModalPayload(null)}
        payload={shopifyModalPayload}
      />
    </div>
  );
}

export default ConfiguratorPage;

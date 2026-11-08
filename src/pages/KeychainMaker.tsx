import React, { useState, useRef, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Center, Float } from "@react-three/drei";
import * as THREE from "three";
import { 
  KeyRound, Sparkles, Download, Upload, Palette, Layers, Settings, 
  Sliders, Eye, EyeOff, RotateCcw, Check, Image as ImageIcon,
  CheckCircle2, AlertCircle, Info, ShieldCheck, Box, Shapes,
  RefreshCw, Copy, FileText, ChevronRight, ChevronLeft, Plus,
  Trash2, SlidersHorizontal, Lock, Unlock, ArrowUpDown, Move,
  CircleDot, HelpCircle, Package, FileArchive, DownloadCloud, Wand2
} from "lucide-react";
import { 
  KeychainConfig, 
  ColorLayerConfig, 
  BaseShapeType, 
  LoopPosition, 
  LoopStyle,
  KEYCHAIN_PRESETS, 
  KeychainPreset,
  processImageToMulticolorSvg,
  buildKeychainGeometries,
  exportKeychainTo3MF,
  exportKeychainToMultiStlZip,
  exportKeychainToSingleSTL
} from "../utils/keychainEngine";

// Popular 3D Filament Color Presets (Bambu PLA / Prusament)
const POPULAR_FILAMENTS = [
  { name: "Preto Fosco (Charcoal)", hex: "#18181B" },
  { name: "Branco Puro (Jade White)", hex: "#FFFFFF" },
  { name: "Vermelho Rubi (Crimson)", hex: "#EF4444" },
  { name: "Amarelo Girassol (Sunflower)", hex: "#FACC15" },
  { name: "Azul Cobalto (Royal Blue)", hex: "#2563EB" },
  { name: "Verde Bambu (Emerald)", hex: "#10B981" },
  { name: "Laranja Neon (Sunset)", hex: "#F97316" },
  { name: "Roxo Cyber (Purple)", hex: "#8B5CF6" },
  { name: "Ciano Brilhante (Cyan)", hex: "#00E5FF" },
  { name: "Rosa Sakura (Pink)", hex: "#EC4899" },
  { name: "Dourado Seda (Gold Silk)", hex: "#D97706" },
  { name: "Cinza Metálico (Silver)", hex: "#71717A" },
];

export default function KeychainMaker() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"image" | "layers" | "base" | "loop" | "export">("image");
  const [selectedPreset, setSelectedPreset] = useState<string>("retro_gamepad");
  const [notification, setNotification] = useState<string | null>(null);

  // Source & Vectorization State
  const [sourceType, setSourceType] = useState<"preset" | "upload">("preset");
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [currentSvgString, setCurrentSvgString] = useState<string>(KEYCHAIN_PRESETS[0].svg);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [colorCountOption, setColorCountOption] = useState<number>(4);
  const [removeBgOption, setRemoveBgOption] = useState<boolean>(true);
  const [bgModeOption, setBgModeOption] = useState<"smart" | "keep_all" | "remove_white">("smart");
  const [blurOption, setBlurOption] = useState<number>(0);
  const [pathOmitOption, setPathOmitOption] = useState<number>(4);

  // Model & Keychain Configuration
  const [config, setConfig] = useState<KeychainConfig>({
    targetWidth: 50,
    targetHeight: 65,
    keepAspectRatio: true,

    baseShape: "contour",
    baseThickness: 2.2,
    baseColor: "#18181B",
    contourMargin: 2.5,
    contourSmoothing: 3,
    fillContourHoles: true,
    autoContourOnImport: true,
    baseBorderRadius: 4,
    hasRaisedBorder: false,
    raisedBorderHeight: 0.8,
    raisedBorderWidth: 1.5,
    raisedBorderColor: "#FACC15",

    loopStyle: "external_tab",
    loopPosition: "top_center",
    loopCustomX: 0,
    loopCustomY: 0,
    loopHoleDiameter: 4.2,
    loopWallThickness: 2.8,
    loopHeight: 2.2,

    colorCount: 4,
    colorMode: "embossed",
    layers: KEYCHAIN_PRESETS[0].defaultColors.map((dc, idx) => ({
      id: `layer_${idx + 1}`,
      name: dc.name,
      hex: dc.hex,
      originalHex: dc.hex,
      pixelCount: 100,
      percentage: 25,
      extrusionHeight: dc.height,
      isFlush: false,
      visible: true,
      amsSlot: dc.amsSlot,
      svgPaths: [dc.hex]
    })),
    removeBackground: true,
    backgroundColor: "#FFFFFF",
    tolerance: 20,

    hasBackText: false,
    backText: "VÉRTICE 3D",
    backTextSize: 8,
    backTextDepth: 0.6,
    backTextEngraved: true,

    showSplitRing: false,
    showWireframe: false,
    splitRingColor: "#D4D4D8"
  });

  // 3D Viewport Controls
  const [sliceHeight, setSliceHeight] = useState<number>(10);
  const [cameraView, setCameraView] = useState<"isometric" | "top" | "front" | "side">("isometric");
  const [customFileName, setCustomFileName] = useState<string>("meu_chaveiro_3d");
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification helper
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Switch Preset
  const handleSelectPreset = (preset: KeychainPreset) => {
    setSelectedPreset(preset.id);
    setSourceType("preset");
    setUploadedImagePreview(null);
    setCurrentSvgString(preset.svg);

    setConfig(prev => ({
      ...prev,
      baseShape: preset.defaultBaseShape,
      layers: preset.defaultColors.map((dc, idx) => ({
        id: `layer_${idx + 1}`,
        name: dc.name,
        hex: dc.hex,
        originalHex: dc.hex,
        pixelCount: 100,
        percentage: Math.round(100 / preset.defaultColors.length),
        extrusionHeight: dc.height,
        isFlush: false,
        visible: true,
        amsSlot: dc.amsSlot,
        svgPaths: [dc.hex]
      }))
    }));

    notify(`Preset "${preset.name}" carregado com sucesso!`);
  };

  // Upload Custom Image (PNG, JPG, WebP, SVG)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setCustomFileName(`chaveiro_${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`);

    setIsProcessing(true);
    notify("Processando e vetorizando imagem em camadas multicolor...");

    try {
      if (ext === "svg") {
        // Direct SVG import
        const text = await file.text();
        setCurrentSvgString(text);
        setSourceType("upload");
        setUploadedImagePreview(URL.createObjectURL(file));

        // Generate layers from SVG
        const res = await processImageToMulticolorSvg(URL.createObjectURL(file), {
          colorCount: colorCountOption,
          removeBackground: removeBgOption,
          bgMode: bgModeOption,
          pathOmit: pathOmitOption,
          blurRadius: blurOption
        });

        setConfig(prev => ({
          ...prev,
          layers: res.layers,
          ...(prev.autoContourOnImport !== false ? { baseShape: "contour" as BaseShapeType } : {})
        }));
        notify("Arquivo SVG carregado com silhueta e segmentado em camadas!");
      } else {
        // Bitmap Image (PNG, JPG, WebP) -> Vectorize
        const previewUrl = URL.createObjectURL(file);
        setUploadedImagePreview(previewUrl);
        setSourceType("upload");

        const res = await processImageToMulticolorSvg(previewUrl, {
          colorCount: colorCountOption,
          removeBackground: removeBgOption,
          bgMode: bgModeOption,
          pathOmit: pathOmitOption,
          blurRadius: blurOption
        });

        setCurrentSvgString(res.svgString);
        setConfig(prev => ({
          ...prev,
          layers: res.layers,
          ...(prev.autoContourOnImport !== false ? { baseShape: "contour" as BaseShapeType } : {})
        }));
        notify(`Imagem vetorizada com sucesso em ${res.layers.length} camadas! Silhueta gerada.`);
      }
    } catch (err) {
      console.error("Erro no processamento da imagem:", err);
      notify("Erro ao vetorizar imagem. Tente uma imagem com cores contrastantes.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Re-process current image with new settings
  const handleReprocessImage = async () => {
    if (!uploadedImagePreview) {
      notify("Nenhuma imagem importada para reprocessar.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await processImageToMulticolorSvg(uploadedImagePreview, {
        colorCount: colorCountOption,
        removeBackground: removeBgOption,
        bgMode: bgModeOption,
        pathOmit: pathOmitOption,
        blurRadius: blurOption
      });

      setCurrentSvgString(res.svgString);
      setConfig(prev => ({
        ...prev,
        layers: res.layers
      }));
      notify(`Imagem reprocessada com ${res.layers.length} camadas!`);
    } catch (err) {
      console.error(err);
      notify("Falha ao reprocessar imagem.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate 3D Geometries
  const { baseGeometry, borderGeometry, loopGeometry, colorGeometries, overallBounds } = useMemo(() => {
    try {
      return buildKeychainGeometries(currentSvgString, config);
    } catch (err) {
      console.error("Erro gerando geometrias 3D:", err);
      return {
        baseGeometry: null,
        borderGeometry: null,
        loopGeometry: null,
        colorGeometries: [],
        overallBounds: { minX: -25, maxX: 25, minY: -30, maxY: 30, depth: 3 }
      };
    }
  }, [currentSvgString, config]);

  // Handle Layer Changes
  const updateLayer = (id: string, updates: Partial<ColorLayerConfig>) => {
    setConfig(prev => ({
      ...prev,
      layers: prev.layers.map(l => (l.id === id ? { ...l, ...updates } : l))
    }));
  };

  // Quick Action: Step Heights (Escalonar Alturas)
  const applySteppedHeights = () => {
    setConfig(prev => ({
      ...prev,
      layers: prev.layers.map((l, i) => ({
        ...l,
        extrusionHeight: parseFloat((prev.baseThickness + 0.4 + i * 0.4).toFixed(1)),
        isFlush: false
      }))
    }));
    notify("Alturas das camadas escalonadas a cada 0.4mm (2 camadas)");
  };

  // Quick Action: Make all layers flush on top surface
  const applyFlushHeights = () => {
    setConfig(prev => ({
      ...prev,
      layers: prev.layers.map(l => ({
        ...l,
        extrusionHeight: parseFloat((prev.baseThickness + 0.6).toFixed(1)),
        isFlush: true
      }))
    }));
    notify("Superfície Plana Ativada: Todas as cores niveladas no topo (0.6mm)");
  };

  // Export 3MF (Bambu Studio / Orca / Prusa)
  const handleExport3MF = async () => {
    setExportingFormat("3mf");
    try {
      const res = await exportKeychainTo3MF(
        baseGeometry,
        loopGeometry,
        colorGeometries,
        config,
        customFileName
      );
      downloadBlob(res.blob, res.filename);
      notify(`✓ Arquivo 3MF Multicolor exportado com sucesso (${(res.sizeBytes / 1024).toFixed(1)} KB)! Pronto para Bambu Studio / OrcaSlicer.`);
    } catch (err) {
      console.error(err);
      notify("Erro ao exportar 3MF.");
    } finally {
      setExportingFormat(null);
    }
  };

  // Export Multi-body STLs ZIP
  const handleExportMultiStlZip = async () => {
    setExportingFormat("zip");
    try {
      const res = await exportKeychainToMultiStlZip(
        baseGeometry,
        loopGeometry,
        colorGeometries,
        config,
        customFileName
      );
      downloadBlob(res.blob, res.filename);
      notify(`✓ Pacote ZIP com STLs separados exportado (${(res.sizeBytes / 1024).toFixed(1)} KB)!`);
    } catch (err) {
      console.error(err);
      notify("Erro ao exportar STLs.");
    } finally {
      setExportingFormat(null);
    }
  };

  // Export Single Unified STL
  const handleExportSingleSTL = async () => {
    setExportingFormat("stl");
    try {
      const res = await exportKeychainToSingleSTL(
        baseGeometry,
        loopGeometry,
        colorGeometries,
        customFileName
      );
      downloadBlob(res.blob, res.filename);
      notify(`✓ STL Unificado exportado com sucesso (${(res.sizeBytes / 1024).toFixed(1)} KB)!`);
    } catch (err) {
      console.error(err);
      notify("Erro ao exportar STL unificado.");
    } finally {
      setExportingFormat(null);
    }
  };

  // Helper to trigger browser file download
  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Calculate estimated filament weight (~PLA 1.24 g/cm3)
  const estimatedGrams = useMemo(() => {
    const w = config.targetWidth + config.contourMargin * 2;
    const h = config.targetHeight + config.contourMargin * 2;
    const avgDepth = (config.baseThickness + 1.2);
    const volumeMm3 = (w * h * 0.7) * avgDepth;
    const grams = (volumeMm3 * 1.24) / 1000;
    return Math.max(2, Math.round(grams * 10) / 10);
  }, [config.targetWidth, config.targetHeight, config.baseThickness, config.contourMargin]);

  // Estimated print time (minutes at 50mm/s)
  const estimatedMinutes = useMemo(() => {
    return Math.max(12, Math.round(estimatedGrams * 2.8 + config.layers.length * 3));
  }, [estimatedGrams, config.layers.length]);

  return (
    <div className="flex h-full w-full bg-[#080808] text-white overflow-hidden select-none font-sans">
      
      {/* LEFT SIDEBAR: KEYCHAIN CONTROLS */}
      <div className="w-[380px] bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col shrink-0 h-full overflow-hidden z-10 shadow-2xl">
        
        {/* HEADER */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00E5FF] to-cyan-700 flex items-center justify-center text-black font-black shadow-lg shadow-[#00E5FF]/20">
              <KeyRound className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-white flex items-center gap-2">
                <span>Keychain Maker</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30">
                  Multicor 3D
                </span>
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono">
                Imagem para Chaveiro 3D com AMS / Fatiador
              </p>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 text-[11px] font-mono">
          <button
            onClick={() => setActiveTab("image")}
            className={`flex-1 py-2.5 text-center font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "image"
                ? "border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Imagem</span>
          </button>

          <button
            onClick={() => setActiveTab("layers")}
            className={`flex-1 py-2.5 text-center font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "layers"
                ? "border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Cores ({config.layers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("base")}
            className={`flex-1 py-2.5 text-center font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "base"
                ? "border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Shapes className="w-3.5 h-3.5" />
            <span>Placa</span>
          </button>

          <button
            onClick={() => setActiveTab("loop")}
            className={`flex-1 py-2.5 text-center font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "loop"
                ? "border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            <span>Argola</span>
          </button>

          <button
            onClick={() => setActiveTab("export")}
            className={`flex-1 py-2.5 text-center font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "export"
                ? "border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
        </div>

        {/* TAB CONTENTS (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          
          {/* TAB 1: IMAGE / PRESET SELECTOR */}
          {activeTab === "image" && (
            <div className="space-y-4">
              
              {/* UPLOAD BOX */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-zinc-300 flex items-center justify-between">
                  <span>Importar Imagem (PNG / JPG / SVG)</span>
                  <span className="text-[9px] text-[#00E5FF]">Multi-camadas auto</span>
                </label>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 hover:border-[#00E5FF] bg-zinc-900/50 hover:bg-[#00E5FF]/5 rounded-xl p-4 text-center cursor-pointer transition-all space-y-2 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.svg,.bmp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-[#00E5FF]/20 flex items-center justify-center mx-auto transition-all">
                    {isProcessing ? (
                      <RefreshCw className="w-5 h-5 text-[#00E5FF] animate-spin" />
                    ) : (
                      <Upload className="w-5 h-5 text-zinc-400 group-hover:text-[#00E5FF]" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-zinc-200 group-hover:text-white">
                      Clique ou arraste uma imagem
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      PNG com fundo transparente, JPG, WebP ou SVG
                    </div>
                  </div>
                </div>
              </div>

              {/* VECTORIZATION SETTINGS (IF UPLOADED) */}
              {uploadedImagePreview && (
                <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span>Ajustes de Vetorização</span>
                    </span>
                    <img 
                      src={uploadedImagePreview} 
                      alt="Original" 
                      className="w-8 h-8 object-contain rounded border border-zinc-700 bg-zinc-950" 
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">Quantidade de Cores (Filamentos)</span>
                      <span className="text-[#00E5FF] font-bold">{colorCountOption} cores</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="6"
                      step="1"
                      value={colorCountOption}
                      onChange={e => setColorCountOption(parseInt(e.target.value))}
                      className="w-full accent-[#00E5FF]"
                    />
                  </div>

                  {/* BACKGROUND HANDLING MODE */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-zinc-400 font-medium">Tratamento de Fundo / Brancos</div>
                    <div className="grid grid-cols-3 gap-1.5 text-[9px]">
                      {[
                        { id: "smart", label: "Inteligente", desc: "Preserva branco interno (ex: ovos)" },
                        { id: "keep_all", label: "Manter Tudo", desc: "Todas as cores" },
                        { id: "remove_white", label: "Sem Branco", desc: "Remove branco" }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setBgModeOption(m.id as any)}
                          className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                            bgModeOption === m.id
                              ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-bold"
                              : "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <div className="font-bold truncate">{m.label}</div>
                          <div className="text-[8px] opacity-70 truncate">{m.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleReprocessImage}
                    disabled={isProcessing}
                    className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-[#00E5FF] hover:text-black text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                    <span>Re-vetorizar Imagem</span>
                  </button>
                </div>
              )}

              {/* SILHOUETTE / CONTOUR FOLLOWING FEATURE */}
              <div className="p-3.5 rounded-xl bg-gradient-to-b from-zinc-900/90 to-zinc-900/50 border border-[#00E5FF]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-100 flex items-center gap-1.5 text-xs">
                    <Wand2 className="w-4 h-4 text-[#00E5FF]" />
                    <span>Seguir Silhueta do Desenho</span>
                  </span>
                  <button
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      baseShape: prev.baseShape === "contour" ? "rounded_rect" : "contour"
                    }))}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      config.baseShape === "contour"
                        ? "bg-[#00E5FF] text-black shadow-sm shadow-[#00E5FF]/30"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {config.baseShape === "contour" ? "Ativado" : "Desativado"}
                  </button>
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Cria uma placa base 3D que acompanha milimetricamente o formato e as curvas do seu desenho, com folga de margem ajustável.
                </p>

                {config.baseShape === "contour" && (
                  <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-300 font-medium">Margem de Offset da Silhueta</span>
                        <span className="text-[#00E5FF] font-bold">{config.contourMargin ?? 2.5} mm</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="8.0"
                        step="0.5"
                        value={config.contourMargin ?? 2.5}
                        onChange={e => setConfig(prev => ({ ...prev, contourMargin: parseFloat(e.target.value) }))}
                        className="w-full accent-[#00E5FF]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-300 font-medium">Suavização de Curvas</span>
                        <span className="text-zinc-200 font-bold">Nível {config.contourSmoothing ?? 3}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={config.contourSmoothing ?? 3}
                        onChange={e => setConfig(prev => ({ ...prev, contourSmoothing: parseInt(e.target.value) }))}
                        className="w-full accent-[#00E5FF]"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span className="text-zinc-300">Preencher Furos Internos da Base</span>
                      <input
                        type="checkbox"
                        checked={config.fillContourHoles !== false}
                        onChange={e => setConfig(prev => ({ ...prev, fillContourHoles: e.target.checked }))}
                        className="accent-[#00E5FF] w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* STARTER PRESETS GALLERY */}
              <div className="space-y-2.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 flex items-center justify-between">
                  <span>Ou escolha um Modelo Pronto</span>
                  <span className="text-[9px] text-zinc-500">{KEYCHAIN_PRESETS.length} modelos</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {KEYCHAIN_PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.id && sourceType === "preset";
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer relative ${
                          isSelected
                            ? "bg-[#00E5FF]/10 border-[#00E5FF] text-white shadow-md shadow-[#00E5FF]/10"
                            : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{preset.icon}</span>
                          <span className="text-[8px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                            {preset.defaultColors.length} cores
                          </span>
                        </div>
                        <div className="font-bold text-[11px] truncate">{preset.name}</div>
                        <div className="flex gap-1">
                          {preset.defaultColors.map((c, i) => (
                            <span 
                              key={i} 
                              className="w-2.5 h-2.5 rounded-full border border-black/40"
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-COLOR LAYERS & AMS */}
          {activeTab === "layers" && (
            <div className="space-y-4">
              
              {/* QUICK HEIGHT ACTIONS */}
              <div className="flex gap-2">
                <button
                  onClick={applySteppedHeights}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <ArrowUpDown className="w-3 h-3 text-[#00E5FF]" />
                  <span>Escalonar (0.4mm)</span>
                </button>

                <button
                  onClick={applyFlushHeights}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <Move className="w-3 h-3 text-amber-400" />
                  <span>Nivelar (Flush)</span>
                </button>
              </div>

              {/* LIST OF DETECTED COLOR LAYERS */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-between">
                  <span>Camadas de Filamento Segmentadas</span>
                  <span className="text-[#00E5FF]">{config.layers.length} Cores Detectadas</span>
                </div>

                {config.layers.map((layer, idx) => (
                  <div 
                    key={layer.id}
                    className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                      layer.visible 
                        ? "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700" 
                        : "bg-zinc-950/40 border-zinc-900 opacity-50"
                    }`}
                  >
                    {/* Layer Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Custom Color Picker Input */}
                        <div className="relative w-6 h-6 rounded-md overflow-hidden border border-zinc-700 shadow shrink-0">
                          <input
                            type="color"
                            value={layer.hex}
                            onChange={e => updateLayer(layer.id, { hex: e.target.value })}
                            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
                          />
                        </div>

                        <input
                          type="text"
                          value={layer.name}
                          onChange={e => updateLayer(layer.id, { name: e.target.value })}
                          className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-[#00E5FF] text-xs font-bold text-white focus:outline-none px-1"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* AMS Slot Badge */}
                        <select
                          value={layer.amsSlot}
                          onChange={e => updateLayer(layer.id, { amsSlot: parseInt(e.target.value) })}
                          className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[9px] font-bold text-[#00E5FF] cursor-pointer"
                        >
                          <option value={1}>AMS 1</option>
                          <option value={2}>AMS 2</option>
                          <option value={3}>AMS 3</option>
                          <option value={4}>AMS 4</option>
                        </select>

                        {/* Visibility Toggle */}
                        <button
                          onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                          className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          {layer.visible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
                        </button>
                      </div>
                    </div>

                    {/* Extrusion Height Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Altura de Relevo (Z)</span>
                        <span className="text-zinc-200 font-bold">{layer.extrusionHeight} mm</span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="6.0"
                        step="0.2"
                        value={layer.extrusionHeight}
                        onChange={e => updateLayer(layer.id, { extrusionHeight: parseFloat(e.target.value) })}
                        className="w-full accent-[#00E5FF]"
                      />
                    </div>

                    {/* Filament Swatch Suggestions */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
                      <span className="text-[8px] text-zinc-500 shrink-0">Paleta:</span>
                      {POPULAR_FILAMENTS.slice(0, 7).map((fil, fi) => (
                        <button
                          key={fi}
                          onClick={() => updateLayer(layer.id, { hex: fil.hex })}
                          title={fil.name}
                          className="w-3.5 h-3.5 rounded-full border border-black/50 shrink-0 hover:scale-125 transition-all cursor-pointer"
                          style={{ backgroundColor: fil.hex }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BASE PLATE & DIMENSIONS */}
          {activeTab === "base" && (
            <div className="space-y-4">
              
              {/* SHAPE SELECTOR */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase font-bold text-zinc-400">Formato da Placa Base</label>
                  {config.baseShape === "contour" && (
                    <span className="text-[9px] text-[#00E5FF] font-bold flex items-center gap-1">
                      <Wand2 className="w-3 h-3" /> Silhueta Ativa
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  {[
                    { id: "contour", label: "Silhueta Real", icon: "📐", badge: "Auto" },
                    { id: "rounded_rect", label: "Retângulo", icon: "⬛" },
                    { id: "circle", label: "Círculo", icon: "⚪" },
                    { id: "shield", label: "Escudo", icon: "🛡️" },
                    { id: "hexagon", label: "Hexágono", icon: "⬡" },
                    { id: "heart", label: "Coração", icon: "❤️" },
                    { id: "star", label: "Estrela", icon: "⭐" },
                    { id: "motel_tag", label: "Motel Tag", icon: "🗝️" },
                    { id: "pet_bone", label: "Ossinho Pet", icon: "🦴" },
                  ].map(shape => (
                    <button
                      key={shape.id}
                      onClick={() => setConfig(prev => ({ ...prev, baseShape: shape.id as BaseShapeType }))}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer relative ${
                        config.baseShape === shape.id
                          ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] font-bold shadow-sm shadow-[#00E5FF]/20"
                          : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 text-zinc-300"
                      }`}
                    >
                      {shape.badge && (
                        <span className="absolute top-1 right-1 text-[7px] font-bold bg-[#00E5FF] text-black px-1 rounded-full">
                          {shape.badge}
                        </span>
                      )}
                      <span className="text-sm">{shape.icon}</span>
                      <span>{shape.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CONTOUR / SILHOUETTE SPECIAL CONTROLS */}
              {config.baseShape === "contour" && (
                <div className="p-3.5 rounded-xl bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-[#00E5FF]/30 space-y-3">
                  <div className="text-[10px] uppercase font-bold text-[#00E5FF] flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Ajustes da Silhueta Orgânica</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-300">Margem Externa (Offset)</span>
                      <span className="text-[#00E5FF] font-bold">{config.contourMargin ?? 2.5} mm</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="8.0"
                      step="0.5"
                      value={config.contourMargin ?? 2.5}
                      onChange={e => setConfig(prev => ({ ...prev, contourMargin: parseFloat(e.target.value) }))}
                      className="w-full accent-[#00E5FF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-300">Arredondamento / Suavização</span>
                      <span className="text-zinc-200 font-bold">Nível {config.contourSmoothing ?? 3}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={config.contourSmoothing ?? 3}
                      onChange={e => setConfig(prev => ({ ...prev, contourSmoothing: parseInt(e.target.value) }))}
                      className="w-full accent-[#00E5FF]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="text-zinc-300">Base Sólida (Preencher Furos Internos)</span>
                    <input
                      type="checkbox"
                      checked={config.fillContourHoles !== false}
                      onChange={e => setConfig(prev => ({ ...prev, fillContourHoles: e.target.checked }))}
                      className="accent-[#00E5FF] w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* DIMENSIONS */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Dimensões do Chaveiro</div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-400">Largura (X)</span>
                    <span className="text-[#00E5FF] font-bold">{config.targetWidth} mm</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    step="1"
                    value={config.targetWidth}
                    onChange={e => setConfig(prev => ({ ...prev, targetWidth: parseInt(e.target.value) }))}
                    className="w-full accent-[#00E5FF]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-400">Altura (Y)</span>
                    <span className="text-[#00E5FF] font-bold">{config.targetHeight} mm</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    step="1"
                    value={config.targetHeight}
                    onChange={e => setConfig(prev => ({ ...prev, targetHeight: parseInt(e.target.value) }))}
                    className="w-full accent-[#00E5FF]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-400">Espessura da Base (Z)</span>
                    <span className="text-zinc-200 font-bold">{config.baseThickness} mm</span>
                  </div>
                  <input
                    type="range"
                    min="1.2"
                    max="4.0"
                    step="0.2"
                    value={config.baseThickness}
                    onChange={e => setConfig(prev => ({ ...prev, baseThickness: parseFloat(e.target.value) }))}
                    className="w-full accent-[#00E5FF]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-400">Margem de Contorno</span>
                    <span className="text-zinc-200 font-bold">{config.contourMargin} mm</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="8.0"
                    step="0.5"
                    value={config.contourMargin}
                    onChange={e => setConfig(prev => ({ ...prev, contourMargin: parseFloat(e.target.value) }))}
                    className="w-full accent-[#00E5FF]"
                  />
                </div>

                {/* Base Plate Color */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-zinc-400 text-[10px]">Cor da Placa Base:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.baseColor}
                      onChange={e => setConfig(prev => ({ ...prev, baseColor: e.target.value }))}
                      className="w-6 h-6 rounded border border-zinc-700 cursor-pointer"
                    />
                    <span className="text-zinc-300 font-mono text-[10px]">{config.baseColor}</span>
                  </div>
                </div>
              </div>

              {/* RAISED BORDER / RIM */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-300">Borda de Proteção Elevada</span>
                  <input
                    type="checkbox"
                    checked={config.hasRaisedBorder}
                    onChange={e => setConfig(prev => ({ ...prev, hasRaisedBorder: e.target.checked }))}
                    className="accent-[#00E5FF] w-4 h-4 cursor-pointer"
                  />
                </div>

                {config.hasRaisedBorder && (
                  <div className="space-y-2 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Altura da Borda</span>
                        <span className="text-zinc-200">{config.raisedBorderHeight} mm</span>
                      </div>
                      <input
                        type="range"
                        min="0.4"
                        max="2.0"
                        step="0.2"
                        value={config.raisedBorderHeight}
                        onChange={e => setConfig(prev => ({ ...prev, raisedBorderHeight: parseFloat(e.target.value) }))}
                        className="w-full accent-[#00E5FF]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-[10px]">Cor da Borda:</span>
                      <input
                        type="color"
                        value={config.raisedBorderColor}
                        onChange={e => setConfig(prev => ({ ...prev, raisedBorderColor: e.target.value }))}
                        className="w-6 h-6 rounded border border-zinc-700 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: KEYCHAIN LOOP / RING */}
          {activeTab === "loop" && (
            <div className="space-y-4">
              
              {/* LOOP STYLE */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase font-bold text-zinc-400">Estilo da Argola de Fixação</label>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { id: "external_tab", label: "Orelha Externa", desc: "Aba reforçada no topo" },
                    { id: "top_eyelet", label: "Olhal Redondo", desc: "Anel concêntrico" },
                    { id: "integrated_hole", label: "Furo Embutido", desc: "Dentro do corpo" },
                    { id: "none", label: "Sem Argola", desc: "Apenas placa decorativa" },
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setConfig(prev => ({ ...prev, loopStyle: style.id as LoopStyle }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        config.loopStyle === style.id
                          ? "bg-[#00E5FF]/10 border-[#00E5FF] text-white font-bold"
                          : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 text-zinc-300"
                      }`}
                    >
                      <div className="font-bold">{style.label}</div>
                      <div className="text-[8px] text-zinc-500">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {config.loopStyle !== "none" && (
                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">Posição e Dimensões da Argola</div>

                  {/* POSITION SELECTOR */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400">Posição da Argola</label>
                    <select
                      value={config.loopPosition}
                      onChange={e => setConfig(prev => ({ ...prev, loopPosition: e.target.value as LoopPosition }))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="top_center">Topo Central (Padrão)</option>
                      <option value="top_left">Topo Esquerda</option>
                      <option value="top_right">Topo Direita</option>
                      <option value="left_center">Lateral Esquerda</option>
                      <option value="right_center">Lateral Direita</option>
                      <option value="bottom_center">Inferior</option>
                    </select>
                  </div>

                  {/* HOLE DIAMETER */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">Diâmetro do Furo</span>
                      <span className="text-[#00E5FF] font-bold">{config.loopHoleDiameter} mm</span>
                    </div>
                    <input
                      type="range"
                      min="2.5"
                      max="7.0"
                      step="0.2"
                      value={config.loopHoleDiameter}
                      onChange={e => setConfig(prev => ({ ...prev, loopHoleDiameter: parseFloat(e.target.value) }))}
                      className="w-full accent-[#00E5FF]"
                    />
                    <div className="text-[8.5px] text-zinc-500">4.2mm é ideal para argolas e correntinhas metálicas padrão.</div>
                  </div>

                  {/* WALL THICKNESS */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">Espessura da Parede</span>
                      <span className="text-zinc-200 font-bold">{config.loopWallThickness} mm</span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="5.0"
                      step="0.2"
                      value={config.loopWallThickness}
                      onChange={e => setConfig(prev => ({ ...prev, loopWallThickness: parseFloat(e.target.value) }))}
                      className="w-full accent-[#00E5FF]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: EXPORT CENTER */}
          {activeTab === "export" && (
            <div className="space-y-4">
              
              {/* PRINT SLICER SUMMARY */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Pronto para Impressão 3D</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                    AMS / Multicor
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[8px]">DIMENSÕES REAIS</span>
                    <span className="text-zinc-200 font-bold">{config.targetWidth} × {config.targetHeight} mm</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[8px]">FILAMENTO EST.</span>
                    <span className="text-[#00E5FF] font-bold">~{estimatedGrams}g PLA</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[8px]">TEMPO ESTIMADO</span>
                    <span className="text-amber-400 font-bold">~{estimatedMinutes} min</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[8px]">CORES DE FILAMENTO</span>
                    <span className="text-purple-300 font-bold">{config.layers.length} filamentos</span>
                  </div>
                </div>
              </div>

              {/* CUSTOM FILE NAME INPUT */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-zinc-400 text-[10px] uppercase font-bold">Nome do Arquivo</span>
                </div>
                <input
                  type="text"
                  value={customFileName}
                  onChange={e => setCustomFileName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              {/* EXPORT CARDS */}
              <div className="space-y-2.5">
                
                {/* 1. 3MF MULTICOLOR CARD (TOP RECOMMENDATION) */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-[#00E5FF]/40 space-y-2.5 shadow-lg shadow-[#00E5FF]/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] font-mono font-black text-xs">
                        3MF
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>3MF Multicolor (.3mf)</span>
                          <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Recomendado AMS
                          </span>
                        </div>
                        <p className="text-[9px] text-zinc-400">
                          Bambu Studio, OrcaSlicer, PrusaSlicer e Creality Print
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExport3MF}
                    disabled={exportingFormat !== null}
                    className="w-full py-2.5 rounded-lg bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#00E5FF]/20 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {exportingFormat === "3mf" ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{exportingFormat === "3mf" ? "Empacotando 3MF..." : "Baixar 3MF Multicolor (.3mf)"}</span>
                  </button>
                </div>

                {/* 2. MULTI-BODY STLs ZIP */}
                <div className="p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-black text-xs">
                        ZIP
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">STLs Separados (.ZIP)</div>
                        <p className="text-[9px] text-zinc-400">
                          Arquivos STL individuais por cor alinhados na mesma origem
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExportMultiStlZip}
                    disabled={exportingFormat !== null}
                    className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {exportingFormat === "zip" ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                    ) : (
                      <FileArchive className="w-4 h-4 text-purple-400" />
                    )}
                    <span>{exportingFormat === "zip" ? "Compactando..." : "Baixar STLs por Camada (.zip)"}</span>
                  </button>
                </div>

                {/* 3. SINGLE UNIFIED STL */}
                <div className="p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-mono font-black text-xs">
                        STL
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">STL Unificado (.stl)</div>
                        <p className="text-[9px] text-zinc-400">
                          Cor única ou troca manual de filamento por pausa de camada (M600)
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExportSingleSTL}
                    disabled={exportingFormat !== null}
                    className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {exportingFormat === "stl" ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Box className="w-3.5 h-3.5" />
                    )}
                    <span>{exportingFormat === "stl" ? "Gerando STL..." : "Baixar STL Único"}</span>
                  </button>
                </div>
              </div>

              {/* RECOMMENDED SLICER SETTINGS */}
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1.5 text-[9px] text-zinc-400 font-mono">
                <div className="text-zinc-300 font-bold text-[10px] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                  <span>Dicas de Fatiamento Recomendadas:</span>
                </div>
                <div>• Altura de camada: 0.16mm ou 0.20mm (primeira camada 0.20mm)</div>
                <div>• Preenchimento: 100% (para chaveiros maciços e duráveis)</div>
                <div>• Passadas de topo (Top Layers): 4 a 5 camadas</div>
                <div>• Ordem de Impressão: Do mais claro para o mais escuro</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT MAIN AREA: REAL-TIME 3D VIEWPORT */}
      <div className="flex-1 flex flex-col h-full bg-[#080808] relative overflow-hidden">
        
        {/* TOP FLOATING TOOLBAR */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          
          {/* CAMERA VIEWS & HELPERS */}
          <div className="flex items-center gap-2 pointer-events-auto bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 rounded-xl p-1.5 shadow-xl font-mono text-[10px]">
            <button
              onClick={() => setCameraView("isometric")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                cameraView === "isometric" ? "bg-[#00E5FF] text-black font-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              3D Isométrica
            </button>
            <button
              onClick={() => setCameraView("top")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                cameraView === "top" ? "bg-[#00E5FF] text-black font-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              Topo (2D)
            </button>
            <button
              onClick={() => setCameraView("front")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                cameraView === "front" ? "bg-[#00E5FF] text-black font-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              Frente
            </button>

            <div className="w-[1px] h-4 bg-zinc-800 mx-0.5" />

            <button
              onClick={() => setConfig(prev => ({ ...prev, showWireframe: !prev.showWireframe }))}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                config.showWireframe ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "text-zinc-400 hover:text-white"
              }`}
              title="Alternar Modo Aramado"
            >
              Wireframe
            </button>
          </div>

          {/* QUICK EXPORT ACTION */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleExport3MF}
              disabled={exportingFormat !== null}
              className="px-3 py-1.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-[#00E5FF]/20 transition-all cursor-pointer active:scale-95"
            >
              {exportingFormat === "3mf" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Exportar 3MF</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-zinc-950/90 border border-[#00E5FF]/40 text-[#00E5FF] px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <Sparkles className="w-4 h-4 text-[#00E5FF]" />
            <span>{notification}</span>
          </div>
        )}

        {/* 3D CANVAS VIEWPORT */}
        <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
          <Canvas
            camera={{ position: [0, -70, 70], fov: 45 }}
            shadows
            gl={{ preserveDrawingBuffer: true, antialias: true }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[30, 40, 50]} intensity={1.2} castShadow />
            <directionalLight position={[-30, -40, 30]} intensity={0.4} />
            <pointLight position={[0, 0, 40]} intensity={0.6} />

            <Grid 
              renderOrder={-1} 
              position={[0, 0, -0.05]} 
              args={[300, 300]} 
              cellSize={10} 
              cellThickness={0.6} 
              cellColor="#1a1a1a" 
              sectionSize={50} 
              sectionThickness={1.2} 
              sectionColor="#2a2a2a" 
              fadeDistance={250} 
            />

            <Center>
              <group>
                {/* 1. BASE PLATE MESH */}
                {baseGeometry && (
                  <mesh geometry={baseGeometry} castShadow receiveShadow>
                    <meshStandardMaterial 
                      color={config.baseColor} 
                      roughness={0.4} 
                      metalness={0.1}
                      wireframe={config.showWireframe}
                    />
                  </mesh>
                )}

                {/* 2. RAISED BORDER MESH */}
                {borderGeometry && config.hasRaisedBorder && (
                  <mesh geometry={borderGeometry} castShadow receiveShadow>
                    <meshStandardMaterial 
                      color={config.raisedBorderColor} 
                      roughness={0.3} 
                      metalness={0.2}
                      wireframe={config.showWireframe}
                    />
                  </mesh>
                )}

                {/* 3. KEYCHAIN LOOP TAB */}
                {loopGeometry && config.loopStyle !== "none" && (
                  <mesh geometry={loopGeometry} castShadow receiveShadow>
                    <meshStandardMaterial 
                      color={config.baseColor} 
                      roughness={0.4} 
                      metalness={0.1}
                      wireframe={config.showWireframe}
                    />
                  </mesh>
                )}

                {/* 4. MULTICOLOR VECTOR LAYERS */}
                {colorGeometries.map((cg, idx) => (
                  <mesh 
                    key={`color-layer-${idx}`} 
                    geometry={cg.geometry} 
                    position={[0, 0, 0]} 
                    castShadow 
                    receiveShadow
                  >
                    <meshStandardMaterial 
                      color={cg.layer.hex} 
                      roughness={0.35} 
                      metalness={0.1}
                      wireframe={config.showWireframe}
                    />
                  </mesh>
                ))}
              </group>
            </Center>

            <OrbitControls 
              makeDefault 
              enableDamping 
              dampingFactor={0.05}
              minDistance={20}
              maxDistance={250}
            />
          </Canvas>
        </div>

        {/* BOTTOM STATUS BAR & DIMENSIONS HUD */}
        <div className="p-3 bg-zinc-950/90 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-600">DIMENSÕES:</span>
              <span className="text-zinc-200 font-bold">
                {config.targetWidth + config.contourMargin * 2} × {config.targetHeight + config.contourMargin * 2} × {(config.baseThickness + 1.2).toFixed(1)} mm
              </span>
            </div>
            <div className="w-[1px] h-3 bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-600">PESO EST.:</span>
              <span className="text-[#00E5FF] font-bold">~{estimatedGrams}g PLA</span>
            </div>
            <div className="w-[1px] h-3 bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-600">TEMPO EST.:</span>
              <span className="text-amber-400 font-bold">~{estimatedMinutes} min</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500">FORMATO:</span>
            <span className="text-emerald-400 font-bold">.3MF / .STL AMS READY</span>
          </div>
        </div>

      </div>

    </div>
  );
}

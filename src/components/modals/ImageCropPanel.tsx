import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import COPY from '@/lib/copy';
import Tooltip from '@/components/ui-custom/Tooltip';
import { PLATFORM_MAP, PLATFORM_CROP_PRESETS, PLATFORM_SAFE_ZONES } from '@/constants/platforms';

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DragMode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;

/**
 * An ordered list of 90°-rotation / flip operations applied to the original image.
 * Stored instead of a baked data URL — the list is tiny (0–N strings) and is
 * re-applied from the original on demand, so no large image data ever lives in state.
 */
export type TransformOp = 'rotateLeft' | 'rotateRight' | 'flipH' | 'flipV';

interface ImageCropPanelProps {
  imageUrl: string;
  platform: string;
  aspectRatio: number;
  cropLabel: string;
  initialCropBox?: CropBox | null;
  initialTransformOps?: TransformOp[];
  initialTiltDeg?: number;
  onSave: (
    url: string,
    cropBox: CropBox | null,
    transformOps: TransformOp[],
    tiltDeg: number
  ) => void;
  onClose: () => void;
}

const HANDLE_SIZE = 8;
const MIN_CROP_PX = 20;

/** Converts a numeric aspect ratio to a human-readable string (e.g. 1.777 → "16:9"). Falls back to two decimal places for unrecognised values. */
function formatRatioStr(ratio: number): string {
  if (Math.abs(ratio - 16 / 9) < 0.01) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.01) return '9:16';
  if (Math.abs(ratio - 4 / 5) < 0.01) return '4:5';
  if (Math.abs(ratio - 1.91) < 0.01) return '1.91:1';
  if (Math.abs(ratio - 3.7) < 0.01) return '3.7:1';
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  return `${ratio.toFixed(2)}`;
}

/**
 * Returns the largest axis-aligned crop box centred over the image that fits
 * within the natural image dimensions at the given aspect ratio.
 */
function computeInitialCropBox(naturalW: number, naturalH: number, aspectRatio: number): CropBox {
  const naturalAspect = naturalW / naturalH;
  let w: number, h: number;
  if (naturalAspect > aspectRatio) {
    h = naturalH;
    w = h * aspectRatio;
  } else {
    w = naturalW;
    h = w / aspectRatio;
  }
  return {
    x: (naturalW - w) / 2,
    y: (naturalH - h) / 2,
    w,
    h,
  };
}

/** Clamps a crop box so it stays within the image bounds and never shrinks below MIN_CROP_PX. */
function clampBox(box: CropBox, natW: number, natH: number): CropBox {
  let { x, y, w, h } = box;
  w = Math.max(MIN_CROP_PX, Math.min(w, natW));
  h = Math.max(MIN_CROP_PX, Math.min(h, natH));
  x = Math.max(0, Math.min(x, natW - w));
  y = Math.max(0, Math.min(y, natH - h));
  return { x, y, w, h };
}

/**
 * Given a pointer position in canvas pixels (relative to the image origin) and the
 * current crop box in natural-image coordinates, returns which drag handle the pointer
 * is over, "move" if it's inside the box, or null if it's outside entirely.
 * `scale` converts natural coords to canvas pixels.
 */
function getHandleAtPoint(mx: number, my: number, box: CropBox, scale: number): DragMode {
  const { x, y, w, h } = box;
  const cx = x * scale;
  const cy = y * scale;
  const cw = w * scale;
  const ch = h * scale;
  const hs = HANDLE_SIZE;

  const inLeft = mx >= cx - hs && mx <= cx + hs;
  const inRight = mx >= cx + cw - hs && mx <= cx + cw + hs;
  const inTop = my >= cy - hs && my <= cy + hs;
  const inBottom = my >= cy + ch - hs && my <= cy + ch + hs;
  const inHMid = mx >= cx + cw / 2 - hs && mx <= cx + cw / 2 + hs;
  const inVMid = my >= cy + ch / 2 - hs && my <= cy + ch / 2 + hs;

  if (inLeft && inTop) return 'nw';
  if (inRight && inTop) return 'ne';
  if (inLeft && inBottom) return 'sw';
  if (inRight && inBottom) return 'se';
  if (inHMid && inTop) return 'n';
  if (inHMid && inBottom) return 's';
  if (inLeft && inVMid) return 'w';
  if (inRight && inVMid) return 'e';

  const inside = mx >= cx && mx <= cx + cw && my >= cy && my <= cy + ch;
  if (inside) return 'move';

  return null;
}

/** Maps a drag handle mode to the appropriate CSS cursor string. */
function getCursorForHandle(mode: DragMode): string {
  switch (mode) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'move':
      return 'move';
    default:
      return 'crosshair';
  }
}

/**
 * Full-height crop drawer rendered inside the CalendarPostModal.
 *
 * Provides a canvas-based cropping UI with:
 * - Drag-to-move and eight-handle resize (Shift to lock aspect ratio)
 * - Per-platform aspect ratio presets and free-form custom cropping
 * - Tilt slider (±45°) for fine rotation adjustments
 * - 90° rotate and flip transforms (baked into the image, not CSS)
 * - Optional platform-specific safe-zone overlays
 * - Crop state (URL, geometry, tilt, transformed data URL) is owned by the
 *   parent and passed back via `onSave` so it persists across drawer reopens.
 */
export default function ImageCropPanel({
  imageUrl,
  platform,
  aspectRatio,
  cropLabel,
  initialCropBox = null,
  initialTransformOps = [],
  initialTiltDeg = 0,
  onSave,
  onClose,
}: ImageCropPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [transformOps, setTransformOps] = useState<TransformOp[]>(initialTransformOps);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('cropShowSafeZones');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const [tiltDeg, setTiltDeg] = useState(initialTiltDeg);

  // Drag state stored in refs to avoid stale closures in event listeners
  const dragMode = useRef<DragMode>(null);
  const dragStart = useRef<{ mx: number; my: number; box: CropBox } | null>(null);
  const scaleRef = useRef<number>(1);
  const imgLayoutRef = useRef<{ offsetX: number; offsetY: number; drawW: number; drawH: number }>({
    offsetX: 0,
    offsetY: 0,
    drawW: 0,
    drawH: 0,
  });

  /**
   * Applies an ordered list of transform ops to an HTMLImageElement by rendering
   * each op in sequence to an offscreen canvas. Returns an HTMLImageElement sized
   * to the final dimensions, loaded synchronously from a data URL.
   * This is cheap — canvas ops on a single image take <1 ms even at 4K.
   */
  function applyOpsToImage(src: HTMLImageElement, ops: TransformOp[]): HTMLImageElement {
    if (ops.length === 0) return src;
    let current: HTMLImageElement = src;
    let curW = src.naturalWidth;
    let curH = src.naturalHeight;

    for (const op of ops) {
      const isRotation = op === 'rotateLeft' || op === 'rotateRight';
      const outW = isRotation ? curH : curW;
      const outH = isRotation ? curW : curH;
      const offscreen = document.createElement('canvas');
      offscreen.width = outW;
      offscreen.height = outH;
      const ctx = offscreen.getContext('2d')!;
      ctx.save();
      if (op === 'rotateLeft') {
        ctx.translate(0, curW);
        ctx.rotate(-Math.PI / 2);
      } else if (op === 'rotateRight') {
        ctx.translate(curH, 0);
        ctx.rotate(Math.PI / 2);
      } else if (op === 'flipH') {
        ctx.translate(curW, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, curH);
        ctx.scale(1, -1);
      }
      ctx.drawImage(current, 0, 0);
      ctx.restore();
      const next = new Image();
      next.src = offscreen.toDataURL('image/jpeg', 0.92);
      current = next;
      curW = outW;
      curH = outH;
    }
    return current;
  }

  // Load original image, re-apply stored transform ops, then set up crop box.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      originalImgRef.current = img;
      const rendered = applyOpsToImage(img, initialTransformOps);
      // applyOpsToImage returns synchronously-loaded Images (data URLs load sync)
      const finalize = (el: HTMLImageElement) => {
        imgRef.current = el;
        const w = el.naturalWidth || img.naturalWidth;
        const h = el.naturalHeight || img.naturalHeight;
        setNaturalSize({ w, h });
        const box = initialCropBox ?? computeInitialCropBox(w, h, aspectRatio);
        setCropBox(box);
        const diff = Math.abs(box.w / box.h - aspectRatio) / aspectRatio;
        setIsCustom(diff > 0.02);
        setImageLoaded(true);
      };
      if (rendered.complete) {
        finalize(rendered);
      } else {
        rendered.onload = () => finalize(rendered);
      }
    };
    img.src = imageUrl;
  }, [imageUrl, aspectRatio]);

  /**
   * Redraws the canvas: renders the image rotated by `tiltDeg`, applies the white
   * overlay outside the crop box, redraws the unrotated crop region clipped to the box,
   * then overlays the border, rule-of-thirds grid, optional safe-zone dashes, and handles.
   */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !naturalSize || !cropBox) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { w: natW, h: natH } = naturalSize;
    // Work in CSS pixels so mouse coords and drawing coords stay in the same space
    const canvasW = canvas.width / dpr;
    const canvasH = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scale = Math.min(canvasW / natW, canvasH / natH);
    scaleRef.current = scale;

    const drawW = natW * scale;
    const drawH = natH * scale;
    const offsetX = (canvasW - drawW) / 2;
    const offsetY = (canvasH - drawH) / 2;

    // Store layout for mouse-coord un-rotation
    imgLayoutRef.current = { offsetX, offsetY, drawW, drawH };

    const rad = (tiltDeg * Math.PI) / 180;
    const centerX = offsetX + drawW / 2;
    const centerY = offsetY + drawH / 2;

    ctx.clearRect(0, 0, canvasW, canvasH);

    // Draw rotated image
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rad);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Dark overlay (same rotation so it perfectly covers the image)
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rad);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Crop box in canvas coords (no rotation — crop box is always axis-aligned)
    const cx = offsetX + cropBox.x * scale;
    const cy = offsetY + cropBox.y * scale;
    const cw = cropBox.w * scale;
    const ch = cropBox.h * scale;

    // Clear crop region then redraw rotated image clipped to it
    ctx.clearRect(cx, cy, cw, ch);
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.clip();
    ctx.translate(centerX, centerY);
    ctx.rotate(rad);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Crop border
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 2;
    ctx.strokeRect(cx, cy, cw, ch);
    ctx.shadowBlur = 0;

    // Rule of thirds grid
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 0.75;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + (cw * i) / 3, cy);
      ctx.lineTo(cx + (cw * i) / 3, cy + ch);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + (ch * i) / 3);
      ctx.lineTo(cx + cw, cy + (ch * i) / 3);
      ctx.stroke();
    }

    // Safe zone overlays
    if (showSafeZones) {
      const currentRatio = cropBox.w / cropBox.h;
      const presets = PLATFORM_CROP_PRESETS[platform] ?? [];
      const matchedPreset = presets.find((p) => Math.abs(p.ratio - currentRatio) / p.ratio < 0.02);
      if (matchedPreset) {
        const zones = PLATFORM_SAFE_ZONES[platform]?.[matchedPreset.ratioLabel] ?? [];
        if (zones.length > 0) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 2;

          const drawSafeLabel = (text: string, lx: number, ly: number) => {
            ctx.save();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
            ctx.font = '10px system-ui, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillText(text, lx, ly);
            ctx.restore();
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 2;
          };

          for (const zone of zones) {
            if (zone.type === 'center-ratio') {
              const boxAspect = cw / ch;
              let szW: number, szH: number;
              if (boxAspect > zone.ratio) {
                szH = ch;
                szW = ch * zone.ratio;
              } else {
                szW = cw;
                szH = cw / zone.ratio;
              }
              const szX = cx + (cw - szW) / 2;
              const szY = cy + (ch - szH) / 2;
              ctx.strokeRect(szX, szY, szW, szH);
              drawSafeLabel(formatRatioStr(zone.ratio), szX + 4, szY + 10);
            } else if (zone.type === 'center-ratio-top') {
              const boxAspect = cw / ch;
              let szW: number, szH: number;
              if (boxAspect > zone.ratio) {
                szH = ch;
                szW = ch * zone.ratio;
              } else {
                szW = cw;
                szH = cw / zone.ratio;
              }
              const szX = cx + (cw - szW) / 2;
              ctx.strokeRect(szX, cy, szW, szH);
              drawSafeLabel(formatRatioStr(zone.ratio), szX + 4, cy + 10);
            } else if (zone.type === 'avoid-bands') {
              const topY = cy + ch * zone.top;
              const botY = cy + ch * (1 - zone.bottom);
              ctx.beginPath();
              ctx.moveTo(cx, topY);
              ctx.lineTo(cx + cw, topY);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(cx, botY);
              ctx.lineTo(cx + cw, botY);
              ctx.stroke();
            }
          }

          ctx.restore();
        }
      }
    }

    // Resize handles — white with drop shadow for visibility on any background
    const handles: [number, number][] = [
      [cx, cy],
      [cx + cw / 2, cy],
      [cx + cw, cy],
      [cx + cw, cy + ch / 2],
      [cx + cw, cy + ch],
      [cx + cw / 2, cy + ch],
      [cx, cy + ch],
      [cx, cy + ch / 2],
    ];
    const hs = HANDLE_SIZE;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = 'white';
    for (const [hx, hy] of handles) {
      ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
    }
    ctx.shadowBlur = 0;
  }, [naturalSize, cropBox, showSafeZones, platform, tiltDeg]);

  // Redraw whenever cropBox or image changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Canvas sizing and resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      drawCanvas();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [drawCanvas]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
  };

  /**
   * Rotates a canvas-space pointer position back by the current tilt angle so that
   * crop-box hit testing always works in the image's un-rotated coordinate space.
   */
  const unrotatePt = (mx: number, my: number) => {
    const { offsetX, offsetY, drawW, drawH } = imgLayoutRef.current;
    const cx = offsetX + drawW / 2;
    const cy = offsetY + drawH / 2;
    const rad = -(tiltDeg * Math.PI) / 180;
    const dx = mx - cx;
    const dy = my - cy;
    return {
      mx: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      my: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  };

  /** Begins a crop-box drag or resize when the pointer lands on a handle or inside the box. */
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropBox || !naturalSize) return;
    const raw = getCanvasPoint(e);
    const { mx, my } = unrotatePt(raw.mx, raw.my);
    const scale = scaleRef.current;
    const { offsetX, offsetY } = imgLayoutRef.current;

    const relMx = mx - offsetX;
    const relMy = my - offsetY;
    const mode = getHandleAtPoint(relMx, relMy, cropBox, scale);
    if (!mode) return;

    dragMode.current = mode;
    dragStart.current = { mx, my, box: { ...cropBox } };
    e.preventDefault();
  };

  /**
   * Updates the cursor while hovering and moves/resizes the crop box while dragging.
   * Holding Shift locks the aspect ratio during resize operations.
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropBox || !naturalSize) return;
    const raw = getCanvasPoint(e);
    const { mx, my } = unrotatePt(raw.mx, raw.my);
    const nat = naturalSize;
    const scale = scaleRef.current;
    const canvas = canvasRef.current!;
    const { offsetX, offsetY } = imgLayoutRef.current;
    const relMx = mx - offsetX;
    const relMy = my - offsetY;

    if (!dragMode.current) {
      const mode = getHandleAtPoint(relMx, relMy, cropBox, scale);
      canvas.style.cursor = getCursorForHandle(mode);
      return;
    }

    if (!dragStart.current) return;
    const dx = (mx - dragStart.current.mx) / scale;
    const dy = (my - dragStart.current.my) / scale;
    const orig = dragStart.current.box;
    let { x, y, w, h } = orig;
    const lockedRatio = orig.w / orig.h;

    switch (dragMode.current) {
      case 'move':
        x = orig.x + dx;
        y = orig.y + dy;
        break;
      case 'nw':
        x = orig.x + dx;
        y = orig.y + dy;
        w = orig.w - dx;
        h = orig.h - dy;
        if (e.shiftKey) {
          h = w / lockedRatio;
          y = orig.y + orig.h - h;
        }
        break;
      case 'ne':
        y = orig.y + dy;
        w = orig.w + dx;
        h = orig.h - dy;
        if (e.shiftKey) {
          h = w / lockedRatio;
          y = orig.y + orig.h - h;
        }
        break;
      case 'sw':
        x = orig.x + dx;
        w = orig.w - dx;
        h = orig.h + dy;
        if (e.shiftKey) {
          h = w / lockedRatio;
        }
        break;
      case 'se':
        w = orig.w + dx;
        h = orig.h + dy;
        if (e.shiftKey) {
          h = w / lockedRatio;
        }
        break;
      case 'n':
        y = orig.y + dy;
        h = orig.h - dy;
        if (e.shiftKey) {
          w = h * lockedRatio;
        }
        break;
      case 's':
        h = orig.h + dy;
        if (e.shiftKey) {
          w = h * lockedRatio;
        }
        break;
      case 'w':
        x = orig.x + dx;
        w = orig.w - dx;
        if (e.shiftKey) {
          h = w / lockedRatio;
        }
        break;
      case 'e':
        w = orig.w + dx;
        if (e.shiftKey) {
          h = w / lockedRatio;
        }
        break;
    }

    const newBox = clampBox({ x, y, w, h }, nat.w, nat.h);
    setCropBox(newBox);

    // Check if still matches preset ratio (within 2%)
    const newRatio = newBox.w / newBox.h;
    const diff = Math.abs(newRatio - aspectRatio) / aspectRatio;
    setIsCustom(dragMode.current !== 'move' && diff > 0.02);
  };

  /** Ends the current drag/resize operation. */
  const handleMouseUp = () => {
    dragMode.current = null;
    dragStart.current = null;
  };

  // Prevent drag state from getting stuck if mouseup happens outside the canvas
  useEffect(() => {
    const handleWindowMouseUp = () => {
      if (dragMode.current) {
        handleMouseUp();
      }
    };
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

  /**
   * Appends one transform op to the list, re-renders the image from the original,
   * and remaps the crop box to its new position in the transformed image.
   */
  const applyTransform = (type: TransformOp) => {
    const orig = originalImgRef.current;
    if (!orig || !naturalSize) return;
    const { w: natW, h: natH } = naturalSize;

    const nextOps = [...transformOps, type];
    const newRendered = applyOpsToImage(orig, nextOps);

    // Remap crop box for this single new op
    const remapBox = (box: CropBox): CropBox => {
      const { x, y, w, h } = box;
      switch (type) {
        case 'rotateLeft':
          return { x: y, y: natW - x - w, w: h, h: w };
        case 'rotateRight':
          return { x: natH - y - h, y: x, w: h, h: w };
        case 'flipH':
          return { x: natW - x - w, y, w, h };
        case 'flipV':
          return { x, y: natH - y - h, w, h };
      }
    };

    const isRotation = type === 'rotateLeft' || type === 'rotateRight';
    const outW = isRotation ? natH : natW;
    const outH = isRotation ? natW : natH;

    const finalize = () => {
      imgRef.current = newRendered;
      setTransformOps(nextOps);
      setNaturalSize({ w: outW, h: outH });
      const box = cropBox ? remapBox(cropBox) : computeInitialCropBox(outW, outH, aspectRatio);
      setCropBox(box);
      const diff = Math.abs(box.w / box.h - aspectRatio) / aspectRatio;
      setIsCustom(diff > 0.02);
    };

    if (newRendered.complete) finalize();
    else newRendered.onload = finalize;
  };

  /**
   * Renders the cropped region (with tilt applied) to an offscreen canvas, uploads the
   * resulting JPEG blob, then calls `onSave` with the hosted URL, crop geometry, the
   * current transformed data URL (for flip/rotate state), and the tilt angle.
   */
  const handleSave = async () => {
    if (!cropBox || !naturalSize || !imgRef.current) return;
    setSaving(true);
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = Math.round(cropBox.w);
      offscreen.height = Math.round(cropBox.h);
      const ctx = offscreen.getContext('2d')!;
      if (tiltDeg !== 0) {
        // Rotate image around its center, then draw only the crop region
        const { w: natW, h: natH } = naturalSize;
        const rad = (tiltDeg * Math.PI) / 180;
        ctx.save();
        ctx.translate(offscreen.width / 2, offscreen.height / 2);
        ctx.rotate(rad);
        // Shift so that cropBox origin maps to (0,0) in the rotated frame
        ctx.drawImage(
          imgRef.current,
          -(cropBox.x + cropBox.w / 2),
          -(cropBox.y + cropBox.h / 2),
          natW,
          natH
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          imgRef.current,
          cropBox.x,
          cropBox.y,
          cropBox.w,
          cropBox.h,
          0,
          0,
          offscreen.width,
          offscreen.height
        );
      }
      const blob = await new Promise<Blob>((resolve, reject) => {
        offscreen.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
          'image/jpeg',
          0.92
        );
      });
      const file = new File([blob], 'crop.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onSave(file_url, cropBox, transformOps, tiltDeg);
    } catch (_err) {
      // Upload failed — close silently; parent can show error if needed
    } finally {
      setSaving(false);
    }
  };

  /**
   * Resets the crop drawer to its initial state: reloads the original (un-transformed)
   * image, recomputes the default crop box for the platform's aspect ratio, and zeroes
   * out any tilt. Does not call `onSave` — the saved crop in the parent is unchanged
   * until the user explicitly saves again.
   */
  const handleReset = () => {
    const orig = originalImgRef.current;
    if (!orig) return;
    setTiltDeg(0);
    setTransformOps([]);
    imgRef.current = orig;
    const natW = orig.naturalWidth;
    const natH = orig.naturalHeight;
    setNaturalSize({ w: natW, h: natH });
    setCropBox(computeInitialCropBox(natW, natH, aspectRatio));
    setIsCustom(false);
  };

  const instructionsText = COPY.calendarPostModal.cropInstructions
    .replace('{platform}', platform)
    .replace('{ratio}', cropLabel);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {(() => {
            const p = PLATFORM_MAP[platform];
            return p ? <p.icon className="h-4 w-4 text-gray-900 dark:text-white" /> : null;
          })()}
          {COPY.calendarPostModal.cropForPlatform.replace('{platform}', platform)}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
          aria-label={COPY.general.close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body: canvas left, controls right */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 overflow-hidden min-w-0">
          {!imageLoaded ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          )}
        </div>

        {/* Controls panel */}
        <div className="w-64 shrink-0 flex flex-col justify-between border-l border-gray-100 dark:border-gray-800 px-4 py-4 overflow-y-auto">
          <div className="space-y-4">
            {/* Presets */}
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                {COPY.calendarPostModal.cropPresets}
              </p>
              <div className="flex flex-col gap-1">
                {(PLATFORM_CROP_PRESETS[platform] ?? []).map((preset) => {
                  const active =
                    !isCustom &&
                    Math.abs(cropBox ? cropBox.w / cropBox.h - preset.ratio : 1) / preset.ratio <
                      0.02;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (!naturalSize) return;
                        setCropBox(
                          computeInitialCropBox(naturalSize.w, naturalSize.h, preset.ratio)
                        );
                        setIsCustom(false);
                      }}
                      className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        active
                          ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-gray-400 dark:text-gray-500 font-mono">
                        {preset.ratioLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current ratio */}
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {isCustom && <span>{COPY.calendarPostModal.cropCustom}</span>}
            </div>

            {/* Hints */}
            <div className="space-y-1">
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                {instructionsText}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                {COPY.calendarPostModal.cropShiftHintPrefix}
                <kbd className="inline px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-mono text-[10px] mx-1">
                  {COPY.calendarPostModal.shiftKey}
                </kbd>
                {COPY.calendarPostModal.cropShiftHintSuffix}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={showSafeZones}
                  aria-label={COPY.calendarPostModal.cropSafeZones}
                  onClick={() => {
                    const next = !showSafeZones;
                    setShowSafeZones(next);
                    try {
                      localStorage.setItem('cropShowSafeZones', String(next));
                    } catch {
                      /* ignore */
                    }
                  }}
                  className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${showSafeZones ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <span
                    className={`pointer-events-none block h-3 w-3 rounded-full bg-white shadow-sm ring-0 transition-transform ${showSafeZones ? 'translate-x-3' : 'translate-x-0'}`}
                  />
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {COPY.calendarPostModal.cropSafeZones}
                </span>
                <Tooltip content={COPY.calendarPostModal.cropSafeZonesTooltip}>
                  <Info className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 cursor-default shrink-0" />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-4">
            {/* Tilt slider */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">−45°</span>
                <button
                  type="button"
                  title="Click to level"
                  onClick={() => setTiltDeg(0)}
                  className="text-[11px] font-mono text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors tabular-nums w-10 text-center"
                >
                  {tiltDeg > 0 ? '+' : ''}
                  {tiltDeg}°
                </button>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">+45°</span>
              </div>
              <input
                type="range"
                min={-45}
                max={45}
                step={0.5}
                value={tiltDeg}
                onChange={(e) => setTiltDeg(Number(e.target.value))}
                className="w-full accent-violet-600 cursor-pointer"
              />
            </div>
            {/* Transform buttons */}
            <div className="flex gap-1">
              {(
                [
                  {
                    type: 'rotateLeft',
                    Icon: RotateCcw,
                    label: COPY.calendarPostModal.cropRotateLeft,
                  },
                  {
                    type: 'rotateRight',
                    Icon: RotateCw,
                    label: COPY.calendarPostModal.cropRotateRight,
                  },
                  {
                    type: 'flipH',
                    Icon: FlipHorizontal,
                    label: COPY.calendarPostModal.cropFlipHorizontal,
                  },
                  {
                    type: 'flipV',
                    Icon: FlipVertical,
                    label: COPY.calendarPostModal.cropFlipVertical,
                  },
                ] as const
              ).map(({ type, Icon, label }) => (
                <Tooltip key={type} content={label}>
                  <button
                    type="button"
                    onClick={() => applyTransform(type)}
                    disabled={saving || !imageLoaded}
                    className="flex-1 flex items-center justify-center py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-900 dark:text-gray-100 transition-colors"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                </Tooltip>
              ))}
            </div>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 transition-colors"
              onClick={handleSave}
              disabled={saving || !imageLoaded}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {COPY.calendarPostModal.saveCrop}
            </button>
            <button
              type="button"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 text-sm font-medium px-4 py-2 transition-colors"
              onClick={handleReset}
              disabled={saving}
            >
              {COPY.calendarPostModal.resetCrop}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

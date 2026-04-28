import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Eraser,
  Paintbrush,
  Undo2,
  RotateCcw,
  Download,
  Type,
  Square,
  Circle,
  ArrowRight,
  Image as ImageIcon,
  History,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function WhiteboardCanvas({ isHost, onDataChange, versions = [], onRevert }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState('draw');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [tempCanvas, setTempCanvas] = useState(null);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textInput, setTextInput] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
  }, [lineWidth, color]);

  const saveState = () => {
    if (!canvasRef.current) {
      return;
    }
    setHistory([...history, canvasRef.current.toDataURL()]);
    onDataChange?.(canvasRef.current.toDataURL());
  };

  const startDrawing = (e) => {
    if (!isHost) {
      return;
    }
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setIsDrawing(true);
    setStartPos(pos);

    if (mode === 'draw' || mode === 'erase') {
      ctx.strokeStyle = mode === 'erase' ? 'rgba(255,255,255,1)' : color;
      ctx.lineWidth = mode === 'erase' ? lineWidth * 2 : lineWidth;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else {
      setTempCanvas(canvas.toDataURL());
    }
  };

  const draw = (e) => {
    if (!isDrawing || !isHost || !startPos) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (mode === 'draw') {
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    } else if (mode === 'erase') {
      ctx.clearRect(
        currentPos.x - lineWidth,
        currentPos.y - lineWidth,
        lineWidth * 2,
        lineWidth * 2
      );
    } else if (['rect', 'circle', 'arrow'].includes(mode) && tempCanvas) {
      const img = new Image();
      img.src = tempCanvas;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        drawShape(ctx, mode, startPos, currentPos);
      };
    }
  };

  const drawShape = (ctx, shapeMode, start, end) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = 'rgba(0,0,0,0)';

    if (shapeMode === 'rect') {
      const width = end.x - start.x;
      const height = end.y - start.y;
      ctx.strokeRect(start.x, start.y, width, height);
    } else if (shapeMode === 'circle') {
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shapeMode === 'arrow') {
      drawArrow(ctx, start.x, start.y, end.x, end.y);
    }
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isHost) {
      return;
    }
    setIsDrawing(false);
    setTempCanvas(null);
    saveState();
  };

  const addText = () => {
    if (!isHost) {
      return;
    }
    setTextInput('');
    setTextDialogOpen(true);
  };

  const submitText = () => {
    if (!textInput) {
      setTextDialogOpen(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const fontSize = parseInt(lineWidth) * 5;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, 50, 50);
    saveState();
    setTextDialogOpen(false);
  };

  const addImage = async (e) => {
    if (!isHost) {
      return;
    }
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.5;
        ctx.drawImage(img, 50, 50, img.width * scale, img.height * scale);
        saveState();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const undo = () => {
    if (history.length === 0) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    if (newHistory.length > 0) {
      const img = new Image();
      img.src = newHistory[newHistory.length - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
    onDataChange?.(canvas.toDataURL());
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `whiteboard-${Date.now()}.png`;
    link.click();
  };

  const revertToVersion = (version) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = version.canvas_state;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory([version.canvas_state]);
      onRevert?.(version);
      setShowVersions(false);
    };
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 gap-2 flex-wrap">
        <h3 className="font-semibold text-sm text-gray-900">Whiteboard</h3>
        <div className="flex items-center gap-1 flex-wrap">
          {isHost && (
            <>
              <Button
                size="sm"
                variant={mode === 'draw' ? 'default' : 'outline'}
                onClick={() => setMode('draw')}
                className="gap-1"
                title="Draw"
              >
                <Paintbrush className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={mode === 'erase' ? 'default' : 'outline'}
                onClick={() => setMode('erase')}
                className="gap-1"
                title="Erase"
              >
                <Eraser className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={mode === 'text' ? 'default' : 'outline'}
                onClick={addText}
                className="gap-1"
                title="Add text"
              >
                <Type className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={mode === 'rect' ? 'default' : 'outline'}
                onClick={() => setMode('rect')}
                className="gap-1"
                title="Rectangle"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={mode === 'circle' ? 'default' : 'outline'}
                onClick={() => setMode('circle')}
                className="gap-1"
                title="Circle"
              >
                <Circle className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={mode === 'arrow' ? 'default' : 'outline'}
                onClick={() => setMode('arrow')}
                className="gap-1"
                title="Arrow"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 cursor-pointer"
                title="Color"
              />
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={(e) => setLineWidth(parseInt(e.target.value))}
                className="w-20"
                title="Line width"
              />
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={addImage} className="hidden" />
                <Button size="sm" variant="outline" className="gap-1" asChild>
                  <span>
                    <ImageIcon className="w-4 h-4" />
                  </span>
                </Button>
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={undo}
                disabled={history.length === 0}
                className="gap-1"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowVersions(true)}
                className="gap-1"
              >
                <History className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={clearCanvas} className="gap-1">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={downloadWhiteboard} className="gap-1">
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
          {!isHost && <p className="text-xs text-gray-500">View-only mode</p>}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="flex-1 cursor-crosshair bg-white"
      />

      {/* Text Input Dialog */}
      <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="whiteboard-text">Text</Label>
            <Input
              id="whiteboard-text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitText()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTextDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitText} disabled={!textInput}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersions} onOpenChange={setShowVersions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Whiteboard History</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-2 p-4">
              {versions.length === 0 ? (
                <p className="text-sm text-gray-500">No history available</p>
              ) : (
                versions.map((version, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => revertToVersion(version)}
                  >
                    <div>
                      <p className="text-sm font-medium">Version {version.version_number}</p>
                      <p className="text-xs text-gray-500">{version.created_by}</p>
                      {version.timestamp && (
                        <p className="text-xs text-gray-400">
                          {new Date(version.timestamp).toLocaleString()}
                        </p>
                      )}
                      {version.description && (
                        <p className="text-xs text-gray-600 mt-1">{version.description}</p>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      Restore
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

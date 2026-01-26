import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Eraser, Paintbrush, Undo2, RotateCcw, Download } from 'lucide-react';

export default function WhiteboardCanvas({ isHost, onDataChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState('draw');
  const [color, setColor] = useState('#000000');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
  }, []);

  const startDrawing = (e) => {
    if (!isHost) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing || !isHost) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    if (mode === 'erase') {
      ctx.clearRect(e.clientX - rect.left - 10, e.clientY - rect.top - 10, 20, 20);
    } else {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    setIsDrawing(false);
    setHistory([...history, canvas.toDataURL()]);
    onDataChange?.(canvas.toDataURL());
  };

  const undo = () => {
    if (history.length === 0) return;
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

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-semibold text-sm text-gray-900">Whiteboard</h3>
        <div className="flex items-center gap-2">
          {isHost && (
            <>
              <Button
                size="sm"
                variant={mode === 'draw' ? 'default' : 'outline'}
                onClick={() => setMode('draw')}
                className="gap-1"
              >
                <Paintbrush className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={mode === 'erase' ? 'default' : 'outline'}
                onClick={() => setMode('erase')}
                className="gap-1"
              >
                <Eraser className="w-4 h-4" />
              </Button>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 cursor-pointer"
                title="Color"
              />
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
                onClick={clearCanvas}
                className="gap-1"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadWhiteboard}
                className="gap-1"
              >
                <Download className="w-4 h-4" />
              </Button>
            </>
          )}
          {!isHost && (
            <p className="text-xs text-gray-500">View-only mode</p>
          )}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="flex-1 cursor-crosshair"
      />
    </div>
  );
}
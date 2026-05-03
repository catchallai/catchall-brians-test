import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Type, Square, Circle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ImageOverlayEditor({ imageUrl, onApply, onClose }) {
  const [overlays, setOverlays] = useState([]);
  const canvasRef = useRef(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [colorInput, setColorInput] = useState('#ffffff');
  const [overlayType, setOverlayType] = useState('text'); // text, rect, circle

  const addOverlay = () => {
    if (overlayType === 'text' && !textInput.trim()) return;
    
    const newOverlay = {
      id: Date.now(),
      type: overlayType,
      x: 50,
      y: 50,
      width: overlayType === 'text' ? 200 : 100,
      height: overlayType === 'text' ? 40 : 100,
      color: colorInput,
      text: overlayType === 'text' ? textInput : '',
      opacity: 1,
      fontSize: 24,
      rotation: 0
    };
    
    setOverlays([...overlays, newOverlay]);
    setTextInput('');
    setSelectedOverlayId(newOverlay.id);
  };

  const updateOverlay = (id, updates) => {
    setOverlays(overlays.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const removeOverlay = (id) => {
    setOverlays(overlays.filter(o => o.id !== id));
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  };

  const handleApply = () => {
    onApply(overlays);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Image Overlays</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Canvas Preview */}
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            
            {/* Overlays Preview */}
            {overlays.map(overlay => (
              <div
                key={overlay.id}
                onClick={() => setSelectedOverlayId(overlay.id)}
                className={`absolute cursor-move border-2 transition-colors ${
                  selectedOverlayId === overlay.id 
                    ? 'border-violet-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{
                  left: `${overlay.x}%`,
                  top: `${overlay.y}%`,
                  width: `${overlay.width}px`,
                  height: `${overlay.height}px`,
                  opacity: overlay.opacity,
                  transform: `rotate(${overlay.rotation}deg)`,
                  backgroundColor: overlay.type !== 'text' ? overlay.color : 'transparent'
                }}
              >
                {overlay.type === 'text' && (
                  <div
                    className="w-full h-full flex items-center justify-center p-2 text-center overflow-hidden"
                    style={{
                      color: overlay.color,
                      fontSize: `${overlay.fontSize}px`,
                      fontWeight: 'bold'
                    }}
                  >
                    {overlay.text}
                  </div>
                )}
                {overlay.type === 'circle' && (
                  <div className="w-full h-full rounded-full" />
                )}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Add Overlay */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Add Overlay</h3>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setOverlayType('text')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    overlayType === 'text'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Type className="w-4 h-4" /> Text
                </button>
                <button
                  onClick={() => setOverlayType('rect')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    overlayType === 'rect'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Square className="w-4 h-4" /> Rectangle
                </button>
                <button
                  onClick={() => setOverlayType('circle')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    overlayType === 'circle'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Circle className="w-4 h-4" /> Circle
                </button>
              </div>

              {overlayType === 'text' && (
                <Input
                  type="text"
                  placeholder="Enter text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addOverlay()}
                  className="h-9"
                />
              )}

              <div className="flex gap-2">
                <input
                  type="color"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="w-10 h-9 rounded cursor-pointer"
                />
                <Button onClick={addOverlay} className="gap-2 flex-1 bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4" /> Add {overlayType === 'text' ? 'Text' : overlayType === 'rect' ? 'Rectangle' : 'Circle'}
                </Button>
              </div>
            </div>

            {/* Edit Selected Overlay */}
            {selectedOverlayId && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Edit Overlay</h3>
                  <button
                    onClick={() => removeOverlay(selectedOverlayId)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
                  >
                    Remove
                  </button>
                </div>

                {overlays.find(o => o.id === selectedOverlayId)?.type === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Font Size
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={overlays.find(o => o.id === selectedOverlayId)?.fontSize || 24}
                      onChange={(e) => updateOverlay(selectedOverlayId, { fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opacity
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={overlays.find(o => o.id === selectedOverlayId)?.opacity || 1}
                    onChange={(e) => updateOverlay(selectedOverlayId, { opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rotation (degrees)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={overlays.find(o => o.id === selectedOverlayId)?.rotation || 0}
                    onChange={(e) => updateOverlay(selectedOverlayId, { rotation: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Overlays List */}
            {overlays.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Overlays ({overlays.length})</h3>
                <div className="space-y-2">
                  {overlays.map(overlay => (
                    <div
                      key={overlay.id}
                      onClick={() => setSelectedOverlayId(overlay.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedOverlayId === overlay.id
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {overlay.type === 'text' ? `Text: ${overlay.text}` : overlay.type}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeOverlay(overlay.id);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleApply} className="bg-violet-600 hover:bg-violet-700">
            Apply Overlays
          </Button>
        </div>
      </div>
    </div>
  );
}
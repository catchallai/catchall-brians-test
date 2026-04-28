import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import EnhancedTooltip from './EnhancedTooltip';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

export default function InteractiveAreaChart({
  data = [],
  dataKeys = [],
  xKey = 'name',
  height = 300,
  showBrush = true,
  showZoom = true,
  stacked = false,
  formatter,
}) {
  const [brushRange, setBrushRange] = useState({ startIndex: 0, endIndex: data.length - 1 });
  const [hiddenKeys, setHiddenKeys] = useState([]);

  const handleLegendClick = (dataKey) => {
    setHiddenKeys((prev) =>
      prev.includes(dataKey) ? prev.filter((k) => k !== dataKey) : [...prev, dataKey]
    );
  };

  const handleZoomIn = () => {
    const range = brushRange.endIndex - brushRange.startIndex;
    if (range > 4) {
      const center = Math.floor((brushRange.startIndex + brushRange.endIndex) / 2);
      const newRange = Math.floor(range / 2);
      setBrushRange({
        startIndex: Math.max(0, center - newRange),
        endIndex: Math.min(data.length - 1, center + newRange),
      });
    }
  };

  const handleZoomOut = () => {
    const range = brushRange.endIndex - brushRange.startIndex;
    const center = Math.floor((brushRange.startIndex + brushRange.endIndex) / 2);
    const newRange = Math.min(data.length - 1, range * 2);
    setBrushRange({
      startIndex: Math.max(0, center - Math.floor(newRange / 2)),
      endIndex: Math.min(data.length - 1, center + Math.ceil(newRange / 2)),
    });
  };

  const handleReset = () => {
    setBrushRange({ startIndex: 0, endIndex: data.length - 1 });
    setHiddenKeys([]);
  };

  const visibleData = data.slice(brushRange.startIndex, brushRange.endIndex + 1);

  const CustomLegend = ({ payload }) => (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry) => (
        <button
          key={entry.dataKey}
          onClick={() => handleLegendClick(entry.dataKey)}
          className={`flex items-center gap-2 text-sm transition-opacity ${
            hiddenKeys.includes(entry.dataKey) ? 'opacity-40' : ''
          }`}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 dark:text-gray-400">{entry.value}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-2">
      {showZoom && (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {dataKeys.map((key, index) => (
                <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip content={<EnhancedTooltip formatter={formatter} />} />
            <Legend content={<CustomLegend />} />

            {dataKeys.map(
              (key, index) =>
                !hiddenKeys.includes(key) && (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={COLORS[index % COLORS.length]}
                    fillOpacity={1}
                    fill={`url(#color${key})`}
                    strokeWidth={2}
                    stackId={stacked ? 'stack' : undefined}
                    animationDuration={500}
                  />
                )
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showBrush && data.length > 10 && (
        <div className="h-12 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <Area
                type="monotone"
                dataKey={dataKeys[0]}
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.2}
              />
              <Brush
                dataKey={xKey}
                height={30}
                stroke="#8b5cf6"
                startIndex={brushRange.startIndex}
                endIndex={brushRange.endIndex}
                onChange={(range) => setBrushRange(range)}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

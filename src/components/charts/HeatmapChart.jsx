import { useState } from 'react';

const getColor = (value, min, max, colorScheme = 'violet') => {
  const normalized = (value - min) / (max - min || 1);

  const schemes = {
    violet: {
      colors: ['#f5f3ff', '#c4b5fd', '#8b5cf6', '#6d28d9', '#4c1d95'],
    },
    blue: {
      colors: ['#eff6ff', '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'],
    },
    green: {
      colors: ['#f0fdf4', '#86efac', '#22c55e', '#15803d', '#14532d'],
    },
    red: {
      colors: ['#fef2f2', '#fca5a5', '#ef4444', '#b91c1c', '#7f1d1d'],
    },
  };

  const colors = schemes[colorScheme]?.colors || schemes.violet.colors;
  const index = Math.min(Math.floor(normalized * (colors.length - 1)), colors.length - 1);
  return colors[Math.max(0, index)];
};

export default function HeatmapChart({
  data = [],
  xLabels = [],
  yLabels = [],
  valueKey = 'value',
  xKey = 'x',
  yKey = 'y',
  colorScheme = 'violet',
  showValues = true,
  title,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Calculate min/max for color scaling
  const values = data.map((d) => d[valueKey]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Create matrix from data
  const matrix = {};
  data.forEach((d) => {
    const key = `${d[yKey]}-${d[xKey]}`;
    matrix[key] = d[valueKey];
  });

  return (
    <div className="space-y-4">
      {title && <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>}

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* X-axis labels */}
          <div className="flex ml-20">
            {xLabels.map((label, i) => (
              <div
                key={i}
                className="flex-1 min-w-[50px] text-center text-xs text-gray-500 dark:text-gray-400 pb-2 truncate px-1"
                title={label}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex flex-col">
            {yLabels.map((yLabel, yi) => (
              <div key={yi} className="flex items-center">
                {/* Y-axis label */}
                <div
                  className="w-20 pr-2 text-right text-xs text-gray-500 dark:text-gray-400 truncate"
                  title={yLabel}
                >
                  {yLabel}
                </div>

                {/* Row cells */}
                <div className="flex flex-1">
                  {xLabels.map((xLabel, xi) => {
                    const cellKey = `${yLabel}-${xLabel}`;
                    const value = matrix[cellKey] ?? 0;
                    const isHovered = hoveredCell === cellKey;

                    return (
                      <div
                        key={xi}
                        className={`flex-1 min-w-[50px] h-10 flex items-center justify-center text-xs font-medium transition-all cursor-pointer border border-white dark:border-gray-800 relative group/cell ${
                          isHovered ? 'ring-2 ring-violet-500 z-10' : ''
                        }`}
                        style={{
                          backgroundColor: getColor(value, minValue, maxValue, colorScheme),
                        }}
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                            {yLabel} × {xLabel}: {value.toLocaleString()}
                          </div>
                        )}
                        {showValues && (
                          <span
                            className={
                              value > (maxValue - minValue) / 2 + minValue
                                ? 'text-white'
                                : 'text-gray-700'
                            }
                          >
                            {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end mt-4 gap-2">
            <span className="text-xs text-gray-500">Low</span>
            <div className="flex h-3 w-32 rounded overflow-hidden">
              {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{
                    backgroundColor: getColor(
                      minValue + v * (maxValue - minValue),
                      minValue,
                      maxValue,
                      colorScheme
                    ),
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

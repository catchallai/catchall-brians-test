import { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Legend,
  Cell,
} from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

export default function ScatterPlotChart({
  data = [],
  xKey = 'x',
  yKey = 'y',
  zKey = 'z',
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  groupKey,
}) {
  const [activeGroup, setActiveGroup] = useState(null);

  // Group data if groupKey provided
  const groups = groupKey ? [...new Set(data.map((d) => d[groupKey]))] : ['all'];

  const groupedData = groupKey
    ? groups.reduce((acc, group) => {
        acc[group] = data.filter((d) => d[groupKey] === group);
        return acc;
      }, {})
    : { all: data };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) {
      return null;
    }
    const point = payload[0].payload;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-3">
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-xs text-gray-500">{xLabel}:</span>
            <span className="text-sm font-medium">{point[xKey]?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-xs text-gray-500">{yLabel}:</span>
            <span className="text-sm font-medium">{point[yKey]?.toLocaleString()}</span>
          </div>
          {zKey && point[zKey] && (
            <div className="flex justify-between gap-4">
              <span className="text-xs text-gray-500">Size:</span>
              <span className="text-sm font-medium">{point[zKey]?.toLocaleString()}</span>
            </div>
          )}
          {point.name && (
            <div className="pt-1 border-t border-gray-100 dark:border-gray-700 mt-1">
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {point.name}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
          <XAxis
            type="number"
            dataKey={xKey}
            name={xLabel}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            label={{ value: xLabel, position: 'bottom', fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis
            type="number"
            dataKey={yKey}
            name={yLabel}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            label={{
              value: yLabel,
              angle: -90,
              position: 'insideLeft',
              fontSize: 12,
              fill: '#6b7280',
            }}
          />
          {zKey && <ZAxis type="number" dataKey={zKey} range={[50, 400]} />}
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          {groupKey && (
            <Legend
              onClick={(e) => setActiveGroup(activeGroup === e.value ? null : e.value)}
              wrapperStyle={{ cursor: 'pointer' }}
            />
          )}

          {groups.map((group, index) => (
            <Scatter
              key={group}
              name={group === 'all' ? 'Data' : group}
              data={groupedData[group]}
              fill={COLORS[index % COLORS.length]}
              opacity={activeGroup && activeGroup !== group ? 0.3 : 1}
            >
              {groupedData[group].map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={COLORS[index % COLORS.length]}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

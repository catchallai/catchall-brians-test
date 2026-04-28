import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ConversionFunnelChart() {
  const funnelData = [
    { stage: 'Visitors', value: 10000, color: '#3b82f6', percent: 100 },
    { stage: 'Leads', value: 2500, color: '#8b5cf6', percent: 25 },
    { stage: 'MQLs', value: 800, color: '#a855f7', percent: 8 },
    { stage: 'SQLs', value: 300, color: '#d946ef', percent: 3 },
    { stage: 'Opportunities', value: 120, color: '#ec4899', percent: 1.2 },
    { stage: 'Customers', value: 45, color: '#10b981', percent: 0.45 },
  ];

  const conversionRates = [
    { from: 'Visitors → Leads', rate: '25.0%' },
    { from: 'Leads → MQLs', rate: '32.0%' },
    { from: 'MQLs → SQLs', rate: '37.5%' },
    { from: 'SQLs → Opportunities', rate: '40.0%' },
    { from: 'Opportunities → Customers', rate: '37.5%' },
  ];

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">10K</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Visitors</p>
        </div>
        <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
          <p className="text-xl font-bold text-violet-600 dark:text-violet-400">2.5K</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Leads</p>
        </div>
        <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">45</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Customers</p>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={funnelData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="stage"
              type="category"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value) => [value.toLocaleString(), 'Count']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion Rates */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Conversion Rates
        </p>
        <div className="grid grid-cols-2 gap-2">
          {conversionRates.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs p-1.5 bg-gray-50 dark:bg-gray-700 rounded"
            >
              <span className="text-gray-600 dark:text-gray-300 truncate">{item.from}</span>
              <span className="font-medium text-violet-600 dark:text-violet-400">{item.rate}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

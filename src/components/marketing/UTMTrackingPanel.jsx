import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link2, TrendingUp, Users, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export default function UTMTrackingPanel({ utmData }) {
  // Aggregate by source
  const bySource = utmData.reduce((acc, item) => {
    const source = item.utm_source || 'direct';
    if (!acc[source]) {
      acc[source] = { count: 0, conversions: 0, value: 0 };
    }
    acc[source].count++;
    if (item.converted) {
      acc[source].conversions++;
      acc[source].value += item.conversion_value || 0;
    }
    return acc;
  }, {});

  const sourceData = Object.entries(bySource)
    .map(([name, data]) => ({
      name,
      visits: data.count,
      conversions: data.conversions,
      value: data.value,
      rate: data.count > 0 ? ((data.conversions / data.count) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.visits - a.visits);

  // Aggregate by campaign
  const byCampaign = utmData.reduce((acc, item) => {
    const campaign = item.utm_campaign || 'none';
    if (!acc[campaign]) {
      acc[campaign] = { count: 0, conversions: 0 };
    }
    acc[campaign].count++;
    if (item.converted) {
      acc[campaign].conversions++;
    }
    return acc;
  }, {});

  const campaignData = Object.entries(byCampaign)
    .map(([name, data]) => ({
      name: name.slice(0, 15),
      visits: data.count,
      conversions: data.conversions,
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 6);

  const totalVisits = utmData.length;
  const totalConversions = utmData.filter((u) => u.converted).length;
  const totalValue = utmData.reduce((sum, u) => sum + (u.conversion_value || 0), 0);
  const avgConversionRate =
    totalVisits > 0 ? ((totalConversions / totalVisits) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          UTM Tracking & Attribution
        </h2>
        <p className="text-sm text-gray-500">
          Track which campaigns and channels drive conversions
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Link2 className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalVisits}</p>
            <p className="text-sm text-gray-500">Tracked Visits</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalConversions}</p>
            <p className="text-sm text-gray-500">Conversions</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-600">{avgConversionRate}%</p>
            <p className="text-sm text-gray-500">Conversion Rate</p>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-2xl">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalValue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Attributed Value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Source */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Traffic by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No UTM data yet</p>
            ) : (
              <div className="space-y-3">
                {sourceData.map((source, idx) => (
                  <div key={source.name} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {source.name}
                        </span>
                        <span className="text-sm text-gray-500">{source.visits} visits</span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span>{source.conversions} conversions</span>
                        <span className="text-emerald-600">{source.rate}% rate</span>
                        {source.value > 0 && <span>${source.value.toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Campaign */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignData.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No campaign data</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={campaignData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="visits" fill="#8b5cf6" name="Visits" />
                  <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

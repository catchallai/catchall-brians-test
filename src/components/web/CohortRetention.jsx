import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function CohortRetention({ cohorts = [] }) {
  if (!cohorts.length) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6 text-center text-gray-500">
          No cohort data available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {cohorts.map((cohort) => (
        <Card key={cohort.id} className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{cohort.cohort_name}</span>
              <div className="flex gap-2">
                <Badge variant="outline">{cohort.total_users} users</Badge>
                <Badge className="bg-emerald-100 text-emerald-800">
                  {cohort.conversion_rate}% CVR
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Avg LTV</p>
                <p className="text-2xl font-bold text-emerald-600">${cohort.avg_ltv}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Churn Rate</p>
                <p className="text-2xl font-bold text-red-600">{cohort.churn_rate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="text-lg font-medium">{cohort.acquisition_source}</p>
              </div>
            </div>

            {cohort.retention_data && (
              <div>
                <h4 className="text-sm font-medium mb-3">Retention Curve</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={cohort.retention_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="retention_rate"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="Retention %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

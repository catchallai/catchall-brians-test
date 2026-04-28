import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const RISK_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

export default function ChurnRiskAnalytics({ healthScores, onboardings, interactions }) {
  // Calculate churn risk based on multiple factors
  const calculateChurnRisk = (customer) => {
    let riskScore = 0;
    const health = healthScores.find((h) => h.contact_id === customer.contact_id);
    const onboarding = onboardings.find((o) => o.contact_id === customer.contact_id);
    const recentInteractions = interactions
      .filter((i) => i.contact_id === customer.contact_id)
      .filter((i) => {
        const daysSince =
          (Date.now() - new Date(i.interaction_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      });

    // Health score factor (40% weight)
    if (health) {
      if (health.health_status === 'critical') {
        riskScore += 40;
      } else if (health.health_status === 'at_risk') {
        riskScore += 25;
      } else if (health.health_score < 60) {
        riskScore += 15;
      }
    } else {
      riskScore += 30; // No health data is risky
    }

    // Onboarding factor (20% weight)
    if (onboarding) {
      if (onboarding.status === 'stalled') {
        riskScore += 20;
      } else if (onboarding.progress_percentage < 50) {
        riskScore += 15;
      }
    }

    // Interaction frequency (25% weight)
    if (recentInteractions.length === 0) {
      riskScore += 25;
    } else if (recentInteractions.length === 1) {
      riskScore += 15;
    } else if (recentInteractions.length === 2) {
      riskScore += 10;
    }

    // Negative sentiment (15% weight)
    const negativeSentiment = recentInteractions.filter((i) => i.sentiment === 'negative').length;
    if (negativeSentiment > 1) {
      riskScore += 15;
    } else if (negativeSentiment === 1) {
      riskScore += 10;
    }

    return {
      score: Math.min(riskScore, 100),
      level: riskScore >= 60 ? 'high' : riskScore >= 35 ? 'medium' : 'low',
    };
  };

  // Get unique customers from health scores
  const customers = healthScores.map((h) => ({
    contact_id: h.contact_id,
    company_id: h.company_id,
    ...calculateChurnRisk(h),
  }));

  const highRiskCustomers = customers.filter((c) => c.level === 'high');
  const mediumRiskCustomers = customers.filter((c) => c.level === 'medium');
  const lowRiskCustomers = customers.filter((c) => c.level === 'low');

  const chartData = [
    { name: 'High Risk', value: highRiskCustomers.length, color: RISK_COLORS.high },
    { name: 'Medium Risk', value: mediumRiskCustomers.length, color: RISK_COLORS.medium },
    { name: 'Low Risk', value: lowRiskCustomers.length, color: RISK_COLORS.low },
  ];

  const estimatedChurnValue = highRiskCustomers.length * 50000 + mediumRiskCustomers.length * 25000;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Churn Risk Analytics
          </CardTitle>
          <Badge variant="outline" className="text-red-600 border-red-200">
            {highRiskCustomers.length} High Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400 mb-1">High Risk</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {highRiskCustomers.length}
            </p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Medium Risk</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {mediumRiskCustomers.length}
            </p>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Low Risk</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {lowRiskCustomers.length}
            </p>
          </div>
          <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <p className="text-xs text-violet-600 dark:text-violet-400 mb-1">At-Risk Value</p>
            <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
              ${(estimatedChurnValue / 1000).toFixed(0)}K
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* High Risk Customers */}
        {highRiskCustomers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Immediate Action Required
            </h4>
            <div className="space-y-2">
              {highRiskCustomers.slice(0, 5).map((customer, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Customer #{customer.contact_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">Risk Score: {customer.score}/100</p>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive">
                    Contact Now
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

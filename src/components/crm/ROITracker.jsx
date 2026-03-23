import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Target, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ROITracker() {
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns-roi'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 50),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals-roi'],
    queryFn: () => base44.entities.Deal.list('-created_date', 200),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-roi'],
    queryFn: () => base44.entities.Contact.list('-created_date', 500),
  });

  // Calculate ROI metrics
  const calculateCampaignROI = () => {
    return campaigns
      .map((campaign) => {
        const campaignDeals = deals.filter((d) => d.campaign_id === campaign.id);
        const totalRevenue = campaignDeals
          .filter((d) => d.stage === 'closed_won')
          .reduce((sum, d) => sum + (d.value || 0), 0);
        const cost = campaign.budget || 0;
        const roi = cost > 0 ? ((totalRevenue - cost) / cost) * 100 : 0;
        const leads = contacts.filter((c) => c.campaign_id === campaign.id).length;
        const costPerLead = leads > 0 ? cost / leads : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          cost,
          revenue: totalRevenue,
          roi,
          leads,
          deals: campaignDeals.length,
          wonDeals: campaignDeals.filter((d) => d.stage === 'closed_won').length,
          costPerLead,
          conversionRate:
            leads > 0
              ? (campaignDeals.filter((d) => d.stage === 'closed_won').length / leads) * 100
              : 0,
        };
      })
      .filter((c) => c.cost > 0 || c.revenue > 0);
  };

  const campaignROI = calculateCampaignROI();

  const totalSpend = campaignROI.reduce((sum, c) => sum + c.cost, 0);
  const totalRevenue = campaignROI.reduce((sum, c) => sum + c.revenue, 0);
  const overallROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
  const totalLeads = campaignROI.reduce((sum, c) => sum + c.leads, 0);
  const avgCostPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;

  // Chart data
  const chartData = campaignROI.slice(0, 8).map((c) => ({
    name: c.name.slice(0, 15),
    revenue: c.revenue,
    cost: c.cost,
    roi: c.roi,
  }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Campaign ROI Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-600">
              ${(totalRevenue / 1000).toFixed(1)}K
            </p>
            <p className="text-xs text-gray-500">Total Revenue</p>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-blue-600">${(totalSpend / 1000).toFixed(1)}K</p>
            <p className="text-xs text-gray-500">Total Spend</p>
          </div>
          <div className="text-center p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              {overallROI >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p
              className={`text-xl font-bold ${overallROI >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {overallROI.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">Overall ROI</p>
          </div>
          <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <Users className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-amber-600">${avgCostPerLead.toFixed(0)}</p>
            <p className="text-xs text-gray-500">Avg CPL</p>
          </div>
        </div>

        {/* Revenue vs Cost Chart */}
        {chartData.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Revenue vs Cost by Campaign
            </p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" fill="#6366f1" name="Cost" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Campaign Breakdown */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Campaign Performance
          </p>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {campaignROI.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No campaign data with budget/revenue
              </p>
            ) : (
              campaignROI.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {campaign.name}
                    </span>
                    <Badge
                      className={
                        campaign.roi >= 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {campaign.roi >= 0 ? '+' : ''}
                      {campaign.roi.toFixed(1)}% ROI
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Spend</p>
                      <p className="font-medium">${campaign.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Revenue</p>
                      <p className="font-medium text-emerald-600">
                        ${campaign.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Leads</p>
                      <p className="font-medium">{campaign.leads}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Conv.</p>
                      <p className="font-medium">{campaign.conversionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

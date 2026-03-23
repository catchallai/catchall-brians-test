import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, Building2, DollarSign } from 'lucide-react';

export default function UserDemographicsCard() {
  // SyberJet audience demographics - luxury aviation target market
  const demographics = {
    industries: [
      { name: 'Business Executives', percentage: 35, color: '#8b5cf6' },
      { name: 'Finance & Investment', percentage: 22, color: '#06b6d4' },
      { name: 'Real Estate & Development', percentage: 15, color: '#10b981' },
      { name: 'Technology & Startups', percentage: 12, color: '#f59e0b' },
      { name: 'Healthcare & Pharma', percentage: 8, color: '#ec4899' },
      { name: 'Other', percentage: 8, color: '#9ca3af' },
    ],
    companySize: [
      { name: 'Enterprise (1000+)', percentage: 42 },
      { name: 'Mid-Market (100-999)', percentage: 28 },
      { name: 'Small Business (10-99)', percentage: 18 },
      { name: 'Individual', percentage: 12 },
    ],
    seniority: [
      { name: 'C-Level / Owner', percentage: 38 },
      { name: 'VP / Director', percentage: 32 },
      { name: 'Manager', percentage: 18 },
      { name: 'Other', percentage: 12 },
    ],
    estimatedNetWorth: [
      { range: '$50M+', percentage: 15 },
      { range: '$10M - $50M', percentage: 28 },
      { range: '$5M - $10M', percentage: 32 },
      { range: '$1M - $5M', percentage: 25 },
    ],
  };

  return (
    <Card className="glass-card rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Audience Demographics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Industry Breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Industry</span>
          </div>
          <div className="space-y-2">
            {demographics.industries.map((industry) => (
              <div key={industry.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{industry.name}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {industry.percentage}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${industry.percentage}%`, backgroundColor: industry.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Size */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Company Size
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demographics.companySize.map((size) => (
              <div
                key={size.name}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center"
              >
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {size.percentage}%
                </p>
                <p className="text-xs text-gray-500">{size.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Seniority Level */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Seniority Level
            </span>
          </div>
          <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
            {demographics.seniority.map((level, idx) => (
              <div
                key={level.name}
                className="flex items-center justify-center transition-all hover:opacity-80"
                style={{
                  width: `${level.percentage}%`,
                  backgroundColor: ['#8b5cf6', '#06b6d4', '#10b981', '#9ca3af'][idx],
                }}
                title={`${level.name}: ${level.percentage}%`}
              >
                <span className="text-xs text-white font-medium">{level.percentage}%</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {demographics.seniority.map((level, idx) => (
              <div key={level.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ['#8b5cf6', '#06b6d4', '#10b981', '#9ca3af'][idx] }}
                />
                {level.name}
              </div>
            ))}
          </div>
        </div>

        {/* Net Worth Indicator */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Est. Net Worth (Audience)
            </span>
          </div>
          <div className="space-y-2">
            {demographics.estimatedNetWorth.map((tier) => (
              <div key={tier.range} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-24">{tier.range}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${tier.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
                  {tier.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

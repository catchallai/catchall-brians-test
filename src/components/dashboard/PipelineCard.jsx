import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, DollarSign, TrendingUp } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const stageConfig = {
  lead: { label: 'Lead', color: 'bg-gray-400' },
  qualified: { label: 'Qualified', color: 'bg-blue-500' },
  proposal: { label: 'Proposal', color: 'bg-violet-500' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500' },
  won: { label: 'Won', color: 'bg-emerald-500' },
  lost: { label: 'Lost', color: 'bg-red-500' },
};

export default function PipelineCard({ deals }) {
  const activeDealsByStage = Object.entries(stageConfig)
    .filter(([stage]) => !['won', 'lost'].includes(stage))
    .map(([stage, config]) => ({
      stage,
      ...config,
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((sum, d) => sum + (d.value || 0), 0)
    }));

  const totalPipeline = deals
    .filter(d => !['won', 'lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const wonValue = deals
    .filter(d => d.stage === 'won')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toLocaleString()}`;
  };

  const maxCount = Math.max(...activeDealsByStage.map(s => s.count), 1);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between text-gray-900 dark:text-white">
          <span className="flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-500" />
            Sales Pipeline
          </span>
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-0">
            {formatCurrency(totalPipeline)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline Stages */}
        <div className="space-y-3">
          {activeDealsByStage.map((stage) => (
            <div key={stage.stage}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">{stage.label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stage.count} · {formatCurrency(stage.value)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                  style={{ width: `${(stage.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Won Revenue */}
        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Won Revenue</span>
          </div>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(wonValue)}
          </span>
        </div>

        <Link 
          to={createPageUrl('Deals')}
          className="block text-center text-sm text-violet-600 dark:text-violet-400 hover:underline py-2"
        >
          View All Deals →
        </Link>
      </CardContent>
    </Card>
  );
}
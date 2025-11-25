import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, TrendingDown } from "lucide-react";

const categoryColors = {
  demographic: "bg-blue-100 text-blue-700",
  engagement: "bg-emerald-100 text-emerald-700",
  behavior: "bg-amber-100 text-amber-700",
};

const operatorLabels = {
  equals: '=',
  not_equals: '≠',
  contains: 'contains',
  greater_than: '>',
  less_than: '<',
  exists: 'exists',
};

export default function LeadScoreCard({ rule, onToggle, onClick }) {
  const isPositive = rule.score_points > 0;

  return (
    <Card 
      className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isPositive ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{rule.name}</h3>
              <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{rule.score_points} pts
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`${categoryColors[rule.category]} text-xs border-0`}>
                {rule.category}
              </Badge>
              <span className="text-sm text-gray-500">
                {rule.condition_field} {operatorLabels[rule.condition_operator]} {rule.condition_value || ''}
              </span>
            </div>
          </div>
        </div>
        
        <Switch
          checked={rule.is_active}
          onCheckedChange={(checked) => onToggle(rule.id, checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </Card>
  );
}
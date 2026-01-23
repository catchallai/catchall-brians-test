import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, DollarSign, TrendingUp } from "lucide-react";

export default function DealKanbanBoard({ 
  deals, 
  stages, 
  stageColors, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onViewDeal,
  getContact 
}) {
  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getDealsForStage = (stageId) => deals.filter(d => d.stage === stageId);
  const getStageValue = (stageId) => getDealsForStage(stageId).reduce((sum, d) => sum + (d.value || 0), 0);
  const getStageWeightedValue = (stageId) => {
    return getDealsForStage(stageId).reduce((sum, d) => sum + ((d.value || 0) * ((d.probability || 50) / 100)), 0);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      {stages.map((stage, index) => {
        const stageId = stage.id;
        const stageName = stage.name || stage.label;
        const stageColor = stage.color || stageColors[index % stageColors.length];
        const stageDeals = getDealsForStage(stageId);
        const stageValue = getStageValue(stageId);
        const weightedValue = getStageWeightedValue(stageId);

        return (
          <div
            key={stageId}
            className={`min-w-[300px] max-w-[300px] rounded-xl ${stageColor} p-4 flex flex-col`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, stageId)}
          >
            {/* Stage Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{stageName}</h3>
                <Badge variant="outline" className="text-xs">{stageDeals.length}</Badge>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>{formatCurrency(stageValue)}</span>
                </div>
                {stageId !== 'won' && stageId !== 'lost' && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs">{formatCurrency(weightedValue)} weighted</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deals List */}
            <div className="space-y-3 flex-1">
              {stageDeals.map((deal) => {
                const contact = getContact(deal.contact_id);
                return (
                  <Card
                    key={deal.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, deal)}
                    onClick={() => onViewDeal(deal)}
                    className="p-3 cursor-move hover:shadow-md transition-all bg-white dark:bg-gray-800 border-l-4 border-l-violet-500"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{deal.title}</p>
                        {contact && (
                          <p className="text-xs text-gray-500 truncate">{contact.first_name} {contact.last_name}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(deal.value)}
                          </span>
                          {deal.probability && (
                            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30">
                              {deal.probability}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {stageDeals.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Drop deals here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
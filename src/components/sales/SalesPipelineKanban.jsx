import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-50 dark:bg-gray-800' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'proposal', label: 'Proposal', color: 'bg-violet-50 dark:bg-violet-900/20' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'closed_won', label: 'Won', color: 'bg-green-50 dark:bg-green-900/20' },
];

export default function SalesPipelineKanban({ deals = [], onDealDrop, onDealClick }) {
  const [draggedDeal, setDraggedDeal] = useState(null);

  const getDealsByStage = (stageId) => {
    return deals.filter((d) => d.stage === stageId);
  };

  const getStageTotal = (stageId) => {
    return getDealsByStage(stageId).reduce((sum, d) => sum + (d.value || 0), 0);
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    if (draggedDeal && draggedDeal.stage !== stageId) {
      onDealDrop?.(draggedDeal, stageId);
    }
    setDraggedDeal(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const stageDels = getDealsByStage(stage.id);
          const stageTotal = getStageTotal(stage.id);

          return (
            <div
              key={stage.id}
              className={`${stage.color} rounded-xl p-4 min-h-[600px] transition-all`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{stage.label}</h3>
                  <Badge variant="secondary">{stageDels.length}</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ${(stageTotal / 1000).toFixed(0)}k
                </p>
              </div>

              <div className="space-y-3">
                {stageDels.map((deal) => (
                  <Card
                    key={deal.id}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    onClick={() => onDealClick?.(deal)}
                  >
                    <CardContent className="p-3">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {deal.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {deal.contact_id || 'No contact'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${(deal.value / 1000).toFixed(0)}k
                        </span>
                        {deal.probability && (
                          <Badge variant="outline" className="text-xs">
                            {deal.probability}%
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

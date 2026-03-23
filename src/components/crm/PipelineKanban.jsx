import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, DollarSign } from 'lucide-react';

const STAGES = [
  {
    id: 'new_lead',
    label: 'New Lead',
    color: 'bg-blue-100 dark:bg-blue-900',
    badge: 'bg-blue-500',
  },
  {
    id: 'email_list',
    label: 'Email List',
    color: 'bg-purple-100 dark:bg-purple-900',
    badge: 'bg-purple-500',
  },
  {
    id: 'media_inquiry',
    label: 'Media Inquiry',
    color: 'bg-indigo-100 dark:bg-indigo-900',
    badge: 'bg-indigo-500',
  },
  {
    id: 'reservation_request',
    label: 'Reservation Req',
    color: 'bg-cyan-100 dark:bg-cyan-900',
    badge: 'bg-cyan-500',
  },
  {
    id: 'contacted',
    label: 'Contacted',
    color: 'bg-yellow-100 dark:bg-yellow-900',
    badge: 'bg-yellow-500',
  },
  {
    id: 'no_response',
    label: 'No Response',
    color: 'bg-orange-100 dark:bg-orange-900',
    badge: 'bg-orange-500',
  },
  {
    id: 'closed',
    label: 'Closed',
    color: 'bg-emerald-100 dark:bg-emerald-900',
    badge: 'bg-emerald-500',
  },
  {
    id: 'not_interested',
    label: 'Not Interested',
    color: 'bg-red-100 dark:bg-red-900',
    badge: 'bg-red-500',
  },
];

export default function PipelineKanban({ opportunities, onEdit, onDelete }) {
  const opportunitiesByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = opportunities.filter((opp) => opp.stage === stage.id);
    return acc;
  }, {});

  const stageValues = STAGES.reduce((acc, stage) => {
    acc[stage.id] = opportunitiesByStage[stage.id].reduce((sum, opp) => sum + (opp.value || 0), 0);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => (
        <div key={stage.id} className={`rounded-2xl p-4 min-h-96 ${stage.color}`}>
          {/* Stage Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${stage.badge}`}></div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{stage.label}</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {opportunitiesByStage[stage.id].length}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              ${stageValues[stage.id].toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Opportunities */}
          <div className="space-y-3">
            {opportunitiesByStage[stage.id].length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                No opportunities
              </div>
            ) : (
              opportunitiesByStage[stage.id].map((opp) => (
                <Card
                  key={opp.id}
                  className="glass-card rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Title */}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white line-clamp-2 text-sm">
                          {opp.title}
                        </p>
                      </div>

                      {/* Contact Info */}
                      {opp.contact_name && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <p className="font-medium">{opp.contact_name}</p>
                          {opp.contact_email && <p className="truncate">{opp.contact_email}</p>}
                        </div>
                      )}

                      {/* Value */}
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-emerald-600">
                          ${(opp.value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-8"
                          onClick={() => onEdit(opp)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => onDelete(opp)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

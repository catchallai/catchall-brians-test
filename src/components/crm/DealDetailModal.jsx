import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Percent, User, Building2, Activity, FileText, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DealDetailModal({ open, onClose, dealId, onEdit, onDelete }) {
  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const deals = await base44.entities.Deal.filter({ id: dealId });
      return deals[0];
    },
    enabled: !!dealId && open,
  });

  const { data: contact } = useQuery({
    queryKey: ['contact', deal?.contact_id],
    queryFn: async () => {
      if (!deal?.contact_id) {
        return null;
      }
      const contacts = await base44.entities.Contact.filter({ id: deal.contact_id });
      return contacts[0];
    },
    enabled: !!deal?.contact_id,
  });

  const { data: company } = useQuery({
    queryKey: ['company', deal?.company_id],
    queryFn: async () => {
      if (!deal?.company_id) {
        return null;
      }
      const companies = await base44.entities.Company.filter({ id: deal.company_id });
      return companies[0];
    },
    enabled: !!deal?.company_id,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['deal-activities', dealId],
    queryFn: () => base44.entities.Activity.filter({ deal_id: dealId }, '-created_date', 50),
    enabled: !!dealId && open,
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <Skeleton className="h-64" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!deal) {
    return null;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{deal.title}</DialogTitle>
              <Badge className="mt-2 capitalize bg-violet-100 text-violet-700">
                {deal.stage?.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(deal.value)}</p>
              {deal.probability && (
                <p className="text-sm text-gray-500 mt-1">{deal.probability}% win probability</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Key Details */}
          <Card className="glass-card">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Key Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {contact && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>
                      {contact.first_name} {contact.last_name}
                    </span>
                  </div>
                )}
                {company && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Building2 className="w-4 h-4" />
                    <span>{company.name}</span>
                  </div>
                )}
                {deal.expected_close_date && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Close: {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {deal.probability && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Percent className="w-4 h-4" />
                    <span>{deal.probability}% probability</span>
                  </div>
                )}
              </div>

              {deal.description && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {deal.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          {activities.length > 0 && (
            <Card className="glass-card">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <Activity className="w-4 h-4" />
                  Recent Activities ({activities.length})
                </h3>
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          activity.type === 'call'
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : activity.type === 'email'
                              ? 'bg-violet-100 dark:bg-violet-900'
                              : activity.type === 'meeting'
                                ? 'bg-emerald-100 dark:bg-emerald-900'
                                : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.due_date && format(new Date(activity.due_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      {activity.completed && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Done</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onEdit?.(deal)} className="flex-1 gap-2">
              <Edit className="w-4 h-4" />
              Edit Deal
            </Button>
            <Button
              variant="outline"
              onClick={() => onDelete?.(deal)}
              className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

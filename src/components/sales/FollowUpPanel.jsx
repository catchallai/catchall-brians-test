import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mail, Phone, CheckCircle, Calendar, Clock, Loader2, Send } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

const followUpTypeIcons = {
  email: Mail,
  call: Phone,
  task: CheckCircle,
  meeting: Calendar,
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  urgent: 'bg-red-600 text-white',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-400 text-white',
  overdue: 'bg-red-100 text-red-700',
};

export default function FollowUpPanel({
  followUps,
  contacts,
  onGenerate,
  onComplete,
  onSend,
  isGenerating,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const getContactName = (contactId) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
  };

  const getTimeLabel = (date) => {
    if (!date) {
      return '';
    }
    const d = new Date(date);
    if (isPast(d) && !isToday(d)) {
      return 'Overdue';
    }
    if (isToday(d)) {
      return 'Today';
    }
    if (isTomorrow(d)) {
      return 'Tomorrow';
    }
    return format(d, 'MMM d');
  };

  const pendingFollowUps = followUps.filter((f) => f.status === 'pending');
  const overdueFollowUps = pendingFollowUps.filter((f) => isPast(new Date(f.scheduled_date)));

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Follow-Up Actions</CardTitle>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            size="sm"
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> AI Suggest Follow-Ups
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-amber-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingFollowUps.length}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{overdueFollowUps.length}</p>
              <p className="text-xs text-gray-600">Overdue</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {followUps.filter((f) => f.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
          </div>

          {followUps.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No follow-ups yet</p>
              <p className="text-gray-400 text-xs">Click "AI Suggest Follow-Ups" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUps.map((followUp) => {
                const TypeIcon = followUpTypeIcons[followUp.follow_up_type];
                const isExpanded = expandedId === followUp.id;
                const isOverdue =
                  followUp.status === 'pending' && isPast(new Date(followUp.scheduled_date));

                return (
                  <div
                    key={followUp.id}
                    className={`border rounded-lg p-3 transition-all ${
                      isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        <TypeIcon className="w-5 h-5 text-violet-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {getContactName(followUp.contact_id)}
                          </p>
                          <p className="text-xs text-gray-600">{followUp.action_description}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : followUp.id)}
                      >
                        {isExpanded ? '−' : '+'}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${priorityColors[followUp.priority]} border-0 text-xs`}>
                        {followUp.priority}
                      </Badge>
                      <Badge className={`${statusColors[followUp.status]} border-0 text-xs`}>
                        {followUp.status}
                      </Badge>
                      {followUp.scheduled_date && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          {getTimeLabel(followUp.scheduled_date)}
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        {followUp.ai_suggested_message && (
                          <div className="p-3 bg-violet-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-violet-600" />
                              <p className="text-xs font-medium text-violet-700">
                                AI-Generated Message
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {followUp.ai_suggested_message}
                            </p>
                          </div>
                        )}

                        {followUp.reasoning && (
                          <div className="p-2 bg-blue-50 rounded text-xs text-gray-700">
                            <p className="font-medium text-blue-700 mb-1">Why now?</p>
                            <p>{followUp.reasoning}</p>
                          </div>
                        )}

                        {followUp.sales_stage && (
                          <Badge variant="outline" className="text-xs">
                            Stage: {followUp.sales_stage}
                          </Badge>
                        )}

                        {followUp.status === 'pending' && (
                          <div className="flex gap-2">
                            {followUp.follow_up_type === 'email' &&
                              followUp.ai_suggested_message && (
                                <Button
                                  size="sm"
                                  onClick={() => onSend(followUp)}
                                  className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <Send className="w-3 h-3" />
                                  Send Email
                                </Button>
                              )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onComplete(followUp.id)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Mark Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

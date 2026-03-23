import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, AlertTriangle, Clock } from 'lucide-react';

const statusColors = {
  not_started: { bg: 'bg-gray-100', text: 'text-gray-700' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  stalled: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function OnboardingTracker({ onboardings, contacts, onUpdate }) {
  const handleMilestoneToggle = (onboarding, milestoneIndex) => {
    const updatedMilestones = [...(onboarding.milestones || [])];
    updatedMilestones[milestoneIndex] = {
      ...updatedMilestones[milestoneIndex],
      completed: !updatedMilestones[milestoneIndex].completed,
      completed_date: !updatedMilestones[milestoneIndex].completed
        ? new Date().toISOString()
        : null,
    };

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    onUpdate(onboarding.id, {
      milestones: updatedMilestones,
      progress_percentage: progress,
      status: progress === 100 ? 'completed' : 'in_progress',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {onboardings.map((onboarding) => {
        const contact = contacts.find((c) => c.id === onboarding.contact_id);
        const colors = statusColors[onboarding.status];

        return (
          <Card key={onboarding.id} className="glass-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {contact?.first_name} {contact?.last_name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">{contact?.company}</p>
                </div>
                <Badge className={`${colors.bg} ${colors.text} border-0`}>
                  {onboarding.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-bold">{onboarding.progress_percentage}%</span>
                </div>
                <Progress value={onboarding.progress_percentage} className="h-2" />
              </div>

              {onboarding.csm_assigned && (
                <div className="text-sm">
                  <span className="text-gray-600">CSM:</span>{' '}
                  <span className="font-medium">{onboarding.csm_assigned}</span>
                </div>
              )}

              {onboarding.target_completion_date && (
                <div className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Target:</span>{' '}
                  <span className="font-medium">
                    {new Date(onboarding.target_completion_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {onboarding.milestones?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Milestones:</p>
                  {onboarding.milestones.map((milestone, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleMilestoneToggle(onboarding, idx)}
                    >
                      {milestone.completed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-sm ${milestone.completed ? 'line-through text-gray-500' : ''}`}
                        >
                          {milestone.name}
                        </p>
                        {milestone.completed && milestone.completed_date && (
                          <p className="text-xs text-gray-500">
                            {new Date(milestone.completed_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {onboarding.blockers?.length > 0 && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Blockers:
                  </p>
                  <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                    {onboarding.blockers.map((blocker, i) => (
                      <li key={i}>• {blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

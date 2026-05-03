import { Users, TrendingUp, Clock, Zap } from 'lucide-react';

export default function SequenceStats({ sequences, enrollments }) {
  const totalSequences = sequences.length;
  const activeSequences = sequences.filter(s => s.is_active).length;
  const totalEnrolled = enrollments.length;
  const activeEnrollments = enrollments.filter(e => e.status === 'active').length;

  const stats = [
    {
      label: 'Total Sequences',
      value: totalSequences,
      icon: Zap,
      color: 'from-emerald-50 to-transparent dark:from-emerald-950/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Active Campaigns',
      value: activeSequences,
      icon: TrendingUp,
      color: 'from-blue-50 to-transparent dark:from-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Total Enrolled',
      value: totalEnrolled,
      icon: Users,
      color: 'from-purple-50 to-transparent dark:from-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Active Now',
      value: activeEnrollments,
      icon: Clock,
      color: 'from-orange-50 to-transparent dark:from-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border-2 bg-gradient-to-br ${stat.color} ${stat.borderColor} transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <Icon className={`w-6 h-6 ${stat.textColor} opacity-60`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
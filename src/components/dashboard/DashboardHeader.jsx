import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function DashboardHeader({ user, stats }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 18) {
      return 'Good afternoon';
    }
    return 'Good evening';
  };

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 lg:p-8 text-white">
      {/* Background decoration */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative">
        <h1 className="text-2xl lg:text-3xl font-bold mb-1">
          {getGreeting()}, {firstName}! 👋
        </h1>
        <p className="text-white/80 text-sm lg:text-base">
          Here's your business performance at a glance
        </p>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 lg:p-4">
              <p className="text-white/70 text-xs lg:text-sm">{stat.label}</p>
              <p className="text-xl lg:text-2xl font-bold mt-1">{stat.value}</p>
              {stat.change && (
                <div
                  className={`flex items-center gap-1 text-xs mt-1 ${
                    stat.changeType === 'up'
                      ? 'text-emerald-300'
                      : stat.changeType === 'down'
                        ? 'text-red-300'
                        : 'text-white/60'
                  }`}
                >
                  {stat.changeType === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : stat.changeType === 'down' ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

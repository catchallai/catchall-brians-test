import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { differenceInMonths, addMonths, format, parseISO, isAfter, isBefore, startOfMonth } from 'date-fns';

function calcVesting(grant) {
  const today = new Date();
  const start = grant.vesting_start_date ? parseISO(grant.vesting_start_date) : (grant.grant_date ? parseISO(grant.grant_date) : null);
  if (!start) return { vested: grant.shares_vested || 0, unvested: (grant.shares_granted || 0) - (grant.shares_vested || 0), pct: 0 };

  const totalMonths = grant.vesting_months || 48;
  const cliff = grant.cliff_months || 12;
  const shares = grant.shares_granted || 0;
  const elapsed = differenceInMonths(today, start);

  let vested = 0;
  if (elapsed >= cliff) {
    const cliffShares = (cliff / totalMonths) * shares;
    const postCliff = Math.min(elapsed, totalMonths) - cliff;
    const monthly = shares / totalMonths;
    vested = cliffShares + postCliff * monthly;
  }
  vested = Math.min(vested, shares);
  return {
    vested: Math.round(vested),
    unvested: shares - Math.round(vested),
    pct: shares > 0 ? Math.round((vested / shares) * 100) : 0,
    nextEvent: elapsed < cliff ? `Cliff: ${format(addMonths(start, cliff), 'MMM d, yyyy')}` : elapsed < totalMonths ? `Full vest: ${format(addMonths(start, totalMonths), 'MMM d, yyyy')}` : 'Fully Vested',
  };
}

export default function EquityVestingTab({ grants }) {
  const activeGrants = grants.filter((g) => ['active', 'partially_exercised'].includes(g.status));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Vesting Status — {activeGrants.length} Active Grants
      </h3>

      {activeGrants.length === 0 && (
        <div className="text-center py-12 text-gray-400">No active grants to display.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {activeGrants.map((g) => {
          const v = calcVesting(g);
          return (
            <Card key={g.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{g.employee_name || 'Unknown'}</CardTitle>
                    <p className="text-xs text-gray-400 mt-0.5">{g.department} · {g.grant_type?.toUpperCase()} · {Number(g.shares_granted || 0).toLocaleString()} shares</p>
                  </div>
                  <Badge className="bg-violet-100 text-violet-700">{v.pct}% vested</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={v.pct} className="h-2" />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{v.vested.toLocaleString()}</p>
                    <p className="text-gray-400">Vested</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{v.unvested.toLocaleString()}</p>
                    <p className="text-gray-400">Unvested</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{Number(g.shares_exercised || 0).toLocaleString()}</p>
                    <p className="text-gray-400">Exercised</p>
                  </div>
                </div>
                {v.nextEvent && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{v.nextEvent}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
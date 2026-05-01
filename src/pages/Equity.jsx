import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Users, PieChart, Award, DollarSign, Activity } from 'lucide-react';
import EquityGrantsTab from '@/components/equity/EquityGrantsTab';
import EquityPoolTab from '@/components/equity/EquityPoolTab';
import EquityExercisesTab from '@/components/equity/EquityExercisesTab';
import EquityVestingTab from '@/components/equity/EquityVestingTab';

const formatCurrency = (val) =>
  val != null ? `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const formatNum = (val) => (val != null ? Number(val).toLocaleString() : '0');

export default function Equity() {
  const [activeTab, setActiveTab] = useState('grants');

  const { data: grants = [] } = useQuery({
    queryKey: ['equity-grants'],
    queryFn: () => base44.entities.EquityGrant.list('-grant_date'),
  });

  const { data: pools = [] } = useQuery({
    queryKey: ['equity-pools'],
    queryFn: () => base44.entities.EquityPool.list(),
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['equity-exercises'],
    queryFn: () => base44.entities.EquityExercise.list('-exercise_date'),
  });

  // Summary stats
  const totalSharesGranted = grants.reduce((s, g) => s + (g.shares_granted || 0), 0);
  const totalSharesVested = grants.reduce((s, g) => s + (g.shares_vested || 0), 0);
  const totalSharesExercised = grants.reduce((s, g) => s + (g.shares_exercised || 0), 0);
  const activeGrants = grants.filter((g) => g.status === 'active').length;
  const totalGain = exercises
    .filter((e) => e.status === 'completed')
    .reduce((s, e) => s + (e.gain || 0), 0);
  const poolsAvailable = pools.reduce(
    (s, p) => s + (p.is_active ? (p.total_shares || 0) - (p.shares_granted || 0) - (p.shares_reserved || 0) : 0),
    0
  );

  const stats = [
    { label: 'Active Grants', value: activeGrants, icon: Award, color: 'text-violet-600' },
    { label: 'Total Shares Granted', value: formatNum(totalSharesGranted), icon: Users, color: 'text-blue-600' },
    { label: 'Shares Vested', value: formatNum(totalSharesVested), icon: TrendingUp, color: 'text-green-600' },
    { label: 'Shares Exercised', value: formatNum(totalSharesExercised), icon: Activity, color: 'text-orange-600' },
    { label: 'Pool Available', value: formatNum(poolsAvailable), icon: PieChart, color: 'text-teal-600' },
    { label: 'Total Exercise Gain', value: formatCurrency(totalGain), icon: DollarSign, color: 'text-emerald-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equity Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track grants, vesting schedules, exercises, and equity pools
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="grants">Grants</TabsTrigger>
          <TabsTrigger value="vesting">Vesting</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="pools">Equity Pools</TabsTrigger>
        </TabsList>

        <TabsContent value="grants" className="mt-4">
          <EquityGrantsTab grants={grants} />
        </TabsContent>

        <TabsContent value="vesting" className="mt-4">
          <EquityVestingTab grants={grants} />
        </TabsContent>

        <TabsContent value="exercises" className="mt-4">
          <EquityExercisesTab exercises={exercises} grants={grants} />
        </TabsContent>

        <TabsContent value="pools" className="mt-4">
          <EquityPoolTab pools={pools} grants={grants} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
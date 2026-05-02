import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, CreditCard, Building2, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';

const SOURCES = [
  {
    label: 'HRIS / Payroll',
    description: 'Employee costs, salaries, benefits',
    icon: Users,
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    link: '/HRISPayroll',
    linkLabel: 'HRIS Payroll',
  },
  {
    label: 'Sales / CRM',
    description: 'Won deals, pipeline revenue, quotas',
    icon: Target,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    link: '/SalesDashboard',
    linkLabel: 'Sales Dashboard',
  },
  {
    label: 'Payments',
    description: 'Invoices, received payments, AR',
    icon: CreditCard,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    link: '/Payments',
    linkLabel: 'Payments',
  },
  {
    label: 'Business Dev',
    description: 'Deals pipeline, partnership revenue',
    icon: Building2,
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    link: '/BusinessDevDashboard',
    linkLabel: 'Biz Dev',
  },
  {
    label: 'Finance Ledger',
    description: 'Manual transactions, adjustments',
    icon: BarChart3,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    link: '/FinanceTransactions',
    linkLabel: 'Transactions',
  },
];

export default function CrossModuleSourcesPanel({ counts = {} }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Connected Data Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {SOURCES.map((s) => (
          <Link
            key={s.label}
            to={s.link}
            className={`flex items-center gap-3 p-2.5 rounded-lg border ${s.border} ${s.bg} hover:opacity-90 transition-opacity`}
          >
            <div className={`w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${s.color}`}>{s.label}</p>
              <p className="text-xs text-gray-500 truncate">{s.description}</p>
            </div>
            {counts[s.label] != null && (
              <Badge className="bg-white/80 text-gray-600 border-0 text-xs px-1.5">{counts[s.label]}</Badge>
            )}
            <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
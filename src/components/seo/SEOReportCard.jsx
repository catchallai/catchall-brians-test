import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  FileText,
  Calendar,
  Mail,
  Play,
  Download,
  Trash2,
  Loader2,
  Clock,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import moment from 'moment';

const scheduleLabels = {
  manual: 'Manual',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function SEOReportCard({ report, website, onRunReport, onExport, isRunning }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SEOReport.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seo-reports'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SEOReport.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seo-reports'] }),
  });

  const toggleActive = () => {
    updateMutation.mutate({ id: report.id, data: { is_active: !report.is_active } });
  };

  return (
    <Card className={`border-0 shadow-sm ${!report.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">{report.name}</CardTitle>
              <p className="text-sm text-gray-500">{website?.name || 'Unknown website'}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport(report, 'pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(report, 'csv')}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteMutation.mutate(report.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <Badge variant="outline">{scheduleLabels[report.schedule]}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Active</span>
            <Switch checked={report.is_active} onCheckedChange={toggleActive} />
          </div>
        </div>

        {report.schedule !== 'manual' && report.next_run && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            Next run: {moment(report.next_run).format('MMM D, YYYY')}
          </div>
        )}

        {report.last_run && (
          <p className="text-xs text-gray-400">
            Last run: {moment(report.last_run).format('MMM D, YYYY h:mm A')}
          </p>
        )}

        {report.recipients?.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{report.recipients.length} recipient(s)</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {report.include_traffic && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">Traffic</Badge>
          )}
          {report.include_rankings && (
            <Badge className="bg-emerald-100 text-emerald-700 text-xs">Rankings</Badge>
          )}
          {report.include_backlinks && (
            <Badge className="bg-purple-100 text-purple-700 text-xs">Backlinks</Badge>
          )}
          {report.include_trends && (
            <Badge className="bg-amber-100 text-amber-700 text-xs">Trends</Badge>
          )}
        </div>

        <Button
          onClick={() => onRunReport(report)}
          disabled={isRunning}
          className="w-full gap-2"
          variant="outline"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Report Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

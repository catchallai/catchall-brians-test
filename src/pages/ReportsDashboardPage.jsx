import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileBarChart,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  Plus,
} from 'lucide-react';
import ReportsDashboard from '@/components/reports/ReportsDashboard';
import ScheduledReports from '@/components/reports/ScheduledReports';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReportsDashboardPage() {
  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords-reports'],
    queryFn: () => base44.entities.Keyword.list('-created_date', 100),
  });

  const { data: mentions = [] } = useQuery({
    queryKey: ['mentions-reports'],
    queryFn: () => base44.entities.ListeningMention.list('-created_date', 100),
  });

  const { data: backlinks = [] } = useQuery({
    queryKey: ['backlinks-reports'],
    queryFn: () => base44.entities.Backlink.list('-created_date', 100),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['seo-reports'],
    queryFn: () => base44.entities.SEOReport.list('-created_date', 100),
  });

  const { data: takedownRequests = [] } = useQuery({
    queryKey: ['takedown-requests'],
    queryFn: () => base44.entities.TakedownRequest.list('-created_date', 20),
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'acknowledged':
        return 'bg-amber-100 text-amber-700';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-4 h-4" />;
      case 'acknowledged':
        return <FileText className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const recentReports = reports.slice(0, 5);
  const successfulReports = reports.filter((r) => r.last_run && !r.error).length;
  const scheduledReports = reports.filter((r) => r.schedule !== 'manual').length;

  const pendingTakedowns = takedownRequests.filter(
    (r) => r.status === 'sent' || r.status === 'draft'
  ).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Overview of all your reports and takedown requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {reports.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <FileBarChart className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Successful Runs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {successfulReports}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {scheduledReports}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Takedowns</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {pendingTakedowns}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Reports</CardTitle>
              <Link to={createPageUrl('Reports')}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No reports yet</p>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {report.last_run
                          ? `Last run: ${new Date(report.last_run).toLocaleDateString()}`
                          : 'Never run'}
                      </p>
                    </div>
                    {report.last_run && !report.error && (
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Reports */}
        <div className="space-y-6">
          <ScheduledReports reports={reports} />
        </div>
      </div>

      {/* TakeDown Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              TakeDown Requests
            </CardTitle>
            <Link to={createPageUrl('TakeDownRequestor')}>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Request
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {takedownRequests.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No takedown requests yet</p>
              <Link to={createPageUrl('TakeDownRequestor')}>
                <Button variant="outline" size="sm" className="mt-3">
                  Create First Request
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {takedownRequests.slice(0, 10).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </Badge>
                      <span className="text-xs text-gray-500">{request.infringement_type}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {request.infringing_url}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Platform: {request.platform} •{' '}
                      {new Date(request.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {takedownRequests.length > 10 && (
                <Link to={createPageUrl('TakeDownRequestor')}>
                  <Button variant="outline" size="sm" className="w-full">
                    View All Requests
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <ReportsDashboard
        websites={websites}
        keywords={keywords}
        mentions={mentions}
        backlinks={backlinks}
      />
    </div>
  );
}

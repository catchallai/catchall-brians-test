import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { base44 } from '@/api/base44Client';
import { 
  Calendar, Clock, Users, MoreHorizontal, Play, Download, 
  Trash2, Copy, Share2, AlertCircle, CheckCircle, Loader2,
  Search, Target, Link2, MapPin, FileText, PieChart, TrendingUp, Mail, Activity
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import moment from 'moment';

const scheduleLabels = {
  manual: 'Manual',
  weekly: 'Weekly',
  monthly: 'Monthly'
};

const templateIcons = {
  seo_overview: Search,
  keyword_performance: Target,
  backlink_audit: Link2,
  local_seo: MapPin,
  competitor_analysis: Users,
  content_performance: FileText,
  crm_pipeline: PieChart,
  campaign_roi: TrendingUp,
  social_media: Share2,
  email_marketing: Mail,
  weekly_digest: Activity
};

const templateColors = {
  seo_overview: 'bg-blue-100 text-blue-600',
  keyword_performance: 'bg-violet-100 text-violet-600',
  backlink_audit: 'bg-green-100 text-green-600',
  local_seo: 'bg-red-100 text-red-600',
  competitor_analysis: 'bg-orange-100 text-orange-600',
  content_performance: 'bg-amber-100 text-amber-600',
  crm_pipeline: 'bg-indigo-100 text-indigo-600',
  campaign_roi: 'bg-teal-100 text-teal-600',
  social_media: 'bg-pink-100 text-pink-600',
  email_marketing: 'bg-cyan-100 text-cyan-600',
  weekly_digest: 'bg-purple-100 text-purple-600'
};

export default function ReportList({ 
  reports, 
  selectedIds = [], 
  onSelect, 
  onRun, 
  onDelete, 
  onDuplicate,
  onExport,
  onView,
  onViewHistory,
  onSchedule,
  runningId 
}) {
  const [downloadingId, setDownloadingId] = React.useState(null);
  const [sendingId, setSendingId] = React.useState(null);

  const handleDownloadPdf = async (report) => {
    setDownloadingId(report.id);
    try {
      const response = await base44.functions.invoke('exportReportPdf', { reportId: report.id });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
    setDownloadingId(null);
  };

  const handleSendEmail = async (report) => {
    if (!report.recipients?.length) {
      alert('No recipients configured for this report');
      return;
    }
    setSendingId(report.id);
    try {
      await base44.functions.invoke('exportReportPdf', { 
        reportId: report.id, 
        sendEmail: true, 
        recipients: report.recipients 
      });
      alert('Report sent successfully!');
    } catch (error) {
      console.error('Send failed:', error);
    }
    setSendingId(null);
  };
  return (
    <div className="space-y-2">
      {reports.map((report) => {
        const isSelected = selectedIds.includes(report.id);
        const isRunning = runningId === report.id;
        
        return (
          <Card 
            key={report.id} 
            className={`border-0 shadow-sm hover:shadow-md transition-all bg-white dark:bg-gray-800 ${isSelected ? 'ring-2 ring-violet-500' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Checkbox */}
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={() => onSelect(report.id)}
                />
                
                {/* Icon */}
                {(() => {
                  const Icon = templateIcons[report.template_id] || Search;
                  const colorClass = templateColors[report.template_id] || 'bg-gray-100 text-gray-600';
                  return (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  );
                })()}

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 
                      className="font-medium text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer"
                      onClick={() => onView && report.report_data && onView(report)}
                    >
                      {report.name}
                    </h3>
                    {report.schedule !== 'manual' && (
                      <Badge variant="outline" className="text-xs">
                        — Scheduled
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {report.last_run ? moment(report.last_run).format('MMM D, YYYY h:mm A') : 'Never run'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {scheduleLabels[report.schedule] || 'Manual'}
                      {report.schedule !== 'manual' && report.next_run && 
                        `, on ${moment(report.next_run).format('dddd')}`
                      }
                    </span>
                    {report.recipients?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        for {report.recipients.length} recipient{report.recipients.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {report.last_run && !report.error && (
                    <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Success
                    </Badge>
                  )}
                  {report.error && (
                    <Badge className="bg-red-100 text-red-700 gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Generation failed
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => onRun(report)}
                    disabled={isRunning}
                    className="h-8 w-8"
                  >
                    {isRunning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  {report.report_data && onExport && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => onExport(report)}
                      title="Export Report"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={() => handleSendEmail(report)}
                    disabled={sendingId === report.id}
                  >
                    {sendingId === report.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDuplicate(report)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(report.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {reports.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No reports found</p>
        </div>
      )}
    </div>
  );
}
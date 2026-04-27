import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Share2, Sparkles } from 'lucide-react';
import ReportTemplates from '@/components/reports/ReportTemplates';
import ReportList from '@/components/reports/ReportList';
import ReportCustomizer from '@/components/reports/ReportCustomizer';
import CreateTemplateModal from '@/components/reports/CreateTemplateModal';
import ReportViewer from '@/components/seo/ReportViewer';
import ShareReportModal from '@/components/reports/ShareReportModal';

import DesignIssuesReportModal from '@/components/reports/DesignIssuesReportModal';
import ReportExporter from '@/components/reports/ReportExporter';
import ReportBrandingSettings from '@/components/reports/ReportBrandingSettings';
import ReportVersionHistory from '@/components/reports/ReportVersionHistory';
import EnhancedScheduleModal from '@/components/reports/EnhancedScheduleModal';
import ReportShareModal from '@/components/reports/ReportShareModal';
import ReportComments from '@/components/reports/ReportComments';
import ReportActivityFeed from '@/components/reports/ReportActivityFeed';

export default function Reports() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchedule, setFilterSchedule] = useState('all');
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [runningReportId, setRunningReportId] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [showBulkShareModal, setShowBulkShareModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showDesignIssuesModal, setShowDesignIssuesModal] = useState(false);
  const [exportingReport, setExportingReport] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBrandingSettings, setShowBrandingSettings] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistoryReport, setVersionHistoryReport] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingReport, setSchedulingReport] = useState(null);
  const [showTeamShareModal, setShowTeamShareModal] = useState(false);
  const [sharingReport, setSharingReport] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentingReport, setCommentingReport] = useState(null);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['seo-reports'],
    queryFn: () => base44.entities.SEOReport.list('-created_date', 100),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const { data: customTemplates = [] } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => base44.entities.ReportTemplate.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SEOReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
      setShowCreateModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SEOReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      setShowCreateTemplateModal(false);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ReportTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });

  const runReportMutation = useMutation({
    mutationFn: async (report) => {
      setRunningReportId(report.id);
      const website = websites.find((w) => w.id === report.website_id);
      const user = await base44.auth.me();

      // Get current version number
      const existingVersions = await base44.entities.ReportVersion.filter({ report_id: report.id });
      const newVersionNumber = (existingVersions[0]?.version_number || 0) + 1;

      const reportData = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a comprehensive SEO report for: ${website?.name || 'Website'}
        URL: ${website?.url || 'N/A'}
        
        Include analysis of:
        - Traffic trends and estimates
        - Keyword rankings overview
        - Backlink profile summary
        - Technical SEO health
        - Content performance
        - Competitor comparison
        
        Provide actionable insights and recommendations.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            traffic_insights: { type: 'string' },
            keyword_performance: { type: 'string' },
            backlink_summary: { type: 'string' },
            technical_health: { type: 'string' },
            recommendations: { type: 'array', items: { type: 'string' } },
            score: { type: 'number' },
          },
        },
      });

      // Save version
      await base44.entities.ReportVersion.create({
        report_id: report.id,
        version_number: newVersionNumber,
        report_data: reportData,
        metrics: report.metrics || [],
        generated_by: user.email,
        change_summary: `Regenerated report with latest data`,
      });

      // Update report
      await base44.entities.SEOReport.update(report.id, {
        last_run: new Date().toISOString(),
        report_data: reportData,
        error: null,
      });

      // Create audit log
      await base44.entities.ReportAuditLog.create({
        report_id: report.id,
        action: 'regenerated',
        user_email: user.email,
        details: {
          version: newVersionNumber,
          timestamp: new Date().toISOString(),
        },
      });

      return reportData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-versions'] });
      setRunningReportId(null);
    },
    onError: async (error, report) => {
      await base44.entities.SEOReport.update(report.id, {
        error: error.message,
      });
      setRunningReportId(null);
    },
  });

  const handleTemplateSelect = (template) => {
    if (template.id === 'design_issues' || template.isDesignReport) {
      setShowDesignIssuesModal(true);
      return;
    }
    if (template.id === 'scratch') {
      setSelectedTemplate({ ...template, metrics: [] });
    } else {
      setSelectedTemplate(template);
    }
    setShowCreateModal(true);
  };

  const handleCreateReport = (data) => {
    createMutation.mutate({
      ...data,
      schedule: data.schedule || 'manual',
      is_active: true,
    });
  };

  const handleSaveAsTemplate = (templateData) => {
    createTemplateMutation.mutate(templateData);
  };

  const handleSelectReport = (id) => {
    setSelectedReportIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDuplicate = (report) => {
    createMutation.mutate({
      ...report,
      name: `${report.name} (Copy)`,
      id: undefined,
      created_date: undefined,
      last_run: undefined,
    });
  };

  const handleShare = async ({ reportIds, emails, permission: _permission }) => {
    for (const id of reportIds) {
      const report = reports.find((r) => r.id === id);
      if (report) {
        const existingRecipients = report.recipients || [];
        const newRecipients = [...new Set([...existingRecipients, ...emails])];
        await base44.entities.SEOReport.update(id, { recipients: newRecipients });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch = !searchTerm || r.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchedule = filterSchedule === 'all' || r.schedule === filterSchedule;
    return matchesSearch && matchesSchedule;
  });

  const myReports = filteredReports.filter((r) => r.created_by);
  const sharedReports = filteredReports.filter((r) => r.recipients?.length > 0);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="min-w-[180px] h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Report data from various digital marketing tools and see results in one place
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowBrandingSettings(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          Branding Settings
        </Button>
      </div>

      {/* Report Templates */}
      <ReportTemplates
        onSelect={handleTemplateSelect}
        customTemplates={customTemplates}
        onDeleteTemplate={(id) => deleteTemplateMutation.mutate(id)}
        onCreateTemplate={() => setShowCreateTemplateModal(true)}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Report List Section */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="cursor-pointer dark:bg-violet-600">
              All {reports.length}
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer dark:border-gray-600 dark:text-gray-300"
            >
              My Own {myReports.length}
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer dark:border-gray-600 dark:text-gray-300"
            >
              Shared with Me {sharedReports.length}
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer dark:border-gray-600 dark:text-gray-300"
            >
              My Team's {reports.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setShowBulkShareModal(true)}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Select value={filterSchedule} onValueChange={setFilterSchedule}>
              <SelectTrigger className="w-32 h-8 dark:bg-gray-700 dark:border-gray-600">
                <SelectValue placeholder="Scheduling" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search for report"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 w-48 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Select All */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <input
            type="checkbox"
            className="rounded border-gray-300 dark:border-gray-600"
            checked={
              selectedReportIds.length === filteredReports.length && filteredReports.length > 0
            }
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedReportIds(filteredReports.map((r) => r.id));
              } else {
                setSelectedReportIds([]);
              }
            }}
          />
          <span>Select all</span>
        </div>

        {/* Report List */}
        <ReportList
          reports={filteredReports}
          selectedIds={selectedReportIds}
          onSelect={handleSelectReport}
          onRun={(report) => runReportMutation.mutate(report)}
          onDelete={(id) => deleteMutation.mutate(id)}
          onDuplicate={handleDuplicate}
          onExport={(report) => setExportingReport(report)}
          onView={(report) => setViewingReport(report)}
          onViewHistory={(report) => {
            setVersionHistoryReport(report);
            setShowVersionHistory(true);
          }}
          onSchedule={(report) => {
            setSchedulingReport(report);
            setShowScheduleModal(true);
          }}
          onShare={(report) => {
            setSharingReport(report);
            setShowTeamShareModal(true);
          }}
          onComment={(report) => {
            setCommentingReport(report);
            setShowComments(true);
          }}
          runningId={runningReportId}
        />

        {/* Pagination */}
        {filteredReports.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="dark:border-gray-600">
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled className="dark:border-gray-600">
                Next
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Page</span>
              <Input
                type="number"
                defaultValue={1}
                className="w-12 h-8 text-center dark:bg-gray-700 dark:border-gray-600"
              />
              <span>of 1</span>
            </div>
          </div>
        )}
      </div>

      {/* Create Report Modal */}
      <ReportCustomizer
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        websites={websites}
        onSave={handleCreateReport}
        onSaveAsTemplate={handleSaveAsTemplate}
        isLoading={createMutation.isPending}
      />

      {/* Report Viewer */}
      {viewingReport && (
        <ReportViewer report={viewingReport} onClose={() => setViewingReport(null)} />
      )}

      {/* Bulk Share Modal */}
      <ShareReportModal
        open={showBulkShareModal}
        onClose={() => setShowBulkShareModal(false)}
        reports={reports}
        selectedIds={selectedReportIds}
        onShare={handleShare}
      />

      {/* Create Template Modal */}
      <CreateTemplateModal
        open={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        onSave={(data) => createTemplateMutation.mutate(data)}
        isLoading={createTemplateMutation.isPending}
      />

      {/* Design Issues Report Modal */}
      <DesignIssuesReportModal
        open={showDesignIssuesModal}
        onClose={() => setShowDesignIssuesModal(false)}
        websites={websites}
      />

      {/* Report Exporter */}
      {exportingReport && (
        <ReportExporter
          report={exportingReport}
          open={!!exportingReport}
          onClose={() => setExportingReport(null)}
        />
      )}

      {/* Branding Settings */}
      <ReportBrandingSettings
        open={showBrandingSettings}
        onClose={() => setShowBrandingSettings(false)}
      />

      {/* Version History */}
      <ReportVersionHistory
        report={versionHistoryReport}
        open={showVersionHistory}
        onClose={() => {
          setShowVersionHistory(false);
          setVersionHistoryReport(null);
        }}
        onRevert={() => {
          queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
        }}
      />

      {/* Enhanced Schedule Modal */}
      {schedulingReport && (
        <EnhancedScheduleModal
          report={schedulingReport}
          open={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setSchedulingReport(null);
          }}
        />
      )}

      {/* Team Share Modal */}
      {sharingReport && (
        <ReportShareModal
          report={sharingReport}
          open={showTeamShareModal}
          onClose={() => {
            setShowTeamShareModal(false);
            setSharingReport(null);
          }}
        />
      )}

      {/* Comments Dialog */}
      {commentingReport && (
        <Dialog
          open={showComments}
          onOpenChange={(open) => {
            setShowComments(open);
            if (!open) {
              setCommentingReport(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{commentingReport.name} - Discussion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <ReportComments report={commentingReport} />
              <ReportActivityFeed reportId={commentingReport.id} limit={10} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileBarChart, Plus, Search, Share2, Filter, Sparkles, BarChart3
} from "lucide-react";
import ReportTemplates, { REPORT_TEMPLATES } from '@/components/reports/ReportTemplates';
import ReportList from '@/components/reports/ReportList';
import CreateReportFromTemplate from '@/components/reports/CreateReportFromTemplate';
import ReportViewer from '@/components/seo/ReportViewer';
import ShareReportModal from '@/components/reports/ShareReportModal';
import ReportsDashboard from '@/components/reports/ReportsDashboard';

export default function Reports() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSchedule, setFilterSchedule] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [runningReportId, setRunningReportId] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['seo-reports'],
    queryFn: () => base44.entities.SEOReport.list('-created_date', 100),
  });

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

  const runReportMutation = useMutation({
    mutationFn: async (report) => {
      setRunningReportId(report.id);
      const website = websites.find(w => w.id === report.website_id);
      
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
          type: "object",
          properties: {
            summary: { type: "string" },
            traffic_insights: { type: "string" },
            keyword_performance: { type: "string" },
            backlink_summary: { type: "string" },
            technical_health: { type: "string" },
            recommendations: { type: "array", items: { type: "string" } },
            score: { type: "number" }
          }
        }
      });

      await base44.entities.SEOReport.update(report.id, {
        last_run: new Date().toISOString(),
        report_data: reportData,
        error: null
      });

      return reportData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
      setRunningReportId(null);
    },
    onError: async (error, report) => {
      await base44.entities.SEOReport.update(report.id, {
        error: error.message
      });
      setRunningReportId(null);
    }
  });

  const handleTemplateSelect = (template) => {
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
      is_active: true
    });
  };

  const getTemplateForReport = (report) => {
    return REPORT_TEMPLATES.find(t => t.id === report.template_id) || REPORT_TEMPLATES[0];
  };

  const handleSelectReport = (id) => {
    setSelectedReportIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDuplicate = (report) => {
    createMutation.mutate({
      ...report,
      name: `${report.name} (Copy)`,
      id: undefined,
      created_date: undefined,
      last_run: undefined
    });
  };

  const handleShare = async ({ reportIds, emails, permission }) => {
    for (const id of reportIds) {
      const report = reports.find(r => r.id === id);
      if (report) {
        const existingRecipients = report.recipients || [];
        const newRecipients = [...new Set([...existingRecipients, ...emails])];
        await base44.entities.SEOReport.update(id, { recipients: newRecipients });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['seo-reports'] });
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = !searchTerm || r.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchedule = filterSchedule === 'all' || r.schedule === filterSchedule;
    return matchesSearch && matchesSchedule;
  });

  const myReports = filteredReports.filter(r => r.created_by);
  const sharedReports = filteredReports.filter(r => r.recipients?.length > 0);

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="min-w-[180px] h-32" />)}
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
          <p className="text-gray-500 dark:text-gray-400 mt-1">Report data from various digital marketing tools and see results in one place</p>
        </div>
        </div>

      {/* Report Templates */}
      <ReportTemplates onSelect={handleTemplateSelect} />

      {/* Report List Section */}
      <div className="space-y-4">
        {/* Tabs and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                Reports <Badge variant="secondary">{reports.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowShareModal(true)}>
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <ReportsDashboard 
            websites={websites}
            keywords={keywords}
            mentions={mentions}
            backlinks={backlinks}
          />
        )}

        {/* Reports Tab Content */}
        {activeTab === 'reports' && (
          <>
            {/* Sub-tabs and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="cursor-pointer dark:bg-violet-600">
                  All {reports.length}
                </Badge>
                <Badge variant="outline" className="cursor-pointer dark:border-gray-600 dark:text-gray-300">
                  My Own {myReports.length}
                </Badge>
                <Badge variant="outline" className="cursor-pointer dark:border-gray-600 dark:text-gray-300">
                  Shared with Me {sharedReports.length}
                </Badge>
                <Badge variant="outline" className="cursor-pointer dark:border-gray-600 dark:text-gray-300">
                  My Team's {reports.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
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
                checked={selectedReportIds.length === filteredReports.length && filteredReports.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedReportIds(filteredReports.map(r => r.id));
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
              runningId={runningReportId}
            />

            {/* Pagination */}
            {filteredReports.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled className="dark:border-gray-600">Prev</Button>
                  <Button variant="outline" size="sm" disabled className="dark:border-gray-600">Next</Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Page</span>
                  <Input type="number" defaultValue={1} className="w-12 h-8 text-center dark:bg-gray-700 dark:border-gray-600" />
                  <span>of 1</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Templates Tab Content */}
        {activeTab === 'templates' && (
          <ReportTemplates onSelect={handleTemplateSelect} />
        )}
      </div>

      {/* Create Report Modal */}
      <CreateReportFromTemplate
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setSelectedTemplate(null); }}
        template={selectedTemplate}
        websites={websites}
        onSave={handleCreateReport}
        isLoading={createMutation.isPending}
      />

      {/* Report Viewer */}
      {viewingReport && (
        <ReportViewer 
          report={viewingReport}
          onClose={() => setViewingReport(null)}
        />
      )}

      {/* Share Modal */}
      <ShareReportModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        reports={reports}
        selectedIds={selectedReportIds}
        onShare={handleShare}
      />
    </div>
  );
}
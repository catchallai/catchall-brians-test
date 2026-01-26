import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Table, Mail, Loader2 } from "lucide-react";
import { base44 } from '@/api/base44Client';

export default function ReportExporter({ report, open, onClose }) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('pdf');
  const [options, setOptions] = useState({
    includeCharts: true,
    includeData: true,
    includeSummary: true,
    includeRecommendations: true
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      if (format === 'pdf') {
        // Use backend function to generate PDF
        const response = await base44.functions.invoke('exportReportPdf', {
          report,
          options
        });
        
        // Download the PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name}-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Generate CSV
        let csv = 'Metric,Value\n';
        if (report.report_data) {
          Object.entries(report.report_data).forEach(([key, value]) => {
            if (typeof value !== 'object') {
              csv += `${key},${value}\n`;
            }
          });
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.name}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleEmailReport = async () => {
    const user = await base44.auth.me();
    setExporting(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Report: ${report.name}`,
        body: `
          <h2>${report.name}</h2>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <hr />
          ${report.report_data?.summary || 'No summary available'}
        `
      });
      
      alert('Report emailed successfully!');
      onClose();
    } catch (error) {
      console.error('Email failed:', error);
      alert('Failed to email report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Export Format</Label>
            <div className="flex gap-2">
              <Button
                variant={format === 'pdf' ? 'default' : 'outline'}
                onClick={() => setFormat('pdf')}
                className="flex-1 gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF
              </Button>
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                onClick={() => setFormat('csv')}
                className="flex-1 gap-2"
              >
                <Table className="w-4 h-4" />
                CSV
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={options.includeSummary}
                  onCheckedChange={(checked) => setOptions({...options, includeSummary: checked})}
                />
                <label className="text-sm">Executive Summary</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={options.includeCharts}
                  onCheckedChange={(checked) => setOptions({...options, includeCharts: checked})}
                />
                <label className="text-sm">Charts & Visualizations</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={options.includeData}
                  onCheckedChange={(checked) => setOptions({...options, includeData: checked})}
                />
                <label className="text-sm">Raw Data Tables</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={options.includeRecommendations}
                  onCheckedChange={(checked) => setOptions({...options, includeRecommendations: checked})}
                />
                <label className="text-sm">Recommendations</label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 gap-2"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download {format.toUpperCase()}
            </Button>
            <Button
              variant="outline"
              onClick={handleEmailReport}
              disabled={exporting}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
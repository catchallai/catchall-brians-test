import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

export default function ShareReportModal({
  open,
  onClose,
  reports = [],
  selectedIds = [],
  onShare,
}) {
  const [selectedReports, setSelectedReports] = useState(selectedIds);
  const [emails, setEmails] = useState('');
  const [permission, setPermission] = useState('viewer');

  const toggleReport = (id) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleShare = () => {
    const emailList = emails
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));

    onShare({
      reportIds: selectedReports,
      emails: emailList,
      permission,
    });

    setEmails('');
    setSelectedReports([]);
    onClose();
  };

  const selectedReportNames = reports
    .filter((r) => selectedReports.includes(r.id))
    .map((r) => r.name);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share reports</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Reports Selection */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Reports</Label>
              <Badge variant="outline" className="text-xs">
                {selectedReports.length}/{reports.length}
              </Badge>
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select reports" />
              </SelectTrigger>
              <SelectContent>
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 rounded"
                    onClick={() => toggleReport(report.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => {}}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{report.name}</span>
                  </div>
                ))}
              </SelectContent>
            </Select>
            {selectedReportNames.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedReportNames.map((name, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs gap-1">
                    {name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => toggleReport(reports.find((r) => r.name === name)?.id)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Email Addresses */}
          <div>
            <Label className="mb-2 block">Email addresses</Label>
            <div className="flex gap-2">
              <Textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="mark@example.com, eve@example.com"
                rows={3}
                className="flex-1"
              />
              <div className="flex flex-col gap-2">
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleShare}
                  disabled={selectedReports.length === 0 || !emails.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

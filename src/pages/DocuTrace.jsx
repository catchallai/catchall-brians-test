import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Upload,
  Eye,
  Download,
  Link2,
  Copy,
  Clock,
  Calendar,
  BarChart3,
  Activity,
  Loader2,
  Plus,
  AlertCircle,
  MapPin,
  Monitor,
  CheckCircle,
  Sparkles,
  User,
  History,
  Edit,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmptyState from '@/components/ui/EmptyState';
import AlertsManager from '@/components/docutrace/AlertsManager';
import DocumentVersionHistory from '@/components/docutrace/DocumentVersionHistory';
import { format } from 'date-fns';

export default function DocuTrace() {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [docForm, setDocForm] = useState({
    name: '',
    description: '',
    contact_id: '',
    deal_id: '',
    expires_at: '',
    review_date: '',
  });
  const [copiedCode, setCopiedCode] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['tracked-documents', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.TrackedDocument.filter(
        { business_id: user.current_business_id },
        '-created_date',
        100
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Contact.filter(
        { business_id: user.current_business_id },
        'first_name',
        100
      );
    },
    enabled: !!user?.current_business_id,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.Deal.filter(
        { business_id: user.current_business_id },
        'title',
        100
      );
    },
    enabled: !!user?.current_business_id,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });

      // Check if we're updating an existing document
      if (editingDoc) {
        // Create new version
        const newVersionNumber = (editingDoc.versions?.length || 0) + 1;
        const newVersion = {
          version_number: newVersionNumber,
          file_url,
          uploaded_at: new Date().toISOString(),
          uploaded_by: user?.email || 'User',
          changes_description:
            docForm.changes_description || `Updated to version ${newVersionNumber}`,
        };

        return base44.entities.TrackedDocument.update(editingDoc.id, {
          ...docForm,
          file_url,
          versions: [...(editingDoc.versions || []), newVersion],
        });
      }

      // Generate unique tracking code
      const trackingCode =
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Create share link
      const shareLink = `${window.location.origin}/api/functions/trackDocumentAccess?code=${trackingCode}&action=view`;

      // AI-powered document analysis
      const aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this document: "${docForm.name}" - ${docForm.description || 'No description provided'}
        
Provide:
1. A concise 2-3 sentence summary of what this document likely contains
2. 5-8 relevant keywords or topics`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      // Create document record
      return base44.entities.TrackedDocument.create({
        ...docForm,
        business_id: user?.current_business_id,
        file_url,
        tracking_code: trackingCode,
        share_link: shareLink,
        status: 'active',
        ai_summary: aiAnalysis.summary,
        keywords: aiAnalysis.keywords,
        versions: [
          {
            version_number: 1,
            file_url,
            uploaded_at: new Date().toISOString(),
            uploaded_by: user?.email || 'User',
            changes_description: 'Initial version',
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-documents'] });
      setShowUpload(false);
      setEditingDoc(null);
      setUploadFile(null);
      setDocForm({
        name: '',
        description: '',
        contact_id: '',
        deal_id: '',
        expires_at: '',
        review_date: '',
        changes_description: '',
      });
    },
  });

  const copyToClipboard = (text, code) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'expired':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                DocuTrace
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Upload, track, and monitor PDF document engagement
              </p>
            </div>
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Upload Document
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {documents.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {documents.reduce((sum, d) => sum + (d.total_views || 0), 0)}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Downloads</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {documents.reduce((sum, d) => sum + (d.total_downloads || 0), 0)}
                  </p>
                </div>
                <Download className="w-8 h-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Documents</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {documents.filter((d) => d.status === 'active').length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Manager */}
        <div className="mb-6">
          <AlertsManager />
        </div>

        {/* Documents List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No tracked documents yet"
            description="Upload your first PDF document to start tracking engagement"
            actionLabel="Upload Document"
            onAction={() => setShowUpload(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{doc.name}</CardTitle>
                      <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                </CardHeader>

                <CardContent>
                  {doc.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {doc.description}
                    </p>
                  )}

                  {/* AI Summary */}
                  {doc.ai_summary && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg mb-3">
                      <p className="text-xs text-blue-900 dark:text-blue-200 flex items-start gap-1">
                        <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {doc.ai_summary}
                      </p>
                    </div>
                  )}

                  {/* Keywords */}
                  {doc.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.keywords.slice(0, 4).map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400 mb-1">
                        <Eye className="w-3 h-3" />
                        <span className="text-xs font-medium">Views</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {doc.total_views || 0}
                      </p>
                    </div>

                    <div className="bg-violet-50 dark:bg-violet-900/20 p-2 rounded">
                      <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 mb-1">
                        <Download className="w-3 h-3" />
                        <span className="text-xs font-medium">Downloads</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {doc.total_downloads || 0}
                      </p>
                    </div>
                  </div>

                  {/* Last Viewed */}
                  {doc.last_viewed_at && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <Clock className="w-3 h-3" />
                      Last viewed {format(new Date(doc.last_viewed_at), 'MMM d, h:mm a')}
                    </div>
                  )}

                  {/* Expiration */}
                  {doc.expires_at && (
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-2">
                      <AlertCircle className="w-3 h-3" />
                      Expires {format(new Date(doc.expires_at), 'MMM d, yyyy')}
                    </div>
                  )}

                  {/* Review Date */}
                  {doc.review_date && (
                    <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                      <Calendar className="w-3 h-3" />
                      Review on {format(new Date(doc.review_date), 'MMM d, yyyy')}
                    </div>
                  )}

                  {/* Version */}
                  {doc.versions?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <FileText className="w-3 h-3" />
                      Version {doc.versions.length}
                      {doc.versions.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-2 text-xs"
                          onClick={() => setVersionHistoryDoc(doc)}
                        >
                          <History className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => copyToClipboard(doc.share_link, doc.tracking_code)}
                    >
                      {copiedCode === doc.tracking_code ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3 h-3" /> Copy Link
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingDoc(doc);
                        setDocForm({
                          name: doc.name,
                          description: doc.description || '',
                          contact_id: doc.contact_id || '',
                          deal_id: doc.deal_id || '',
                          expires_at: doc.expires_at || '',
                          review_date: doc.review_date || '',
                          changes_description: '',
                        });
                        setShowUpload(true);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedDoc(doc)}>
                      <BarChart3 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog
          open={showUpload}
          onOpenChange={() => {
            setShowUpload(false);
            setEditingDoc(null);
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingDoc ? 'Update Document Version' : 'Upload Tracked Document'}
              </DialogTitle>
              <DialogDescription>
                {editingDoc
                  ? 'Upload a new version of this document'
                  : "Upload a PDF document and track when it's viewed or downloaded"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">PDF File</label>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Document Name</label>
                <Input
                  value={docForm.name}
                  onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                  placeholder="Q4 Sales Proposal"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  value={docForm.description}
                  onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                  placeholder="Brief description of the document"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Contact (Optional)</label>
                  <Select
                    value={docForm.contact_id}
                    onValueChange={(val) => setDocForm({ ...docForm, contact_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Deal (Optional)</label>
                  <Select
                    value={docForm.deal_id}
                    onValueChange={(val) => setDocForm({ ...docForm, deal_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select deal" />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Expiration Date (Optional)</label>
                <Input
                  type="datetime-local"
                  value={docForm.expires_at}
                  onChange={(e) => setDocForm({ ...docForm, expires_at: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Review Date (Optional)</label>
                <Input
                  type="date"
                  value={docForm.review_date}
                  onChange={(e) => setDocForm({ ...docForm, review_date: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Set a reminder to review this document</p>
              </div>

              {editingDoc && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Version Changes (Optional)
                  </label>
                  <Textarea
                    value={docForm.changes_description}
                    onChange={(e) =>
                      setDocForm({ ...docForm, changes_description: e.target.value })
                    }
                    placeholder="What changed in this version?"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpload(false);
                  setEditingDoc(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!uploadFile || (!editingDoc && !docForm.name) || uploadMutation.isPending}
                className="gap-2"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{' '}
                    {editingDoc ? 'Updating...' : 'Uploading...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />{' '}
                    {editingDoc ? 'Upload New Version' : 'Upload & Track'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Analytics Dialog */}
        <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDoc?.name}</DialogTitle>
              <DialogDescription>Document engagement analytics</DialogDescription>
            </DialogHeader>

            {selectedDoc && (
              <div className="space-y-4 py-4">
                {/* Stats Overview */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Views</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {selectedDoc.total_views || 0}
                    </p>
                  </div>
                  <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Downloads</p>
                    <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {selectedDoc.total_downloads || 0}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Events</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {(selectedDoc.access_logs || []).length}
                    </p>
                  </div>
                </div>

                {/* Share Link */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                    Tracking Link
                  </label>
                  <div className="flex gap-2">
                    <Input value={selectedDoc.share_link} readOnly className="flex-1 text-xs" />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(selectedDoc.share_link, 'analytics')}
                    >
                      {copiedCode === 'analytics' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Version History */}
                {selectedDoc.versions?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Version History
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVersionHistoryDoc(selectedDoc)}
                      >
                        <History className="w-4 h-4 mr-1" />
                        View All
                      </Button>
                    </div>
                    <div className="space-y-2 mb-6">
                      {selectedDoc.versions
                        .slice()
                        .reverse()
                        .slice(0, 3)
                        .map((version, idx) => (
                          <div
                            key={idx}
                            className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Badge className="bg-blue-600 text-white">
                                v{version.version_number}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {format(new Date(version.uploaded_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {version.changes_description}
                            </p>
                            {version.uploaded_by && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                {version.uploaded_by}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Access Logs */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Access History
                  </h4>
                  {!selectedDoc.access_logs || selectedDoc.access_logs.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No access activity yet</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedDoc.access_logs.map((log, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-gray-800 p-3 rounded-lg border text-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              className={
                                log.action === 'download' ? 'bg-violet-600' : 'bg-green-600'
                              }
                            >
                              {log.action === 'download' ? (
                                <Download className="w-3 h-3 mr-1" />
                              ) : (
                                <Eye className="w-3 h-3 mr-1" />
                              )}
                              {log.action}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {log.ip_address}
                            </div>
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {log.user_agent.slice(0, 50)}...
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Version History Modal */}
        <DocumentVersionHistory
          open={!!versionHistoryDoc}
          onClose={() => setVersionHistoryDoc(null)}
          document={versionHistoryDoc}
        />
      </div>
    </div>
  );
}

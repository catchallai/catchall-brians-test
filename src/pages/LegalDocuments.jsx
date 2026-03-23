import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  FileText,
  Search,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileSignature,
  Copy,
} from 'lucide-react';
import LegalDocumentModal from '@/components/modals/LegalDocumentModal';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/toast-provider';

export default function LegalDocuments() {
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sendingDoc, setSendingDoc] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['legal-documents', user?.current_business_id],
    queryFn: async () => {
      const docs = await base44.entities.LegalDocument.filter({
        business_id: user?.current_business_id,
      });
      return docs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.current_business_id,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', user?.current_business_id],
    queryFn: () =>
      base44.entities.Contact.filter({
        business_id: user?.current_business_id,
      }),
    enabled: !!user?.current_business_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const trackingCode = Math.random().toString(36).substring(2, 15);
      return await base44.entities.LegalDocument.create({
        ...data,
        business_id: user?.current_business_id,
        tracking_code: trackingCode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setShowModal(false);
      toast.success('Document created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LegalDocument.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setShowModal(false);
      setEditingDoc(null);
      toast.success('Document updated successfully');
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (doc) => {
      // Send email via Resend
      const response = await base44.functions.invoke('sendResendEmail', {
        to: doc.recipient_email,
        subject: `${doc.title} - Signature Required`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">${doc.title}</h2>
            <p>Hi ${doc.recipient_name},</p>
            <p>Please review and sign the following document:</p>
            <p><strong>${doc.description || doc.title}</strong></p>
            <p style="margin: 30px 0;">
              <a href="${window.location.origin}?page=PublicLegalDocumentSigner&token=${doc.tracking_code}" 
                 style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review & Sign Document
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">This link will expire on ${new Date(doc.expires_date).toLocaleDateString()}.</p>
            <p>Best regards,<br/>${user?.full_name || 'The Team'}</p>
          </div>
        `,
      });

      if (!response.data.success) {
        throw new Error('Failed to send email');
      }

      // Update document status with Resend email ID
      return await base44.entities.LegalDocument.update(doc.id, {
        status: 'sent',
        sent_date: new Date().toISOString(),
        resend_email_id: response.data.emailId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setSendingDoc(null);
      toast.success('Document sent successfully');
    },
    onError: () => {
      toast.error('Failed to send document');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LegalDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      toast.success('Document deleted');
    },
  });

  const handleSave = (data) => {
    if (editingDoc) {
      updateMutation.mutate({ id: editingDoc.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSend = (doc) => {
    setSendingDoc(doc);
  };

  const confirmSend = () => {
    if (sendingDoc) {
      sendMutation.mutate(sendingDoc);
    }
  };

  const copyTrackingLink = (doc) => {
    const link = `${window.location.origin}?page=PublicLegalDocumentSigner&token=${doc.tracking_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Tracking link copied to clipboard');
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusConfig = (status) => {
    const configs = {
      draft: {
        icon: FileText,
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        label: 'Draft',
      },
      sent: {
        icon: Send,
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        label: 'Sent',
      },
      viewed: {
        icon: Eye,
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        label: 'Viewed',
      },
      signed: {
        icon: CheckCircle2,
        color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        label: 'Signed',
      },
      expired: {
        icon: Clock,
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        label: 'Expired',
      },
      declined: {
        icon: XCircle,
        color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        label: 'Declined',
      },
    };
    return configs[status] || configs.draft;
  };

  const getTypeLabel = (type) => {
    const labels = {
      nda: 'NDA',
      media_release: 'Media Release',
      contractor_agreement: 'Contractor Agreement',
      location_release: 'Location Release',
      talent_release: 'Talent Release',
      custom: 'Custom',
    };
    return labels[type] || type;
  };

  const stats = {
    total: documents.length,
    sent: documents.filter((d) => d.status === 'sent').length,
    signed: documents.filter((d) => d.status === 'signed').length,
    pending: documents.filter((d) => ['sent', 'viewed'].includes(d.status)).length,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Legal Documents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create, send, and track NDAs and media release forms
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingDoc(null);
            setShowModal(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Documents
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <FileSignature className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sent</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.sent}</p>
              </div>
              <Send className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Signed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.signed}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <option value="all">All Types</option>
              <option value="nda">NDA</option>
              <option value="media_release">Media Release</option>
              <option value="contractor_agreement">Contractor Agreement</option>
              <option value="location_release">Location Release</option>
              <option value="talent_release">Talent Release</option>
              <option value="custom">Custom</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="signed">Signed</option>
              <option value="expired">Expired</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No documents found"
          description="Create your first legal document to get started with tracking NDAs and media releases."
          actionLabel="Create Document"
          onAction={() => {
            setEditingDoc(null);
            setShowModal(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocuments.map((doc) => {
            const statusConfig = getStatusConfig(doc.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <FileSignature className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {doc.title}
                        </h3>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline">{getTypeLabel(doc.document_type)}</Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {doc.recipient_name && (
                          <p>
                            <strong>Recipient:</strong> {doc.recipient_name} ({doc.recipient_email})
                          </p>
                        )}
                        {doc.company_name && (
                          <p>
                            <strong>Company:</strong> {doc.company_name}
                          </p>
                        )}
                        {doc.sent_date && (
                          <p>
                            <strong>Sent:</strong> {new Date(doc.sent_date).toLocaleString()}
                          </p>
                        )}
                        {doc.signed_date && (
                          <p className="text-green-600 dark:text-green-400">
                            <strong>Signed:</strong> {new Date(doc.signed_date).toLocaleString()}
                          </p>
                        )}
                        {doc.expires_date && (
                          <p>
                            <strong>Expires:</strong>{' '}
                            {new Date(doc.expires_date).toLocaleDateString()}
                          </p>
                        )}
                        {doc.view_count > 0 && (
                          <p>
                            <strong>Views:</strong> {doc.view_count}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleSend(doc)}
                          disabled={!doc.recipient_email}
                          className="gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </Button>
                      )}
                      {doc.status !== 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyTrackingLink(doc)}
                          className="gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDoc(doc);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <LegalDocumentModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingDoc(null);
        }}
        document={editingDoc}
        contacts={contacts}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!sendingDoc}
        onClose={() => setSendingDoc(null)}
        onConfirm={confirmSend}
        title="Send Document"
        description={`Send "${sendingDoc?.title}" to ${sendingDoc?.recipient_email}?`}
        confirmLabel="Send"
        isLoading={sendMutation.isPending}
      />
    </div>
  );
}

import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, FileSignature, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicLegalDocumentSigner() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const [signature, setSignature] = useState('');
  const [declining, setDeclining] = useState(false);

  const {
    data: document,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['legal-document', token],
    queryFn: async () => {
      if (!token) {
        return null;
      }
      const docs = await base44.entities.LegalDocument.filter({ tracking_code: token });
      const doc = docs?.[0];

      if (doc && ['sent', 'viewed'].includes(doc.status)) {
        // Mark as viewed if not already
        if (doc.status === 'sent') {
          await base44.entities.LegalDocument.update(doc.id, {
            status: 'viewed',
            viewed_date: new Date().toISOString(),
            view_count: (doc.view_count || 0) + 1,
          });
          return { ...doc, status: 'viewed', view_count: (doc.view_count || 0) + 1 };
        }
        return doc;
      }
      return doc;
    },
    enabled: !!token,
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.LegalDocument.update(document.id, {
        status: 'signed',
        signed_date: new Date().toISOString(),
        signature_url: signature,
        ip_address: 'tracked',
      });
    },
    onSuccess: () => {
      toast.success('Document signed successfully!');
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.LegalDocument.update(document.id, {
        status: 'declined',
      });
    },
    onSuccess: () => {
      toast.success('Document declined');
    },
  });

  const handleSign = (e) => {
    e.preventDefault();
    if (!signature.trim()) {
      toast.error('Please enter your full name as signature');
      return;
    }
    signMutation.mutate();
  };

  const handleDecline = () => {
    setDeclining(true);
  };

  const confirmDecline = () => {
    declineMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400">
              This document is no longer available or the link has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if document is expired
  const isExpired = document.expires_date && new Date(document.expires_date) < new Date();

  if (isExpired || document.status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Expired</h1>
            <p className="text-gray-600 dark:text-gray-400">
              This document expired on {new Date(document.expires_date).toLocaleDateString()}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (document.status === 'signed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Already Signed</h1>
            <p className="text-gray-600 dark:text-gray-400">
              This document was signed on {new Date(document.signed_date).toLocaleString()}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (document.status === 'declined') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Document Declined</h1>
            <p className="text-gray-600 dark:text-gray-400">This document has been declined.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Replace placeholders in content
  const processedContent = document.content
    .replace(/\[RECIPIENT_NAME\]/g, document.recipient_name || '[Your Name]')
    .replace(/\[RECIPIENT_EMAIL\]/g, document.recipient_email || '[Your Email]')
    .replace(/\[YOUR_COMPANY_NAME\]/g, document.company_name || '[Company Name]')
    .replace(/\[DATE\]/g, new Date().toLocaleDateString());

  if (declining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="bg-red-50 dark:bg-red-900/20">
              <CardTitle className="text-red-700 dark:text-red-400">Decline Document</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to decline signing "{document.title}"?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setDeclining(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={confirmDecline}
                  disabled={declineMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Confirm Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <FileSignature className="w-8 h-8" />
              <div>
                <CardTitle className="text-2xl">{document.title}</CardTitle>
                <p className="text-violet-100 text-sm mt-1">{document.description}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Document Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300">
                {processedContent}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Signature Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sign Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSign} className="space-y-4">
              <div>
                <Label htmlFor="signature">Type your full name as signature</Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="text-lg font-medium"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  By typing your name, you agree to electronically sign this document.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Legal Notice:</strong> By signing this document, you agree to be legally
                  bound by its terms and conditions. Your signature will be recorded with a
                  timestamp and IP address.
                </p>
              </div>

              {document.expires_date && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This document expires on{' '}
                  <strong>{new Date(document.expires_date).toLocaleDateString()}</strong>
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDecline}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Decline
                </Button>
                <Button
                  type="submit"
                  disabled={signMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {signMutation.isPending ? 'Signing...' : 'Sign Document'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

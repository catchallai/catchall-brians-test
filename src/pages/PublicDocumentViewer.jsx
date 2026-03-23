import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download, Eye, AlertCircle } from 'lucide-react';
import SessionReplayTracker from '@/components/analytics/SessionReplayTracker';

export default function PublicDocumentViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const [downloadStarted, setDownloadStarted] = useState(false);

  const {
    data: document,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tracked-document', token],
    queryFn: async () => {
      if (!token) {
        return null;
      }
      const docs = await base44.entities.TrackedDocument.filter({ tracking_code: token });
      const doc = docs?.[0];

      if (doc && doc.status === 'active') {
        // Log view
        const views = (doc.total_views || 0) + 1;
        await base44.entities.TrackedDocument.update(doc.id, {
          total_views: views,
          last_viewed_at: new Date().toISOString(),
        });
        return { ...doc, total_views: views };
      }
      return null;
    },
    enabled: !!token,
  });

  const handleDownload = async () => {
    if (!document) {
      return;
    }

    try {
      setDownloadStarted(true);

      // Log download
      const downloads = (document.total_downloads || 0) + 1;
      await base44.entities.TrackedDocument.update(document.id, {
        total_downloads: downloads,
      });

      // Trigger download
      const link = document.createElement('a');
      link.href = document.file_url;
      link.download = document.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloadStarted(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Document Not Found</h1>
          <p className="text-gray-600">
            This document is no longer available or the link has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <SessionReplayTracker />
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">{document.name}</h1>
            <p className="text-violet-100">Document shared with you</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Document Preview */}
            {document.file_url.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={document.file_url}
                className="w-full rounded-lg border border-slate-300 bg-white"
                style={{ minHeight: '500px' }}
                title={document.name}
              />
            ) : (
              <div className="bg-slate-50 rounded-lg p-8 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center min-h-64 space-y-4">
                <div className="text-5xl">📄</div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-slate-600">{document.name}</p>
                  <p className="text-xs text-slate-400">Click download to access the file</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Views</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{document.total_views || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-600 mb-2">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Downloads</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{document.total_downloads || 0}</p>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleDownload}
              disabled={downloadStarted}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 text-lg gap-2"
            >
              <Download className="w-5 h-5" />
              {downloadStarted ? 'Downloading...' : 'Download Document'}
            </Button>

            {/* Document Info */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> This link is secure and tracks document access. Your download
                activity may be logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

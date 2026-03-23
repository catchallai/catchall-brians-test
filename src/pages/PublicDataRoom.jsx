import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Download,
  Eye,
  Lock,
  FolderOpen,
  Calendar,
  Shield,
  AlertCircle,
} from 'lucide-react';
import SessionReplayTracker from '@/components/analytics/SessionReplayTracker';

export default function PublicDataRoom() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const {
    data: dataRoom,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['public-data-room', token],
    queryFn: async () => {
      const rooms = await base44.entities.DataRoom.filter({ tracking_code: token });
      if (!rooms || rooms.length === 0) {
        throw new Error('Data room not found');
      }

      const room = rooms[0];

      // Check if expired
      if (room.expires_at && new Date(room.expires_at) < new Date()) {
        throw new Error('Data room has expired');
      }

      // Log access
      await base44.entities.DataRoom.update(room.id, {
        total_views: (room.total_views || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      });

      return room;
    },
    enabled: !!token,
    retry: false,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['data-room-documents', dataRoom?.id],
    queryFn: async () => {
      if (!dataRoom?.document_ids || dataRoom.document_ids.length === 0) {
        return [];
      }

      const docs = await Promise.all(
        dataRoom.document_ids.map((id) =>
          base44.entities.TrackedDocument.filter({ id }).then((res) => res[0])
        )
      );

      return docs.filter(Boolean);
    },
    enabled: !!dataRoom && isAuthenticated,
  });

  useEffect(() => {
    if (dataRoom && !dataRoom.access_password) {
      setIsAuthenticated(true);
    }
  }, [dataRoom]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === dataRoom?.access_password) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const handleDownload = async (doc) => {
    try {
      await base44.entities.TrackedDocument.update(doc.id, {
        total_downloads: (doc.total_downloads || 0) + 1,
      });

      const link = document.createElement('a');
      link.href = doc.file_url;
      link.download = doc.name;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50 p-6 flex items-center justify-center">
        <Skeleton className="h-96 w-full max-w-4xl" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">{fetchError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated && dataRoom?.access_password) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Lock className="w-12 h-12 text-violet-600" />
            </div>
            <CardTitle className="text-center">Protected Data Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  This data room is password protected. Please enter the password to continue.
                </p>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
              <Button type="submit" className="w-full">
                Access Data Room
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50 p-6">
      <SessionReplayTracker />
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-8 h-8 text-violet-600" />
                <div>
                  <CardTitle className="text-2xl">{dataRoom?.name}</CardTitle>
                  <p className="text-gray-600 mt-1">{dataRoom?.description}</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">{dataRoom?.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{documents.length} documents</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Expires {new Date(dataRoom?.expires_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Secure access</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-600" />
                  {doc.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {doc.description || 'No description'}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {doc.total_views || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {doc.total_downloads || 0}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      window.open(`?page=PublicDocumentViewer&token=${doc.tracking_code}`, '_blank')
                    }
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  {dataRoom?.allow_downloads && (
                    <Button size="sm" className="flex-1" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {documents.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

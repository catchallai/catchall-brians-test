import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DataRoomPortal() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(!token);
  const [accessError, setAccessError] = useState(null);

  // Verify token and get access info
  const { data: access, isError: accessError2 } = useQuery({
    queryKey: ['data-room-access-token', token],
    queryFn: async () => {
      if (!token) return null;

      try {
        const result = await base44.asServiceRole.entities.DataRoomAccess.filter({
          access_token: token,
        });

        if (!result.length) {
          setAccessError('Invalid or expired access token');
          return null;
        }

        const acc = result[0];

        // Check if expired
        if (acc.expires_at && new Date(acc.expires_at) < new Date()) {
          setAccessError('Access has expired');
          return null;
        }

        // Check if active
        if (!acc.is_active) {
          setAccessError('Access has been revoked');
          return null;
        }

        // Update last accessed
        await base44.asServiceRole.entities.DataRoomAccess.update(acc.id, {
          last_accessed: new Date().toISOString(),
        });

        return acc;
      } catch (error) {
        setAccessError('Failed to verify access');
        return null;
      }
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // Get data room and files
  const { data: dataRoom } = useQuery({
    queryKey: ['data-room-portal', access?.data_room_id],
    queryFn: async () => {
      if (!access?.data_room_id) return null;
      return await base44.asServiceRole.entities.ProjectDataRoom.get(access.data_room_id);
    },
    enabled: !!access?.data_room_id,
  });

  const { data: files = [] } = useQuery({
    queryKey: ['data-room-files', access?.data_room_id],
    queryFn: async () => {
      if (!access?.data_room_id) return [];
      return await base44.asServiceRole.entities.DataRoomFile.filter({
        data_room_id: access.data_room_id,
      }, '-created_date');
    },
    enabled: !!access?.data_room_id,
  });

  // Handle file download with tracking
  const handleDownload = async (file) => {
    if (access.access_level !== 'download' && access.access_level !== 'comment') {
      toast.error('Download not allowed with your access level');
      return;
    }

    try {
      // Track download
      await base44.asServiceRole.entities.DataRoomFile.update(file.id, {
        download_count: (file.download_count || 0) + 1,
      });

      // Open file
      window.open(file.file_url, '_blank');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // Handle file view tracking
  const handleViewFile = async (file) => {
    try {
      await base44.asServiceRole.entities.DataRoomFile.update(file.id, {
        view_count: (file.view_count || 0) + 1,
      });
      window.open(file.file_url, '_blank');
    } catch (error) {
      console.error('View tracking error:', error);
      window.open(file.file_url, '_blank');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Lock className="w-12 h-12 mx-auto text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">Access Required</h1>
            <p className="text-gray-600">Please use the secure link sent to your email to access this data room.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-red-600">{accessError}</p>
            <p className="text-sm text-gray-600">Please contact the project owner for assistance.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dataRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Loading data room...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">{dataRoom.name}</h1>
          {dataRoom.description && (
            <p className="text-gray-600 mt-2">{dataRoom.description}</p>
          )}
          {access && (
            <div className="mt-4 flex items-center gap-3">
              <Badge variant="outline">
                {access.contact_name || access.contact_email}
              </Badge>
              <Badge className={`${
                access.access_level === 'view' ? 'bg-blue-100 text-blue-800' :
                access.access_level === 'download' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {access.access_level === 'view' && 'View Only'}
                {access.access_level === 'download' && 'Download Enabled'}
                {access.access_level === 'comment' && 'Full Access'}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Files Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {files.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No files shared yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const fileIcon = file.file_type?.includes('pdf') ? FileText : FileText;
              const fileSize = file.file_size 
                ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB`
                : 'Unknown size';

              return (
                <Card key={file.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 flex-1">
                    <div className="flex items-start gap-3 mb-4">
                      <FileText className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">
                          {file.file_name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{fileSize}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* View Stats */}
                    <div className="flex gap-2 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {file.view_count || 0} views
                      </span>
                      {access.access_level !== 'view' && (
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {file.download_count || 0} downloads
                        </span>
                      )}
                    </div>
                  </CardContent>

                  {/* Actions */}
                  <div className="border-t p-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewFile(file)}
                      className="flex-1 gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    {access.access_level !== 'view' && (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(file)}
                        className="flex-1 gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
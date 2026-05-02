import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Lock, FileUp, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function PublicDataRoomPortal() {
  const { accessCode } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [sessionId, setSessionId] = useState(null);

  const { data: portal } = useQuery({
    queryKey: ['public-portal', accessCode],
    queryFn: async () => {
      const portals = await base44.entities.DataRoomPortal.filter({
        access_code: accessCode,
        status: 'active',
      });
      return portals[0] || null;
    },
    enabled: !isAuthenticated,
  });

  const { data: files } = useQuery({
    queryKey: ['portal-files', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      // In a real scenario, you'd fetch files from storage
      return [];
    },
    enabled: isAuthenticated && !!sessionId,
  });

  const handleAccessPortal = (e) => {
    e.preventDefault();
    if (!userEmail || !userName) {
      toast.error('Please enter your email and name');
      return;
    }
    setSessionId(`session_${Date.now()}`);
    setIsAuthenticated(true);
    toast.success('Portal access granted');
  };

  if (!portal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center space-y-4">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Portal Not Found</h1>
            <p className="text-muted-foreground">
              The portal access code is invalid or has expired.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{portal.name}</h1>
              {portal.description && (
                <p className="text-muted-foreground mt-2">{portal.description}</p>
              )}
            </div>

            <form onSubmit={handleAccessPortal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {portal.allow_upload && (
                  <Badge className="gap-1">
                    <Upload className="w-3 h-3" />
                    Upload
                  </Badge>
                )}
                {portal.allow_download && (
                  <Badge className="gap-1">
                    <Download className="w-3 h-3" />
                    Download
                  </Badge>
                )}
              </div>

              <Button type="submit" className="w-full">
                Access Portal
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{portal.name}</h1>
            <p className="text-muted-foreground mt-1">Welcome, {userName}</p>
          </div>
          <Button variant="outline" onClick={() => setIsAuthenticated(false)}>
            <LogOut className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>

        {/* File Share Area */}
        <Card className="p-8 mb-6">
          {portal.allow_upload ? (
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-12 text-center hover:border-primary/40 transition-colors cursor-pointer">
              <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">Upload Files</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop files or click to browse
              </p>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Upload is not enabled for this portal</p>
            </div>
          )}
        </Card>

        {/* Files List */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Available Files</h2>
          {files && files.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No files available yet
            </p>
          ) : (
            <div className="space-y-2">
              {files?.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  {portal.allow_download && (
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
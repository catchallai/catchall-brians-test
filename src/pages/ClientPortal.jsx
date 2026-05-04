import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, MessageSquare, LogIn } from 'lucide-react';
import ClientDocuments from '@/components/portal/ClientDocuments';
import ClientSupportForm from '@/components/portal/ClientSupportForm';

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (isAuthed) => {
      if (isAuthed) {
        const me = await base44.auth.me();
        setUser(me);
        setAuthed(true);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Portal</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Sign in to access your documents and submit support requests.
            </p>
          </div>
          <Button className="w-full" onClick={() => base44.auth.redirectToLogin(window.location.href)}>
            Sign In to Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Client Portal</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome back, {user?.full_name || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
              ● Active Session
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => base44.auth.logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="documents">
          <TabsList className="mb-6">
            <TabsTrigger value="documents" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              My Documents
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Support & Feedback
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <ClientDocuments user={user} />
          </TabsContent>

          <TabsContent value="support">
            <ClientSupportForm user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
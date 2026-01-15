import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Eye, Edit, Trash2, Globe, TrendingUp, Target, Copy, ExternalLink
} from "lucide-react";
import LandingPageEditorModal from '@/components/landing/LandingPageEditorModal';
import LandingPagePreviewModal from '@/components/landing/LandingPagePreviewModal';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function LandingPageBuilder() {
  const [selectedPage, setSelectedPage] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: landingPages = [], isLoading } = useQuery({
    queryKey: ['landing-pages', user?.current_business_id],
    queryFn: async () => {
      if (!user?.current_business_id) return [];
      return await base44.entities.LandingPage.filter(
        { business_id: user.current_business_id },
        '-created_date',
        50
      );
    },
    enabled: !!user?.current_business_id,
  });

  const createPageMutation = useMutation({
    mutationFn: (data) => base44.entities.LandingPage.create({
      ...data,
      business_id: user?.current_business_id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LandingPage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      setShowEditor(false);
      setSelectedPage(null);
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id) => base44.entities.LandingPage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      setDeleteConfirm(null);
    },
  });

  const duplicatePageMutation = useMutation({
    mutationFn: async (page) => {
      const { id, created_date, updated_date, created_by, ...pageData } = page;
      return await base44.entities.LandingPage.create({
        ...pageData,
        title: `${page.title} (Copy)`,
        slug: `${page.slug}-copy-${Date.now()}`,
        status: 'draft',
        business_id: user?.current_business_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
    },
  });

  const handleNewPage = () => {
    setSelectedPage(null);
    setShowEditor(true);
  };

  const handleEdit = (page) => {
    setSelectedPage(page);
    setShowEditor(true);
  };

  const publishedPages = landingPages.filter(p => p.status === 'published');
  const draftPages = landingPages.filter(p => p.status === 'draft');
  const totalViews = landingPages.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalConversions = landingPages.reduce((sum, p) => sum + (p.conversions || 0), 0);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Landing Pages</h1>
          <p className="text-gray-500 mt-1">Create and manage marketing landing pages</p>
        </div>
        <Button onClick={handleNewPage} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4" />
          New Page
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Globe className="w-6 h-6 text-violet-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{landingPages.length}</p>
            <p className="text-sm text-gray-500">Total Pages</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{publishedPages.length}</p>
            <p className="text-sm text-gray-500">Published</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalViews.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Views</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalConversions}</p>
            <p className="text-sm text-gray-500">Conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* Landing Pages List */}
      {landingPages.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No landing pages yet"
          description="Create your first landing page to start capturing leads"
          actionLabel="Create Page"
          onAction={handleNewPage}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {landingPages.map((page) => (
            <Card key={page.id} className="glass-card hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{page.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          page.status === 'published'
                            ? 'bg-green-100 text-green-700 border-0'
                            : 'bg-gray-100 text-gray-700 border-0'
                        }
                      >
                        {page.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        /{page.slug}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {page.views || 0} views
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {page.conversions || 0} conversions
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPage(page);
                      setShowPreview(true);
                    }}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicatePageMutation.mutate(page)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm(page)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                {page.status === 'published' && (
                   <Button
                     variant="ghost"
                     size="sm"
                     className="w-full gap-1"
                     onClick={() => {
                       const shareUrl = `${window.location.origin}/#/PublicLandingPage?slug=${page.slug}`;
                       window.open(shareUrl, '_blank');
                     }}
                   >
                     <ExternalLink className="w-3 h-3" />
                     View Live Page
                   </Button>
                 )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <LandingPageEditorModal
        open={showEditor}
        onClose={() => {
          setShowEditor(false);
          setSelectedPage(null);
        }}
        page={selectedPage}
        isLoading={createPageMutation.isPending || updatePageMutation.isPending}
        onSave={(data) => {
          if (selectedPage) {
            updatePageMutation.mutate({ id: selectedPage.id, data });
          } else {
            createPageMutation.mutate(data);
          }
        }}
      />

      {/* Preview Modal */}
      <LandingPagePreviewModal
        open={showPreview}
        onClose={() => {
          setShowPreview(false);
          setSelectedPage(null);
        }}
        page={selectedPage}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deletePageMutation.mutate(deleteConfirm.id)}
        title="Delete Landing Page"
        description={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}
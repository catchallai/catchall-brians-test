import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Link2, Loader2, Download } from "lucide-react";
import BacklinkItem from '@/components/seo/BacklinkItem';
import EmptyState from '@/components/ui/EmptyState';

export default function Backlinks() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [websiteFilter, setWebsiteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    website_id: '',
    source_url: '',
    source_domain: '',
    target_url: '',
    anchor_text: '',
    domain_authority: '',
    link_type: 'dofollow',
    status: 'active',
  });
  const queryClient = useQueryClient();

  const { data: backlinks = [], isLoading } = useQuery({
    queryKey: ['backlinks'],
    queryFn: () => base44.entities.Backlink.list('-created_date', 500),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites'],
    queryFn: () => base44.entities.Website.list('-created_date', 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Backlink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlinks'] });
      setShowModal(false);
      setFormData({
        website_id: '',
        source_url: '',
        source_domain: '',
        target_url: '',
        anchor_text: '',
        domain_authority: '',
        link_type: 'dofollow',
        status: 'active',
      });
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    const domain = formData.source_url ? new URL(formData.source_url).hostname : '';
    createMutation.mutate({
      ...formData,
      source_domain: domain,
      domain_authority: formData.domain_authority ? parseInt(formData.domain_authority) : null,
      first_seen: new Date().toISOString().split('T')[0],
    });
  };

  const filteredBacklinks = backlinks.filter(backlink => {
    const matchesSearch = !searchTerm || 
      backlink.source_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backlink.source_domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backlink.anchor_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWebsite = websiteFilter === 'all' || backlink.website_id === websiteFilter;
    const matchesStatus = statusFilter === 'all' || backlink.status === statusFilter;
    return matchesSearch && matchesWebsite && matchesStatus;
  });

  const activeCount = backlinks.filter(b => b.status === 'active').length;
  const dofollowCount = backlinks.filter(b => b.link_type === 'dofollow').length;

  const handleExportCSV = () => {
    const headers = ['Source URL', 'Source Domain', 'Target URL', 'Anchor Text', 'DA', 'Type', 'Status', 'First Seen'];
    const rows = backlinks.map(b => [
      b.source_url || '',
      b.source_domain || '',
      b.target_url || '',
      b.anchor_text || '',
      b.domain_authority || '',
      b.link_type || '',
      b.status || '',
      b.first_seen || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backlinks_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Backlinks</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {backlinks.length} total • {activeCount} active • {dofollowCount} dofollow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 dark:bg-gray-800 dark:border-gray-700">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => setShowModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" />
            Add Backlink
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search backlinks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
          <SelectTrigger className="w-full sm:w-48 dark:bg-gray-800 dark:border-gray-700">
            <SelectValue placeholder="Website" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Websites</SelectItem>
            {websites.map((website) => (
              <SelectItem key={website.id} value={website.id}>{website.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 dark:bg-gray-800 dark:border-gray-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="broken">Broken</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Backlink List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filteredBacklinks.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No backlinks tracked"
          description="Start tracking backlinks to monitor your link profile."
          actionLabel="Add Backlink"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredBacklinks.map((backlink) => (
            <BacklinkItem key={backlink.id} backlink={backlink} />
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Backlink</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Website *</Label>
              <Select
                value={formData.website_id}
                onValueChange={(value) => setFormData({ ...formData, website_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select website" />
                </SelectTrigger>
                <SelectContent>
                  {websites.map((website) => (
                    <SelectItem key={website.id} value={website.id}>{website.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_url">Source URL *</Label>
              <Input
                id="source_url"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://example.com/page"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_url">Target URL *</Label>
              <Input
                id="target_url"
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                placeholder="https://yoursite.com/page"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="anchor_text">Anchor Text</Label>
                <Input
                  id="anchor_text"
                  value={formData.anchor_text}
                  onChange={(e) => setFormData({ ...formData, anchor_text: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain_authority">Domain Authority</Label>
                <Input
                  id="domain_authority"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.domain_authority}
                  onChange={(e) => setFormData({ ...formData, domain_authority: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Link Type</Label>
                <Select
                  value={formData.link_type}
                  onValueChange={(value) => setFormData({ ...formData, link_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dofollow">Dofollow</SelectItem>
                    <SelectItem value="nofollow">Nofollow</SelectItem>
                    <SelectItem value="ugc">UGC</SelectItem>
                    <SelectItem value="sponsored">Sponsored</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="broken">Broken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Backlink
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
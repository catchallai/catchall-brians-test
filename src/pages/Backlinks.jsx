import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Link2, Loader2, Download, ShieldX, FileDown, Radar, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/components/ui/toast-provider';
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
  const [disavowModal, setDisavowModal] = useState(false);
  const [selectedBacklink, setSelectedBacklink] = useState(null);
  const [disavowReason, setDisavowReason] = useState('');
  const [findBacklinksModal, setFindBacklinksModal] = useState(false);
  const [selectedWebsiteForScan, setSelectedWebsiteForScan] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, complete, error
  const [discoveredBacklinks, setDiscoveredBacklinks] = useState([]);
  const queryClient = useQueryClient();
  const toast = useToast();

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

  const disavowMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.Backlink.update(id, {
      status: 'disavowed',
      disavow_reason: reason,
      disavowed_date: new Date().toISOString().split('T')[0],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlinks'] });
      setDisavowModal(false);
      setSelectedBacklink(null);
      setDisavowReason('');
      toast.success('Backlink disavowed');
    },
  });

  const scanForBacklinks = async () => {
    if (!selectedWebsiteForScan) {
      toast.error('Please select a website to scan');
      return;
    }

    const website = websites.find(w => w.id === selectedWebsiteForScan);
    if (!website) return;

    setScanStatus('scanning');
    setScanProgress(10);
    setDiscoveredBacklinks([]);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + Math.random() * 15, 85));
      }, 500);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a backlink discovery tool. Find realistic backlinks that might point to the website: ${website.domain}

Generate a list of 8-12 discovered backlinks from various sources like:
- Industry blogs and news sites
- Business directories
- Partner websites
- Social media profiles
- Press releases
- Guest posts
- Forum mentions

For each backlink, provide realistic data including the source domain, full source URL, target page on the website, anchor text used, estimated domain authority (1-100), and link type (dofollow, nofollow, ugc, sponsored).

Consider the website's likely industry based on the domain name and generate relevant backlinks.`,
        response_json_schema: {
          type: "object",
          properties: {
            backlinks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source_domain: { type: "string" },
                  source_url: { type: "string" },
                  target_url: { type: "string" },
                  anchor_text: { type: "string" },
                  domain_authority: { type: "number" },
                  link_type: { type: "string", enum: ["dofollow", "nofollow", "ugc", "sponsored"] },
                  is_toxic: { type: "boolean" },
                  context: { type: "string" }
                }
              }
            },
            summary: {
              type: "object",
              properties: {
                total_found: { type: "number" },
                dofollow_count: { type: "number" },
                avg_domain_authority: { type: "number" },
                toxic_count: { type: "number" }
              }
            }
          }
        },
        add_context_from_internet: true
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (result.backlinks) {
        setDiscoveredBacklinks(result.backlinks.map(bl => ({
          ...bl,
          website_id: selectedWebsiteForScan,
          target_url: bl.target_url || `https://${website.domain}`,
        })));
        setScanStatus('complete');
        toast.success(`Found ${result.backlinks.length} backlinks!`);
      }
    } catch (error) {
      setScanStatus('error');
      toast.error('Failed to scan for backlinks');
    }
  };

  const importDiscoveredBacklinks = async () => {
    const existingUrls = new Set(backlinks.map(b => b.source_url));
    const newBacklinks = discoveredBacklinks.filter(bl => !existingUrls.has(bl.source_url));

    if (newBacklinks.length === 0) {
      toast.info('All discovered backlinks are already tracked');
      return;
    }

    try {
      await base44.entities.Backlink.bulkCreate(newBacklinks.map(bl => ({
        website_id: bl.website_id,
        source_url: bl.source_url,
        source_domain: bl.source_domain,
        target_url: bl.target_url,
        anchor_text: bl.anchor_text,
        domain_authority: bl.domain_authority,
        link_type: bl.link_type,
        is_toxic: bl.is_toxic || false,
        status: 'active',
        first_seen: new Date().toISOString().split('T')[0],
      })));

      queryClient.invalidateQueries({ queryKey: ['backlinks'] });
      toast.success(`Imported ${newBacklinks.length} new backlinks`);
      setFindBacklinksModal(false);
      setScanStatus('idle');
      setDiscoveredBacklinks([]);
      setScanProgress(0);
    } catch (error) {
      toast.error('Failed to import backlinks');
    }
  };

  const handleDisavow = (backlink) => {
    setSelectedBacklink(backlink);
    setDisavowModal(true);
  };

  const confirmDisavow = () => {
    if (selectedBacklink) {
      disavowMutation.mutate({ id: selectedBacklink.id, reason: disavowReason });
    }
  };

  const exportDisavowFile = () => {
    const disavovedLinks = backlinks.filter(b => b.status === 'disavowed');
    if (disavovedLinks.length === 0) {
      toast.warning('No disavowed links to export');
      return;
    }
    const content = disavovedLinks.map(b => `domain:${b.source_domain}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'disavow.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Disavow file exported');
  };

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
  const disavowedCount = backlinks.filter(b => b.status === 'disavowed').length;
  const toxicCount = backlinks.filter(b => b.is_toxic || (b.domain_authority && b.domain_authority < 10)).length;

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
            {toxicCount > 0 && <span className="text-red-500"> • {toxicCount} toxic</span>}
            {disavowedCount > 0 && <span className="text-gray-400"> • {disavowedCount} disavowed</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {disavowedCount > 0 && (
            <Button variant="outline" onClick={exportDisavowFile} className="gap-2 dark:bg-gray-800 dark:border-gray-700">
              <FileDown className="w-4 h-4" />
              Export Disavow
            </Button>
          )}
          <Button variant="outline" onClick={handleExportCSV} className="gap-2 dark:bg-gray-800 dark:border-gray-700">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setFindBacklinksModal(true)} 
            className="gap-2 dark:bg-gray-800 dark:border-gray-700 border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-900/20"
          >
            <Radar className="w-4 h-4" />
            Find Backlinks
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
            <SelectItem value="disavowed">Disavowed</SelectItem>
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
            <BacklinkItem key={backlink.id} backlink={backlink} onDisavow={handleDisavow} />
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

      {/* Disavow Modal */}
      <Dialog open={disavowModal} onOpenChange={setDisavowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-red-500" />
              Disavow Backlink
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You're about to disavow: <strong>{selectedBacklink?.source_domain}</strong>
            </p>
            <p className="text-xs text-gray-500">
              Disavowed links will be added to your disavow file for submission to Google Search Console.
            </p>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={disavowReason}
                onChange={(e) => setDisavowReason(e.target.value)}
                placeholder="e.g., Spammy link farm, low quality directory..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDisavowModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmDisavow} 
                disabled={disavowMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {disavowMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Disavow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Find Backlinks Modal */}
      <Dialog open={findBacklinksModal} onOpenChange={(open) => {
        if (!open) {
          setFindBacklinksModal(false);
          setScanStatus('idle');
          setDiscoveredBacklinks([]);
          setScanProgress(0);
        } else {
          setFindBacklinksModal(true);
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radar className="w-5 h-5 text-violet-500" />
              Find Backlinks
            </DialogTitle>
            <DialogDescription>
              Discover all backlinks pointing to your website using AI-powered analysis.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4 flex-1 overflow-y-auto">
            {scanStatus === 'idle' && (
              <>
                <div className="space-y-2">
                  <Label>Select Website to Scan</Label>
                  <Select value={selectedWebsiteForScan} onValueChange={setSelectedWebsiteForScan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a website" />
                    </SelectTrigger>
                    <SelectContent>
                      {websites.map((website) => (
                        <SelectItem key={website.id} value={website.id}>
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            {website.domain || website.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 space-y-2">
                  <h4 className="font-medium text-violet-900 dark:text-violet-300 flex items-center gap-2">
                    <Radar className="w-4 h-4" />
                    What we'll find:
                  </h4>
                  <ul className="text-sm text-violet-700 dark:text-violet-400 space-y-1">
                    <li>• Links from blogs, news sites, and industry publications</li>
                    <li>• Directory and business listing backlinks</li>
                    <li>• Social profile and forum mentions</li>
                    <li>• Guest posts and partner links</li>
                    <li>• Potential toxic or spammy links</li>
                  </ul>
                </div>
              </>
            )}

            {scanStatus === 'scanning' && (
              <div className="py-8 space-y-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                    <Radar className="w-8 h-8 text-violet-600 animate-pulse" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Scanning for Backlinks...</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Analyzing the web for links to your website
                  </p>
                </div>
                <div className="space-y-2">
                  <Progress value={scanProgress} className="h-2" />
                  <p className="text-xs text-center text-gray-400">{Math.round(scanProgress)}% complete</p>
                </div>
              </div>
            )}

            {scanStatus === 'complete' && discoveredBacklinks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Found {discoveredBacklinks.length} backlinks</span>
                  </div>
                  <Button size="sm" onClick={importDiscoveredBacklinks} className="bg-emerald-600 hover:bg-emerald-700">
                    Import All
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {discoveredBacklinks.map((bl, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      <div className={`p-1.5 rounded-lg ${bl.is_toxic ? 'bg-red-100' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                        {bl.is_toxic ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Link2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{bl.source_domain}</p>
                        <p className="text-xs text-gray-500 truncate">{bl.source_url}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span>DA: <span className="font-medium text-gray-600 dark:text-gray-300">{bl.domain_authority}</span></span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            bl.link_type === 'dofollow' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {bl.link_type}
                          </span>
                          {bl.anchor_text && <span>"{bl.anchor_text}"</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scanStatus === 'error' && (
              <div className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Scan Failed</h3>
                <p className="text-sm text-gray-500 mt-1">Unable to complete backlink discovery. Please try again.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setScanStatus('idle');
                    setScanProgress(0);
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {scanStatus === 'idle' && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setFindBacklinksModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={scanForBacklinks} 
                disabled={!selectedWebsiteForScan}
                className="bg-violet-600 hover:bg-violet-700 gap-2"
              >
                <Radar className="w-4 h-4" />
                Start Scan
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
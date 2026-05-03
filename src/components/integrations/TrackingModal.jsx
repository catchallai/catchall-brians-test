import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Code2,
  Copy,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  BookOpen,
  Rocket,
  Globe,
  BarChart3,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'ca_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
      >
        {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

const HOW_TO_STEPS = [
  {
    icon: Rocket,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    title: 'Step 1 — Generate a Tracking Key',
    desc: 'Enter a name (e.g. "Company Website") and optionally the domain, then click Generate Key. Each website should have its own unique key.',
  },
  {
    icon: Code2,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    title: 'Step 2 — Copy the Snippet',
    desc: 'Click on any active key below to expand it. Copy the snippet that fits your platform — use the Auto-Loader for most sites, or the Manual snippet for SPAs and React/Vue apps.',
  },
  {
    icon: Globe,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    title: 'Step 3 — Paste into Your Website',
    desc: (
      <span>
        Add the snippet inside the{' '}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">&lt;head&gt;</code> tag of every page you want to track.
        <span className="block mt-2 space-y-1">
          <span className="block">• <strong>WordPress:</strong> Appearance → Theme Editor → header.php, or use a "Header & Footer Scripts" plugin.</span>
          <span className="block">• <strong>Shopify:</strong> Online Store → Themes → Edit Code → layout/theme.liquid → inside <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">&lt;head&gt;</code>.</span>
          <span className="block">• <strong>Webflow:</strong> Project Settings → Custom Code → Head Code.</span>
          <span className="block">• <strong>Squarespace:</strong> Settings → Advanced → Code Injection → Header.</span>
          <span className="block">• <strong>Wix:</strong> Settings → Custom Code → Add to &lt;head&gt;.</span>
          <span className="block">• <strong>HTML / Static:</strong> Paste directly in your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">index.html</code> or shared template file.</span>
          <span className="block">• <strong>React / Next.js / Vue:</strong> Use the Manual snippet inside your root component or app entry point (e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">_app.js</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">App.vue</code>).</span>
        </span>
      </span>
    ),
  },
  {
    icon: Layers,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    title: 'Step 4 — Publish & Verify',
    desc: 'Publish your website changes, then visit a page. Within a few seconds the "Last Seen" timestamp and event counter on your key will update — confirming tracking is live.',
  },
  {
    icon: BarChart3,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
    title: 'Step 5 — View Your Data',
    desc: 'Navigate to Web → Web Analytics (Traffic Analytics) to see real-time visitors, sessions, pages, devices, locations, and referrers. Visitor Profiles and Advanced Analytics will also populate automatically.',
  },
];

function HowToGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="glass-card rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/40">
      <button
        className="w-full text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              How to Add Tracking to Your Website
            </CardTitle>
            {open ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
          {!open && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              5-step guide — works with WordPress, Shopify, Webflow, Wix, React, and more.
            </p>
          )}
        </CardHeader>
      </button>

      {open && (
        <CardContent className="pt-0 space-y-3">
          {HOW_TO_STEPS.map((step, i) => (
            <div key={i} className={`flex gap-4 p-4 rounded-xl ${step.bg}`}>
              <div className={`shrink-0 mt-0.5 ${step.color}`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className={`text-sm font-semibold ${step.color}`}>{step.title}</p>
                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {step.desc}
                </div>
              </div>
            </div>
          ))}

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-700 dark:text-amber-300">
            <strong>Tip:</strong> Use a separate key for each website or client. This lets you filter traffic data per site and revoke access independently without affecting other properties.
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function TrackingModal({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trackingKeys = [], isLoading } = useQuery({
    queryKey: ['tracking-keys'],
    queryFn: () => base44.entities.TrackingKey.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.TrackingKey.create({
        name: newName.trim(),
        domain: newDomain.trim(),
        key: generateKey(),
        status: 'active',
        created_by_email: currentUser?.email || '',
        total_events: 0,
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-keys'] });
      setNewName('');
      setNewDomain('');
      setSelectedKey(created);
      toast.success('Tracking key created');
    },
    onError: () => toast.error('Failed to create key'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => base44.entities.TrackingKey.update(id, { status: 'revoked' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-keys'] });
      toast.success('Key revoked');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TrackingKey.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-keys'] });
      if (selectedKey) setSelectedKey(null);
      toast.success('Key deleted');
    },
  });

  const getSnippet = (key) => {
    const baseUrl = window.location.origin;
    return `<!-- CatchAll Analytics Tracker -->
<script>
(function(w,d,s,k){
  w._ca = w._ca || {};
  w._ca.siteKey = k;
  var js = d.createElement(s);
  js.async = true;
  js.src = "${baseUrl}/tracker.js";
  d.head.appendChild(js);
})(window, document, 'script', '${key}');
</script>`;
  };

  const getManualSnippet = (key) => {
    const baseUrl = window.location.origin;
    return `<!-- CatchAll Manual Tracking Call -->
<script>
fetch("${baseUrl}/api/functions/trackVisitor", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    siteKey: "${key}",
    sessionId: localStorage.getItem("_ca_sid") || (function(){
      var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("_ca_sid", id);
      return id;
    })(),
    page: window.location.pathname,
    referrer: document.referrer,
    device: /Mobi/.test(navigator.userAgent) ? "Mobile" : "Desktop",
    browser: navigator.userAgent.slice(0,50),
    isNewSession: !localStorage.getItem("_ca_sid")
  })
});
</script>`;
  };

  const activeKeys = trackingKeys.filter((k) => k.status === 'active');
  const revokedKeys = trackingKeys.filter((k) => k.status === 'revoked');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Website Tracking Keys
          </DialogTitle>
          <DialogDescription>
            Generate site keys to embed on your websites. Traffic data flows into Web Analytics and Visitor Profiles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* How-To Guide */}
          <HowToGuide />

          {/* Create Key Section */}
          <Card className="glass-card rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Generate New Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Key Name</Label>
                  <Input
                    placeholder="e.g. Main Website"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Domain (optional)</Label>
                  <Input
                    placeholder="e.g. example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={!newName.trim() || createMutation.isPending}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Generate Key
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Keys */}
          {activeKeys.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Active Keys ({activeKeys.length})
              </h3>
              {activeKeys.map((tk) => (
                <Card
                  key={tk.id}
                  className={`glass-card rounded-2xl cursor-pointer transition-all border-2 ${
                    selectedKey?.id === tk.id
                      ? 'border-indigo-400 dark:border-indigo-500'
                      : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                  onClick={() => setSelectedKey(selectedKey?.id === tk.id ? null : tk)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{tk.name}</p>
                          {tk.domain && (
                            <p className="text-xs text-gray-400 truncate">{tk.domain}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-gray-600 dark:text-gray-300 hidden md:block">
                          {tk.key}
                        </code>
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          active
                        </Badge>
                        {tk.total_events > 0 && (
                          <span className="text-xs text-gray-400">{tk.total_events.toLocaleString()} events</span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(tk.key);
                            toast.success('Key copied!');
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            revokeMutation.mutate(tk.id);
                          }}
                          className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                          title="Revoke key"
                        >
                          <XCircle className="w-3.5 h-3.5 text-yellow-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(tk.id);
                          }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete key"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded snippet view */}
                    {selectedKey?.id === tk.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Code2 className="w-4 h-4 text-indigo-500" />
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Auto-Loader Snippet (Recommended)
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            Paste this in the <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">&lt;head&gt;</code> of every page on your website.
                          </p>
                          <CodeBlock code={getSnippet(tk.key)} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Code2 className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Manual Fetch Snippet (Advanced)
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            Use this if you want full control over when tracking fires (e.g. SPAs, custom events).
                          </p>
                          <CodeBlock code={getManualSnippet(tk.key)} />
                        </div>

                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
                          <p className="font-semibold">What gets tracked:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-indigo-600 dark:text-indigo-400">
                            <li>Page views, session duration, scroll depth</li>
                            <li>Device type, browser, referrer source</li>
                            <li>Visitor location (city, country)</li>
                            <li>Returning vs new visitor status</li>
                          </ul>
                          <p className="mt-2 font-semibold">Data appears in:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-indigo-600 dark:text-indigo-400">
                            <li>Web Dashboard → Web Analytics → Visitor Profiles</li>
                            <li>Advanced Analytics → Traffic Analytics</li>
                            <li>Web Crawler → Contact Forms</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Revoked Keys */}
          {revokedKeys.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Revoked Keys ({revokedKeys.length})
              </h3>
              {revokedKeys.map((tk) => (
                <Card key={tk.id} className="rounded-2xl opacity-60">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-500">{tk.name}</p>
                          {tk.domain && <p className="text-xs text-gray-400">{tk.domain}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs text-gray-400">revoked</Badge>
                        <button
                          onClick={() => deleteMutation.mutate(tk.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && trackingKeys.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="font-medium">No tracking keys yet</p>
              <p className="text-sm mt-1">Create your first key above to start collecting website data.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
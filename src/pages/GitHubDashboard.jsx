import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitPullRequest, GitCommit, AlertCircle, Star, GitFork, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const REPO = 'briangibbs7/catchall-brians';

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function GitHubDashboard() {
  const [activeTab, setActiveTab] = useState('pulls');
  const [data, setData] = useState({ pulls: null, issues: null, commits: null, repo: null });
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const fetchData = async (type) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: null }));
    const res = await base44.functions.invoke('fetchGitHubData', { type });
    setLoading(prev => ({ ...prev, [type]: false }));
    if (res.data?.error) {
      setErrors(prev => ({ ...prev, [type]: res.data.error }));
    } else {
      setData(prev => ({ ...prev, [type]: res.data?.data }));
    }
  };

  useEffect(() => {
    fetchData('repo');
    fetchData('pulls');
  }, []);

  useEffect(() => {
    if (activeTab === 'issues' && !data.issues) fetchData('issues');
    if (activeTab === 'commits' && !data.commits) fetchData('commits');
  }, [activeTab]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub — {REPO}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Live data from your repository</p>
        </div>
        <a href={`https://github.com/${REPO}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="w-4 h-4" /> View on GitHub
          </Button>
        </a>
      </div>

      {/* Repo Stats */}
      {data.repo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Star, label: 'Stars', value: data.repo.stargazers_count },
            { icon: GitFork, label: 'Forks', value: data.repo.forks_count },
            { icon: Eye, label: 'Watchers', value: data.repo.watchers_count },
            { icon: AlertCircle, label: 'Open Issues', value: data.repo.open_issues_count },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pulls" className="gap-2">
            <GitPullRequest className="w-4 h-4" /> Pull Requests
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2">
            <AlertCircle className="w-4 h-4" /> Issues
          </TabsTrigger>
          <TabsTrigger value="commits" className="gap-2">
            <GitCommit className="w-4 h-4" /> Commits
          </TabsTrigger>
        </TabsList>

        {/* Pull Requests */}
        <TabsContent value="pulls" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Open Pull Requests</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => fetchData('pulls')} disabled={loading.pulls}>
                <RefreshCw className={`w-4 h-4 ${loading.pulls ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {loading.pulls ? <LoadingSkeleton /> : errors.pulls ? (
                <p className="text-red-500 text-sm">{errors.pulls}</p>
              ) : data.pulls?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No open pull requests</p>
              ) : (
                <div className="space-y-3">
                  {data.pulls?.map(pr => (
                    <a key={pr.id} href={pr.html_url} target="_blank" rel="noopener noreferrer"
                      className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <GitPullRequest className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{pr.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              #{pr.number} opened {formatDate(pr.created_at)} by {pr.user.login}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {pr.labels?.map(l => (
                            <Badge key={l.id} variant="outline" className="text-xs">{l.name}</Badge>
                          ))}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues */}
        <TabsContent value="issues" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Open Issues</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => fetchData('issues')} disabled={loading.issues}>
                <RefreshCw className={`w-4 h-4 ${loading.issues ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {loading.issues ? <LoadingSkeleton /> : errors.issues ? (
                <p className="text-red-500 text-sm">{errors.issues}</p>
              ) : data.issues?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No open issues</p>
              ) : (
                <div className="space-y-3">
                  {data.issues?.filter(i => !i.pull_request).map(issue => (
                    <a key={issue.id} href={issue.html_url} target="_blank" rel="noopener noreferrer"
                      className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{issue.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              #{issue.number} opened {formatDate(issue.created_at)} by {issue.user.login}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {issue.labels?.map(l => (
                            <Badge key={l.id} variant="outline" className="text-xs">{l.name}</Badge>
                          ))}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commits */}
        <TabsContent value="commits" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Recent Commits</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => fetchData('commits')} disabled={loading.commits}>
                <RefreshCw className={`w-4 h-4 ${loading.commits ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {loading.commits ? <LoadingSkeleton /> : errors.commits ? (
                <p className="text-red-500 text-sm">{errors.commits}</p>
              ) : data.commits?.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No commits found</p>
              ) : (
                <div className="space-y-3">
                  {data.commits?.map(c => (
                    <a key={c.sha} href={c.html_url} target="_blank" rel="noopener noreferrer"
                      className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start gap-2">
                        <GitCommit className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{c.commit.message.split('\n')[0]}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {c.commit.author.name} · {formatDate(c.commit.author.date)} · <code className="font-mono">{c.sha.slice(0, 7)}</code>
                          </p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
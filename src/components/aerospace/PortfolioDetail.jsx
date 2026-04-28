import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Target,
  Edit2,
  X,
  Star,
  Tag,
  Plus,
  FileText,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Label } from '@/components/ui/label';

export default function PortfolioDetail({ portfolio, onBack, user }) {
  const [editingNotes, setEditingNotes] = useState(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [removeCompanyConfirm, setRemoveCompanyConfirm] = useState(null);
  const queryClient = useQueryClient();

  const { data: companies = [] } = useQuery({
    queryKey: ['portfolio-companies', portfolio.id],
    queryFn: async () => {
      const allCompanies = await base44.entities.AerospaceCompany.list();
      return allCompanies.filter((c) => portfolio.company_ids?.includes(c.id));
    },
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['portfolio-notes', portfolio.id],
    queryFn: () =>
      base44.entities.PortfolioCompanyNote.filter({
        portfolio_id: portfolio.id,
        user_email: user.email,
      }),
    enabled: !!user?.email,
  });

  const removeCompanyMutation = useMutation({
    mutationFn: (companyId) => {
      const newCompanyIds = portfolio.company_ids.filter((id) => id !== companyId);
      return base44.entities.AerospacePortfolio.update(portfolio.id, {
        company_ids: newCompanyIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-companies'] });
    },
  });

  const saveNoteMutation = useMutation({
    mutationFn: (data) => {
      const existing = notes.find((n) => n.company_id === data.company_id);
      if (existing) {
        return base44.entities.PortfolioCompanyNote.update(existing.id, data);
      }
      return base44.entities.PortfolioCompanyNote.create({
        ...data,
        portfolio_id: portfolio.id,
        user_email: user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-notes'] });
      setShowNoteDialog(false);
      setEditingNotes(null);
    },
  });

  const getNoteForCompany = (companyId) => {
    return notes.find((n) => n.company_id === companyId);
  };

  const handleSaveNote = () => {
    saveNoteMutation.mutate(editingNotes);
  };

  // Calculate KPIs
  const kpis = {
    totalCompanies: companies.length,
    totalEmployees: companies.reduce((sum, c) => sum + (c.employee_count || 0), 0),
    avgGrowth:
      companies.length > 0
        ? companies.reduce((sum, c) => {
            const growth = parseFloat(
              (c.financial_highlights?.revenue_growth || '0').replace(/[^0-9.-]/g, '')
            );
            return sum + (isNaN(growth) ? 0 : growth);
          }, 0) / companies.length
        : 0,
    totalContracts: companies.reduce(
      (sum, c) => sum + (c.dod_contracts?.length || 0) + (c.public_sector_contracts?.length || 0),
      0
    ),
    publicCompanies: companies.filter((c) => c.company_type === 'public').length,
    privateCompanies: companies.filter((c) => c.company_type === 'private').length,
  };

  // Chart data
  const employeeData = companies
    .map((c) => ({
      name: c.company_name.length > 20 ? c.company_name.substring(0, 20) + '...' : c.company_name,
      employees: c.employee_count || 0,
    }))
    .sort((a, b) => b.employees - a.employees)
    .slice(0, 10);

  const contractData = companies
    .map((c) => ({
      name: c.company_name.length > 20 ? c.company_name.substring(0, 20) + '...' : c.company_name,
      contracts: (c.dod_contracts?.length || 0) + (c.public_sector_contracts?.length || 0),
    }))
    .sort((a, b) => b.contracts - a.contracts)
    .slice(0, 10);

  const generateReport = () => {
    const report = `
PORTFOLIO REPORT: ${portfolio.name}
Generated: ${new Date().toLocaleDateString()}

=== KEY METRICS ===
Total Companies: ${kpis.totalCompanies}
Total Employees: ${kpis.totalEmployees.toLocaleString()}
Average Growth: ${kpis.avgGrowth.toFixed(1)}%
Total Contracts: ${kpis.totalContracts}
Public Companies: ${kpis.publicCompanies}
Private Companies: ${kpis.privateCompanies}

=== COMPANIES ===
${companies
  .map(
    (c) => `
${c.company_name}
- Type: ${c.company_type}
- Employees: ${c.employee_count?.toLocaleString() || 'N/A'}
- Revenue: ${c.annual_revenue || 'N/A'}
- Contracts: ${(c.dod_contracts?.length || 0) + (c.public_sector_contracts?.length || 0)}
${getNoteForCompany(c.id)?.notes ? `- Notes: ${getNoteForCompany(c.id).notes}` : ''}
`
  )
  .join('\n')}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${portfolio.name.replace(/\s+/g, '_')}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: portfolio.color }} />
              {portfolio.name}
            </h2>
            {portfolio.description && (
              <p className="text-sm text-gray-500">{portfolio.description}</p>
            )}
          </div>
        </div>
        <Button onClick={generateReport} className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{kpis.totalCompanies}</p>
              <p className="text-xs text-gray-500">Companies</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{kpis.totalEmployees.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Employees</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              {kpis.avgGrowth > 0 ? (
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              ) : (
                <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-500" />
              )}
              <p className="text-2xl font-bold">{kpis.avgGrowth.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Avg Growth</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{kpis.totalContracts}</p>
              <p className="text-xs text-gray-500">Contracts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{kpis.publicCompanies}</p>
              <p className="text-xs text-gray-500">Public</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-violet-500" />
              <p className="text-2xl font-bold">{kpis.privateCompanies}</p>
              <p className="text-xs text-gray-500">Private</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Companies by Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="employees" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contract Leaders</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contractData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contracts" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Company List */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {companies.map((company) => {
              const note = getNoteForCompany(company.id);
              return (
                <div
                  key={company.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {company.logo_url && (
                          <img
                            src={company.logo_url}
                            alt={company.company_name}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <h3 className="font-semibold">{company.company_name}</h3>
                        <Badge
                          className={
                            company.company_type === 'public'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }
                        >
                          {company.company_type}
                        </Badge>
                        {note?.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < note.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-gray-500">Employees:</span>
                          <span className="font-medium ml-1">
                            {company.employee_count?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Revenue:</span>
                          <span className="font-medium ml-1">
                            {company.annual_revenue || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Growth:</span>
                          <span className="font-medium ml-1">
                            {company.financial_highlights?.revenue_growth || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Contracts:</span>
                          <span className="font-medium ml-1">
                            {(company.dod_contracts?.length || 0) +
                              (company.public_sector_contracts?.length || 0)}
                          </span>
                        </div>
                      </div>
                      {note?.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {note.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {note?.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          {note.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingNotes(
                            note || {
                              company_id: company.id,
                              notes: '',
                              tags: [],
                              rating: 0,
                            }
                          );
                          setShowNoteDialog(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() =>
                          setRemoveCompanyConfirm({
                            id: company.id,
                            name: company.company_name,
                          })
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Company Notes & Tags</DialogTitle>
          </DialogHeader>
          {editingNotes && (
            <div className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setEditingNotes({ ...editingNotes, rating })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          rating <= (editingNotes.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Watch Reason</Label>
                <Input
                  value={editingNotes.watch_reason || ''}
                  onChange={(e) =>
                    setEditingNotes({ ...editingNotes, watch_reason: e.target.value })
                  }
                  placeholder="Why are you tracking this company?"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editingNotes.notes || ''}
                  onChange={(e) => setEditingNotes({ ...editingNotes, notes: e.target.value })}
                  placeholder="Add your notes about this company..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        const currentTags = editingNotes.tags || [];
                        setEditingNotes({
                          ...editingNotes,
                          tags: [...currentTags, newTag.trim()],
                        });
                        setNewTag('');
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      if (newTag.trim()) {
                        const currentTags = editingNotes.tags || [];
                        setEditingNotes({
                          ...editingNotes,
                          tags: [...currentTags, newTag.trim()],
                        });
                        setNewTag('');
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editingNotes.tags || []).map((tag, i) => (
                    <Badge key={i} className="gap-1">
                      {tag}
                      <button
                        onClick={() => {
                          const newTags = editingNotes.tags.filter((_, idx) => idx !== i);
                          setEditingNotes({ ...editingNotes, tags: newTags });
                        }}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeCompanyConfirm}
        onClose={() => setRemoveCompanyConfirm(null)}
        onConfirm={() => {
          removeCompanyMutation.mutate(removeCompanyConfirm.id);
          setRemoveCompanyConfirm(null);
        }}
        title={
          removeCompanyConfirm
            ? `Remove ${removeCompanyConfirm.name} from portfolio?`
            : 'Remove from portfolio?'
        }
        description="This action cannot be undone."
        confirmLabel="Remove"
      />
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Briefcase, Plus, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PortfolioManager({ user, onSelectPortfolio }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [newPortfolio, setNewPortfolio] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });
  const queryClient = useQueryClient();

  const { data: portfolios = [] } = useQuery({
    queryKey: ['aerospace-portfolios', user?.email],
    queryFn: () => base44.entities.AerospacePortfolio.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['aerospace-companies-all'],
    queryFn: () => base44.entities.AerospaceCompany.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AerospacePortfolio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-portfolios'] });
      setShowCreateDialog(false);
      setNewPortfolio({ name: '', description: '', color: '#3b82f6' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AerospacePortfolio.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-portfolios'] });
      setShowEditDialog(false);
      setEditingPortfolio(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AerospacePortfolio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aerospace-portfolios'] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      ...newPortfolio,
      user_email: user.email,
      company_ids: [],
    });
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      id: editingPortfolio.id,
      data: {
        name: editingPortfolio.name,
        description: editingPortfolio.description,
        color: editingPortfolio.color,
      },
    });
  };

  const getPortfolioStats = (portfolio) => {
    const companies = allCompanies.filter((c) => portfolio.company_ids?.includes(c.id));
    const totalEmployees = companies.reduce((sum, c) => sum + (c.employee_count || 0), 0);
    const avgGrowth =
      companies.length > 0
        ? companies.reduce((sum, c) => {
            const growth = parseFloat(
              (c.financial_highlights?.revenue_growth || '0').replace(/[^0-9.-]/g, '')
            );
            return sum + (isNaN(growth) ? 0 : growth);
          }, 0) / companies.length
        : 0;

    return {
      count: companies.length,
      totalEmployees,
      avgGrowth: avgGrowth.toFixed(1),
    };
  };

  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#6366f1',
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            My Portfolios
          </h3>
          <p className="text-sm text-gray-500">Organize and track companies</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Portfolio
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((portfolio) => {
          const stats = getPortfolioStats(portfolio);
          return (
            <Card
              key={portfolio.id}
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
              style={{ borderLeftColor: portfolio.color }}
              onClick={() => onSelectPortfolio(portfolio)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{portfolio.name}</CardTitle>
                    {portfolio.description && (
                      <p className="text-xs text-gray-500 mt-1">{portfolio.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPortfolio(portfolio);
                        setShowEditDialog(true);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    {!portfolio.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(portfolio.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="text-xs text-gray-500">Companies</div>
                    <div className="text-lg font-bold">{stats.count}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="text-xs text-gray-500">Employees</div>
                    <div className="text-sm font-bold">{stats.totalEmployees.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="text-xs text-gray-500">Avg Growth</div>
                    <div className="text-sm font-bold flex items-center gap-1">
                      {stats.avgGrowth > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      {stats.avgGrowth}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Portfolio Name</Label>
              <Input
                value={newPortfolio.name}
                onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
                placeholder="e.g., Defense Contractors, Satellite Companies"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={newPortfolio.description}
                onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                placeholder="What is this portfolio tracking?"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewPortfolio({ ...newPortfolio, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newPortfolio.color === color
                        ? 'border-gray-900 dark:border-white'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newPortfolio.name}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
          </DialogHeader>
          {editingPortfolio && (
            <div className="space-y-4">
              <div>
                <Label>Portfolio Name</Label>
                <Input
                  value={editingPortfolio.name}
                  onChange={(e) =>
                    setEditingPortfolio({ ...editingPortfolio, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingPortfolio.description || ''}
                  onChange={(e) =>
                    setEditingPortfolio({ ...editingPortfolio, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditingPortfolio({ ...editingPortfolio, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        editingPortfolio.color === color
                          ? 'border-gray-900 dark:border-white'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          deleteMutation.mutate(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        title="Delete this portfolio?"
        description="This action cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}

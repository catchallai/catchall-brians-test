import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Calendar,
  Star,
  DollarSign,
  Mail,
  Phone,
  ExternalLink,
  Trash2,
  Heart,
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import TimesheetApproval from './TimesheetApproval';
import ContractorInvoicing from './ContractorInvoicing';
import ContractorRatingSystem from './ContractorRatingSystem';

export default function ContractorManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    rate: '',
    rate_type: 'hourly',
    skills: '',
    portfolio_url: '',
    notes: '',
  });
  const [scheduleData, setScheduleData] = useState({
    project_name: '',
    start_date: '',
    end_date: '',
    location: '',
    deliverables: '',
    estimated_hours: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list('-created_date', 50),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['contractor-schedules'],
    queryFn: () => base44.entities.ContractorSchedule.list('-start_date', 50),
  });

  const addMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.Contractor.create({
        ...data,
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()) : [],
        is_active: true,
        availability: 'available',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => base44.entities.ContractorSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-schedules'] });
      setShowScheduleModal(false);
      setScheduleData({
        project_name: '',
        start_date: '',
        end_date: '',
        location: '',
        deliverables: '',
        estimated_hours: '',
        notes: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contractor.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contractors'] }),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      rate: '',
      rate_type: 'hourly',
      skills: '',
      portfolio_url: '',
      notes: '',
    });
  };

  const handleScheduleContractor = (contractor) => {
    setSelectedContractor(contractor);
    setShowScheduleModal(true);
  };

  const handleSubmitSchedule = () => {
    if (
      !selectedContractor ||
      !scheduleData.project_name ||
      !scheduleData.start_date ||
      !scheduleData.end_date
    ) {
      return;
    }

    scheduleMutation.mutate({
      contractor_id: selectedContractor.id,
      contractor_name: selectedContractor.name,
      ...scheduleData,
      rate: selectedContractor.rate,
      status: 'scheduled',
    });
  };

  const upcomingSchedules = schedules
    .filter((s) => new Date(s.start_date) >= new Date() && s.status !== 'cancelled')
    .slice(0, 5);

  return (
    <Tabs defaultValue="contractors" className="space-y-6">
      <TabsList>
        <TabsTrigger value="contractors">Contractors</TabsTrigger>
        <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="ratings">Ratings</TabsTrigger>
      </TabsList>

      <TabsContent value="contractors" className="space-y-6">
        {/* Contractors List */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contractors</CardTitle>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Contractor
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {contractors.map((contractor) => (
                <div
                  key={contractor.id}
                  className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {contractor.name}
                          </h4>
                          {contractor.is_preferred && (
                            <Heart className="w-4 h-4 fill-violet-500 text-violet-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {contractor.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {contractor.rating && (
                        <Badge variant="outline" className="gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {contractor.rating.toFixed(1)}
                        </Badge>
                      )}
                      <Badge
                        className={
                          contractor.availability === 'available'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {contractor.availability}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {contractor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {contractor.email}
                      </div>
                    )}
                    {contractor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {contractor.phone}
                      </div>
                    )}
                    {contractor.rate && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3" />${contractor.rate}/{contractor.rate_type}
                      </div>
                    )}
                    {contractor.completed_projects > 0 && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {contractor.completed_projects} projects completed
                      </div>
                    )}
                  </div>

                  {contractor.skills && contractor.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {contractor.skills.map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleScheduleContractor(contractor)}
                      className="flex-1 gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      Schedule
                    </Button>
                    {contractor.portfolio_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={contractor.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirmId(contractor.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {contractors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No contractors added yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Schedule */}
        <Card className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <div key={schedule.id} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {schedule.contractor_name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {schedule.project_name}
                      </p>
                    </div>
                    <Badge>{schedule.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>
                      {format(new Date(schedule.start_date), 'MMM d, yyyy')} -{' '}
                      {format(new Date(schedule.end_date), 'MMM d, yyyy')}
                    </div>
                    {schedule.location && <div>📍 {schedule.location}</div>}
                    {schedule.estimated_hours && <div>⏱️ {schedule.estimated_hours} hours</div>}
                  </div>
                </div>
              ))}
            </div>

            {upcomingSchedules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No upcoming schedules</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Contractor Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Contractor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <Input
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Photographer, Videographer, Editor"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rate</label>
                  <Input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rate Type</label>
                  <select
                    value={formData.rate_type}
                    onChange={(e) => setFormData({ ...formData, rate_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="project">Project</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Skills (comma separated)</label>
                <Input
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="Photography, Video Editing, Drone"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Portfolio URL</label>
                <Input
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addMutation.mutate(formData)}
                  disabled={!formData.name || !formData.email || !formData.role}
                >
                  Add Contractor
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Modal */}
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule {selectedContractor?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name *</label>
                <Input
                  value={scheduleData.project_name}
                  onChange={(e) =>
                    setScheduleData({ ...scheduleData, project_name: e.target.value })
                  }
                  placeholder="Project or shoot name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date *</label>
                  <Input
                    type="datetime-local"
                    value={scheduleData.start_date}
                    onChange={(e) =>
                      setScheduleData({ ...scheduleData, start_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date *</label>
                  <Input
                    type="datetime-local"
                    value={scheduleData.end_date}
                    onChange={(e) => setScheduleData({ ...scheduleData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={scheduleData.location}
                  onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                  placeholder="Shoot location"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Estimated Hours</label>
                <Input
                  type="number"
                  value={scheduleData.estimated_hours}
                  onChange={(e) =>
                    setScheduleData({ ...scheduleData, estimated_hours: e.target.value })
                  }
                  placeholder="8"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Deliverables</label>
                <Input
                  value={scheduleData.deliverables}
                  onChange={(e) =>
                    setScheduleData({ ...scheduleData, deliverables: e.target.value })
                  }
                  placeholder="20 edited photos, 2 min video"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitSchedule}
                  disabled={
                    !scheduleData.project_name || !scheduleData.start_date || !scheduleData.end_date
                  }
                >
                  Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
          title="Delete this contractor?"
          description="This action cannot be undone."
          confirmLabel="Delete"
          isLoading={deleteMutation.isPending}
        />
      </TabsContent>

      <TabsContent value="timesheets">
        <TimesheetApproval />
      </TabsContent>

      <TabsContent value="invoices">
        <ContractorInvoicing />
      </TabsContent>

      <TabsContent value="ratings">
        <ContractorRatingSystem />
      </TabsContent>
    </Tabs>
  );
}

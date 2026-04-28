import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Target } from 'lucide-react';

export default function QuickAddCalendarModal({ open, onClose }) {
  const [activeTab, setActiveTab] = useState('task');
  const queryClient = useQueryClient();

  // Task form state
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
    status: 'not_started',
  });

  // Milestone form state
  const [milestoneData, setMilestoneData] = useState({
    name: '',
    description: '',
    project_id: '',
    due_date: '',
    status: 'not_started',
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      resetForms();
      onClose();
    },
  });

  // Create milestone mutation
  const createMilestoneMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectMilestone.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-milestones'] });
      resetForms();
      onClose();
    },
  });

  const resetForms = () => {
    setTaskData({
      title: '',
      description: '',
      project_id: '',
      assigned_to: '',
      due_date: '',
      priority: 'medium',
      status: 'not_started',
    });
    setMilestoneData({
      name: '',
      description: '',
      project_id: '',
      due_date: '',
      status: 'not_started',
    });
  };

  const handleCreateTask = () => {
    if (!taskData.title || !taskData.project_id || !taskData.due_date) {
      return;
    }
    createTaskMutation.mutate(taskData);
  };

  const handleCreateMilestone = () => {
    if (!milestoneData.name || !milestoneData.project_id || !milestoneData.due_date) {
      return;
    }
    createMilestoneMutation.mutate(milestoneData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add to Project Calendar</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              Task
            </TabsTrigger>
            <TabsTrigger value="milestone" className="gap-2">
              <Target className="w-4 h-4" />
              Milestone
            </TabsTrigger>
          </TabsList>

          {/* Task Form */}
          <TabsContent value="task" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                placeholder="Enter task title"
                value={taskData.title}
                onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={taskData.project_id}
                onValueChange={(val) => setTaskData({ ...taskData, project_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={taskData.due_date}
                  onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={taskData.priority}
                  onValueChange={(val) => setTaskData({ ...taskData, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign To</Label>
              <Input
                type="email"
                placeholder="team@example.com"
                value={taskData.assigned_to}
                onChange={(e) => setTaskData({ ...taskData, assigned_to: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Task description..."
                value={taskData.description}
                onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={
                  !taskData.title ||
                  !taskData.project_id ||
                  !taskData.due_date ||
                  createTaskMutation.isPending
                }
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Milestone Form */}
          <TabsContent value="milestone" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Milestone Name *</Label>
              <Input
                placeholder="Enter milestone name"
                value={milestoneData.name}
                onChange={(e) => setMilestoneData({ ...milestoneData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={milestoneData.project_id}
                onValueChange={(val) => setMilestoneData({ ...milestoneData, project_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={milestoneData.due_date}
                onChange={(e) => setMilestoneData({ ...milestoneData, due_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Milestone description..."
                value={milestoneData.description}
                onChange={(e) =>
                  setMilestoneData({ ...milestoneData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateMilestone}
                disabled={
                  !milestoneData.name ||
                  !milestoneData.project_id ||
                  !milestoneData.due_date ||
                  createMilestoneMutation.isPending
                }
              >
                {createMilestoneMutation.isPending ? 'Creating...' : 'Create Milestone'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

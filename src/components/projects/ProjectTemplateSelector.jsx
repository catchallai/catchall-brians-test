import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Rocket, Palette, Settings, Briefcase } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ICONS = {
  software: Rocket,
  marketing: Palette,
  design: Palette,
  operations: Settings,
  general: Briefcase,
};

export default function ProjectTemplateSelector({ onSelect, onClose }) {
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['project-templates'],
    queryFn: () => base44.entities.ProjectTemplate.list(),
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const project = await base44.entities.Project.create({
        ...template.project_config,
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        status: 'planning',
      });

      if (template.task_templates?.length) {
        const taskPromises = template.task_templates.map((taskTemplate) =>
          base44.entities.Task.create({
            ...taskTemplate,
            project_id: project.id,
          })
        );
        await Promise.all(taskPromises);
      }

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSelect(project);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Start from Template</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Skip
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const Icon = ICONS[template.category] || Briefcase;
          return (
            <Card
              key={template.id}
              className="glass-card cursor-pointer hover:shadow-lg transition-all"
              onClick={() => createFromTemplateMutation.mutate(template)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {template.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {template.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{template.category}</Badge>
                  {template.task_templates?.length > 0 && (
                    <Badge variant="outline">{template.task_templates.length} tasks</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No templates available yet</p>
        </Card>
      )}
    </div>
  );
}

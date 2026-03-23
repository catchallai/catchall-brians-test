import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Plus, ListChecks } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ChecklistManager({ taskId, checklists = [] }) {
  const [newItem, setNewItem] = useState('');
  const queryClient = useQueryClient();

  const addItemMutation = useMutation({
    mutationFn: async () => {
      if (!checklists.length) {
        // Create first checklist
        return base44.entities.Checklist.create({
          task_id: taskId,
          title: 'Task Checklist',
          items: [{ text: newItem, completed: false, order: 0 }],
          progress: 0,
        });
      } else {
        // Update existing
        const checklist = checklists[0];
        const items = [
          ...(checklist.items || []),
          { text: newItem, completed: false, order: checklist.items.length },
        ];
        return base44.entities.Checklist.update(checklist.id, { items });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      setNewItem('');
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ checklistId, itemIndex }) => {
      const checklist = checklists.find((c) => c.id === checklistId);
      const items = [...checklist.items];
      items[itemIndex].completed = !items[itemIndex].completed;
      const progress = Math.round((items.filter((i) => i.completed).length / items.length) * 100);
      return base44.entities.Checklist.update(checklistId, { items, progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });

  const checklist = checklists[0];
  const completedItems = checklist?.items?.filter((i) => i.completed).length || 0;
  const totalItems = checklist?.items?.length || 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Checklist
          </div>
          {totalItems > 0 && (
            <span className="text-sm font-normal text-gray-500">
              {completedItems}/{totalItems}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalItems > 0 && <Progress value={(completedItems / totalItems) * 100} />}

        <div className="space-y-2">
          {checklist?.items?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Checkbox
                checked={item.completed}
                onCheckedChange={() =>
                  toggleItemMutation.mutate({ checklistId: checklist.id, itemIndex: idx })
                }
              />
              <span className={`flex-1 ${item.completed ? 'line-through text-gray-400' : ''}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Add checklist item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItemMutation.mutate()}
          />
          <Button
            size="icon"
            onClick={() => addItemMutation.mutate()}
            disabled={!newItem || addItemMutation.isPending}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

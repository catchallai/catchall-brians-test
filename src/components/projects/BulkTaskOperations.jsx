import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Trash2, UserPlus, Calendar } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function BulkTaskOperations({ tasks = [], selectedTasks = [], onSelectionChange }) {
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [bulkSprint, setBulkSprint] = useState('');
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates) => {
      const promises = selectedTasks.map(taskId => 
        base44.entities.Task.update(taskId, updates)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSelectionChange([]);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const promises = selectedTasks.map(taskId => 
        base44.entities.Task.delete(taskId)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSelectionChange([]);
    }
  });

  if (selectedTasks.length === 0) return null;

  return (
    <Card className="glass-card border-violet-200 dark:border-violet-800">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-violet-600" />
            <span className="font-medium">{selectedTasks.length} selected</span>
          </div>

          <Select value={bulkStatus} onValueChange={(value) => {
            setBulkStatus(value);
            bulkUpdateMutation.mutate({ status: value });
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Set status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const assignee = prompt('Enter assignee email:');
              if (assignee) bulkUpdateMutation.mutate({ assigned_to: assignee });
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Assign
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-red-600"
            onClick={() => {
              if (confirm(`Delete ${selectedTasks.length} tasks?`)) {
                bulkDeleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
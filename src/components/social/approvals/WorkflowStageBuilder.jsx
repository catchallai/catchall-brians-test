import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Settings, CheckCircle2, ArrowRight, Save } from 'lucide-react';

const DEFAULT_WORKFLOWS = [
  {
    id: 'simple',
    name: 'Simple Approval',
    stages: [
      { id: '1', name: 'Draft', role: 'editor', action: 'submit' },
      { id: '2', name: 'Review', role: 'reviewer', action: 'approve_or_reject' },
      { id: '3', name: 'Approved', role: null, action: null },
    ],
  },
  {
    id: 'full',
    name: 'Full Review Cycle',
    stages: [
      { id: '1', name: 'Draft', role: 'editor', action: 'submit' },
      { id: '2', name: 'Copy Review', role: 'editor', action: 'approve_or_reject' },
      { id: '3', name: 'Brand Approval', role: 'approver', action: 'approve_or_reject' },
      { id: '4', name: 'Final Sign-Off', role: 'admin', action: 'approve_or_reject' },
      { id: '5', name: 'Approved', role: null, action: null },
    ],
  },
];

const ROLES = ['editor', 'reviewer', 'approver', 'admin'];
const ACTIONS = [
  { value: 'submit', label: 'Submit to next stage' },
  { value: 'approve_or_reject', label: 'Approve or Reject' },
  { value: 'approve_only', label: 'Approve only' },
];

function StageRow({ stage, idx, onUpdate, onRemove, canRemove }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-1 text-gray-300 shrink-0">
        <GripVertical className="w-4 h-4" />
        <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}</span>
      </div>
      <Input
        value={stage.name}
        onChange={(e) => onUpdate({ ...stage, name: e.target.value })}
        className="h-8 text-sm flex-1"
        placeholder="Stage name"
      />
      <Select
        value={stage.role || 'none'}
        onValueChange={(v) => onUpdate({ ...stage, role: v === 'none' ? null : v })}
      >
        <SelectTrigger className="h-8 w-28 text-xs">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No role</SelectItem>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={stage.action || 'none'}
        onValueChange={(v) => onUpdate({ ...stage, action: v === 'none' ? null : v })}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No action</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a.value} value={a.value}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canRemove && (
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function WorkflowStageBuilder({ onSave }) {
  const [workflows, setWorkflows] = useState(DEFAULT_WORKFLOWS);
  const [activeWorkflow, setActiveWorkflow] = useState(DEFAULT_WORKFLOWS[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  const startEdit = (wf) => {
    setEditingWorkflow(JSON.parse(JSON.stringify(wf)));
    setIsEditing(true);
  };

  const createNew = () => {
    const wf = {
      id: Date.now().toString(),
      name: 'Custom Workflow',
      stages: [
        { id: '1', name: 'Draft', role: 'editor', action: 'submit' },
        { id: '2', name: 'Review', role: 'reviewer', action: 'approve_or_reject' },
        { id: '3', name: 'Approved', role: null, action: null },
      ],
    };
    setEditingWorkflow(wf);
    setIsEditing(true);
  };

  const addStage = () => {
    const newStage = {
      id: Date.now().toString(),
      name: 'New Stage',
      role: 'reviewer',
      action: 'approve_or_reject',
    };
    setEditingWorkflow((prev) => ({ ...prev, stages: [...prev.stages, newStage] }));
  };

  const updateStage = (idx, updated) => {
    setEditingWorkflow((prev) => {
      const stages = [...prev.stages];
      stages[idx] = updated;
      return { ...prev, stages };
    });
  };

  const removeStage = (idx) => {
    setEditingWorkflow((prev) => ({ ...prev, stages: prev.stages.filter((_, i) => i !== idx) }));
  };

  const saveWorkflow = () => {
    setWorkflows((prev) => {
      const exists = prev.find((w) => w.id === editingWorkflow.id);
      return exists
        ? prev.map((w) => (w.id === editingWorkflow.id ? editingWorkflow : w))
        : [...prev, editingWorkflow];
    });
    setActiveWorkflow(editingWorkflow);
    setIsEditing(false);
  };

  if (isEditing && editingWorkflow) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Input
            value={editingWorkflow.name}
            onChange={(e) => setEditingWorkflow((prev) => ({ ...prev, name: e.target.value }))}
            className="text-base font-semibold h-9 w-48"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveWorkflow}
              className="gap-1 bg-violet-600 hover:bg-violet-700"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {editingWorkflow.stages.map((stage, idx) => (
            <StageRow
              key={stage.id}
              stage={stage}
              idx={idx}
              onUpdate={(updated) => updateStage(idx, updated)}
              onRemove={() => removeStage(idx)}
              canRemove={editingWorkflow.stages.length > 2}
            />
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={addStage}
          className="gap-1.5 w-full border-dashed"
        >
          <Plus className="w-4 h-4" /> Add Stage
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Drag to reorder stages (coming soon). Each stage defines who acts and what action is
          required.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-violet-500" />
          Approval Workflows
        </h3>
        <Button size="sm" onClick={createNew} className="gap-1 bg-violet-600 hover:bg-violet-700">
          <Plus className="w-3.5 h-3.5" /> New
        </Button>
      </div>

      <div className="space-y-3">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className={`rounded-xl border p-4 cursor-pointer transition-all ${
              activeWorkflow.id === wf.id
                ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 hover:border-gray-300'
            }`}
            onClick={() => setActiveWorkflow(wf)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-gray-900 dark:text-white">{wf.name}</span>
              <div className="flex gap-2">
                {activeWorkflow.id === wf.id && (
                  <Badge className="bg-violet-100 text-violet-700 text-xs">Active</Badge>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(wf);
                  }}
                  className="text-xs text-gray-400 hover:text-violet-600 font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {wf.stages.map((stage, i) => (
                <React.Fragment key={stage.id}>
                  <span className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-lg text-gray-600 dark:text-gray-400">
                    {stage.name}
                  </span>
                  {i < wf.stages.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      {onSave && (
        <Button
          onClick={() => onSave(activeWorkflow)}
          className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Apply "{activeWorkflow.name}" to New Posts
        </Button>
      )}
    </div>
  );
}

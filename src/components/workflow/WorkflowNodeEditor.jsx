import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function WorkflowNodeEditor({ node, onSave, onClose }) {
  const [nodeType, setNodeType] = useState(node.node_type);
  const [config, setConfig] = useState(node.config || {});
  const conditions = node.conditions || [];

  const renderConfigFields = () => {
    switch (nodeType) {
      case 'send_email':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <input
                type="text"
                value={config.subject || ''}
                onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                placeholder="Email subject"
                className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => setConfig({ ...config, body: e.target.value })}
                placeholder="Use {{first_name}}, {{company}} for variables"
                className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-24"
              />
              <p className="text-xs text-gray-500 mt-1">
                Variables: {'{{' + 'first_name' + '}}'}, {'{{' + 'company' + '}}'}
              </p>
            </div>
          </div>
        );

      case 'create_task':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Task Title</label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Task title"
                className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Task description"
                className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={config.priority || 'medium'}
                  onChange={(e) => setConfig({ ...config, priority: e.target.value })}
                  className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Assign to CSM</label>
                <input
                  type="email"
                  value={config.csm_email || ''}
                  onChange={(e) => setConfig({ ...config, csm_email: e.target.value })}
                  placeholder="csm@company.com"
                  className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
            </div>
          </div>
        );

      case 'create_alert':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Alert Type</label>
              <select
                value={config.alert_type || 'churn_risk'}
                onChange={(e) => setConfig({ ...config, alert_type: e.target.value })}
                className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="health_decline">Health Decline</option>
                <option value="churn_risk">Churn Risk</option>
                <option value="expansion_ready">Expansion Ready</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Alert Message</label>
              <textarea
                value={config.message || ''}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                placeholder="Alert message"
                className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm h-20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Severity</label>
              <select
                value={config.severity || 'warning'}
                onChange={(e) => setConfig({ ...config, severity: e.target.value })}
                className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        );

      case 'wait':
        return (
          <div>
            <label className="text-sm font-medium">Wait Duration (minutes)</label>
            <input
              type="number"
              value={config.delay_minutes || 60}
              onChange={(e) => setConfig({ ...config, delay_minutes: parseInt(e.target.value) })}
              className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const handleSave = () => {
    onSave({
      ...node,
      node_type: nodeType,
      config,
      conditions,
    });
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Edit Action</CardTitle>
        <button onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Action Type</label>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value)}
            className="w-full mt-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="send_email">📧 Send Email</option>
            <option value="create_task">✓ Create Task</option>
            <option value="create_alert">⚠️ Create Alert</option>
            <option value="wait">⏱️ Wait</option>
          </select>
        </div>

        {renderConfigFields()}

        <div className="pt-4 flex gap-2 justify-end">
          <Button onClick={onClose} variant="outline" size="sm">
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm">
            Save Action
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

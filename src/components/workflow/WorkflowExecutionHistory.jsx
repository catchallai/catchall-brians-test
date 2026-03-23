import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, ChevronDown } from 'lucide-react';

export default function WorkflowExecutionHistory({ workflowId = null }) {
  const [expandedId, setExpandedId] = useState(null);

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ['workflow-executions', workflowId],
    queryFn: async () => {
      const query = workflowId ? { workflow_id: workflowId } : {};
      return await base44.entities.WorkflowExecutionLog.filter(query, '-started_at', 100);
    },
  });

  const statusColor = {
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    running: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-800',
  };

  const statusIcon = {
    completed: <CheckCircle className="w-4 h-4 text-green-600" />,
    failed: <AlertCircle className="w-4 h-4 text-red-600" />,
    running: <Clock className="w-4 h-4 text-blue-600 animate-spin" />,
    pending: <Clock className="w-4 h-4 text-gray-600" />,
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Loading executions...</div>;
  }

  const completed = executions.filter((e) => e.status === 'completed');
  const failed = executions.filter((e) => e.status === 'failed');
  const successRate =
    completed.length + failed.length > 0
      ? Math.round((completed.length / (completed.length + failed.length)) * 100)
      : 0;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Execution History</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="text-sm">
            <p className="text-gray-600 dark:text-gray-400">Total Executions</p>
            <p className="text-2xl font-bold">{executions.length}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">{successRate}%</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-600 dark:text-gray-400">Failed</p>
            <p className="text-2xl font-bold text-red-600">{failed.length}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No executions yet</p>
        ) : (
          <div className="space-y-2">
            {executions.map((exec) => (
              <div
                key={exec.id}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {statusIcon[exec.status]}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {exec.contact_name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {exec.workflow_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor[exec.status]}>{exec.status}</Badge>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedId === exec.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {expandedId === exec.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Started</p>
                        <p className="font-mono text-gray-900 dark:text-white">
                          {new Date(exec.started_at).toLocaleString()}
                        </p>
                      </div>
                      {exec.completed_at && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Completed</p>
                          <p className="font-mono text-gray-900 dark:text-white">
                            {new Date(exec.completed_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {exec.error_message && (
                      <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="font-semibold text-red-800 dark:text-red-200">Error</p>
                        <p className="text-red-700 dark:text-red-300">{exec.error_message}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Actions Executed
                      </p>
                      <div className="space-y-1">
                        {exec.executed_nodes?.map((node, idx) => (
                          <div key={idx} className="p-2 rounded bg-gray-100 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{node.node_type}</span>
                              <Badge
                                className={
                                  node.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {node.status}
                              </Badge>
                            </div>
                            {node.error && (
                              <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                                {node.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

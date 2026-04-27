import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  Loader2,
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

export default function AIAssistant({ project, tasks, comments, user: _user }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: (content) =>
      base44.entities.ProjectComment.create({
        project_id: project.id,
        content,
        is_ai_generated: true,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-comments'] }),
  });

  const analyzeProject = async () => {
    setIsAnalyzing(true);

    const taskSummary = tasks
      .map(
        (t) =>
          `- ${t.title} (${t.status}, assigned to: ${t.assignee || 'unassigned'}, priority: ${t.priority})`
      )
      .join('\n');

    const recentComments = comments
      .slice(0, 10)
      .map((c) => `- ${c.author_name || c.author}: ${c.content}`)
      .join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this SEO project and provide actionable insights:

Project: ${project.name}
Description: ${project.description || 'No description'}
Status: ${project.status}
Goals: ${project.goals?.join(', ') || 'Not specified'}

Current Tasks:
${taskSummary || 'No tasks'}

Recent Discussion:
${recentComments || 'No comments'}

Provide:
1. PROJECT HEALTH ASSESSMENT:
   - Overall progress score (0-100)
   - Bottlenecks or blockers
   - Team workload balance

2. TASK RECOMMENDATIONS:
   - Which tasks should be prioritized
   - Suggested task assignments based on workload
   - Tasks that might be at risk

3. ACTION ITEMS:
   - Immediate actions needed
   - Who should do what

4. DISCUSSION SUMMARY:
   - Key points from recent comments
   - Unresolved questions or decisions needed

5. NEXT STEPS:
   - Recommended next milestones
   - Timeline suggestions`,
      response_json_schema: {
        type: 'object',
        properties: {
          health: {
            type: 'object',
            properties: {
              score: { type: 'number' },
              bottlenecks: { type: 'array', items: { type: 'string' } },
              workload_assessment: { type: 'string' },
            },
          },
          task_recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                task: { type: 'string' },
                recommendation: { type: 'string' },
                suggested_assignee: { type: 'string' },
                priority_change: { type: 'string' },
              },
            },
          },
          action_items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                action: { type: 'string' },
                owner: { type: 'string' },
                urgency: { type: 'string' },
              },
            },
          },
          discussion_summary: {
            type: 'object',
            properties: {
              key_points: { type: 'array', items: { type: 'string' } },
              unresolved: { type: 'array', items: { type: 'string' } },
            },
          },
          next_steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                milestone: { type: 'string' },
                timeline: { type: 'string' },
              },
            },
          },
        },
      },
    });

    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const postSummaryToComments = () => {
    if (!analysis) {
      return;
    }

    let summary = `📊 **AI Project Analysis**\n\n`;
    summary += `**Health Score:** ${analysis.health?.score}/100\n\n`;

    if (analysis.action_items?.length) {
      summary += `**Priority Actions:**\n`;
      analysis.action_items.slice(0, 3).forEach((item) => {
        summary += `• ${item.action} (${item.owner})\n`;
      });
    }

    if (analysis.next_steps?.length) {
      summary += `\n**Next Milestones:**\n`;
      analysis.next_steps.slice(0, 2).forEach((step) => {
        summary += `• ${step.milestone} - ${step.timeline}\n`;
      });
    }

    createCommentMutation.mutate(summary);
  };

  const urgencyColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-blue-100 text-blue-700',
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            AI Project Assistant
          </CardTitle>
          <Button
            onClick={analyzeProject}
            disabled={isAnalyzing}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Analyze Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAnalyzing && (
          <div className="p-4 bg-violet-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              <div>
                <p className="font-medium text-violet-900">Analyzing project...</p>
                <p className="text-sm text-violet-600">Reviewing tasks, comments, and progress</p>
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <ScrollArea className="h-[500px]">
            <div className="space-y-6">
              {/* Health Score */}
              <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Project Health</p>
                    <p className="text-4xl font-bold text-violet-600">
                      {analysis.health?.score}/100
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center">
                    {analysis.health?.score >= 70 ? (
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                    ) : analysis.health?.score >= 40 ? (
                      <AlertTriangle className="w-8 h-8 text-amber-500" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">{analysis.health?.workload_assessment}</p>
                {analysis.health?.bottlenecks?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Bottlenecks:</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.health.bottlenecks.map((b, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Items */}
              {analysis.action_items?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Priority Actions
                  </h4>
                  <div className="space-y-2">
                    {analysis.action_items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-100 rounded-lg">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-gray-900">{item.action}</p>
                          <Badge
                            className={
                              urgencyColors[item.urgency?.toLowerCase()] || urgencyColors.medium
                            }
                          >
                            {item.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          <Users className="w-3 h-3 inline mr-1" />
                          {item.owner}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Task Recommendations */}
              {analysis.task_recommendations?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Task Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysis.task_recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                        <p className="font-medium text-gray-900">{rec.task}</p>
                        <p className="text-sm text-gray-600 mt-1">{rec.recommendation}</p>
                        {rec.suggested_assignee && (
                          <p className="text-xs text-blue-600 mt-1">
                            Suggest: {rec.suggested_assignee}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussion Summary */}
              {analysis.discussion_summary && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-500" />
                    Discussion Summary
                  </h4>
                  {analysis.discussion_summary.key_points?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Key Points:</p>
                      <ul className="space-y-1">
                        {analysis.discussion_summary.key_points.map((point, i) => (
                          <li key={i} className="text-sm text-gray-700">
                            • {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.discussion_summary.unresolved?.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-xs font-medium text-amber-700 mb-1">Needs Resolution:</p>
                      <ul className="space-y-1">
                        {analysis.discussion_summary.unresolved.map((item, i) => (
                          <li key={i} className="text-sm text-amber-800">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Next Steps */}
              {analysis.next_steps?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Next Milestones</h4>
                  <div className="space-y-2">
                    {analysis.next_steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium text-gray-900">{step.milestone}</span>
                        <Badge variant="outline">{step.timeline}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post to Comments */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={postSummaryToComments}
                disabled={createCommentMutation.isPending}
              >
                {createCommentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Share Summary with Team
              </Button>
            </div>
          </ScrollArea>
        )}

        {!analysis && !isAnalyzing && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Click "Analyze Project" to get AI-powered insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

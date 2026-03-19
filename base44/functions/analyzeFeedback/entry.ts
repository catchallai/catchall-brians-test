import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { feedback_id } = await req.json();

    const feedback = await base44.asServiceRole.entities.CustomerFeedback.filter({
      id: feedback_id,
    });
    if (!feedback.length) {
      return Response.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const fb = feedback[0];

    // Analyze sentiment
    const sentiment = analyzeSentiment(fb.message, fb.nps_score);

    // Update feedback with sentiment
    await base44.asServiceRole.entities.CustomerFeedback.update(feedback_id, {
      sentiment,
    });

    // Check if should trigger workflow
    let workflowTriggered = false;
    let triggeredWorkflowId = null;

    if (sentiment === 'negative' || (fb.nps_score && fb.nps_score < 7)) {
      // Find matching workflows
      const workflows = await base44.asServiceRole.entities.ProactiveEngagementWorkflow.filter({
        is_active: true,
      });

      for (const workflow of workflows) {
        if (shouldTriggerForFeedback(workflow, fb, sentiment)) {
          // Execute workflow
          const response = await base44.asServiceRole.functions.invoke('executeWorkflow', {
            workflow_id: workflow.id,
            contact_id: fb.contact_id,
          });

          if (response.data?.success) {
            workflowTriggered = true;
            triggeredWorkflowId = workflow.id;
            break;
          }
        }
      }
    }

    // Update feedback with workflow trigger info
    if (workflowTriggered) {
      await base44.asServiceRole.entities.CustomerFeedback.update(feedback_id, {
        workflow_triggered: true,
        workflow_id: triggeredWorkflowId,
      });
    }

    return Response.json({
      feedback_id,
      sentiment,
      workflow_triggered: workflowTriggered,
      workflow_id: triggeredWorkflowId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function analyzeSentiment(message, npsScore) {
  // Keywords for sentiment detection
  const positiveKeywords = [
    'great',
    'excellent',
    'love',
    'amazing',
    'perfect',
    'happy',
    'satisfied',
    'wonderful',
  ];
  const negativeKeywords = [
    'terrible',
    'awful',
    'hate',
    'poor',
    'bad',
    'disappointed',
    'frustration',
    'broken',
  ];

  const lowerMessage = message.toLowerCase();

  let score = 0;

  positiveKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) score += 1;
  });

  negativeKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) score -= 1;
  });

  // Factor in NPS score if available
  if (npsScore !== null && npsScore !== undefined) {
    if (npsScore >= 8) score += 2;
    if (npsScore <= 6) score -= 2;
  }

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function shouldTriggerForFeedback(workflow, feedback, sentiment) {
  // Trigger on negative feedback
  if (workflow.trigger_type === 'health_score' && sentiment === 'negative') {
    return true;
  }

  // Trigger on low NPS
  if (feedback.nps_score !== null && feedback.nps_score < 7) {
    if (workflow.trigger_type === 'health_score' || workflow.trigger_type === 'custom_event') {
      return true;
    }
  }

  return false;
}

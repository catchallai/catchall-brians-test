import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Configuration for data retention
const RETENTION_DAYS = {
  Notification: 30,
  ListeningMention: 90,
  ForumMention: 180,
  KeywordHistory: 365,
  APIUsage: 90,
  SocialPost: 90,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, entity, daysToKeep } = await req.json();
    const results = { archived: 0, deleted: 0, errors: [] };

    if (action === 'cleanup') {
      // Cleanup specific entity
      const retentionDays = daysToKeep || RETENTION_DAYS[entity] || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      if (entity === 'Notification') {
        const records = await base44.asServiceRole.entities.Notification.list('created_date', 5000);
        for (const record of records) {
          if (new Date(record.created_date) < cutoffDate && record.is_read) {
            await base44.asServiceRole.entities.Notification.delete(record.id);
            results.deleted++;
          }
        }
      }

      if (entity === 'ListeningMention') {
        const records = await base44.asServiceRole.entities.ListeningMention.list(
          'post_date',
          5000
        );
        for (const record of records) {
          if (new Date(record.post_date) < cutoffDate) {
            await base44.asServiceRole.entities.ListeningMention.delete(record.id);
            results.deleted++;
          }
        }
      }

      if (entity === 'KeywordHistory') {
        const records = await base44.asServiceRole.entities.KeywordHistory.list('date', 10000);
        for (const record of records) {
          if (new Date(record.date) < cutoffDate) {
            await base44.asServiceRole.entities.KeywordHistory.delete(record.id);
            results.deleted++;
          }
        }
      }

      // Create notification about cleanup
      await base44.asServiceRole.entities.Notification.create({
        type: 'system',
        title: 'Data Cleanup Complete',
        message: `Cleaned up ${results.deleted} old ${entity} records older than ${retentionDays} days.`,
        priority: 'low',
      });

      return Response.json({
        success: true,
        entity,
        retentionDays,
        ...results,
      });
    }

    if (action === 'cleanupAll') {
      // Cleanup all entities
      for (const [entityName, days] of Object.entries(RETENTION_DAYS)) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        try {
          let records = [];

          if (entityName === 'Notification') {
            records = await base44.asServiceRole.entities.Notification.list('created_date', 5000);
            for (const record of records) {
              if (new Date(record.created_date) < cutoffDate && record.is_read) {
                await base44.asServiceRole.entities.Notification.delete(record.id);
                results.deleted++;
              }
            }
          }

          if (entityName === 'APIUsage') {
            records = await base44.asServiceRole.entities.APIUsage.list('date', 5000);
            for (const record of records) {
              if (new Date(record.date) < cutoffDate) {
                await base44.asServiceRole.entities.APIUsage.delete(record.id);
                results.deleted++;
              }
            }
          }
        } catch (err) {
          results.errors.push({ entity: entityName, error: err.message });
        }
      }

      await base44.asServiceRole.entities.Notification.create({
        type: 'system',
        title: 'Full Data Cleanup Complete',
        message: `Cleaned up ${results.deleted} old records across all entities.`,
        priority: 'medium',
      });

      return Response.json({ success: true, ...results });
    }

    if (action === 'getStats') {
      // Get data statistics
      const stats = {};

      const notifications = await base44.asServiceRole.entities.Notification.list(
        '-created_date',
        1
      );
      stats.Notification = { count: notifications.length };

      const apiUsage = await base44.asServiceRole.entities.APIUsage.list('-date', 1);
      stats.APIUsage = { count: apiUsage.length };

      return Response.json({ success: true, stats });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

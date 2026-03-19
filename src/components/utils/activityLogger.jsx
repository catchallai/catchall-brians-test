import { base44 } from '@/api/base44Client';

export const logActivity = async (
  action,
  entityType,
  entityId = null,
  entityName = null,
  details = {}
) => {
  try {
    const user = await base44.auth.me();

    await base44.entities.ActivityLog.create({
      user_id: user?.id,
      user_email: user?.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      details,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const ActivityActions = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  IMPORT: 'import',
  EXPORT: 'export',
  LOGIN: 'login',
  LOGOUT: 'logout',
};

import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Default permissions by role
const DEFAULT_PERMISSIONS = {
  admin: {
    dashboard: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    contacts: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    companies: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    deals: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    activities: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    campaigns: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    emailMarketing: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    reports: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    seoDashboard: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    keywords: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    backlinks: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    seoAudit: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    socialMedia: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    socialListening: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    socialCalendar: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    hashtags: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    competitors: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    contentStudio: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    landing_pages: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    automation: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    docutrace: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    legal_documents: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    data_rooms: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
    settings: { can_view: true, can_create: false, can_edit: true, can_delete: false, can_export: false },
    admin: { can_view: true, can_create: true, can_edit: true, can_delete: true, can_export: true },
  },
  editor: {
    dashboard: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: true },
    contacts: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: true },
    companies: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: true },
    deals: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: true },
    activities: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: false },
    campaigns: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: true },
    emailMarketing: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: true },
    reports: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: true },
    seoDashboard: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: true },
    keywords: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: true },
    backlinks: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: true },
    seoAudit: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    socialMedia: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: true },
    socialListening: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: true },
    socialCalendar: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: false },
    hashtags: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: false },
    competitors: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: true },
    contentStudio: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: true },
    landing_pages: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: false },
    automation: { can_view: true, can_create: true, can_edit: true, can_delete: false, can_export: false },
    docutrace: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    legal_documents: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    data_rooms: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    settings: { can_view: true, can_create: false, can_edit: true, can_delete: false, can_export: false },
    admin: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
  },
  viewer: {
    dashboard: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    contacts: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    companies: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    deals: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    activities: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    campaigns: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    emailMarketing: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    reports: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: true },
    seoDashboard: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: true },
    keywords: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    backlinks: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    seoAudit: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    socialMedia: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    socialListening: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    socialCalendar: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    hashtags: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    competitors: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    contentStudio: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    landing_pages: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    automation: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    docutrace: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    legal_documents: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    data_rooms: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    settings: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    admin: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
  },
  user: {
    dashboard: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    contacts: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    companies: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    deals: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    activities: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    campaigns: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    emailMarketing: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    reports: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    seoDashboard: { can_view: true, can_create: false, can_edit: false, can_delete: false, can_export: false },
    keywords: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    backlinks: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    seoAudit: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    socialMedia: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    socialListening: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    socialCalendar: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    hashtags: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    competitors: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    contentStudio: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    landing_pages: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    automation: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    docutrace: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    legal_documents: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    data_rooms: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
    settings: { can_view: true, can_create: false, can_edit: true, can_delete: false, can_export: false },
    admin: { can_view: false, can_create: false, can_edit: false, can_delete: false, can_export: false },
  },
};

export function useRBAC() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['role-permissions', user?.role],
    queryFn: async () => {
      if (!user?.role) return [];
      const perms = await base44.entities.RolePermission.filter({ role: user.role });
      return perms;
    },
    enabled: !!user?.role,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const getPermission = (section, action = 'can_view') => {
    if (!user?.role) return false;
    if (user.role === 'admin') return true; // Admins have full access

    // Check if custom permission exists
    const customPerm = permissions.find(p => p.section === section);
    if (customPerm) return customPerm[action] || false;

    // Fall back to defaults
    const defaultPerms = DEFAULT_PERMISSIONS[user.role]?.[section];
    return defaultPerms?.[action] || false;
  };

  const canAccess = (section) => getPermission(section, 'can_view');
  const canCreate = (section) => getPermission(section, 'can_create');
  const canEdit = (section) => getPermission(section, 'can_edit');
  const canDelete = (section) => getPermission(section, 'can_delete');
  const canExport = (section) => getPermission(section, 'can_export');

  return {
    user,
    canAccess,
    canCreate,
    canEdit,
    canDelete,
    canExport,
    getPermission,
    permissions,
  };
}
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldOff, Clock, Shield } from 'lucide-react';

const ACCESS_CONFIG = {
  active:       { label: 'System Access', icon: ShieldCheck, cls: 'bg-emerald-100 text-emerald-700' },
  invited:      { label: 'Invite Sent',   icon: Clock,       cls: 'bg-amber-100 text-amber-700' },
  not_invited:  { label: 'No Access',     icon: ShieldOff,   cls: 'bg-gray-100 text-gray-500' },
};

const ROLE_CONFIG = {
  admin: { label: 'Admin', cls: 'bg-violet-100 text-violet-700' },
  user:  { label: 'User',  cls: 'bg-blue-100 text-blue-700' },
};

export default function EmployeeAccessBadge({ employee }) {
  const access = ACCESS_CONFIG[employee.system_access_status || 'not_invited'];
  const Icon = access.icon;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge className={`${access.cls} gap-1 text-xs`}>
        <Icon className="w-3 h-3" />{access.label}
      </Badge>
      {employee.system_access_status !== 'not_invited' && employee.system_role && ROLE_CONFIG[employee.system_role] && (
        <Badge className={`${ROLE_CONFIG[employee.system_role].cls} text-xs`}>
          {ROLE_CONFIG[employee.system_role].label}
        </Badge>
      )}
    </div>
  );
}
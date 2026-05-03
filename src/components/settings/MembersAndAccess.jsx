import React, { useMemo, useState, useEffect, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEPARTMENTS } from '@/lib/departmentPermissions';

/* ────────────────────────────────────────────────────────────────────────── */
/* Data                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

const DEPT_TONE = {
  'Business Dev':      { dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50',      border: 'border-blue-200'      },
  'Sales':             { dot: 'bg-green-500',   text: 'text-green-700',   bg: 'bg-green-50',     border: 'border-green-200'     },
  'Marketing':         { dot: 'bg-pink-500',    text: 'text-pink-700',    bg: 'bg-pink-50',      border: 'border-pink-200'      },
  'Human Resources':   { dot: 'bg-purple-500',  text: 'text-purple-700',  bg: 'bg-purple-50',    border: 'border-purple-200'    },
  'Legal':             { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',     border: 'border-amber-200'     },
  'Finance':           { dot: 'bg-yellow-500',  text: 'text-yellow-700',  bg: 'bg-yellow-50',    border: 'border-yellow-200'    },
  'Engineering':       { dot: 'bg-slate-500',   text: 'text-slate-700',   bg: 'bg-slate-50',     border: 'border-slate-200'     },
  'Information Technology': { dot: 'bg-cyan-500', text: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  'Admin':             { dot: 'bg-violet-500',  text: 'text-violet-700',  bg: 'bg-violet-50',    border: 'border-violet-200'    },
  'SuperAdmin':        { dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50',       border: 'border-red-200'       },
};

const ACTIONS = [
  { id: 'view',   label: 'View',   icon: 'eye'    },
  { id: 'create', label: 'Create', icon: 'plus'   },
  { id: 'edit',   label: 'Edit',   icon: 'pen'    },
  { id: 'delete', label: 'Delete', icon: 'trash'  },
  { id: 'export', label: 'Export', icon: 'export' },
];

const SECTION_GROUPS = [
  { id: 'crm',     label: 'CRM',       desc: 'Pipeline, contacts, and outreach', sections: [
    { id: 'dashboard', label: 'Dashboard' }, { id: 'contacts', label: 'Contacts' },
    { id: 'companies', label: 'Companies' }, { id: 'deals', label: 'Deals' },
    { id: 'activities', label: 'Activities' }, { id: 'campaigns', label: 'Campaigns' },
    { id: 'emailMarketing', label: 'Email Marketing' }, { id: 'reports', label: 'Reports' },
  ]},
  { id: 'seo',     label: 'SEO',       desc: 'Rankings, content, and audits', sections: [
    { id: 'seoDashboard', label: 'SEO Dashboard' }, { id: 'keywords', label: 'Keywords' },
    { id: 'backlinks', label: 'Backlinks' }, { id: 'seoAudit', label: 'SEO Audit' },
    { id: 'competitors', label: 'Competitors' },
  ]},
  { id: 'social',  label: 'Social',    desc: 'Publishing, listening, and engagement', sections: [
    { id: 'socialMedia', label: 'Social Media' }, { id: 'socialListening', label: 'Social Listening' },
    { id: 'socialCalendar', label: 'Social Calendar' }, { id: 'hashtags', label: 'Hashtags' },
  ]},
  { id: 'content', label: 'Content',   desc: 'Production and assets', sections: [
    { id: 'contentStudio', label: 'Content Studio' }, { id: 'landingPages', label: 'Landing Pages' },
    { id: 'automation', label: 'Automation' },
  ]},
  { id: 'docs',    label: 'Documents', desc: 'Files and legal', sections: [
    { id: 'docutrace', label: 'Docutrace' }, { id: 'legalDocuments', label: 'Legal Documents' },
    { id: 'dataRooms', label: 'Data Rooms' },
  ]},
  { id: 'system',  label: 'System',    desc: 'Workspace and platform', sections: [
    { id: 'settings', label: 'Settings' }, { id: 'admin', label: 'Admin' },
  ]},
];

const ALL_SECTIONS = SECTION_GROUPS.flatMap(g =>
  g.sections.map(s => ({ ...s, group: g.id, groupLabel: g.label }))
);

function defaultPerms() {
  const perms = {};
  // Initialize all departments
  for (const d of DEPARTMENTS) {
    perms[d] = {};
    for (const s of ALL_SECTIONS) {
      perms[d][s.id] = { view: false, create: false, edit: false, delete: false, export: false };
    }
  }
  // SuperAdmin: full access to all sections
  for (const s of ALL_SECTIONS) {
    perms['SuperAdmin'][s.id] = { view: true, create: true, edit: true, delete: true, export: true };
  }
  // Admin: full access except system
  for (const s of ALL_SECTIONS) {
    if (s.group !== 'system') {
      perms['Admin'][s.id] = { view: true, create: true, edit: true, delete: true, export: true };
    } else {
      perms['Admin'][s.id] = { view: true, create: false, edit: false, delete: false, export: false };
    }
  }
  return perms;
}

const getAvatarColor = (email) => {
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500', 'bg-emerald-500', 'bg-teal-500'];
  const hash = email.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const STATUS_TONE = {
  active:    { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  pending:   { dot: 'bg-amber-500',   text: 'text-amber-700'   },
  suspended: { dot: 'bg-rose-500',    text: 'text-rose-700'    },
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Icons (inline SVG)                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

const ICON_PATHS = {
  eye:    <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  plus:   <path d="M12 5v14M5 12h14"/>,
  pen:    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>,
  trash:  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>,
  export: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 5v12"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  chevronDown:  <path d="m6 9 6 6 6-6"/>,
  chevronRight: <path d="m9 6 6 6-6 6"/>,
  chevronUp:    <path d="m6 15 6-6 6 6"/>,
  check:  <path d="M20 6 9 17l-5-5"/>,
  x:      <path d="M18 6 6 18M6 6l12 12"/>,
  user:   <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  users:  <><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7"/></>,
  shield: <path d="M12 2 4 5v6c0 5 3.5 9.4 8 11 4.5-1.6 8-6 8-11V5l-8-3z"/>,
  grid:   <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  moreH:  <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  copy:   <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  history:<><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/></>,
  download:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
  sparkles:<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>,
};

function Icon({ name, className = 'w-4 h-4', stroke = 1.6 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICON_PATHS[name] || null}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Primitives                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function Button({ children, variant = 'secondary', size = 'md', icon, onClick, type = 'button', disabled, className = '' }) {
  const sizes = {
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-8 px-3 text-[13px] gap-1.5',
    lg: 'h-10 px-4 text-sm gap-2',
  }[size];
  const variants = {
    primary:   'bg-slate-900 text-white border-slate-900 hover:bg-slate-800',
    secondary: 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50',
    ghost:     'bg-transparent text-slate-900 border-transparent hover:bg-slate-100',
    danger:    'bg-white text-rose-700 border-rose-200 hover:bg-rose-50',
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center font-medium border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizes} ${variants} ${className}`}>
      {icon && <Icon name={icon} className="w-3.5 h-3.5"/>}
      {children}
    </button>
  );
}

function Avatar({ name, color = 'bg-slate-500', size = 'w-8 h-8 text-xs' }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`inline-flex items-center justify-center rounded-full text-white font-semibold flex-none ${color} ${size}`}>
      {initials}
    </div>
  );
}

function ActionCheck({ checked, onChange, tone = 'bg-slate-900', destructive, icon, disabled }) {
  const fill = destructive ? 'bg-rose-600 border-rose-600' : `${tone} border-transparent`;
  return (
    <button type="button" disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange?.(!checked); }}
      className="w-[22px] h-[22px] inline-flex items-center justify-center rounded-md flex-none disabled:cursor-not-allowed">
      <span className={`w-[18px] h-[18px] rounded-[5px] inline-flex items-center justify-center transition-colors border
        ${checked ? `${fill} text-white shadow-sm` : 'bg-white border-slate-300 text-slate-400'}`}>
        {checked
          ? <Icon name="check" className="w-3 h-3" stroke={2.4}/>
          : (icon ? <Icon name={icon} className="w-[11px] h-[11px]"/> : null)}
      </span>
    </button>
  );
}

function Switch({ checked, onChange, tone = 'bg-slate-900', disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange?.(!checked); }}
      className={`relative w-[30px] h-[17px] rounded-full transition-colors flex-none
        ${checked ? tone : 'bg-slate-200'} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <span className={`absolute top-[2px] w-[13px] h-[13px] rounded-full bg-white shadow transition-[left]
        ${checked ? 'left-[15px]' : 'left-[2px]'}`}/>
    </button>
  );
}

function Badge({ children, tone = 'slate', className = '' }) {
  const tones = {
    slate:   'bg-slate-100 text-slate-600 border-slate-200',
    violet:  'bg-violet-50 text-violet-700 border-violet-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    cyan:    'bg-cyan-50 text-cyan-700 border-cyan-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    rose:    'bg-rose-50 text-rose-700 border-rose-200',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${tones} ${className}`}>
      {children}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function actionCount(perms, role, sectionId) {
  const p = perms[role][sectionId] || {};
  return ACTIONS.reduce((n, a) => n + (p[a.id] ? 1 : 0), 0);
}

function groupCoverage(perms, role, group) {
  const total = group.sections.length * ACTIONS.length;
  const on = group.sections.reduce((n, s) => n + actionCount(perms, role, s.id), 0);
  return { on, total, pct: on / total };
}

function useFilteredGroups(query) {
  return useMemo(() => {
    if (!query) return SECTION_GROUPS;
    const q = query.toLowerCase();
    return SECTION_GROUPS
      .map(g => ({ ...g, sections: g.sections.filter(s =>
        s.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
      .filter(g => g.sections.length > 0);
  }, [query]);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Page header                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function PageHeader() {
  return (
    <div className="flex items-start justify-between gap-4 px-8 py-6 border-b border-slate-200 bg-white">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
          <span>Settings</span>
          <Icon name="chevronRight" className="w-3 h-3"/>
          <span>Workspace</span>
          <Icon name="chevronRight" className="w-3 h-3"/>
          <span className="text-slate-600 font-medium">Members &amp; access</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Members &amp; access</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Invite people to your workspace, change their roles, and configure what each role can see and do across the platform.
        </p>
      </div>
      <Button variant="secondary" icon="history" size="md">View audit log</Button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Members table                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function MembersSection() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState(() => new Set());
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  // Fetch users from User entity
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const list = await base44.entities.User.list();
      return list.map(u => ({
        id: u.id,
        name: u.full_name || u.email.split('@')[0],
        email: u.email,
        department: u.department || 'Admin',
        status: u.status || 'active',
        lastActive: u.lastActive || '—',
        avatarColor: getAvatarColor(u.email),
      }));
    },
  });

  // Mutation to update user department
  const updateDeptMutation = useMutation({
    mutationFn: async ({ userId, department }) => {
      await base44.entities.User.update(userId, { department });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const counts = useMemo(() => {
    const c = { total: users.length, pending: 0, active: 0 };
    DEPARTMENTS.forEach(d => { c[d] = 0; });
    users.forEach(u => { 
      c[u.department]++; 
      c[u.status]++;
    });
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    let out = users;
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (roleFilter !== 'all') out = out.filter(u => u.department === roleFilter);
    out = [...out].sort((a, b) => {
      const sortKey = sort.key === 'role' ? 'department' : sort.key;
      const r = String(a[sortKey]).localeCompare(String(b[sortKey]));
      return sort.dir === 'asc' ? r : -r;
    });
    return out;
  }, [users, query, roleFilter, sort]);

  const toggleSel = (id) => {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n);
  };
  const selectAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(u => u.id)));
  };
  const sortBy = (key) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  const stats = [
    { label: 'Total members',   value: counts.total, hint: `${counts.active} active` },
    { label: 'Sales',           value: counts['Sales'] || 0, hint: 'Sales team' },
    { label: 'Marketing',       value: counts['Marketing'] || 0, hint: 'Marketing team' },
    { label: 'Other depts',     value: counts.total - (counts['Sales'] || 0) - (counts['Marketing'] || 0), hint: `${counts.pending} pending` },
  ];

  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium text-slate-500 mb-1.5">
            <Icon name="users" className="w-3.5 h-3.5"/> Team members
          </div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">Who has access</h2>
          <p className="mt-1 text-[13.5px] text-slate-500">
            Manage the people in your workspace and the role each of them holds.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="download">Export CSV</Button>
          <Button variant="primary" icon="plus">Invite member</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-[10px] px-4 py-3.5">
            <div className="text-[11.5px] font-medium text-slate-500">{s.label}</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[26px] font-semibold tracking-tight text-slate-900 tabular-nums">{s.value}</span>
              <span className="text-xs text-slate-400">{s.hint}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 border-b-0 rounded-t-[10px] px-3 py-2.5">
        <div className="relative flex-none w-80">
          <Icon name="search" className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or email"
            className="w-full h-8 pl-8 pr-3 text-[13px] bg-slate-50 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-slate-400"/>
        </div>
        <div className="flex gap-1 ml-1 flex-wrap">
          {[{ id: 'all', label: 'All' }, ...DEPARTMENTS.map(d => ({ id: d, label: d }))].map(d => {
            const active = roleFilter === d.id;
            return (
              <button key={d.id} onClick={() => setRoleFilter(d.id)}
                className={`h-7 px-2.5 text-[12.5px] font-medium rounded-md inline-flex items-center gap-1.5 border transition-colors
                  ${active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                {d.id !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${DEPT_TONE[d.id]?.dot}`}/>}
                {d.label}
                {d.id !== 'all' && <span className="opacity-60 tabular-nums">{counts[d.id] || 0}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex-1"/>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 text-[12.5px] text-slate-600">
            <span><b className="text-slate-900">{selected.size}</b> selected</span>
            <Button size="sm" variant="secondary">Change role</Button>
            <Button size="sm" variant="danger" icon="trash">Remove</Button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-b-[10px] overflow-hidden">
        <div className="grid grid-cols-[36px_2.4fr_1fr_1fr_1.2fr_80px] items-center px-3.5 h-9 border-t border-slate-100 bg-slate-50
                        text-[11px] uppercase tracking-wider font-semibold text-slate-500">
          <div>
            <input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length}
                   onChange={selectAll} className="accent-slate-900"/>
          </div>
          {[
            { k: 'name', label: 'Member' },
            { k: 'role', label: 'Department' },
            { k: 'status', label: 'Status' },
            { k: 'lastActive', label: 'Last active' },
          ].map(col => (
            <button key={col.k} onClick={() => sortBy(col.k)}
              className="inline-flex items-center gap-1 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500 hover:text-slate-700">
              {col.label}
              {sort.key === col.k && <Icon name={sort.dir === 'asc' ? 'chevronUp' : 'chevronDown'} className="w-3 h-3"/>}
            </button>
          ))}
          <div className="text-right">Actions</div>
        </div>

        {filtered.map(u => {
           const tone = DEPT_TONE[u.department];
           const stat = STATUS_TONE[u.status];
           const isSel = selected.has(u.id);
           return (
             <div key={u.id} className={`grid grid-cols-[36px_2.4fr_1fr_1fr_1.2fr_80px] items-center px-3.5 py-2.5 min-h-[52px] border-t border-slate-100
                                         ${isSel ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/60'}`}>
               <div>
                 <input type="checkbox" checked={isSel} onChange={() => toggleSel(u.id)} className="accent-slate-900"/>
               </div>
               <div className="flex items-center gap-2.5 min-w-0">
                 <Avatar name={u.name} color={u.avatarColor} size="w-8 h-8 text-[12px]"/>
                 <div className="min-w-0">
                   <div className="text-[13.5px] font-medium text-slate-900 truncate">{u.name}</div>
                   <div className="text-[12.5px] text-slate-500 truncate">{u.email}</div>
                 </div>
               </div>
               <div>
                 <select value={u.department} onChange={(e) => updateDeptMutation.mutate({ userId: u.id, department: e.target.value })}
                   className={`inline-flex items-center gap-1.5 h-[22px] px-2 rounded-md border text-[12px] font-medium appearance-none cursor-pointer
                               ${tone?.bg} ${tone?.text} ${tone?.border} bg-no-repeat pr-6 bg-right`}
                   style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='${tone?.text.split('-')[0] || 'currentColor'}' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")` }}>
                   {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
               </div>
              <div className={`flex items-center gap-1.5 text-[13px] capitalize ${stat.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`}/>
                {u.status}
              </div>
              <div className="text-[13px] text-slate-500 tabular-nums">{u.lastActive}</div>
              <div className="flex justify-end gap-0.5">
                <button title="Edit" className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100">
                  <Icon name="pen" className="w-3.5 h-3.5"/>
                </button>
                <button title="More" className="w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100">
                  <Icon name="moreH" className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          <span>Showing <b className="text-slate-900">{filtered.length}</b> of <b className="text-slate-900">{users.length}</b> members</span>
          <span>{counts.pending} pending invite{counts.pending === 1 ? '' : 's'}</span>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* RBAC — Grouped Matrix                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

function RBACMatrix({ perms, setPerms }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(() => Object.fromEntries(SECTION_GROUPS.map(g => [g.id, true])));
  const [activeDept, setActiveDept] = useState(DEPARTMENTS[0]);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(true);
  const filteredGroups = useFilteredGroups(query);
  const visibleDepts = showAll ? DEPARTMENTS : DEPARTMENTS.filter(d => d === activeDept);

  // Mutation to save permissions
  const savePermsMutation = useMutation({
    mutationFn: async (permsData) => {
      const entries = [];
      for (const [dept, sections] of Object.entries(permsData)) {
        for (const [sectionId, actions] of Object.entries(sections)) {
          entries.push({ department: dept, section_id: sectionId, actions });
        }
      }
      for (const entry of entries) {
        const existing = await base44.entities.RolePermission.filter({ department: entry.department, section_id: entry.section_id });
        if (existing.length > 0) {
          await base44.entities.RolePermission.update(existing[0].id, entry);
        } else {
          await base44.entities.RolePermission.create(entry);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });

  const toggleCell = (dept, sectionId, action) => {
    setPerms(prev => {
      const next = structuredClone(prev);
      const cur = next[dept][sectionId][action];
      next[dept][sectionId][action] = !cur;
      if (!cur && action !== 'view') next[dept][sectionId].view = true;
      if (cur && action === 'view') ACTIONS.forEach(a => { next[dept][sectionId][a.id] = false; });
      savePermsMutation.mutate(next);
      return next;
    });
  };
  const setGroupAll = (dept, group, value) => {
    setPerms(prev => {
      const next = structuredClone(prev);
      group.sections.forEach(s => ACTIONS.forEach(a => { next[dept][s.id][a.id] = value; }));
      savePermsMutation.mutate(next);
      return next;
    });
  };

  const cols = visibleDepts.length;
  const gridStyle = { gridTemplateColumns: `minmax(220px, 1.5fr) repeat(${cols}, 1fr)` };

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="relative flex-none w-72">
          <Icon name="search" className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a section…"
            className="w-full h-8 pl-8 pr-3 text-[13px] bg-slate-50 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-slate-400"/>
        </div>
        <div className="inline-flex p-[3px] gap-0.5 bg-slate-100 border border-slate-200 rounded-lg">
          <button onClick={() => setShowAll(true)}
            className={`h-[26px] px-2.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5
                        ${showAll ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <Icon name="grid" className="w-3 h-3"/> All roles
          </button>
          <button onClick={() => setShowAll(false)}
            className={`h-[26px] px-2.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5
                        ${!showAll ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            <Icon name="user" className="w-3 h-3"/> Single role
          </button>
        </div>
        {!showAll && (
          <div className="flex gap-1 flex-wrap">
            {DEPARTMENTS.map(d => {
              const t = DEPT_TONE[d];
              const active = activeDept === d;
              return (
                <button key={d} onClick={() => setActiveDept(d)}
                  className={`h-8 px-3 text-[13px] font-medium rounded-md inline-flex items-center gap-1.5 border
                              ${active ? `${t.bg} ${t.text} ${t.border}` : 'bg-white text-slate-600 border-slate-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`}/>{d}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex-1"/>
        <div className="text-xs text-slate-500">{ALL_SECTIONS.length} sections × {ACTIONS.length} actions</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid border-b border-slate-200 bg-slate-50 sticky top-0 z-[2]" style={gridStyle}>
          <div className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Section</div>
          {visibleDepts.map(d => (
            <div key={d} className="px-3 py-2.5 border-l border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${DEPT_TONE[d].dot}`}/>
                <span className="text-[13px] font-semibold text-slate-900">{d}</span>
              </div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${ACTIONS.length}, 1fr)` }}>
                {ACTIONS.map(a => (
                  <div key={a.id} title={a.label}
                    className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center py-0.5">
                    {a.label.slice(0, 4)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredGroups.map((g, gi) => (
          <div key={g.id} className={gi === filteredGroups.length - 1 ? '' : 'border-b border-slate-200'}>
            <div onClick={() => setOpen({ ...open, [g.id]: !open[g.id] })}
              className={`grid items-center bg-stone-50/60 cursor-pointer ${open[g.id] ? 'border-b border-slate-100' : ''}`}
              style={gridStyle}>
              <div className="px-4 py-2.5 flex items-center gap-2">
                <Icon name={open[g.id] ? 'chevronDown' : 'chevronRight'} className="w-3.5 h-3.5 text-slate-500"/>
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">{g.label}</div>
                  <div className="text-[11.5px] text-slate-400">{g.desc} · {g.sections.length} sections</div>
                </div>
              </div>
              {visibleDepts.map(d => {
                 const cov = groupCoverage(perms, d, g);
                 const tone = DEPT_TONE[d];
                 return (
                   <div key={d} className="px-3 py-2.5 border-l border-slate-100 flex items-center justify-between gap-2">
                     <div className="flex items-center gap-2 flex-1">
                       <div className="flex-1 h-1 bg-slate-100 rounded overflow-hidden">
                         <div className={`h-full transition-[width] ${tone.dot}`} style={{ width: `${cov.pct * 100}%` }}/>
                       </div>
                       <span className="text-[11px] text-slate-500 tabular-nums w-9 text-right">{cov.on}/{cov.total}</span>
                     </div>
                     <div className="flex gap-0.5">
                       <button onClick={(e) => { e.stopPropagation(); setGroupAll(d, g, true); }}
                         title={`Grant all to ${d}`} className="w-[22px] h-[22px] inline-flex items-center justify-center border border-slate-200 bg-white rounded text-slate-500 hover:bg-slate-50">
                         <Icon name="check" className="w-[11px] h-[11px]"/>
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); setGroupAll(d, g, false); }}
                         title={`Revoke all from ${d}`} className="w-[22px] h-[22px] inline-flex items-center justify-center border border-slate-200 bg-white rounded text-slate-500 hover:bg-slate-50">
                         <Icon name="x" className="w-[11px] h-[11px]"/>
                       </button>
                     </div>
                   </div>
                 );
               })}
            </div>

            {open[g.id] && g.sections.map((s, si) => (
              <div key={s.id} className={`grid items-center bg-white ${si === g.sections.length - 1 ? '' : 'border-b border-slate-50'}`}
                style={gridStyle}>
                <div className="pl-9 pr-4 py-2 text-[13px] text-slate-900">{s.label}</div>
                {visibleDepts.map(d => {
                  const p = perms[d][s.id];
                  const tone = DEPT_TONE[d];
                  return (
                    <div key={d} className="px-3 py-1.5 border-l border-slate-100 grid"
                      style={{ gridTemplateColumns: `repeat(${ACTIONS.length}, 1fr)` }}>
                      {ACTIONS.map(a => (
                        <div key={a.id} className="flex justify-center">
                          <ActionCheck checked={!!p[a.id]} tone={tone.dot} icon={a.icon}
                            destructive={a.id === 'delete'}
                            onChange={() => toggleCell(d, s.id, a.id)}/>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3.5 p-4 bg-slate-50 border border-slate-200 rounded-[10px] grid grid-cols-3 gap-3.5 text-[12.5px] text-slate-600">
         {DEPARTMENTS.map(d => (
           <div key={d} className="flex gap-2.5 items-start">
             <span className={`w-2 h-2 rounded-full mt-1.5 ${DEPT_TONE[d].dot}`}/>
             <div>
               <div className="text-slate-900 font-semibold text-[13px]">{d}</div>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Recent activity                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

const RECENT_EVENTS = [
  { who: 'Brian Gibbs',  avatarColor: 'bg-violet-500', what: 'granted Editor delete access on', target: 'Contacts',                    when: '2 minutes ago' },
  { who: 'Brian Gibbs',  avatarColor: 'bg-violet-500', what: 'invited',                          target: 'priya.r@syberjet.com as User', when: '1 hour ago'    },
  { who: 'Maya Patel',   avatarColor: 'bg-blue-500',   what: 'changed role of',                  target: 'Lena Vasquez to Viewer',     when: 'Yesterday'     },
  { who: 'System',       avatarColor: 'bg-slate-500',  what: 'auto-disabled',                    target: 'Admin section for Editor role', when: '2 days ago'   },
];

function RecentActivity() {
  return (
    <section>
      <div className="mb-3.5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium text-slate-500 mb-1.5">
          <Icon name="history" className="w-3.5 h-3.5"/> Recent activity
        </div>
        <h2 className="text-[18px] font-semibold tracking-tight text-slate-900">What changed</h2>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {RECENT_EVENTS.map((e, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i === RECENT_EVENTS.length - 1 ? '' : 'border-b border-slate-100'}`}>
            <Avatar name={e.who} color={e.avatarColor} size="w-[26px] h-[26px] text-[10px]"/>
            <div className="flex-1 text-[13px] text-slate-600">
              <b className="text-slate-900 font-semibold">{e.who}</b> {e.what} <b className="text-slate-900 font-semibold">{e.target}</b>
            </div>
            <div className="text-xs text-slate-400">{e.when}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Page                                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export default function MembersAndAccess() {
  const [perms, setPerms] = useState(() => defaultPerms());

  return (
    <main className="min-h-screen bg-stone-50 text-slate-900 antialiased">
      <PageHeader/>
      <div className="px-8 py-7 flex flex-col gap-9">
        <MembersSection/>
        <section>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-medium text-slate-500 mb-1.5">
                <Icon name="shield" className="w-3.5 h-3.5"/> Role-based access control
              </div>
              <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">What each role can do</h2>
              <p className="mt-1 text-[13.5px] text-slate-500 max-w-2xl">
                {ALL_SECTIONS.length} sections, grouped by product area.
              </p>
            </div>
          </div>
          <RBACMatrix perms={perms} setPerms={setPerms}/>
        </section>
        <RecentActivity/>
        <div className="h-10"/>
      </div>
    </main>
  );
}
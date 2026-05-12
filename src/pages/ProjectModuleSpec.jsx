import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

// ─────────────────────────────────────────────────────────────────
// Spec data — sourced from actual component implementations
// ─────────────────────────────────────────────────────────────────
const MODULES = [
  // ── 1. Projects List ─────────────────────────────────────────
  {
    id: 'projects-list',
    title: 'Projects — List & Overview Page',
    route: '/Projects',
    purpose:
      'Central hub for browsing, creating, and managing all projects. Provides real-time health metrics, three view modes (Grid, Kanban Board, Timeline), search/filter controls, and entry points for project and task creation.',
    sections: [
      {
        heading: 'Stats Dashboard (4 metric cards)',
        what: 'Total Projects · Active Projects · Total Budget · Average Progress — rendered only when at least one project exists.',
        should: 'Values derived from the full unfiltered project list, not the filtered subset.',
        how: 'Computed inline in JSX: `projects.length`, `projects.filter(p=>p.status==="active").length`, `projects.reduce((s,p)=>s+(p.budget||0),0)`, `Math.round(projects.reduce((s,p)=>s+(p.progress||0),0)/projects.length)`.',
      },
      {
        heading: 'Search & Filters',
        what: 'Free-text name search + collapsible Status dropdown (planning/active/on_hold/completed/cancelled) + Priority dropdown (low/medium/high/critical). Clear button resets both dropdowns.',
        should: 'Filtering is instant — no network call. All three conditions must pass for a project to appear.',
        how: '`useMemo` over `projects` array gating on `name.toLowerCase().includes(searchTerm)`, `statusFilter==="all" || p.status===statusFilter`, `priorityFilter==="all" || p.priority===priorityFilter`.',
      },
      {
        heading: 'View Mode Switcher',
        what: 'Three icon-buttons toggle between Grid, Board (Kanban), and Timeline views. Default on mount: "board".',
        should: 'Active mode button renders with `variant="default"` (filled); others with `variant="ghost"`.',
        how: '`useState("board")`. Each mode renders a separate child: card grid, `<ProjectKanbanBoard>`, or `<ProjectTimeline>`.',
      },
      {
        heading: 'Grid View',
        what: '1-to-3 column responsive card grid. Each card: project name, company name (resolved from companies lookup), status badge, priority badge, member-count badge, progress bar (violet), due date, budget summary.',
        should: 'Skeleton placeholders (6 items) during load. `<EmptyState>` CTA when no filtered results. Clicking a card sets `selectedProject` state.',
        how: 'Cards from `filteredProjects`. Company name: `companies.find(c=>c.id===project.company_id)?.name||"N/A"`. Progress bar: `style={{ width: \`${project.progress}%\` }}`.',
      },
      {
        heading: 'Kanban Board View',
        what: 'Project selector dropdown at top + full task Kanban for selected project. "Add Task" button in header. Column "+" icons add tasks with pre-set status.',
        should: 'Prompt "Select a project to view its kanban board" when no project selected. Tasks filtered to `task.project_id === selectedProject.id`.',
        how: '`<ProjectKanbanBoard tasks={projectTasks} onStatusChange={(id,status)=>updateTaskMutation.mutate({id,data:{status}})} />`. `projectTasks` = `tasks.filter(t=>t.project_id===selectedProject.id)`.',
      },
      {
        heading: 'Timeline View',
        what: 'Gantt-style view of all filtered projects and their tasks on a shared date axis.',
        should: 'Clicking a project bar opens ProjectModal in edit mode. Clicking a task bar opens TaskModal.',
        how: '`<ProjectTimeline projects={filteredProjects} tasks={tasks} milestones={[]} onProjectClick={p=>{setEditingProject(p);setShowModal(true)}} onTaskClick={t=>{setEditingTask(t);setShowTaskModal(true)}} />`.',
      },
      {
        heading: 'Create / Edit Project (ProjectModal)',
        what: 'Full-form dialog: name (required), project_type selector, description, status, priority, company (optional), budget, progress %, start/end dates (hidden for photo_video_shoot type), team members (email pills), and type-specific fields section.',
        should: 'Unsaved-changes guard (`useUnsavedChangesGuard`) prompts before closing if form is dirty. Type-switch confirmation dialog warns that type-specific fields will reset. On create: auto-generate media folders (non-blocking).',
        how: 'Create: `createMutation → Project.create(data)` then `generateProjectFolders({id,name,type,created_by})` in `onSuccess`. Edit: `updateMutation → Project.update(id,data)`. Both invalidate `["projects"]` query on success.',
      },
      {
        heading: 'Task Quick-Create (from board)',
        what: 'TaskModal opened from Kanban "Add Task" button or column "+" icon. Auto-attaches `project_id` of selected project.',
        should: 'On save: `project_id: selectedProject?.id` merged into task data payload.',
        how: '`createTaskMutation → Task.create({...data, project_id: selectedProject?.id})`. Invalidates `["all-tasks"]`.',
      },
    ],
    entityFields: [
      'Project.name (string, required)',
      'Project.description (string)',
      'Project.status (planning|active|on_hold|completed|cancelled, default: planning)',
      'Project.priority (low|medium|high|critical, default: medium)',
      'Project.start_date (date)',
      'Project.end_date (date)',
      'Project.progress (number 0–100, default 0)',
      'Project.budget (number)',
      'Project.budget_spent (number, default 0)',
      'Project.team_members (string[])',
      'Project.company_id (FK → Company)',
      'Project.contact_id (FK → Contact)',
      'Project.tags (string[])',
      'Project.notes (string)',
      'Project.project_type (enum, default: "project")',
      'Project.project_type_data (object, default: {})',
      'Project.created_by_name (string|null)',
      'Project.workflow_history (array, default: [])',
      'Task.id, title, status, assigned_to, due_date, project_id',
    ],
    relatedEntities: ['Project', 'Task', 'Company', 'Contact'],
  },

  // ── 2. Project Detail ─────────────────────────────────────────
  {
    id: 'project-detail',
    title: 'Project Detail Page',
    route: '/ProjectDetail?id=<projectId>',
    purpose:
      'Deep-dive dashboard for a single project. Aggregates budget, task progress, milestones, team leaderboard, time logs, and media-folder/approval workflows into one unified view.',
    sections: [
      {
        heading: 'Page Load & Route Param',
        what: 'Reads `?id=` from URL params, fetches that project record, and gates all child queries on `!!projectId`.',
        should: 'Show `<Skeleton className="h-96">` while loading. Show "Project not found" text if fetch returns null.',
        how: '`useSearchParams()` → `projectId = searchParams.get("id")`. Project loaded via `Project.list()` then `.find(p=>p.id===projectId)` (no filter endpoint used). All other queries use `enabled: !!projectId`.',
      },
      {
        heading: 'Page Header',
        what: 'Project name (h1), description (subtitle), Back button (→ /Projects), Share button (stub), Add Task button.',
        should: '"Add Task" opens TaskModal with `project_id` pre-set. "Share" is a placeholder — no action yet.',
        how: '`<Link to={createPageUrl("Projects")}>` for back. TaskModal controlled by `showTaskModal` / `editingTask` state pair.',
      },
      {
        heading: 'Top Metrics Row (4 cards)',
        what: 'Card 1: Project Budget (total). Card 2: Spent + % used. Card 3: Goal Completion SVG donut (% tasks completed, completed/total label). Card 4: Time Logged (sum of all TimeLog hours for tasks in this project).',
        should: 'Donut uses SVG circles with `strokeDashoffset = 2π×40×(1−rate/100)`. TimeLogs query enabled only when `tasks.length > 0`.',
        how: '`completionRate = tasks.length>0 ? (completed/tasks.length*100).toFixed(0) : 0`. `budgetPercentage = project.budget>0 ? (budget_spent/budget*100).toFixed(0) : 0`. `totalHours = timeLogs.reduce((s,l)=>s+(l.hours||0),0)`.',
      },
      {
        heading: 'Board Summary Card',
        what: 'Status badge + three horizontal progress bars: In Progress (yellow), To Do (gray), Done (green) — each labeled with task count.',
        should: 'Bar widths proportional to `taskCount / tasks.length`. Zero-division safe (defaults to "0%").',
        how: '`taskStatusCounts = { todo: tasks.filter(t=>t.status==="todo").length, in_progress: ..., completed: ... }`. Bar: `style={{ width: tasks.length>0 ? \`${(count/tasks.length)*100}%\` : "0%" }}`.',
      },
      {
        heading: 'Milestones Card',
        what: 'List of project milestones sorted by `due_date`. Each row: completion icon (CheckCircle2 green / Circle gray), name, due date, status badge. "Add" button opens MilestoneModal.',
        should: 'Empty state: "No milestones yet" centered text.',
        how: '`ProjectMilestone.filter({ project_id }, "due_date")`. Create via `createMilestoneMutation → ProjectMilestone.create({...data, project_id})`. Invalidates `["project-milestones", projectId]`.',
      },
      {
        heading: 'All Tasks List',
        what: 'Full list sorted by `-created_date`: title, status badge, assignee name (resolved from users), due date, delete button.',
        should: 'Delete is immediate (no confirmation dialog). Assignee display name resolved by matching `task.assigned_to` email against `users` array.',
        how: '`Task.filter({ project_id }, "-created_date")`. Delete: `deleteTaskMutation → Task.delete(taskId)`. `getUserName(email) = users.find(u=>u.email===email)?.full_name || email || "Unassigned"`.',
      },
      {
        heading: 'Team Leaderboard',
        what: 'Top-5 ranked list: rank badge (gradient circle), user display name, completed-task count.',
        should: 'Only users with ≥1 completed task appear. "No completed tasks yet" empty state otherwise.',
        how: '`tasks.reduce((acc,t)=>{ if(t.assigned_to && t.status==="completed") acc[t.assigned_to]=(acc[t.assigned_to]||0)+1; return acc; },{})` → sort desc → slice(0,5).',
      },
      {
        heading: 'Project Details Sidebar',
        what: 'Read-only fields: Start Date, End Date, Team Members (comma list). Fields omitted when empty.',
        should: 'No edit controls — info-only sidebar.',
        how: 'Direct reads from `project` object. Conditional renders: `{project.start_date && <div>…</div>}`.',
      },
      {
        heading: 'Media Folders & Approvals Section',
        what: 'Full `<ProjectFoldersView project={project}>` section showing folder grid, file upload, approval status badges, and approval workflow panel.',
        should: 'Section always rendered, even if no folders exist (empty state prompts auto-generation).',
        how: '`<ProjectFoldersView project={project} />` handles its own queries: `MediaFolder.filter({ project_id })` and `MediaAsset.filter({ folder_id })`.',
      },
      {
        heading: 'Task Creation (with notification)',
        what: 'TaskModal from header "Add Task". On save: task created with `project_id`, then `notifyAssignment` backend function called if `assigned_to` is set.',
        should: 'Notification failure is caught and logged but must NOT block task creation success.',
        how: '`createTaskMutation.mutationFn`: `Task.create({...data, project_id})` → if `task.assigned_to`, `base44.functions.invoke("notifyAssignment",{task_id,entity_type:"task",assigned_to,assigned_by:user.email,title,due_date})` wrapped in try/catch.',
      },
    ],
    entityFields: [
      'Project: all fields (see Module 1)',
      'Task: id, title, status, assigned_to, due_date, project_id',
      'ProjectMilestone: id, name, status, due_date, project_id',
      'TimeLog: id, task_id, hours, date',
      'User: id, email, full_name',
    ],
    relatedEntities: ['Project', 'Task', 'ProjectMilestone', 'TimeLog', 'User'],
  },

  // ── 3. ProjectModal — Type-Specific Fields ────────────────────
  {
    id: 'project-modal-types',
    title: 'ProjectModal — Project Type Custom Fields',
    route: 'Dialog component used in /Projects and /ProjectDetail',
    purpose:
      'Extends the base project form with type-specific metadata sections. The visible sub-form switches based on `project_type`. All type fields are stored inside `project_type_data` (a free-form JSON object) — never at the top level of Project.',
    sections: [
      {
        heading: 'Dirty-State Guard & Type-Switch Confirmation',
        what: 'If the form has unsaved changes and the user changes `project_type`, a confirmation dialog warns that custom fields will be replaced.',
        should: 'User can cancel ("Keep Editing") to abort the switch. Shared top-level fields (name, status, etc.) are preserved regardless.',
        how: '`isDirty = JSON.stringify(normalizeFormDataForCompare(formData)) !== JSON.stringify(normalizeFormDataForCompare(initialFormData))`. If dirty + type change → `setPendingProjectType(nextType); setShowTypeSwitchConfirm(true)`. Confirm: `setFormData(cur=>({...cur,project_type:pendingProjectType,project_type_data:normalizeProjectTypeData(pendingProjectType)}))`. Uses `useUnsavedChangesGuard` hook for close-button guard.',
      },
      {
        heading: 'Type: "project" (default)',
        what: 'No additional sub-form fields rendered.',
        should: '`renderProjectTypeFields()` returns null.',
        how: '`switch(formData.project_type) { case ProjectType.PROJECT: default: return null; }`',
      },
      {
        heading: 'Type: "photo_video_shoot"',
        what: 'Fields: Shoot Start Date+Time (datetime-local), Shoot End Date+Time (datetime-local), Location text (+ "Open Google Maps" button), Indoor/Outdoor select (indoor|outdoor|both), Use Case checkboxes (social_media|website|ad|commercial|pdf|other), Use Case Other (shown only when "other" checked), Equipment List (textarea), Summary (textarea). Start/End date inputs hidden from base form.',
        should: 'On submit: `start_date` and `end_date` set from `shoot_start_at.split("T")[0]` and `shoot_end_at.split("T")[0]`. "Open Google Maps" opens `https://www.google.com/maps/search/?api=1&query=<encoded location>` in new tab.',
        how: '`updateProjectTypeField(field, value)` merges into `formData.project_type_data`. `toggleUseCase(val, checked)` updates `use_case` array; if "other" deselected, clears `use_case_other`. Submit: `onSave({...formData, start_date: shootStartDate, end_date: shootEndDate, project_type_data: normalizedData})`.',
      },
      {
        heading: 'Type: "graphic_design"',
        what: 'File placeholder fields (upload UX coming later): Photo/Video Files, Caption Copy Files, Brand Guidelines, Fonts, Assets, Example. Text fields: Caption Copy (textarea), Google Font selector (with live preview), Hex Codes/Colors (textarea), Summary (textarea).',
        should: 'Google Font selector loads all 12 fonts from Google Fonts stylesheet injected once into `<head>`. Preview renders sample sentence in selected font.',
        how: '`GoogleFontField` component: `useEffect` injects `<link rel="stylesheet" href="...googleapis.com/css2?family=...">` with `id="project-modal-google-fonts-stylesheet"` to avoid duplicates. `FilePlaceholderField` renders dashed-border upload placeholder.',
      },
      {
        heading: 'Type: "photo_video"',
        what: 'File placeholder fields: Photo/Video Files, Filter, Example. Text field: Summary (textarea).',
        should: 'Lighter form than photo_video_shoot — no scheduling or location fields.',
        how: 'Same `updateProjectTypeField("summary_field", value)` pattern.',
      },
      {
        heading: 'Type: "pdf_document"',
        what: 'File placeholder fields: Template, Copy Files, Fonts, Assets, Example. Text fields: Copy (textarea), Google Font selector (with preview), Hex Codes/Colors (textarea), Summary (textarea).',
        should: 'Same Google Font injection logic as graphic_design — stylesheet injected once, shared between both types.',
        how: '`updateProjectTypeField("copy_text"|"google_font_family"|"hex_codes_colors"|"summary_field", value)`.',
      },
      {
        heading: 'Normalization on Open & Submit',
        what: '`normalizeProjectTypeData(type, incoming)` merges type defaults with saved data. `use_case` coerced to array if stored as comma-string. `use_case_other` cleared if "other" not in use_case.',
        should: 'Called on modal open (to populate form) and again on submit (to clean before saving).',
        how: '`buildInitialFormData(project)` calls `normalizeProjectTypeData(projectType, project?.project_type_data)`. Submit calls `normalizeProjectTypeData(formData.project_type, formData.project_type_data)` before `onSave`.',
      },
    ],
    entityFields: [
      'project_type_data.shoot_start_at (ISO datetime string)',
      'project_type_data.shoot_end_at (ISO datetime string)',
      'project_type_data.location_text (string)',
      'project_type_data.indoor_outdoor ("indoor"|"outdoor"|"both")',
      'project_type_data.use_case (string[] of: social_media|website|ad|commercial|pdf|other)',
      'project_type_data.use_case_other (string)',
      'project_type_data.equipment_list (string)',
      'project_type_data.summary_field (string)',
      'project_type_data.caption_copy_text (string)',
      'project_type_data.google_font_family (string)',
      'project_type_data.hex_codes_colors (string)',
      'project_type_data.copy_text (string)',
    ],
    relatedEntities: ['Project'],
  },

  // ── 4. Media Folders & Approvals ─────────────────────────────
  {
    id: 'media-folders',
    title: 'Project Media Folders & Approvals',
    route: 'Component rendered inside /ProjectDetail',
    purpose:
      'Automatically scaffolds a project-type-specific folder hierarchy on project creation. Provides in-app file upload, per-asset approval status tracking, and an approval workflow panel.',
    sections: [
      {
        heading: 'Auto-Generation on Project Create',
        what: 'When a new project is saved, `generateProjectFolders` is called with `{id, name, type: project_type||"default", created_by}`. Creates typed MediaFolder records in bulk.',
        should: 'Must be non-blocking: failure is caught and swallowed — project creation succeeds regardless.',
        how: '`createMutation.onSuccess`: `generateProjectFolders({...})` in a try/catch block. Uses `MediaFolder.bulkCreate(foldersToCreate)` where each folder has: `folder_type, description, name, project_id, project_name, is_project_auto_generated:true, created_by`.',
      },
      {
        heading: 'Folder Template by Project Type',
        what: 'Each `project_type` maps to a predefined set of folder types: design→[drafts,assets,approved,final], video→[assets,drafts,approved,final], social→[drafts,assets,approved,archived], content→[drafts,assets,approved,final], default→[assets,drafts,approved,final]. (Note: marketing type also defined.)',
        should: 'Falls back to "default" template for any unmapped project_type value.',
        how: '`PROJECT_TYPE_FOLDERS[project.type] || PROJECT_TYPE_FOLDERS.default` in `generateProjectFolders`. `getProjectFolderTemplate(projectType)` exported for UI preview.',
      },
      {
        heading: 'Folder Grid View',
        what: '2-to-4 column responsive grid of folder cards. Each card: type-specific icon (FolderOpen/Folder), folder_type label (uppercased), description, file count badge. Clicking a folder selects/deselects it.',
        should: 'Selected folder highlighted with `ring-2 ring-violet-500`. Icon turns violet when selected. Deselect by clicking same folder again.',
        how: '`selectedFolder` state toggled on card click: `setSelectedFolder(isSelected ? null : folder)`. Icons and colors from `FOLDER_TYPE_ICONS` and `FOLDER_TYPE_COLORS` maps.',
      },
      {
        heading: 'Empty State & Manual Generation',
        what: 'When no folders exist: dashed-border empty card showing folder template badges and "Generate Project Folders" button. Header also shows "Auto-Generate Folders" button.',
        should: 'Preview shows which folder types will be created based on current `project_type`. Generating shows spinner on button.',
        how: '`folderTemplate = getProjectFolderTemplate(project?.project_type||"default")`. `handleGenerateFolders` calls same `generateProjectFolders` then invalidates `["media-folders", project.id]`.',
      },
      {
        heading: 'File Upload to Selected Folder',
        what: 'When a folder is selected: file detail panel appears with "Upload Files" button (hidden `<input type="file" multiple>`). Shows list of assets with filename, size, approval status badge, view (eye) button, and "Submit for Approval" (send icon) button.',
        should: 'Multiple files uploaded sequentially. Upload spinner on button during upload. Toasts on success/failure.',
        how: 'Each file: `Core.UploadFile({file})` → `MediaAsset.create({file_name,file_url,folder_id,project_id,file_type,file_size,approval_status:"pending"})`. Invalidates `["media-assets",selectedFolder.id]` and `["media-folders",project.id]`.',
      },
      {
        heading: 'Asset Approval Status Flow',
        what: 'Each asset has `approval_status`: pending → in_review → approved|rejected. "Submit for Approval" button visible only when status is "pending". Status shown as color-coded badge.',
        should: 'Status badge colors: pending=yellow, in_review=blue, approved=green, rejected=red.',
        how: '`handleRequestApproval(assetId)`: `MediaAsset.update(assetId,{approval_status:"in_review"})`. Full approval workflow managed by `<ApprovalWorkflowPanel projectId={project?.id}>` shown in toggled "Approvals" panel.',
      },
      {
        heading: 'Approvals Panel Toggle',
        what: '"Approvals" button in section header toggles the `<ApprovalWorkflowPanel>` visibility.',
        should: 'Panel sits above the folder grid when open.',
        how: '`showApprovals` boolean state. `<ApprovalWorkflowPanel projectId={project?.id} />` wrapped in a Card when `showApprovals === true`.',
      },
    ],
    entityFields: [
      'MediaFolder: id, name, folder_type, description, project_id, project_name, is_project_auto_generated, created_by, file_count',
      'MediaAsset: id, file_name, file_url, folder_id, project_id, file_type, file_size, approval_status',
    ],
    relatedEntities: ['MediaFolder', 'MediaAsset', 'ApprovalWorkflowPanel'],
  },

  // ── 5. Workflow History & Authorship ─────────────────────────
  {
    id: 'workflow-history',
    title: 'Project Workflow History & Authorship',
    route: 'Entity fields on Project — read/written by frontend mutations',
    purpose:
      'Append-only audit trail (`workflow_history` array) and write-once creator attribution (`created_by_name`). Provides accountability, a human-readable change log, and authorship UI.',
    sections: [
      {
        heading: 'created_by_name — Write-Once Attribution',
        what: 'Top-level string field on Project storing the display name of the original creator. Stamped at creation alongside the built-in `created_by` email.',
        should: 'Set once in `Project.create()` payload. Must be explicitly excluded from all subsequent `Project.update()` payloads to prevent overwrite.',
        how: '`Project.create({ ...formData, created_by_name: user.full_name })`. On update: spread only the editable fields — never include `created_by_name` in the update payload.',
      },
      {
        heading: 'workflow_history — Append-Only Array',
        what: 'Each entry: `action` (string, required), `by_email` (string|null), `by_name` (string|null), `timestamp` (ISO string, required), `note` (string|null — comma-separated changed field names on update entries). Array stored on the Project record.',
        should: 'Entries are never edited or deleted — only appended. The array grows with each meaningful mutation.',
        how: 'Before each `Project.update()` call: build entry `{ action, by_email: user.email, by_name: user.full_name, timestamp: new Date().toISOString(), note }`. Spread existing array: `workflow_history: [...(project.workflow_history||[]), newEntry]`.',
      },
      {
        heading: 'Standard Action Values',
        what: '"created" (on Project.create), "updated" (on Project.update), "status_changed" (when status field changes), "type_changed" (when project_type changes), "member_added" / "member_removed" (team_members changes).',
        should: '"updated" entries include `note` with comma-separated names of changed top-level fields (e.g. "name, priority, end_date").',
        how: 'Caller computes `note = Object.keys(changedFields).join(", ")` by diffing `formData` vs `project` before calling mutation. `action` value chosen based on which fields changed.',
      },
      {
        heading: 'Authorship Stamping',
        what: 'Every entry stamped with the authenticated user\'s email and display name at the moment of the action.',
        should: 'Read from `base44.auth.me()` which is already loaded in both Projects and ProjectDetail via `useQuery(["current-user"])`.',
        how: '`const user = await base44.auth.me()` (or from query cache). `entry.by_email = user.email; entry.by_name = user.full_name`.',
      },
      {
        heading: 'UI Display (Activity Feed)',
        what: 'Chronological list (newest first) of entries: actor initials avatar, action label, relative timestamp, note badge.',
        should: 'Collapsed to 5 most recent entries by default. "Show all" toggle expands full history.',
        how: '`[...workflow_history].reverse().slice(0, showAll ? Infinity : 5)`. Relative time: `date-fns/formatDistanceToNow` or `moment(entry.timestamp).fromNow()`.',
      },
    ],
    entityFields: [
      'Project.created_by_name (string|null, write-once on create)',
      'Project.workflow_history (array, default: [])',
      'workflow_history[n].action (string, required)',
      'workflow_history[n].by_email (string|null)',
      'workflow_history[n].by_name (string|null)',
      'workflow_history[n].timestamp (ISO datetime string, required)',
      'workflow_history[n].note (string|null)',
    ],
    relatedEntities: ['Project', 'User'],
  },
];

// ─────────────────────────────────────────────────────────────────
// PDF generation
// ─────────────────────────────────────────────────────────────────
const C = {
  brand:   [109, 40, 217],
  brandDk: [76,  29, 149],
  dark:    [17,  24,  39],
  mid:     [75,  85,  99],
  light:   [156, 163, 175],
  white:   [255, 255, 255],
  bgGray:  [248, 250, 252],
  bgVio:   [245, 243, 255],
  bgGreen: [240, 253, 244],
  bgAmb:   [255, 251, 235],
  bgInd:   [238, 242, 255],
  border:  [229, 231, 235],
  green:   [5,   150, 105],
  amber:   [217, 119,   6],
  indigo:  [79,   70, 229],
};

function generatePDF(modules) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297, M = 16, CW = PW - M * 2;
  let y = M;

  const rgb  = (col) => doc.setTextColor(...col);
  const fill = (col) => doc.setFillColor(...col);
  const drw  = (col) => doc.setDrawColor(...col);
  const font = (style, size) => { doc.setFont('helvetica', style); doc.setFontSize(size); };

  const newPage = () => { doc.addPage(); y = M; };
  const guard   = (need = 10) => { if (y + need > PH - 14) newPage(); };

  const text = (str, x, yPos, opts) => doc.text(str, x, yPos, opts);

  // ── Cover ────────────────────────────────────────────────────
  fill(C.brand); doc.rect(0, 0, PW, PH, 'F');

  // decorative circles
  fill([139, 92, 246]); doc.circle(180, 40, 35, 'F');
  fill([76, 29, 149]);  doc.circle(30, 260, 50, 'F');
  fill([109, 40, 217]); doc.circle(160, 230, 25, 'F');

  font('bold', 32); rgb(C.white);
  text('Project Module', M, 90);
  text('Technical', M, 108);
  text('Specification', M, 126);

  font('normal', 12); rgb([196, 181, 253]);
  text('Requirements · Behaviour · Implementation', M, 142);

  font('normal', 10); rgb([167, 139, 250]);
  text(`Generated ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}`, M, 160);
  text(`${modules.length} modules documented`, M, 168);

  // contents box
  fill([76, 29, 149]); doc.roundedRect(M, 185, CW, modules.length * 14 + 14, 3, 3, 'F');
  font('bold', 11); rgb(C.white);
  text('Contents', M + 6, 197);
  font('normal', 9.5);
  modules.forEach((m, i) => {
    rgb([196, 181, 253]); text(`${i + 1}.`, M + 6, 209 + i * 13);
    rgb(C.white);         text(m.title, M + 13, 209 + i * 13);
  });

  // ── Module pages ─────────────────────────────────────────────
  modules.forEach((mod, mi) => {
    newPage();

    // header band
    fill(C.brandDk); doc.rect(0, 0, PW, 28, 'F');
    fill(C.brand);   doc.rect(0, 20, PW, 8, 'F');
    font('bold', 15); rgb(C.white);
    text(`${mi + 1}. ${mod.title}`, M, 14);
    font('normal', 8); rgb([196, 181, 253]);
    text(`Route: ${mod.route}`, M, 23);
    y = 36;

    // Purpose
    guard(16);
    fill(C.bgVio); doc.roundedRect(M, y, CW, 6, 1, 1, 'F');
    font('bold', 8); rgb(C.brand);
    text('PURPOSE', M + 3, y + 4.3);
    y += 8;
    const pLines = doc.splitTextToSize(mod.purpose, CW);
    pLines.forEach(l => { guard(5); font('normal', 9); rgb(C.dark); text(l, M, y); y += 5; });
    y += 4;

    // Requirements heading
    guard(8);
    font('bold', 10); rgb(C.dark);
    text('MODULE REQUIREMENTS', M, y); y += 6;

    mod.sections.forEach((sec, si) => {
      guard(28);

      // section header
      fill(C.bgVio); drw(C.brand); doc.setLineWidth(0.4);
      doc.roundedRect(M, y, CW, 7, 1.5, 1.5, 'FD');
      font('bold', 9); rgb(C.brand);
      text(`${si + 1}. ${sec.heading}`, M + 3, y + 4.8);
      y += 9;

      const rows = [
        { label: 'WHAT IT DOES', bg: C.bgGreen, lc: C.green,  value: sec.what },
        { label: 'SHOULD / MUST', bg: C.bgAmb,  lc: C.amber,  value: sec.should },
        { label: 'HOW IT WORKS', bg: C.bgInd,   lc: C.indigo, value: sec.how },
      ];

      rows.forEach(({ label, bg, lc, value }) => {
        const vLines = doc.splitTextToSize(value, CW - 34);
        const rowH = Math.max(vLines.length * 4.7 + 5, 11);
        guard(rowH + 2);

        fill(C.bgGray); drw(C.border); doc.setLineWidth(0.2);
        doc.rect(M, y, CW, rowH, 'FD');

        // label col
        fill(bg); doc.rect(M, y, 32, rowH, 'F');
        font('bold', 6.5); rgb(lc);
        text(label, M + 2, y + 4.5);

        // value col
        font('normal', 8.5); rgb(C.dark);
        vLines.forEach((l, li) => text(l, M + 34, y + 4.5 + li * 4.7));
        y += rowH + 1;
      });
      y += 5;
    });

    // Entity fields
    guard(14);
    fill(C.bgGreen); drw([134, 239, 172]); doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, 7, 1.5, 1.5, 'FD');
    font('bold', 9); rgb(C.green);
    text('ENTITY FIELDS', M + 3, y + 4.8); y += 10;

    mod.entityFields.forEach(f => {
      guard(5);
      font('normal', 8); rgb(C.mid);
      text(`• ${f}`, M + 3, y); y += 4.5;
    });
    y += 3;

    // Related entities
    guard(10);
    font('bold', 8.5); rgb(C.dark);
    text('Related Entities: ', M, y);
    font('normal', 8.5); rgb(C.brand);
    text(mod.relatedEntities.join('  ·  '), M + 33, y);
    y += 8;
  });

  // ── Footer on every page ─────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drw(C.border); doc.setLineWidth(0.25);
    doc.line(M, PH - 11, PW - M, PH - 11);
    font('normal', 7); rgb(C.light);
    text('Project Module Technical Specification — Confidential', M, PH - 6);
    text(`Page ${p} of ${total}`, PW - M, PH - 6, { align: 'right' });
  }

  doc.save('project-module-spec.pdf');
}

// ─────────────────────────────────────────────────────────────────
// Page UI
// ─────────────────────────────────────────────────────────────────
const ROW_META = [
  { key: 'what',   label: 'WHAT',   bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-700 dark:text-emerald-400' },
  { key: 'should', label: 'SHOULD', bg: 'bg-amber-50 dark:bg-amber-900/10',     text: 'text-amber-700 dark:text-amber-400' },
  { key: 'how',    label: 'HOW',    bg: 'bg-indigo-50 dark:bg-indigo-900/10',   text: 'text-indigo-700 dark:text-indigo-400' },
];

export default function ProjectModuleSpec() {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => { generatePDF(MODULES); setExporting(false); }, 80);
  };

  return (
    <div className="p-6 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Project Module Specification
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {MODULES.length} modules · sourced from actual component implementations
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {exporting ? 'Generating…' : 'Export PDF'}
        </Button>
      </div>

      {MODULES.map((mod, mi) => (
        <Card key={mod.id} className="overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Module header */}
          <div className="bg-gradient-to-r from-violet-700 to-violet-600 px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">{mod.title}</h2>
                <p className="text-violet-200 text-xs mt-1 font-mono">{mod.route}</p>
              </div>
              <Badge className="bg-white/20 text-white border-0 shrink-0 text-xs">
                Module {mi + 1}
              </Badge>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Purpose */}
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 border border-violet-100 dark:border-violet-800">
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1.5">Purpose</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{mod.purpose}</p>
            </div>

            {/* Sections */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Requirements</p>
              {mod.sections.map((sec, si) => (
                <div key={si} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Section heading */}
                  <div className="bg-violet-50 dark:bg-violet-900/20 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                      {si + 1}. {sec.heading}
                    </span>
                  </div>
                  {/* What / Should / How rows */}
                  {ROW_META.map(({ key, label, bg, text: textCls }) => (
                    <div key={key} className="grid grid-cols-12 divide-x divide-gray-100 dark:divide-gray-800 border-t border-gray-100 dark:border-gray-800 first:border-t-0">
                      <div className={`col-span-2 ${bg} px-3 py-3 flex items-start justify-center`}>
                        <span className={`text-[10px] font-bold ${textCls} uppercase tracking-wide mt-0.5 text-center`}>
                          {label}
                        </span>
                      </div>
                      <div className="col-span-10 px-4 py-3">
                        <p className={`text-sm leading-relaxed ${key === 'how' ? 'font-mono text-xs text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {sec[key]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Entity fields */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2.5">Entity Fields</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                {mod.entityFields.map((f, i) => (
                  <p key={i} className="text-xs text-gray-600 dark:text-gray-400 font-mono">• {f}</p>
                ))}
              </div>
            </div>

            {/* Related entities */}
            <div className="flex flex-wrap gap-1.5">
              {mod.relatedEntities.map(e => (
                <Badge key={e} variant="outline" className="text-xs text-violet-700 border-violet-200 dark:text-violet-300 dark:border-violet-700">
                  {e}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
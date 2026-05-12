import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

// ─────────────────────────────────────────────
// Spec data
// ─────────────────────────────────────────────
const MODULES = [
  {
    id: 'projects-list',
    title: 'Projects — List / Overview Page',
    route: '/Projects',
    purpose:
      'Central hub for browsing, creating, and managing all projects across the organisation. Provides at-a-glance health metrics and supports three view modes so users can work in the layout that suits their workflow.',
    sections: [
      {
        heading: 'Stats Dashboard',
        what: 'Four summary cards: Total Projects, Active Projects, Total Budget, Average Progress.',
        should: 'Compute values live from the full (unfiltered) project list every time projects are fetched.',
        how: 'Read-only derived values calculated in JSX from the `projects` array returned by `base44.entities.Project.list("-created_date", 200)`.',
      },
      {
        heading: 'Search & Filters',
        what: 'Free-text search box plus collapsible Status and Priority filter dropdowns.',
        should:
          'Instantly filter the visible project cards without a network request. Clearing filters resets both dropdowns to "all".',
        how: '`useMemo` over the `projects` array, gating each record on `name.toLowerCase().includes(searchTerm)`, `status === statusFilter`, and `priority === priorityFilter`.',
      },
      {
        heading: 'View Mode Switcher',
        what: 'Three toggle buttons: Grid (card layout), Board (Kanban per project), Timeline (Gantt-style).',
        should: 'Remember last-used mode within the session. Default to "board" on first load.',
        how: '`useState("board")`. Each mode renders a different child component: <ProjectGrid>, <ProjectKanbanBoard>, or <ProjectTimeline>.',
      },
      {
        heading: 'Grid View',
        what: 'Responsive 1–3 column card grid; each card shows name, company, status badge, priority badge, member count, progress bar, due date, and budget summary.',
        should:
          'Skeleton placeholders shown while loading. Empty-state CTA shown when no projects match filters.',
        how: 'Cards rendered from `filteredProjects`. Company name resolved client-side via the `companies` lookup array.',
      },
      {
        heading: 'Kanban Board View',
        what: 'Project selector dropdown + full Kanban board of tasks for the selected project.',
        should:
          'Allow inline task status drag-and-drop. "Add Task" button opens TaskModal pre-filled with the selected project.',
        how: '`<ProjectKanbanBoard>` receives `tasks` filtered to `task.project_id === selectedProject.id`. Status changes call `Task.update(id, { status })` via `updateTaskMutation`.',
      },
      {
        heading: 'Timeline View',
        what: 'Horizontal Gantt-style timeline showing all filtered projects and their tasks on a date axis.',
        should: 'Clicking a project bar opens the edit modal; clicking a task bar opens TaskModal.',
        how: '`<ProjectTimeline projects={filteredProjects} tasks={tasks} milestones={[]} />`.',
      },
      {
        heading: 'Create / Edit Project Modal',
        what: 'Full-form modal: name, description, status, priority, start/end dates, budget, team members, company, contact, project_type, and project_type_data fields.',
        should:
          'On create: auto-generate media folders via `generateProjectFolders` (non-blocking). On save: invalidate the `["projects"]` query.',
        how: '`<ProjectModal>` driven by `createMutation` (POST) or `updateMutation` (PATCH). `project_type` enum drives which `project_type_data` sub-fields render inside the modal.',
      },
      {
        heading: 'Task Quick-Create',
        what: 'TaskModal accessible from the Kanban "Add Task" button and the board column "+" icons.',
        should: 'Auto-attach `project_id` of the currently selected project.',
        how: '`createTaskMutation` calls `Task.create({ ...data, project_id: selectedProject?.id })`.',
      },
    ],
    entity: 'Project',
    entityFields: [
      'name (string, required)',
      'description (string)',
      'status (enum: planning | active | on_hold | completed | cancelled, default: planning)',
      'priority (enum: low | medium | high | critical, default: medium)',
      'start_date (date)',
      'end_date (date)',
      'progress (number 0–100, default 0)',
      'budget (number)',
      'budget_spent (number, default 0)',
      'team_members (string[])',
      'company_id (string FK)',
      'contact_id (string FK)',
      'tags (string[])',
      'notes (string)',
      'project_type (enum: project | photo_video_shoot | graphic_design | photo_video | pdf_document, default: project)',
      'project_type_data (object, free-form, default: {})',
      'created_by_name (string, nullable)',
      'workflow_history (array of audit entries, default: [])',
    ],
    relatedEntities: ['Task', 'Company', 'Contact'],
  },
  {
    id: 'project-detail',
    title: 'Project Detail Page',
    route: '/ProjectDetail?id=<projectId>',
    purpose:
      'Deep-dive dashboard for a single project. Surfaces budget, progress, tasks, milestones, team performance, and media-folder/approval workflows in one unified view.',
    sections: [
      {
        heading: 'Page Header',
        what: 'Project name, description, Back button (→ /Projects), Share button, and Add Task button.',
        should: 'Share button is a placeholder stub; Add Task opens TaskModal with `project_id` pre-set.',
        how: 'Project loaded by filtering `Project.list()` for the `id` URL param. `useSearchParams()` extracts `?id=`.',
      },
      {
        heading: 'Top Metrics Row (4 cards)',
        what: 'Project Budget (total), Spent (budget_spent), Goal Completion donut chart (% tasks completed), Time Logged (sum of all TimeLog hours for tasks in this project).',
        should:
          'Donut chart uses an SVG circle with `strokeDashoffset` driven by `completionRate`. Budget percentage shown as secondary text.',
        how: 'All four values derived in-component: `completionRate = (completed / total) * 100`, `budgetPercentage = (budget_spent / budget) * 100`, `totalHours = timeLogs.reduce(sum + log.hours, 0)`.',
      },
      {
        heading: 'Board Summary Card',
        what: 'Status badge + three horizontal progress bars: In Progress, To Do, Done — each labeled with task count.',
        should: 'Bars proportional to `taskCount / tasks.length`.',
        how: 'Bar width set via inline `style={{ width: \`${(count / tasks.length) * 100}%\` }}`.',
      },
      {
        heading: 'Milestones Card',
        what: 'List of project milestones ordered by `due_date`, each showing name, due date, status badge, and completion icon.',
        should:
          'Completed milestones show a filled green checkmark. "Add" button opens MilestoneModal.',
        how: '`ProjectMilestone.filter({ project_id }, "due_date")`. Create via `createMilestoneMutation`.',
      },
      {
        heading: 'All Tasks List',
        what: 'Full task list with status badge, assignee name, due date, and a delete button per row.',
        should: 'Delete is immediate (no confirmation). Assignee name resolved from `users` list by email.',
        how: '`Task.filter({ project_id }, "-created_date")`. Delete calls `Task.delete(taskId)` via `deleteTaskMutation`.',
      },
      {
        heading: 'Team Leaderboard',
        what: 'Top-5 ranked list of team members by number of completed tasks, with rank badge and task count.',
        should: 'Only users with at least one completed task appear. Updates live as tasks are completed.',
        how: '`tasks.reduce` groups by `assigned_to` where `status === "completed"`, sorted descending, sliced to 5.',
      },
      {
        heading: 'Project Details Sidebar',
        what: 'Read-only summary: Start Date, End Date, Team Members.',
        should: 'Fields only rendered when non-empty.',
        how: 'Direct reads from the `project` object returned by the query.',
      },
      {
        heading: 'Media Folders & Approvals Section',
        what: 'Full `<ProjectFoldersView>` component showing auto-generated folder tree and approval workflow for media assets.',
        should:
          'Folders are created automatically on project creation via `generateProjectFolders`. Approvals allow team review of uploaded assets.',
        how: '`<ProjectFoldersView project={project} />` handles its own data fetching internally.',
      },
      {
        heading: 'Task Creation (from detail)',
        what: 'TaskModal launched from the header "Add Task" button.',
        should:
          'On save, call `notifyAssignment` backend function if `assigned_to` is set, sending an email notification to the assignee.',
        how: '`createTaskMutation` calls `Task.create({ ...data, project_id })`, then `base44.functions.invoke("notifyAssignment", { task_id, entity_type, assigned_to, assigned_by, title, due_date })`.',
      },
      {
        heading: 'Milestone Creation',
        what: 'MilestoneModal launched from the Milestones card "Add" button.',
        should: 'Auto-attach `project_id`. Invalidate `["project-milestones", projectId]` on success.',
        how: '`createMilestoneMutation` calls `ProjectMilestone.create({ ...data, project_id })`.',
      },
    ],
    entity: 'Project + Task + ProjectMilestone + TimeLog + User',
    entityFields: [
      'Project: all fields (same as Projects page)',
      'Task: id, title, status, assigned_to, due_date, project_id',
      'ProjectMilestone: id, name, status, due_date, project_id',
      'TimeLog: id, task_id, hours, date',
      'User: id, email, full_name',
    ],
    relatedEntities: ['Task', 'ProjectMilestone', 'TimeLog', 'User', 'MediaFolder'],
  },
  {
    id: 'project-type-data',
    title: 'Project Type — Custom Fields (project_type_data)',
    route: 'Rendered inside ProjectModal and ProjectDetail',
    purpose:
      'Extends the base Project record with type-specific metadata without polluting the top-level schema. The shape of `project_type_data` varies by `project_type`.',
    sections: [
      {
        heading: 'project_type: "project" (default)',
        what: 'No extra fields beyond the base project schema.',
        should: 'Render no additional inputs in the modal.',
        how: 'Conditional section rendered only when `project_type !== "project"` or `project_type` is absent.',
      },
      {
        heading: 'project_type: "photo_video_shoot"',
        what: 'Fields: shoot_start_at (datetime), shoot_end_at (datetime), location_text (string), indoor_outdoor (enum: indoor | outdoor | both), equipment_list (string textarea), caption_copy_text (string textarea), use_case (multi-select: social_media | website | ad | commercial | pdf | other), use_case_other (string, shown when "other" selected).',
        should: 'shoot_end_at must be after shoot_start_at. use_case_other only visible when "other" is in use_case array.',
        how: 'Stored as `project_type_data.shoot_start_at`, etc. Read/written via a controlled form section that merges into `project_type_data` before calling `Project.create/update`.',
      },
      {
        heading: 'project_type: "graphic_design"',
        what: 'Fields: summary_field (string), google_font_family (string), hex_codes_colors (string — comma-separated hex codes), use_case (multi-select same as above), use_case_other (string).',
        should: 'hex_codes_colors displayed as a colour-swatch preview row next to the input.',
        how: 'Parse `hex_codes_colors.split(",").map(s => s.trim())` to render inline colour circles.',
      },
      {
        heading: 'project_type: "photo_video"',
        what: 'Fields: summary_field (string), use_case (multi-select), use_case_other (string), caption_copy_text (string textarea).',
        should: 'Lighter form than "photo_video_shoot" — no shoot scheduling fields.',
        how: 'Same merge pattern into `project_type_data`.',
      },
      {
        heading: 'project_type: "pdf_document"',
        what: 'Fields: summary_field (string), copy_text (string — rich text / long textarea), use_case (multi-select), use_case_other (string).',
        should: 'copy_text may be long; render as a resizable textarea or a rich-text editor.',
        how: 'Stored as `project_type_data.copy_text`.',
      },
      {
        heading: 'Persistence Strategy',
        what: 'All sub-fields are stored inside the single `project_type_data` JSON object, never as top-level project fields.',
        should: 'When switching `project_type`, preserve existing `project_type_data` keys to avoid accidental data loss on misclick.',
        how: 'Merge patch: `Project.update(id, { project_type, project_type_data: { ...existing, ...newFields } })`.',
      },
    ],
    entity: 'Project (project_type_data sub-object)',
    entityFields: [
      'summary_field (string)',
      'google_font_family (string)',
      'hex_codes_colors (string)',
      'use_case (string[])',
      'use_case_other (string)',
      'shoot_start_at (ISO datetime string)',
      'shoot_end_at (ISO datetime string)',
      'location_text (string)',
      'indoor_outdoor (enum: indoor | outdoor | both)',
      'equipment_list (string)',
      'caption_copy_text (string)',
      'copy_text (string)',
    ],
    relatedEntities: ['Project'],
  },
  {
    id: 'workflow-history',
    title: 'Project Workflow History (Audit Trail)',
    route: 'Rendered inside ProjectDetail sidebar / Activity tab',
    purpose:
      'Append-only log of every meaningful change to a project. Provides accountability, debugging context, and a human-readable change history visible to all team members.',
    sections: [
      {
        heading: 'Entry Structure',
        what: 'Each entry: action (string), by_email (string|null), by_name (string|null), timestamp (ISO string), note (string|null — comma-separated changed field names).',
        should: 'Never delete or edit existing entries. Only append.',
        how: 'Stored in `project.workflow_history` (array). On each `Project.update()` the caller appends a new entry to the existing array before calling the SDK.',
      },
      {
        heading: 'Standard Action Values',
        what: '"created", "updated", "status_changed", "type_changed", "member_added", "member_removed", "milestone_completed".',
        should: '"updated" entries should include a `note` listing the names of fields that changed (e.g. "name, priority, end_date").',
        how: 'Before calling `Project.update`, compute `Object.keys(changedFields).join(", ")` and insert as `note`.',
      },
      {
        heading: 'Authorship Stamping',
        what: 'Each entry stamped with the current user\'s email (`by_email`) and display name (`by_name`) at the moment of the action.',
        should: 'Read from `base44.auth.me()` at the time of the mutation.',
        how: '`const user = await base44.auth.me(); entry.by_email = user.email; entry.by_name = user.full_name;`',
      },
      {
        heading: 'UI Display',
        what: 'Chronological list (newest-first) showing actor avatar/initials, action label, timestamp (relative e.g. "2 hours ago"), and note badge.',
        should: 'Collapsed to 5 entries by default with a "Show all" expand button.',
        how: 'Slice `[...workflow_history].reverse().slice(0, showAll ? Infinity : 5)`.',
      },
      {
        heading: 'created_by_name Field',
        what: 'A separate top-level field (not inside workflow_history) that stores the display name of the original creator.',
        should: 'Set once on project creation; never overwritten on subsequent updates.',
        how: 'On `Project.create(data)`, include `created_by_name: user.full_name`. On `Project.update`, explicitly omit this field from the payload.',
      },
    ],
    entity: 'Project (workflow_history array + created_by_name string)',
    entityFields: [
      'workflow_history[].action (string, required)',
      'workflow_history[].by_email (string|null)',
      'workflow_history[].by_name (string|null)',
      'workflow_history[].timestamp (ISO string, required)',
      'workflow_history[].note (string|null)',
      'created_by_name (string|null, top-level, write-once)',
    ],
    relatedEntities: ['Project', 'User'],
  },
  {
    id: 'media-folders',
    title: 'Project Media Folders & Approvals',
    route: 'Rendered inside ProjectDetail (/ProjectDetail?id=<id>)',
    purpose:
      'Automatically scaffolds a folder hierarchy for each new project based on its `project_type`, and provides an in-app approval workflow for uploaded media assets.',
    sections: [
      {
        heading: 'Auto-Generation on Project Create',
        what: 'When a new project is saved, media folders are created automatically matching the project type (e.g. "Raw Footage", "Edited", "Finals" for photo/video shoots).',
        should:
          'Failure to generate folders must NOT block project creation — it is non-blocking and errors are swallowed.',
        how: '`generateProjectFolders({ id, name, type, created_by })` called in `createMutation.onSuccess`. Uses `base44.entities.MediaFolder.bulkCreate` internally.',
      },
      {
        heading: 'Folder Tree View',
        what: 'Collapsible folder tree showing all MediaFolders whose `project_id` matches. Files within each folder shown as thumbnails or list rows.',
        should: 'Support file upload per folder. Show file count badge on folder nodes.',
        how: '`<ProjectFoldersView project={project} />` fetches `MediaFolder.filter({ project_id })` and `MediaAsset.filter({ folder_id })` internally.',
      },
      {
        heading: 'Approval Workflow',
        what: 'Each file/asset can be submitted for review. Reviewers can Approve, Request Changes, or Reject with a comment.',
        should:
          'Only the asset uploader or a project admin can submit for approval. Approval status reflected in the folder thumbnail view.',
        how: '`<FolderApprovalsManager>` and `<PostApprovalPanel>` driven by `ApprovalRequest` entity. Status transitions: draft → pending_review → approved | changes_requested | rejected.',
      },
      {
        heading: 'Notifications',
        what: 'On approval state change, the relevant party (uploader or reviewer) receives an in-app notification.',
        should:
          'Notification text should include the asset name and new status.',
        how: '`base44.functions.invoke("createNotification", { ... })` called inside the approval mutation `onSuccess`.',
      },
    ],
    entity: 'MediaFolder + MediaAsset + ApprovalRequest',
    entityFields: [
      'MediaFolder: id, name, project_id, parent_folder_id, created_by',
      'MediaAsset: id, name, file_url, folder_id, project_id, created_by',
      'ApprovalRequest: id, asset_id, status, submitted_by, reviewed_by, comment, created_date',
    ],
    relatedEntities: ['MediaFolder', 'MediaAsset', 'ApprovalRequest', 'Notification'],
  },
];

// ─────────────────────────────────────────────
// PDF generation
// ─────────────────────────────────────────────
function generatePDF(modules) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 18;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = 0;

  const colors = {
    brand: [109, 40, 217],
    dark: [17, 24, 39],
    mid: [75, 85, 99],
    light: [156, 163, 175],
    bg: [248, 250, 252],
    border: [229, 231, 235],
    accent: [237, 233, 254],
  };

  const checkNewPage = (needed = 10) => {
    if (y + needed > PAGE_H - 15) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const setColor = (rgb) => doc.setTextColor(...rgb);
  const setFill = (rgb) => doc.setFillColor(...rgb);
  const setDraw = (rgb) => doc.setDrawColor(...rgb);

  // ── Cover page ──────────────────────────────
  setFill(colors.brand);
  doc.rect(0, 0, PAGE_W, 80, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  setColor([255, 255, 255]);
  doc.text('Project Module', MARGIN, 38);
  doc.text('Technical Specification', MARGIN, 50);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Requirements · Behaviour · Implementation', MARGIN, 62);

  setColor(colors.mid);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, MARGIN, 90);
  doc.text(`Modules covered: ${modules.length}`, MARGIN, 97);

  // Module index
  y = 112;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setColor(colors.dark);
  doc.text('Contents', MARGIN, y);
  y += 7;

  modules.forEach((mod, i) => {
    checkNewPage(8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setColor(colors.brand);
    doc.text(`${i + 1}.`, MARGIN, y);
    setColor(colors.dark);
    doc.text(mod.title, MARGIN + 6, y);
    setColor(colors.light);
    doc.text(mod.route, MARGIN + 6, y + 4.5);
    y += 12;
  });

  // ── Module pages ────────────────────────────
  modules.forEach((mod) => {
    doc.addPage();
    y = MARGIN;

    // Module header bar
    setFill(colors.brand);
    doc.rect(0, 0, PAGE_W, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    setColor([255, 255, 255]);
    doc.text(mod.title, MARGIN, 14);

    y = 30;

    // Route pill
    setFill(colors.accent);
    doc.roundedRect(MARGIN, y, CONTENT_W, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setColor(colors.brand);
    doc.text(`Route: ${mod.route}`, MARGIN + 3, y + 5.5);
    y += 13;

    // Purpose
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(colors.dark);
    doc.text('Purpose', MARGIN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    setColor(colors.mid);
    const purposeLines = doc.splitTextToSize(mod.purpose, CONTENT_W);
    purposeLines.forEach((line) => {
      checkNewPage(6);
      doc.text(line, MARGIN, y);
      y += 5;
    });
    y += 4;

    // Sections table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(colors.dark);
    doc.text('Module Requirements', MARGIN, y);
    y += 6;

    mod.sections.forEach((sec, si) => {
      checkNewPage(24);

      // Section header
      setFill([245, 243, 255]);
      doc.rect(MARGIN, y - 3, CONTENT_W, 7, 'F');
      setDraw(colors.brand);
      doc.setLineWidth(0.4);
      doc.rect(MARGIN, y - 3, CONTENT_W, 7, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      setColor(colors.brand);
      doc.text(`${si + 1}. ${sec.heading}`, MARGIN + 2, y + 1.2);
      y += 8;

      const rows = [
        { label: 'WHAT IT DOES', value: sec.what, labelColor: [5, 150, 105] },
        { label: 'SHOULD / MUST', value: sec.should, labelColor: [217, 119, 6] },
        { label: 'HOW IT WORKS', value: sec.how, labelColor: [79, 70, 229] },
      ];

      rows.forEach(({ label, value, labelColor }) => {
        const valueLines = doc.splitTextToSize(value, CONTENT_W - 38);
        const blockH = Math.max(valueLines.length * 4.8 + 4, 10);
        checkNewPage(blockH + 2);

        setFill(colors.bg);
        doc.rect(MARGIN, y, CONTENT_W, blockH, 'F');
        setDraw(colors.border);
        doc.setLineWidth(0.2);
        doc.rect(MARGIN, y, CONTENT_W, blockH, 'S');

        // Label column
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        setColor(labelColor);
        doc.text(label, MARGIN + 2, y + 4.5);

        // Value column
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        setColor(colors.dark);
        valueLines.forEach((line, li) => {
          doc.text(line, MARGIN + 38, y + 4.5 + li * 4.8);
        });

        y += blockH + 1;
      });
      y += 4;
    });

    // Entity fields
    checkNewPage(16);
    setFill([240, 253, 244]);
    doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor([5, 150, 105]);
    doc.text(`Entity: ${mod.entity}`, MARGIN + 2, y + 4.8);
    y += 10;

    mod.entityFields.forEach((field) => {
      checkNewPage(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setColor(colors.mid);
      doc.text(`• ${field}`, MARGIN + 3, y);
      y += 4.8;
    });
    y += 4;

    // Related entities
    if (mod.relatedEntities?.length) {
      checkNewPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setColor(colors.dark);
      doc.text('Related Entities:', MARGIN, y);
      doc.setFont('helvetica', 'normal');
      setColor(colors.brand);
      doc.text(mod.relatedEntities.join('  ·  '), MARGIN + 34, y);
      y += 8;
    }
  });

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    setDraw(colors.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(colors.light);
    doc.text('Project Module Technical Specification', MARGIN, PAGE_H - 7);
    doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN - 20, PAGE_H - 7);
  }

  doc.save('project-module-spec.pdf');
}

// ─────────────────────────────────────────────
// UI
// ─────────────────────────────────────────────
export default function ProjectModuleSpec() {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      generatePDF(MODULES);
      setExporting(false);
    }, 100);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Project Module Specification
          </h1>
          <p className="text-gray-500 mt-1">
            Technical requirements for all Project-related modules
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {exporting ? 'Generating PDF…' : 'Export to PDF'}
        </Button>
      </div>

      {/* Module cards */}
      <div className="space-y-8">
        {MODULES.map((mod, mi) => (
          <Card key={mod.id} className="overflow-hidden">
            {/* Module title bar */}
            <div className="bg-violet-600 px-6 py-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{mod.title}</h2>
                <p className="text-violet-200 text-sm mt-0.5">{mod.route}</p>
              </div>
              <Badge className="bg-white text-violet-700 font-bold mt-1">
                Module {mi + 1}
              </Badge>
            </div>

            <div className="p-6 space-y-6">
              {/* Purpose */}
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 border border-violet-100 dark:border-violet-800">
                <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-1 uppercase tracking-wide">
                  Purpose
                </p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{mod.purpose}</p>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                  Requirements
                </h3>
                {mod.sections.map((sec, si) => (
                  <div
                    key={si}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div className="bg-violet-50 dark:bg-violet-900/20 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-violet-700 dark:text-violet-300 text-sm">
                        {si + 1}. {sec.heading}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      <div className="grid grid-cols-12 gap-0">
                        <div className="col-span-2 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-3 flex items-start">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mt-0.5">
                            What
                          </span>
                        </div>
                        <div className="col-span-10 px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{sec.what}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-0">
                        <div className="col-span-2 bg-amber-50 dark:bg-amber-900/10 px-3 py-3 flex items-start">
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mt-0.5">
                            Should
                          </span>
                        </div>
                        <div className="col-span-10 px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{sec.should}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-0">
                        <div className="col-span-2 bg-indigo-50 dark:bg-indigo-900/10 px-3 py-3 flex items-start">
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mt-0.5">
                            How
                          </span>
                        </div>
                        <div className="col-span-10 px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-mono text-xs leading-relaxed">
                            {sec.how}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Entity fields */}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-4 border border-emerald-100 dark:border-emerald-800">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2 uppercase tracking-wide">
                  Entity: {mod.entity}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {mod.entityFields.map((f, i) => (
                    <p key={i} className="text-xs text-gray-600 dark:text-gray-400">
                      • {f}
                    </p>
                  ))}
                </div>
              </div>

              {/* Related entities */}
              <div className="flex flex-wrap gap-2">
                {mod.relatedEntities.map((e) => (
                  <Badge
                    key={e}
                    variant="outline"
                    className="text-violet-700 border-violet-300 dark:text-violet-300"
                  >
                    {e}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
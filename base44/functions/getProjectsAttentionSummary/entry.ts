/**
 * Returns the aggregated counts that drive the global "Attention Needed"
 * banner in the notification bell:
 *   - blockedTasks: tasks across all projects with status === 'blocked'
 *   - atRiskProjectsCount: non-completed projects with at least one blocked
 *     task or with task completion below 30%
 *   - hasAttention: convenience flag for the frontend to gate the banner
 *
 * Why this exists: the bell previously fetched up to 200 projects + 1000
 * tasks on every popover open just to derive two numbers. This endpoint
 * pushes that aggregation server-side so the bell only ships the small
 * summary payload over the wire. The aggregation rule is logic-equivalent
 * to `src/utils/projectsAttention.ts` (same at-risk predicate and same
 * blocked-task count) so the two implementations can be kept in sync; the
 * frontend helper stays around for any future surfaces that already have
 * project + task data on hand.
 *
 * Authentication is enforced by `createClientFromRequest`: the entity reads
 * below run with the caller's identity and inherit Base44's row-level
 * scoping, so callers never see projects/tasks they aren't already entitled
 * to read in the bell's existing list queries.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PROJECT_LIMIT = 200;
const TASK_LIMIT = 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [projectsRaw, tasksRaw] = await Promise.all([
      base44.entities.Project.list('-created_date', PROJECT_LIMIT),
      base44.entities.Task.list('-created_date', TASK_LIMIT),
    ]);

    // Runtime guard so a future SDK change to a paginated `{ data, cursor }`
    // shape surfaces as a clean error instead of silently treating
    // `tasks.length === undefined` as zero work.
    if (!Array.isArray(projectsRaw) || !Array.isArray(tasksRaw)) {
      throw new Error('Project.list / Task.list returned an unexpected shape');
    }
    const projects = projectsRaw;
    const tasks = tasksRaw;

    // Surface cap saturation in server logs so a tenant that grows past these
    // limits gets a paper trail instead of a silently undercounted banner.
    // The previous client-side query had the same caps; pushing aggregation
    // server-side hides the truncation behind a 3-field summary, which is
    // why the warning matters here specifically.
    if (projects.length === PROJECT_LIMIT) {
      console.warn(
        `getProjectsAttentionSummary hit PROJECT_LIMIT (${PROJECT_LIMIT}); at-risk count may undercount`
      );
    }
    if (tasks.length === TASK_LIMIT) {
      console.warn(
        `getProjectsAttentionSummary hit TASK_LIMIT (${TASK_LIMIT}); blocked-task count may undercount`
      );
    }

    // Pre-group tasks by project_id once so each project lookup is O(1).
    // Tasks with a missing project_id are intentionally excluded so they
    // can't collide with a project whose id is also missing — that would
    // inflate the at-risk count.
    const tasksByProject = new Map();
    let blockedTasks = 0;
    for (const task of tasks) {
      if (task.status === 'blocked') {
        blockedTasks += 1;
      }
      if (!task.project_id) {
        continue;
      }
      const list = tasksByProject.get(task.project_id);
      if (list) {
        list.push(task);
      } else {
        tasksByProject.set(task.project_id, [task]);
      }
    }

    let atRiskProjectsCount = 0;
    for (const project of projects) {
      if (!project.id || project.status === 'completed') {
        continue;
      }
      const projectTasks = tasksByProject.get(project.id);
      if (!projectTasks || projectTasks.length === 0) {
        continue;
      }
      let projectBlocked = 0;
      let projectCompleted = 0;
      for (const task of projectTasks) {
        if (task.status === 'blocked') {
          projectBlocked += 1;
        } else if (task.status === 'done' || task.status === 'completed') {
          // Two writers exist for completed Tasks — `TaskModal.jsx` persists
          // `'completed'` while older surfaces still write `'done'`. Both
          // values can appear on real records, so the at-risk predicate
          // must accept either. Mirrors `isTaskDone` in
          // `src/utils/taskStatus.ts`; kept inline because Base44 functions
          // can't import frontend modules.
          projectCompleted += 1;
        }
      }
      const completionRate = (projectCompleted / projectTasks.length) * 100;
      if (projectBlocked > 0 || completionRate < 30) {
        atRiskProjectsCount += 1;
      }
    }

    return Response.json({
      blockedTasks,
      atRiskProjectsCount,
      hasAttention: blockedTasks > 0 || atRiskProjectsCount > 0,
    });
  } catch (error) {
    // Log the full message server-side for debugging, but return a generic
    // body to the client so Base44 entity errors (table names, predicate
    // fragments, etc.) don't leak to any authenticated caller.
    console.error('getProjectsAttentionSummary failed:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
});
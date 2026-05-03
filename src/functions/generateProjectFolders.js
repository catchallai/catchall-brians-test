// @ts-nocheck
/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PROJECT_TYPE_FOLDERS = {
  design: [
    { folder_type: "drafts", description: "Initial design drafts and concepts" },
    { folder_type: "assets", description: "Design assets and resources" },
    { folder_type: "approved", description: "Approved designs ready for use" },
    { folder_type: "final", description: "Final deliverables" },
  ],
  marketing: [
    { folder_type: "assets", description: "Marketing materials and graphics" },
    { folder_type: "drafts", description: "Campaign drafts" },
    { folder_type: "approved", description: "Approved marketing content" },
    { folder_type: "final", description: "Final campaigns" },
  ],
  social: [
    { folder_type: "drafts", description: "Social post drafts" },
    { folder_type: "assets", description: "Images, videos, and graphics" },
    { folder_type: "approved", description: "Posts approved for publishing" },
    { folder_type: "archived", description: "Archived posts" },
  ],
  video: [
    { folder_type: "assets", description: "Raw footage and resources" },
    { folder_type: "drafts", description: "Video edits in progress" },
    { folder_type: "approved", description: "Final cuts ready" },
    { folder_type: "final", description: "Completed videos" },
  ],
  content: [
    { folder_type: "drafts", description: "Writing drafts" },
    { folder_type: "assets", description: "Supporting media" },
    { folder_type: "approved", description: "Approved content" },
    { folder_type: "final", description: "Published content" },
  ],
  default: [
    { folder_type: "assets", description: "Project assets" },
    { folder_type: "drafts", description: "Work in progress" },
    { folder_type: "approved", description: "Approved materials" },
    { folder_type: "final", description: "Final deliverables" },
  ],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { project_id, project_name, project_type } = payload;

    if (!project_id || !project_name) {
      return Response.json({ error: 'Missing project_id or project_name' }, { status: 400 });
    }

    const folderTemplates = PROJECT_TYPE_FOLDERS[project_type] || PROJECT_TYPE_FOLDERS.default;

    const foldersToCreate = folderTemplates.map(template => ({
      ...template,
      name: `${project_name} - ${template.folder_type.replace('_', ' ').toUpperCase()}`,
      project_id,
      project_name,
      is_project_auto_generated: true,
      created_by: user.email,
    }));

    const createdFolders = await base44.entities.MediaFolder.bulkCreate(foldersToCreate);

    console.log(`Created ${createdFolders.length} media folders for project ${project_id}`);

    return Response.json({
      success: true,
      folders_created: createdFolders.length,
      folders: createdFolders,
    });
  } catch (error) {
    console.error('Error generating project folders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Map project types to their default folder structure
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

export async function generateProjectFolders(project) {
  try {
    const folderTemplates = PROJECT_TYPE_FOLDERS[project.type] || PROJECT_TYPE_FOLDERS.default;
    
    const foldersToCreate = folderTemplates.map(template => ({
      ...template,
      name: `${project.name} - ${template.folder_type.replace('_', ' ').toUpperCase()}`,
      project_id: project.id,
      project_name: project.name,
      is_project_auto_generated: true,
      created_by: project.created_by || "system",
    }));

    const createdFolders = await base44.entities.MediaFolder.bulkCreate(foldersToCreate);
    toast.success(`Created ${createdFolders.length} media folders for ${project.name}`);
    return createdFolders;
  } catch (error) {
    console.error("Error creating project folders:", error);
    toast.error("Failed to create project folders");
    throw error;
  }
}

export async function deleteProjectFolders(projectId) {
  try {
    const folders = await base44.entities.MediaFolder.filter({ project_id: projectId });
    
    for (const folder of folders) {
      await base44.entities.MediaFolder.delete(folder.id);
    }
    
    toast.success(`Deleted ${folders.length} media folders`);
    return folders.length;
  } catch (error) {
    console.error("Error deleting project folders:", error);
    toast.error("Failed to delete project folders");
    throw error;
  }
}

export function getProjectFolderTemplate(projectType) {
  return PROJECT_TYPE_FOLDERS[projectType] || PROJECT_TYPE_FOLDERS.default;
}
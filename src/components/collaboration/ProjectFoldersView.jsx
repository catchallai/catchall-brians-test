import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Folder, FolderOpen, Upload, File, Plus, ChevronRight, CheckCircle,
  Clock, Eye, AlertCircle, FolderPlus, Loader2, Send
} from "lucide-react";
import { toast } from "sonner";
import { generateProjectFolders, getProjectFolderTemplate } from "./ProjectMediaFolderGenerator";
import ApprovalWorkflowPanel from "./ApprovalWorkflowPanel";

const FOLDER_TYPE_COLORS = {
  assets: "bg-blue-100 text-blue-700",
  drafts: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  final: "bg-purple-100 text-purple-700",
  reference: "bg-gray-100 text-gray-700",
  archived: "bg-slate-100 text-slate-600",
};

const FOLDER_TYPE_ICONS = {
  assets: FolderOpen,
  drafts: Folder,
  approved: FolderOpen,
  final: FolderOpen,
  reference: Folder,
  archived: Folder,
};

const APPROVAL_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700",
  in_review: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ProjectFoldersView({ project }) {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showApprovals, setShowApprovals] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["media-folders", project?.id],
    queryFn: () =>
      project?.id
        ? base44.entities.MediaFolder.filter({ project_id: project.id })
        : Promise.resolve([]),
    enabled: !!project?.id,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ["media-assets", selectedFolder?.id],
    queryFn: () =>
      selectedFolder?.id
        ? base44.entities.MediaAsset.filter({ folder_id: selectedFolder.id })
        : Promise.resolve([]),
    enabled: !!selectedFolder?.id,
  });

  const createAssetMutation = useMutation({
    mutationFn: (data) => base44.entities.MediaAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-assets", selectedFolder?.id] });
      queryClient.invalidateQueries({ queryKey: ["media-folders", project?.id] });
      toast.success("File added to folder");
    },
  });

  const handleGenerateFolders = async () => {
    if (!project?.id) return;
    setIsGenerating(true);
    try {
      await generateProjectFolders({
        ...project,
        type: project.project_type || "default",
      });
      queryClient.invalidateQueries({ queryKey: ["media-folders", project.id] });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !selectedFolder) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await createAssetMutation.mutateAsync({
          file_name: file.name,
          file_url,
          folder_id: selectedFolder.id,
          project_id: project?.id,
          file_type: file.type,
          file_size: file.size,
          approval_status: "pending",
        });
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRequestApproval = async (assetId) => {
    try {
      await base44.entities.MediaAsset.update(assetId, { approval_status: "in_review" });
      queryClient.invalidateQueries({ queryKey: ["media-assets", selectedFolder?.id] });
      toast.success("Sent for approval");
    } catch {
      toast.error("Failed to send for approval");
    }
  };

  // Show folder generation prompt if no folders exist
  const folderTemplate = getProjectFolderTemplate(project?.project_type || "default");

  if (foldersLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Project Media Folders</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {folders.length} folder{folders.length !== 1 ? "s" : ""} · {project?.project_type || "general"} project
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowApprovals(!showApprovals)}
            className="gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Approvals
          </Button>
          {folders.length === 0 && (
            <Button
              size="sm"
              onClick={handleGenerateFolders}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FolderPlus className="w-4 h-4" />
              )}
              Auto-Generate Folders
            </Button>
          )}
        </div>
      </div>

      {/* Folder generation preview if no folders */}
      {folders.length === 0 && (
        <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="p-6 text-center">
            <FolderPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
              No folders yet for this project
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Auto-generate a folder structure based on the{" "}
              <span className="font-medium text-violet-600">{project?.project_type || "default"}</span> project type:
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {folderTemplate.map((t) => (
                <Badge
                  key={t.folder_type}
                  className={FOLDER_TYPE_COLORS[t.folder_type] || "bg-gray-100 text-gray-700"}
                >
                  {t.folder_type.replace("_", " ").toUpperCase()}
                </Badge>
              ))}
            </div>
            <Button onClick={handleGenerateFolders} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FolderPlus className="w-4 h-4" />
              )}
              Generate Project Folders
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Approvals Panel */}
      {showApprovals && (
        <Card>
          <CardContent className="p-4">
            <ApprovalWorkflowPanel projectId={project?.id} />
          </CardContent>
        </Card>
      )}

      {/* Folders Grid */}
      {folders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {folders.map((folder) => {
            const FolderIcon = FOLDER_TYPE_ICONS[folder.folder_type] || Folder;
            const isSelected = selectedFolder?.id === folder.id;
            return (
              <Card
                key={folder.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-violet-500 shadow-md" : ""
                }`}
                onClick={() => setSelectedFolder(isSelected ? null : folder)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <FolderIcon
                    className={`w-10 h-10 ${
                      isSelected ? "text-violet-600" : "text-gray-400"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate w-full">
                      {folder.folder_type.replace("_", " ").toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {folder.description}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs ${FOLDER_TYPE_COLORS[folder.folder_type] || "bg-gray-100"}`}
                  >
                    {folder.file_count || 0} files
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selected Folder Contents */}
      {selectedFolder && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="w-5 h-5 text-violet-500" />
                {selectedFolder.folder_type.replace("_", " ").toUpperCase()}
                <span className="text-sm font-normal text-gray-500">
                  — {selectedFolder.description}
                </span>
              </CardTitle>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button size="sm" variant="outline" className="gap-2" asChild>
                  <span>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload Files
                  </span>
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <File className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No files yet — upload to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <File className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {asset.file_name}
                        </p>
                        {asset.file_size && (
                          <p className="text-xs text-gray-400">
                            {(asset.file_size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={`text-xs ${
                          APPROVAL_STATUS_COLORS[asset.approval_status] || "bg-gray-100"
                        }`}
                      >
                        {asset.approval_status || "pending"}
                      </Badge>
                      {asset.file_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(asset.file_url, "_blank")}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {asset.approval_status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-violet-600 hover:text-violet-700"
                          onClick={() => handleRequestApproval(asset.id)}
                          title="Submit for Approval"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
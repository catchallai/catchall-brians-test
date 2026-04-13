import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Folder, FolderOpen, FileText, MoreVertical, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function FolderTree({
  folders = [],
  pages = [],
  spaceId,
  onAddFolder,
  onDeleteFolder,
  onAddPage,
  currentPageId,
  bookmarkedPageIds = [],
}) {
  const [expandedFolders, setExpandedFolders] = useState({});

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const rootFolders = folders
    .filter((f) => !f.parent_folder_id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const rootPages = pages
    .filter((p) => !p.folder_id && !p.parent_page_id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const getChildFolders = (parentId) => {
    return folders
      .filter((f) => f.parent_folder_id === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const getFolderPages = (folderId) => {
    return pages
      .filter((p) => p.folder_id === folderId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const FolderItem = ({ folder, level = 0 }) => {
    const isExpanded = expandedFolders[folder.id];
    const childFolders = getChildFolders(folder.id);
    const folderPages = getFolderPages(folder.id);

    return (
      <div>
        <div
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group cursor-pointer`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <button onClick={() => toggleFolder(folder.id)} className="p-0.5">
            <ChevronRight
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
          <div onClick={() => toggleFolder(folder.id)} className="flex items-center gap-2 flex-1">
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white">{folder.name}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onAddPage(folder.id)}>
                <FileText className="w-4 h-4 mr-2" />
                Add Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddFolder(folder.id)}>
                <Folder className="w-4 h-4 mr-2" />
                Add Subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeleteFolder(folder.id)} className="text-red-600">
                Delete Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && (
          <div>
            {childFolders.map((child) => (
              <FolderItem key={child.id} folder={child} level={level + 1} />
            ))}
            {folderPages.map((page) => (
              <PageItem key={page.id} page={page} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const PageItem = ({ page, level = 0 }) => {
    const isActive = page.id === currentPageId;

    return (
      <Link
        to={`${createPageUrl('WikiPageEditor')}?spaceId=${spaceId}&pageId=${page.id}`}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group ${
          isActive ? 'bg-violet-50 dark:bg-violet-900/20' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 32}px` }}
      >
        <FileText
          className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-600' : 'text-gray-400'}`}
        />
        <span
          className={`text-sm flex-1 truncate ${
            isActive
              ? 'font-medium text-violet-600'
              : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
          }`}
        >
          {page.title}
        </span>
        {bookmarkedPageIds.includes(page.id) && (
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
        )}
      </Link>
    );
  };

  return (
    <div className="space-y-1">
      {rootFolders.map((folder) => (
        <FolderItem key={folder.id} folder={folder} />
      ))}
      {rootPages.map((page) => (
        <PageItem key={page.id} page={page} />
      ))}
      {rootFolders.length === 0 && rootPages.length === 0 && (
        <div className="text-sm text-gray-500 py-4 text-center">No content yet</div>
      )}
    </div>
  );
}
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Eye, Edit3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function ActiveEditors({ editors = [] }) {
  const activeEditors = editors.filter((e) => e.is_editing);
  const viewers = editors.filter((e) => !e.is_editing);

  if (editors.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {editors.slice(0, 3).map((editor) => (
            <Tooltip key={editor.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-900">
                    <AvatarFallback
                      className={`text-xs ${
                        editor.is_editing
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {editor.user_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {editor.is_editing && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  {editor.is_editing ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{editor.user_name}</span>
                  <span className="text-xs text-gray-400">
                    {editor.is_editing ? 'editing' : 'viewing'}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {editors.length > 3 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    +{editors.length - 3}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {editors.slice(3).map((editor) => (
                    <div key={editor.id} className="text-xs">
                      {editor.user_name}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Users className="w-3 h-3" />
          {activeEditors.length > 0 && (
            <span className="text-green-600">{activeEditors.length} editing</span>
          )}
          {activeEditors.length > 0 && viewers.length > 0 && <span>•</span>}
          {viewers.length > 0 && <span>{viewers.length} viewing</span>}
        </div>
      </div>
    </TooltipProvider>
  );
}

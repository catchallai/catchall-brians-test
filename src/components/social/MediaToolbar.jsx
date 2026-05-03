import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, ChevronDown, ChevronUp, Smile, Hash, Link2, Layers } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ImageOverlayEditor from './ImageOverlayEditor';

export default function MediaToolbar({
  containerRef,
  captionRef,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  isLinkPopoverOpen,
  setIsLinkPopoverOpen,
  mediaMenuTarget,
  setMediaMenuTarget,
  onMediaMenuClick,
  onEmojiSelect,
  onHashtagClick,
  onLinkClick,
  hasImage,
  imageUrl,
  onApplyOverlays
}) {
  const [showOverlayEditor, setShowOverlayEditor] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-gray-100 dark:border-gray-800 mt-1">
        <div className="flex items-center gap-1">
          <Popover
            open={mediaMenuTarget === 'toolbar'}
            onOpenChange={(open) => setMediaMenuTarget(open ? 'toolbar' : null)}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                {mediaMenuTarget === 'toolbar' ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              sideOffset={10}
              className="w-[250px] rounded-xl border border-gray-200 bg-white p-0 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {onMediaMenuClick && onMediaMenuClick()}
            </PopoverContent>
          </Popover>

          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  if (captionRef?.current) {
                    const textarea = captionRef.current;
                    if (document.activeElement === textarea) {
                      // Update caption selection
                    }
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              container={containerRef?.current}
              align="start"
              side="top"
              onFocusOutside={(event) => {
                if (event.target === captionRef?.current) event.preventDefault();
              }}
              className="w-auto p-0 border-0 shadow-none bg-transparent"
            >
              <EmojiPicker
                onEmojiClick={onEmojiSelect}
                lazyLoadEmojis
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
              />
            </PopoverContent>
          </Popover>

          <button
            type="button"
            onClick={onHashtagClick}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Hash className="w-5 h-5" />
          </button>

          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  if (captionRef?.current) {
                    const textarea = captionRef.current;
                    if (document.activeElement === textarea) {
                      // Update caption selection
                    }
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Insert link"
                title="Insert link"
              >
                <Link2 className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              container={containerRef?.current}
              align="start"
              side="top"
              className="w-72 p-3"
              onFocusOutside={(event) => {
                if (event.target === captionRef?.current) event.preventDefault();
              }}
            >
              {onLinkClick && onLinkClick()}
            </PopoverContent>
          </Popover>

          {hasImage && (
            <button
              type="button"
              onClick={() => setShowOverlayEditor(true)}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Add image overlays"
            >
              <Layers className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {showOverlayEditor && imageUrl && (
        <ImageOverlayEditor
          imageUrl={imageUrl}
          onApply={onApplyOverlays}
          onClose={() => setShowOverlayEditor(false)}
        />
      )}
    </>
  );
}
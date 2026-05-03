import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Smile,
  Hash,
  Link2,
  Layers
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import ImageOverlayEditor from './ImageOverlayEditor';
import COPY from '@/lib/copy';

const TypedPopoverContent = PopoverContent;
const TypedLabel = Label;
const TypedInput = Input;
const TypedButton = Button;

export default function ComposerToolbar({
  containerRef,
  captionRef,
  mediaMenuTarget,
  setMediaMenuTarget,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  isLinkPopoverOpen,
  setIsLinkPopoverOpen,
  linkUrl,
  setLinkUrl,
  linkDisplayText,
  setLinkDisplayText,
  onEmojiSelect,
  onLinkInsert,
  linkUrlError,
  onMediaMenuClick,
  formData,
  activePlatform,
  updateCaptionSelection
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
            <TypedPopoverContent
              align="start"
              side="top"
              sideOffset={10}
              className="w-[250px] rounded-xl border border-gray-200 bg-white p-0 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {onMediaMenuClick()}
            </TypedPopoverContent>
          </Popover>

          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  if (document.activeElement === captionRef.current) {
                    updateCaptionSelection(captionRef.current);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <TypedPopoverContent
              container={containerRef.current}
              align="start"
              side="top"
              onFocusOutside={(event) => {
                if (event.target === captionRef.current) event.preventDefault();
              }}
              className="w-auto p-0 border-0 shadow-none bg-transparent"
            >
              <EmojiPicker
                onEmojiClick={onEmojiSelect}
                lazyLoadEmojis
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
              />
            </TypedPopoverContent>
          </Popover>

          <button
            type="button"
            onClick={() => {
              if (document.activeElement === captionRef.current) {
                updateCaptionSelection(captionRef.current);
              }
            }}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Hash className="w-5 h-5" />
          </button>

          <Popover
            open={isLinkPopoverOpen}
            onOpenChange={(open) => {
              if (!open) {
                setLinkUrl('');
                setLinkDisplayText('');
              }
              setIsLinkPopoverOpen(open);
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  if (document.activeElement === captionRef.current) {
                    updateCaptionSelection(captionRef.current);
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Insert link"
                title="Insert link"
              >
                <Link2 className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <TypedPopoverContent
              container={containerRef.current}
              align="start"
              side="top"
              className="w-72 p-3"
              onFocusOutside={(event) => {
                if (event.target === captionRef.current) event.preventDefault();
              }}
            >
              <p className="text-sm font-semibold mb-3">{COPY.linkInserter.title}</p>
              <div className="flex flex-col gap-3">
                <div>
                  <TypedLabel className="text-xs text-gray-500 mb-1 block">
                    {COPY.linkInserter.urlLabel}
                  </TypedLabel>
                  <TypedInput
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder={COPY.linkInserter.urlPlaceholder}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !linkUrlError && linkUrl.trim().length > 0) {
                        onLinkInsert();
                      }
                      if (e.key === 'Escape') setIsLinkPopoverOpen(false);
                    }}
                  />
                  <p className="text-xs text-red-500 mt-1 min-h-[2rem]">{linkUrlError ?? ''}</p>
                </div>
                <div>
                  <TypedLabel className="text-xs text-gray-500 mb-1 block">
                    {COPY.linkInserter.displayTextLabel}
                  </TypedLabel>
                  <TypedInput
                    value={linkDisplayText}
                    onChange={(e) => setLinkDisplayText(e.target.value)}
                    placeholder={COPY.linkInserter.displayTextPlaceholder}
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !linkUrlError && linkUrl.trim().length > 0) {
                        onLinkInsert();
                      }
                      if (e.key === 'Escape') setIsLinkPopoverOpen(false);
                    }}
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <TypedButton
                    size="sm"
                    onClick={onLinkInsert}
                    disabled={!linkUrl.trim().length || !!linkUrlError}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {COPY.linkInserter.insert}
                  </TypedButton>
                </div>
              </div>
            </TypedPopoverContent>
          </Popover>

          {(formData.image_urls?.length ?? 0) > 0 && (
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

        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-medium ${
              formData.caption.length > activePlatform.limit
                ? 'text-red-500'
                : 'text-gray-400'
            }`}
          >
            {formData.caption.length}/{activePlatform.limit}
          </span>
        </div>
      </div>

      {showOverlayEditor && (formData.image_urls?.length ?? 0) > 0 && (
        <ImageOverlayEditor
          imageUrl={formData.image_urls[0]}
          onApply={() => setShowOverlayEditor(false)}
          onClose={() => setShowOverlayEditor(false)}
        />
      )}
    </>
  );
}
import React, { useState, useRef } from 'react';
import { Send, Plus, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FileUploader from './FileUploader';
import RichTextInput from './RichTextInput';

export default function MessageInput({ onSendMessage, onTyping }) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const typingTimeoutRef = useRef(null);

  const handleChange = (val) => {
    setMessage(val);
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!message.trim() && attachedFiles.length === 0) return;

    onSendMessage({
      content: message || (attachedFiles.length > 0 ? 'Shared files' : ''),
      attachments: attachedFiles,
    });

    setMessage('');
    setAttachedFiles([]);
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-2">
      {attachedFiles.length > 0 && (
        <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
          <p className="text-xs font-medium mb-2 text-slate-500">{attachedFiles.length} file(s) attached</p>
          <div className="space-y-1">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-slate-700">{file.name}</span>
                <button onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 mb-0.5">
          <Plus size={20} className="text-slate-500" />
        </Button>

        <RichTextInput
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… use **bold**, _italic_, `code`, or • bullets"
        />

        <div className="flex items-center gap-1 shrink-0 mb-0.5">
          <div className="w-8 h-8 flex items-center justify-center">
            <FileUploader onFilesSelected={setAttachedFiles} maxFiles={5} />
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
            <Mic size={18} className="text-slate-500" />
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/30 h-8 w-8"
            size="icon"
            disabled={!message.trim() && attachedFiles.length === 0}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-400">
          {attachedFiles.length > 0 ? '🔒 Encrypted' : '📝 Standard encryption'}
        </span>
        <span className="text-xs text-slate-400">Enter to send · Shift+Enter for new line</span>
      </div>
    </div>
  );
}
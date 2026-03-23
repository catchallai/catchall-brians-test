import React, { useState } from 'react';
import { Send, Plus, Image, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FileUploader from './FileUploader';

export default function MessageInput({ onSendMessage, onTyping, darkMode }) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const typingTimeoutRef = React.useRef(null);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    // Notify typing
    if (onTyping) {
      onTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() && attachedFiles.length === 0) {
      return;
    }

    onSendMessage({
      content: message || (attachedFiles.length > 0 ? 'Shared files' : ''),
      attachments: attachedFiles,
    });

    setMessage('');
    setAttachedFiles([]);

    // Stop typing indicator
    if (onTyping) {
      onTyping(false);
    }
  };

  return (
    <div className="space-y-2">
      {attachedFiles.length > 0 && (
        <div
          className={`p-3 rounded-lg border ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <p
            className={`text-xs font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
          >
            {attachedFiles.length} file(s) attached
          </p>
          <div className="space-y-1">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{file.name}</span>
                <button
                  onClick={() => setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-2">
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl ${
            darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'
          }`}
        >
          <Button type="button" variant="ghost" size="icon" className="h-auto p-2">
            <Plus size={20} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
          </Button>

          <Input
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="Type a message..."
            className={`flex-1 bg-transparent outline-none border-0 ${
              darkMode
                ? 'text-white placeholder:text-slate-500'
                : 'text-slate-900 placeholder:text-slate-400'
            }`}
          />

          <div className="flex items-center gap-1">
            <div className="w-8 h-8 flex items-center justify-center">
              <FileUploader onFilesSelected={setAttachedFiles} maxFiles={5} />
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-auto p-2">
              <Image size={20} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-auto p-2">
              <Mic size={20} className={darkMode ? 'text-slate-400' : 'text-slate-500'} />
            </Button>
            <Button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white ml-2 shadow-lg shadow-violet-900/30"
              size="icon"
              disabled={!message.trim() && attachedFiles.length === 0}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <span className={`text-xs ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
            {attachedFiles.length > 0 ? '🔒 Encrypted' : '📝 Standard encryption'}
          </span>
          <span className={`text-xs ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Press Enter to send
          </span>
        </div>
      </form>
    </div>
  );
}

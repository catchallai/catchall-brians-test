import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PREDEFINED_STATUSES, DEFAULT_EMOJIS } from './statusConfig';
import { X } from 'lucide-react';

export default function StatusSelector({ currentStatus, onStatusChange }) {
  const [customMessage, setCustomMessage] = useState(currentStatus?.custom_status || '');
  const [selectedEmoji, setSelectedEmoji] = useState(currentStatus?.status_emoji || '✍️');
  const [showCustomInput, setShowCustomInput] = useState(
    currentStatus?.custom_status ? true : false
  );

  const handleSelectStatus = (status) => {
    onStatusChange({
      custom_status: status.label,
      status_emoji: status.emoji,
    });
    setShowCustomInput(false);
  };

  const handleCustomStatus = () => {
    if (customMessage.trim()) {
      onStatusChange({
        custom_status: customMessage,
        status_emoji: selectedEmoji,
      });
      setShowCustomInput(false);
    }
  };

  const handleClearStatus = () => {
    onStatusChange({
      custom_status: '',
      status_emoji: '',
    });
    setCustomMessage('');
    setShowCustomInput(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-sm">
          {currentStatus?.status_emoji} {currentStatus?.custom_status || 'Set status'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Suggested statuses
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PREDEFINED_STATUSES.filter(s => s.id !== 'custom').map((status) => (
                <button
                  key={status.id}
                  onClick={() => handleSelectStatus(status)}
                  className="flex items-center gap-2 p-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <span className="text-lg">{status.emoji}</span>
                  <span className="text-gray-700 dark:text-gray-300 text-xs">
                    {status.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Custom status
            </p>

            {!showCustomInput ? (
              <Button
                variant="outline"
                className="w-full text-left justify-start"
                onClick={() => setShowCustomInput(true)}
              >
                ✍️ Add custom status
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="What's your status?"
                    maxLength={50}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCustomStatus();
                      if (e.key === 'Escape') setShowCustomInput(false);
                    }}
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Choose emoji:</p>
                  <div className="flex gap-1 flex-wrap">
                    {DEFAULT_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`w-8 h-8 text-lg flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                          selectedEmoji === emoji
                            ? 'bg-violet-100 dark:bg-violet-900 ring-2 ring-violet-500'
                            : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCustomStatus}
                    size="sm"
                    className="flex-1"
                    disabled={!customMessage.trim()}
                  >
                    Set status
                  </Button>
                  <Button
                    onClick={() => setShowCustomInput(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {currentStatus?.custom_status && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 dark:text-red-400"
                onClick={handleClearStatus}
              >
                <X className="w-4 h-4 mr-1" />
                Clear status
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
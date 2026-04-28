import { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import MessageInput from './MessageInput';
import FilePreview from './FilePreview';
import VideoCallInterface from './VideoCallInterface';
import CollaborativeDocumentEditor from './CollaborativeDocumentEditor';
import PollWidget from './PollWidget';

export default function ChatArea({
  channel,
  user,
  messages,
  onSendMessage,
  onStartCall,
  onShowProfile,
  typingUsers = [],
  onTyping,
  activeCall,
  onEndCall,
  onToggleRecording,
  onToggleWaitingRoom,
  onAdmitUser,
  onRejectUser,
  updateCallMutation,
}) {
  const messagesEndRef = useRef(null);
  const [sidePanel, setSidePanel] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-slate-900">Select a conversation</h3>
          <p className="text-sm text-slate-400">Choose a channel to start messaging</p>
        </div>
      </div>
    );
  }

  // If call is active, show video interface
  if (activeCall && activeCall.status === 'active') {
    return (
      <div className="flex-1 flex flex-col bg-slate-50">
        <VideoCallInterface
          activeCall={activeCall}
          user={user}
          onEndCall={onEndCall}
          onToggleRecording={onToggleRecording}
          onToggleWaitingRoom={onToggleWaitingRoom}
          onAdmitUser={onAdmitUser}
          onRejectUser={onRejectUser}
          updateCallMutation={updateCallMutation}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
              {channel.name.split(' ')[0][0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-slate-900">{channel.name}</h2>
            <p className="text-sm text-slate-500">{channel.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSidePanel('docs')} title="Documents">
            <FileText size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSidePanel('polls')} title="Polls">
            <BarChart3 size={18} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onStartCall?.()} title="Audio call">
            <Phone size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStartCall?.('video')}
            title="Video call"
          >
            <Video size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShowProfile?.(channel)}
            title="Options"
          >
            <MoreVertical size={18} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {/* Date Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">Today</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Messages */}
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMe={message.sender_email === user?.email}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>
              </div>
            )}

            {typingUsers && typingUsers.length > 0 && (
              <div className="flex items-end gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-slate-600 text-white text-xs">
                    {typingUsers[0]?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="px-4 py-3 rounded-2xl bg-white shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Side Panel for Documents/Polls */}
        {sidePanel && (
          <div className="w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto">
            {sidePanel === 'docs' && (
              <CollaborativeDocumentEditor
                channelId={channel.id}
                user={user}
                onClose={() => setSidePanel(null)}
              />
            )}
            {sidePanel === 'polls' && <PollWidget channelId={channel.id} user={user} />}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} />
      </div>
    </div>
  );
}

const MessageBubble = ({ message, isMe }) => {
  return (
    <div className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
      {!isMe && (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-slate-600 text-white text-xs">
            {message.sender_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && <p className="text-xs font-medium mb-1 text-slate-500">{message.sender_name}</p>}

        <div
          className={`px-4 py-3 rounded-2xl ${
            isMe
              ? 'bg-violet-600 text-white rounded-br-md'
              : 'bg-white text-slate-900 rounded-bl-md shadow-sm'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((file, idx) => (
                <FilePreview key={idx} file={file} />
              ))}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1.5 mt-1 text-xs ${isMe ? 'justify-end' : ''}`}>
          <span className="text-slate-400">
            {new Date(message.created_date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

import { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreVertical, FileText, BarChart3, Hash, Users, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import MessageInput from './MessageInput';
import FilePreview from './FilePreview';
import VideoCallInterface from './VideoCallInterface';
import CollaborativeDocumentEditor from './CollaborativeDocumentEditor';
import PollWidget from './PollWidget';
import MessageReactions from './MessageReactions';
import ThreadPanel from './ThreadPanel';

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
  const [sidePanel, setSidePanel] = useState(null); // 'docs' | 'polls' | 'thread'
  const [threadMessage, setThreadMessage] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpenThread = (msg) => {
    setThreadMessage(msg);
    setSidePanel('thread');
  };

  const handleEditMessage = async (msg) => {
    if (!editContent.trim()) return;
    await base44.entities.Message.update(msg.id, { content: editContent, is_edited: true });
    queryClient.invalidateQueries({ queryKey: ['messages', channel.id] });
    setEditingMessage(null);
    setEditContent('');
  };

  const handleDeleteMessage = async (msgId) => {
    await base44.entities.Message.update(msgId, { is_deleted: true, content: 'This message was deleted' });
    queryClient.invalidateQueries({ queryKey: ['messages', channel.id] });
  };

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hash className="w-8 h-8 text-violet-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900">Select a conversation</h3>
          <p className="text-sm text-slate-400 mt-1">Choose a channel or DM to start messaging</p>
        </div>
      </div>
    );
  }

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

  const visibleMessages = messages.filter((m) => !m.thread_parent_id);

  return (
    <div className="flex-1 flex min-w-0">
      <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
        {/* Chat Header */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
              {channel.type === 'dm' ? (
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-violet-600 text-white text-sm">
                    {channel.name?.[0]}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Hash className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 leading-tight">{channel.name}</h2>
              {channel.description && (
                <p className="text-xs text-slate-400 truncate max-w-xs">{channel.description}</p>
              )}
            </div>
            {channel.members && (
              <div className="flex items-center gap-1 text-xs text-slate-400 ml-2">
                <Users className="w-3.5 h-3.5" />
                <span>{channel.members.length}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setSidePanel(sidePanel === 'docs' ? null : 'docs')} title="Documents" className={sidePanel === 'docs' ? 'bg-slate-100' : ''}>
              <FileText size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSidePanel(sidePanel === 'polls' ? null : 'polls')} title="Polls" className={sidePanel === 'polls' ? 'bg-slate-100' : ''}>
              <BarChart3 size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onStartCall?.()} title="Audio call">
              <Phone size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onStartCall?.('video')} title="Video call">
              <Video size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onShowProfile?.(channel)} title="Options">
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-h-0">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">Today</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {visibleMessages.length > 0 ? (
                visibleMessages.map((message, idx) => {
                  const prevMsg = visibleMessages[idx - 1];
                  const isSameAuthor = prevMsg?.sender_email === message.sender_email &&
                    (new Date(message.created_date) - new Date(prevMsg.created_date)) < 5 * 60 * 1000;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isMe={message.sender_email === user?.email}
                      compact={isSameAuthor}
                      isHovered={hoveredMessage === message.id}
                      onHover={setHoveredMessage}
                      onReply={() => handleOpenThread(message)}
                      onEdit={() => { setEditingMessage(message.id); setEditContent(message.content); }}
                      onDelete={() => handleDeleteMessage(message.id)}
                      isEditing={editingMessage === message.id}
                      editContent={editContent}
                      onEditChange={setEditContent}
                      onEditSave={() => handleEditMessage(message)}
                      onEditCancel={() => setEditingMessage(null)}
                      currentUser={user}
                      channelId={channel.id}
                    />
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Hash className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-600">Welcome to #{channel.name}</p>
                  <p className="text-sm text-slate-400 mt-1">This is the beginning of this conversation.</p>
                </div>
              )}

              {typingUsers.length > 0 && (
                <div className="flex items-end gap-3 mt-2">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-slate-400 text-white text-xs">
                      {typingUsers[0]?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="px-4 py-2.5 rounded-2xl bg-white shadow-sm">
                    <div className="flex items-center gap-1.5">
                      {[0, 150, 300].map((delay) => (
                        <div key={delay} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{typingUsers.join(', ')} typing…</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Side Panel */}
          {sidePanel && sidePanel !== 'thread' && (
            <div className="w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto">
              {sidePanel === 'docs' && (
                <CollaborativeDocumentEditor channelId={channel.id} user={user} onClose={() => setSidePanel(null)} />
              )}
              {sidePanel === 'polls' && (
                <PollWidget channelId={channel.id} user={user} />
              )}
            </div>
          )}

          {/* Thread Panel */}
          {sidePanel === 'thread' && threadMessage && (
            <ThreadPanel
              parentMessage={threadMessage}
              user={user}
              onClose={() => { setSidePanel(null); setThreadMessage(null); }}
            />
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <MessageInput onSendMessage={onSendMessage} onTyping={onTyping} channel={channel} allUsers={[]} />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isMe, compact, isHovered, onHover, onReply, onEdit, onDelete, isEditing, editContent, onEditChange, onEditSave, onEditCancel, currentUser, channelId }) {
  const canEdit = message.sender_email === currentUser?.email && !message.is_deleted;

  return (
    <div
      className="group relative"
      onMouseEnter={() => onHover(message.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={`flex items-start gap-3 px-2 py-1 rounded-lg transition-colors ${isHovered ? 'bg-slate-100' : ''} ${compact ? 'mt-0' : 'mt-3'}`}>
        {!compact ? (
          <Avatar className="w-9 h-9 flex-shrink-0 mt-0.5">
            <AvatarFallback className={`text-white text-sm ${isMe ? 'bg-violet-600' : 'bg-slate-500'}`}>
              {message.sender_name?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-9 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          {!compact && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold text-slate-900">{message.sender_name}</span>
              <span className="text-xs text-slate-400">
                {new Date(message.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {message.is_edited && <span className="text-xs text-slate-400 italic">(edited)</span>}
            </div>
          )}

          {isEditing ? (
            <div className="flex gap-2 items-center">
              <input
                value={editContent}
                onChange={(e) => onEditChange(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-violet-400 rounded-lg outline-none focus:ring-1 focus:ring-violet-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditSave();
                  if (e.key === 'Escape') onEditCancel();
                }}
              />
              <Button size="sm" onClick={onEditSave} className="bg-violet-600 hover:bg-violet-700 text-xs h-7 px-2">Save</Button>
              <Button size="sm" variant="ghost" onClick={onEditCancel} className="text-xs h-7 px-2">Cancel</Button>
            </div>
          ) : (
            <p className={`text-sm leading-relaxed ${message.is_deleted ? 'text-slate-400 italic' : 'text-slate-800'}`}>
              {message.content}
            </p>
          )}

          {message.attachments?.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((file, idx) => (
                <FilePreview key={idx} file={file} />
              ))}
            </div>
          )}

          {!message.is_deleted && (
            <div className="mt-1">
              <MessageReactions message={message} currentUser={currentUser} channelId={channelId} />
            </div>
          )}

          {message.reply_count > 0 && (
            <button
              onClick={onReply}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium mt-1 hover:underline"
            >
              {message.reply_count} repl{message.reply_count === 1 ? 'y' : 'ies'}
            </button>
          )}
        </div>

        {/* Hover Actions */}
        {isHovered && !message.is_deleted && !isEditing && (
          <div className="absolute right-2 top-0 flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm px-1 py-0.5 z-10">
            <button onClick={onReply} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 text-xs" title="Reply in thread">💬</button>
            {canEdit && (
              <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700 text-xs" title="Edit">✏️</button>
            )}
            {canEdit && (
              <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded text-slate-500 hover:text-red-500 text-xs" title="Delete">🗑️</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
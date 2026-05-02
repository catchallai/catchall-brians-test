import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Hash, Lock, Search, X } from 'lucide-react';

export default function NewChannelModal({ open, onClose, onCreateChannel, allUsers, currentUser }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDM, setIsDM] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [tab, setTab] = useState('channel'); // 'channel' | 'dm'

  const filteredUsers = (allUsers || []).filter(
    (u) =>
      !selectedMembers.find((m) => m.email === u.email) &&
      (u.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  const handleCreate = () => {
    if (tab === 'dm') {
      if (selectedMembers.length === 0) return;
      const isGroup = selectedMembers.length > 1;
      onCreateChannel({
        name: isGroup
          ? selectedMembers.map((m) => m.full_name?.split(' ')[0]).join(', ')
          : selectedMembers[0].full_name,
        type: isGroup ? 'group' : 'dm',
        members: [currentUser.email, ...selectedMembers.map((m) => m.email)],
        last_activity: new Date().toISOString(),
      });
    } else {
      if (!name.trim()) return;
      onCreateChannel({
        name: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        type: isPrivate ? 'private' : 'public',
        members: [currentUser.email, ...selectedMembers.map((m) => m.email)],
        last_activity: new Date().toISOString(),
      });
    }
    // Reset
    setName(''); setDescription(''); setIsPrivate(false);
    setSelectedMembers([]); setMemberSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        {/* Tab Selector */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setTab('channel')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${tab === 'channel' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Hash className="w-4 h-4 inline mr-1" /> Channel
          </button>
          <button
            onClick={() => setTab('dm')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${tab === 'dm' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Direct Message
          </button>
        </div>

        <div className="space-y-4">
          {tab === 'channel' && (
            <>
              <div>
                <Label>Channel Name</Label>
                <div className="relative mt-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="e.g. marketing, general"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input
                  placeholder="What is this channel about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {isPrivate ? <Lock className="w-4 h-4 text-slate-600" /> : <Hash className="w-4 h-4 text-slate-600" />}
                  <div>
                    <p className="text-sm font-medium">{isPrivate ? 'Private' : 'Public'} Channel</p>
                    <p className="text-xs text-slate-500">{isPrivate ? 'Only invited members can join' : 'Anyone in the workspace can join'}</p>
                  </div>
                </div>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>
            </>
          )}

          {/* Member picker (for both DMs and channels) */}
          <div>
            <Label>{tab === 'dm' ? 'Select People' : 'Add Members (optional)'}</Label>
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 mb-2">
                {selectedMembers.map((m) => (
                  <span key={m.email} className="flex items-center gap-1 bg-violet-100 text-violet-800 text-xs px-2 py-1 rounded-full">
                    {m.full_name || m.email}
                    <button onClick={() => setSelectedMembers((prev) => prev.filter((x) => x.email !== m.email))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search people..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            {memberSearch && (
              <div className="mt-1 border rounded-lg max-h-48 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="p-3 text-sm text-slate-400">No users found</p>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => { setSelectedMembers((prev) => [...prev, u]); setMemberSearch(''); }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                          {u.full_name?.[0] || u.email?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{u.full_name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleCreate}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
            disabled={tab === 'channel' ? !name.trim() : selectedMembers.length === 0}
          >
            {tab === 'dm' ? 'Open Message' : 'Create Channel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
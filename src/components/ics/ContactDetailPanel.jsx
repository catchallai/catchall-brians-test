import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  X,
  MessageSquare,
  Mail,
  Phone,
  Video,
  Users,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
} from 'lucide-react';
import PresenceIndicator from './PresenceIndicator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

export default function ContactDetailPanel({
  contact,
  presence,
  darkMode,
  isOpen,
  onClose,
  onDirectMessage,
  onGroupMessage,
  onVideoCall,
  onScheduleCall,
  isOwnProfile = false,
  onEditProfile = null,
}) {
  const [showGroupDialog, setShowGroupDialog] = useState(false);

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500',
  };

  return (
    <>
      {/* Slide-out Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-96 transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${darkMode ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-gray-200'}`}
      >
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isOwnProfile ? 'My Profile' : 'Contact Details'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className={`h-8 w-8 ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Profile Section */}
            <Card className={`p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className={`text-2xl font-bold ${darkMode ? 'bg-slate-700 text-white' : 'bg-gray-200 text-gray-900'}`}>
                      {getInitials(contact?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-1 right-1">
                    <PresenceIndicator presence={presence} size="md" />
                  </div>
                </div>

                <div className="text-center">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {contact?.full_name || 'User'}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {contact?.email}
                  </p>
                  {presence?.custom_status && (
                    <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {presence.status_emoji} {presence.custom_status}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap justify-center">
                  <Badge className={`${statusColors[presence?.status || 'offline']}`}>
                    {presence?.status || 'offline'}
                  </Badge>
                  {presence?.in_call && (
                    <Badge className="bg-blue-600">In a call</Badge>
                  )}
                </div>

                {isOwnProfile && onEditProfile ? (
                  <Button
                    onClick={onEditProfile}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={() => onDirectMessage(contact)}
                      variant="outline"
                      className="flex-1 gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </Button>
                    <Button
                      onClick={() => onVideoCall(contact)}
                      className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
                    >
                      <Video className="w-4 h-4" />
                      Video
                    </Button>
                  </div>
                )}

                {!isOwnProfile && (
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={() => setShowGroupDialog(true)}
                      variant="outline"
                      className="flex-1 gap-2 text-xs"
                    >
                      <Users className="w-4 h-4" />
                      Add to Group
                    </Button>
                    <Button
                      onClick={() => onScheduleCall(contact)}
                      variant="outline"
                      className="flex-1 gap-2 text-xs"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Contact Information
              </h4>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                  <p className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {contact?.email}
                  </p>
                </div>
              </div>

              {/* Role */}
              {contact?.role && (
                <div className="flex items-start gap-3">
                  <Briefcase className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Role</p>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {contact.role === 'admin' ? 'Administrator' : 'User'}
                    </p>
                  </div>
                </div>
              )}

              {/* User Status */}
              <div className="flex items-start gap-3">
                <Clock className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <div className="flex-1">
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                  <p className={`text-sm font-medium capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {presence?.status || 'offline'}
                  </p>
                </div>
              </div>

              {/* Last Activity */}
              {presence?.last_activity && (
                <div className="flex items-start gap-3">
                  <Clock className={`w-5 h-5 mt-0.5 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div className="flex-1">
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Activity</p>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {format(new Date(presence.last_activity), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Member Since */}
            {contact?.created_date && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Member Since</p>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {format(new Date(contact.created_date), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        />
      )}

      {/* Group Message Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className={darkMode ? 'bg-slate-900 border-slate-800' : ''}>
          <DialogHeader>
            <DialogTitle className={darkMode ? 'text-white' : ''}>
              Add {contact?.full_name} to Group
            </DialogTitle>
            <DialogDescription>
              This would typically show existing groups or allow creating a new group with this contact.
            </DialogDescription>
          </DialogHeader>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Feature coming soon: Select or create a group to add this contact.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
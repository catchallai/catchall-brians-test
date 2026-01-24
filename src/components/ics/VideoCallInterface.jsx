import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Video,
  Mic,
  MicOff,
  VideoOff as VideoOffIcon,
  PhoneOff,
  ScreenShare,
  StopCircle,
  Circle,
  UserPlus,
  Shield,
  Monitor,
  Settings,
  Maximize,
  Volume2,
  VolumeX
} from "lucide-react";
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useWebRTC } from './useWebRTC';

export default function VideoCallInterface({
  activeCall,
  user,
  onEndCall,
  onToggleRecording,
  onToggleWaitingRoom,
  onAdmitUser,
  updateCallMutation,
}) {
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [pinnedParticipants, setPinnedParticipants] = useState([]); // Support multiple pins
  const videoRefs = useRef({});

  const {
    localStream,
    remoteStreams,
    isAudioEnabled,
    isVideoEnabled,
    videoQuality,
    mutedParticipants,
    initializeLocalStream,
    toggleAudio,
    toggleVideo,
    changeVideoQuality,
    startScreenShare,
    stopScreenShare,
    muteParticipant,
    unmuteParticipant,
    createPeerConnection,
    cleanupConnections,
  } = useWebRTC(activeCall?.room_id, user, activeCall?.participants);

  useEffect(() => {
    if (activeCall) {
      initializeLocalStream();
    }
    return cleanupConnections;
  }, [activeCall, initializeLocalStream, cleanupConnections]);

  // Attach streams to video elements
  useEffect(() => {
    if (localStream && videoRefs.current['local']) {
      videoRefs.current['local'].srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([participantId, stream]) => {
      if (videoRefs.current[participantId]) {
        videoRefs.current[participantId].srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      const success = await startScreenShare();
      if (success) {
        setIsScreenSharing(true);
        const updatedParticipants = activeCall.participants.map(p =>
          p.email === user?.email ? { ...p, is_screen_sharing: true } : p
        );
        updateCallMutation.mutate({
          callId: activeCall.id,
          data: { participants: updatedParticipants },
        });
      }
    } else {
      await stopScreenShare();
      setIsScreenSharing(false);
      const updatedParticipants = activeCall.participants.map(p =>
        p.email === user?.email ? { ...p, is_screen_sharing: false } : p
      );
      updateCallMutation.mutate({
        callId: activeCall.id,
        data: { participants: updatedParticipants },
      });
    }
  };

  const allParticipants = [
    { 
      id: 'local', 
      email: user?.email, 
      name: user?.full_name, 
      isLocal: true,
      status: user?.status || 'online',
      status_emoji: user?.status_emoji || '✨',
    },
    ...(activeCall?.participants?.filter(p => p.email !== user?.email).map((p, idx) => ({
      id: `remote-${idx}`,
      ...p,
      isLocal: false,
      status: p.status || 'online',
      status_emoji: p.status_emoji || '✨',
    })) || []),
  ];

  const isHost = user?.email === activeCall?.host_email;

  const togglePinParticipant = (participantId) => {
    setPinnedParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const gridClass = allParticipants.length === 1 ? 'grid-cols-1'
    : allParticipants.length === 2 ? 'grid-cols-2'
    : allParticipants.length <= 4 ? 'grid-cols-2'
    : allParticipants.length <= 9 ? 'grid-cols-3'
    : 'grid-cols-4';

  const mainParticipants = pinnedParticipants.length > 0
    ? allParticipants.filter(p => pinnedParticipants.includes(p.id))
    : [allParticipants[0]];
  const otherParticipants = allParticipants.filter(p => !pinnedParticipants.includes(p.id) && p.id !== mainParticipants[0]?.id);

  return (
    <div className="bg-gray-900 p-4">
      <Card className="bg-gray-800 border-gray-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center relative">
              <Video className="w-6 h-6 text-white" />
              {activeCall?.recording_status === 'recording' && (
                <Circle className="w-3 h-3 text-red-500 fill-red-500 absolute -top-1 -right-1 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">Video Call Active</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{allParticipants.length} participant(s)</span>
                <span>•</span>
                <span className="capitalize">{videoQuality} Quality</span>
                {activeCall?.recording_status === 'recording' && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-red-400">
                      <Circle className="w-2 h-2 fill-red-400" />
                      Recording
                    </span>
                  </>
                )}
                {activeCall?.waiting_room?.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWaitingRoom(!showWaitingRoom)}
                    className="text-yellow-400 hover:text-yellow-300 ml-2"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    {activeCall.waiting_room.length} waiting
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Video Quality</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => changeVideoQuality('sd')}>
                  {videoQuality === 'sd' && '✓ '}SD (640x480)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeVideoQuality('hd')}>
                  {videoQuality === 'hd' && '✓ '}HD (1280x720)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeVideoQuality('fhd')}>
                  {videoQuality === 'fhd' && '✓ '}Full HD (1920x1080)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onToggleWaitingRoom}>
                  <Shield className="w-4 h-4 mr-2" />
                  Waiting Room {activeCall?.settings?.waiting_room_enabled ? 'On' : 'Off'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={onEndCall} variant="destructive">
              <PhoneOff className="w-4 h-4 mr-2" />
              End Call
            </Button>
          </div>
        </div>

        {/* Waiting Room */}
        {showWaitingRoom && activeCall?.waiting_room?.length > 0 && (
          <Card className="mb-4 p-4 bg-gray-700 border-gray-600">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Waiting Room ({activeCall.waiting_room.length})
            </h3>
            <div className="space-y-2">
              {activeCall.waiting_room.map((person, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback className="bg-violet-600 text-white">
                        {person.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white text-sm font-medium">{person.name}</p>
                      <p className="text-gray-400 text-xs">
                        Waiting since {format(new Date(person.requested_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAdmitUser(person.email, person.name)}
                  >
                    Admit
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Video Grid */}
         {allParticipants.length <= 4 ? (
           <div className={`grid ${gridClass} gap-4 mb-4`}>
             {allParticipants.map((participant) => (
               <div
                 key={participant.id}
                 className={`aspect-video bg-gray-700 rounded-lg relative overflow-hidden group cursor-pointer border-2 ${
                   pinnedParticipants.includes(participant.id) ? 'border-violet-500' : 'border-transparent'
                 }`}
                 onClick={() => togglePinParticipant(participant.id)}
               >
                <video
                  ref={el => videoRefs.current[participant.id] = el}
                  autoPlay
                  playsInline
                  muted={participant.isLocal}
                  className="w-full h-full object-cover"
                />
                {!localStream && participant.isLocal && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-violet-600 text-white text-xl">
                        {participant.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                {participant.is_screen_sharing && (
                  <div className="absolute top-2 right-2 bg-blue-600 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    Sharing
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                  <span>{participant.status_emoji}</span>
                  {participant.name}
                  {participant.isLocal && ' (You)'}
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs text-white">
                  <span className={`w-2 h-2 rounded-full ${
                    participant.status === 'online' ? 'bg-green-500' :
                    participant.status === 'away' ? 'bg-yellow-500' :
                    participant.status === 'busy' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></span>
                  {participant.status}
                </div>
                {isHost && !participant.isLocal && (
                   <Button
                     variant="ghost"
                     size="sm"
                     className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-red-600"
                     onClick={(e) => {
                       e.stopPropagation();
                       mutedParticipants[participant.email]
                         ? unmuteParticipant(participant.email)
                         : muteParticipant(participant.email);
                     }}
                     title={mutedParticipants[participant.email] ? "Unmute" : "Mute"}
                   >
                     {mutedParticipants[participant.email] ? (
                       <MicOff className="w-4 h-4 text-white" />
                     ) : (
                       <Mic className="w-4 h-4 text-white" />
                     )}
                   </Button>
                 )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4">
            {/* Main view - show pinned participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              {mainParticipants.map((participant) => (
                <div key={participant.id} className="aspect-video bg-gray-700 rounded-lg relative overflow-hidden border-2 border-violet-500">
                  <video
                    ref={el => videoRefs.current[participant.id] = el}
                    autoPlay
                    playsInline
                    muted={participant.isLocal}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    <span>{participant.status_emoji}</span>
                    {participant.name}
                    {participant.isLocal && ' (You)'}
                  </div>
                  <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${
                      participant.status === 'online' ? 'bg-green-500' :
                      participant.status === 'away' ? 'bg-yellow-500' :
                      participant.status === 'busy' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></span>
                    {participant.status}
                  </div>
                  {isHost && !participant.isLocal && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute bottom-2 right-2 bg-black/50 hover:bg-red-600"
                      onClick={() => {
                        mutedParticipants[participant.email]
                          ? unmuteParticipant(participant.email)
                          : muteParticipant(participant.email);
                      }}
                    >
                      {mutedParticipants[participant.email] ? (
                        <MicOff className="w-4 h-4 text-white" />
                      ) : (
                        <Mic className="w-4 h-4 text-white" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {/* Thumbnail strip */}
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                {otherParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="w-32 h-20 bg-gray-700 rounded relative cursor-pointer flex-shrink-0"
                    onClick={() => setPinnedParticipant(participant)}
                  >
                    <video
                      ref={el => videoRefs.current[participant.id] = el}
                      autoPlay
                      playsInline
                      muted={participant.isLocal}
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute bottom-1 left-1 bg-black/70 px-1 py-0.5 rounded text-xs text-white flex items-center gap-0.5">
                      <span>{participant.status_emoji}</span>
                      <span className="w-1.5 h-1.5 rounded-full" style={{
                        backgroundColor: participant.status === 'online' ? '#10b981' :
                                        participant.status === 'away' ? '#eab308' :
                                        participant.status === 'busy' ? '#ef4444' :
                                        '#9ca3af'
                      }}></span>
                      {participant.name}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            title={isAudioEnabled ? "Mute" : "Unmute"}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          <Button
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOffIcon className="w-5 h-5" />}
          </Button>
          <Button
            variant={isScreenSharing ? "default" : "secondary"}
            size="lg"
            onClick={handleScreenShare}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            {isScreenSharing ? <StopCircle className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
          </Button>
          <Button
            variant={activeCall?.recording_status === 'recording' ? "destructive" : "secondary"}
            size="lg"
            onClick={onToggleRecording}
            title={activeCall?.recording_status === 'recording' ? "Pause recording" : "Start recording"}
          >
            {activeCall?.recording_status === 'recording' ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
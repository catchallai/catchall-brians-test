import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
  Image as ImageIcon,
  Pencil,
  Link as LinkIcon,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useWebRTC } from './useWebRTC';
import WhiteboardCanvas from './WhiteboardCanvas';
import { WhiteboardVersionManager } from './WhiteboardVersionManager';

export default function VideoCallInterface({
  activeCall,
  user,
  onEndCall,
  onToggleRecording,
  onToggleWaitingRoom,
  onAdmitUser,
  onRejectUser,
  updateCallMutation,
}) {
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [pinnedParticipants, setPinnedParticipants] = useState([]);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPublicLink, setShowPublicLink] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const videoRefs = useRef({});

  const { data: whiteboardVersions = [] } = useQuery({
    queryKey: ['whiteboard-versions', activeCall?.id],
    queryFn: async () => {
      if (!activeCall?.id) {
        return [];
      }
      return await WhiteboardVersionManager.getVersions(base44, activeCall.id);
    },
    enabled: !!activeCall?.id,
    refetchInterval: 10000,
  });

  const VIRTUAL_BACKGROUNDS = [
    { name: 'None', value: null },
    { name: 'Blur', value: 'blur' },
    { name: 'Office', value: 'office', color: 'bg-blue-100' },
    { name: 'Park', value: 'park', color: 'bg-green-100' },
    { name: 'Beach', value: 'beach', color: 'bg-yellow-100' },
  ];

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
    cleanupConnections,
  } = useWebRTC();

  useEffect(() => {
    if (activeCall) {
      initializeLocalStream();
    }
    return cleanupConnections;
  }, [activeCall, initializeLocalStream, cleanupConnections]);

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
        const updatedParticipants = activeCall.participants.map((p) =>
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
      const updatedParticipants = activeCall.participants.map((p) =>
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
    ...(activeCall?.participants
      ?.filter((p) => p.email !== user?.email)
      .map((p, idx) => ({
        id: `remote-${idx}`,
        ...p,
        isLocal: false,
        status: p.status || 'online',
        status_emoji: p.status_emoji || '✨',
      })) || []),
  ];

  const isHost = user?.email === activeCall?.host_email;

  useEffect(() => {
    if (activeCall?.room_id && isHost) {
      const baseUrl = window.location.origin;
      setPublicLink(`${baseUrl}/call/join/${activeCall.room_id}`);
    }
  }, [activeCall?.room_id, isHost]);

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicLink);
  };

  const togglePublicJoin = async () => {
    if (!isHost || !activeCall) {
      return;
    }
    const newSetting = !activeCall.settings?.allow_public_join;
    updateCallMutation.mutate({
      callId: activeCall.id,
      data: {
        settings: {
          ...activeCall.settings,
          allow_public_join: newSetting,
        },
      },
    });
  };

  const togglePinParticipant = (participantId) => {
    setPinnedParticipants((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );
  };

  const gridClass =
    allParticipants.length === 1
      ? 'grid-cols-1'
      : allParticipants.length === 2
        ? 'grid-cols-2'
        : allParticipants.length <= 4
          ? 'grid-cols-2'
          : allParticipants.length <= 9
            ? 'grid-cols-3'
            : 'grid-cols-4';

  const mainParticipants =
    pinnedParticipants.length > 0
      ? allParticipants.filter((p) => pinnedParticipants.includes(p.id))
      : [allParticipants[0]];
  const otherParticipants = allParticipants.filter(
    (p) => !pinnedParticipants.includes(p.id) && p.id !== mainParticipants[0]?.id
  );

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
                {isHost && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={togglePublicJoin}>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Public Join {activeCall?.settings?.allow_public_join ? 'On' : 'Off'}
                    </DropdownMenuItem>
                    {activeCall?.settings?.allow_public_join && (
                      <DropdownMenuItem onClick={() => setShowPublicLink(true)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Join Link
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={onEndCall} variant="destructive">
              <PhoneOff className="w-4 h-4 mr-2" />
              End Call
            </Button>
          </div>
        </div>

        {/* Waiting Room */}
        {showWaitingRoom && activeCall?.waiting_room?.length > 0 && isHost && (
          <Card className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-yellow-900 dark:text-yellow-100 font-semibold flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Waiting Room ({activeCall.waiting_room.length})
              </h3>
              <Button
                size="sm"
                onClick={() => activeCall.waiting_room.forEach((u) => onAdmitUser(u.email, u.name))}
                className="bg-green-600 hover:bg-green-700"
              >
                Admit All
              </Button>
            </div>
            <div className="space-y-2">
              {activeCall.waiting_room.map((person, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 text-sm">
                        {person.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm font-medium">
                        {person.name}
                      </p>
                      {person.requested_at && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {format(new Date(person.requested_at), 'h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onAdmitUser(person.email, person.name)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Admit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRejectUser(person.email)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Video Grid or Whiteboard */}
        {showWhiteboard ? (
          <div className="mb-4 h-96">
            <WhiteboardCanvas
              isHost={isHost}
              versions={whiteboardVersions}
              onDataChange={(data) => {
                updateCallMutation.mutate({
                  callId: activeCall.id,
                  data: { whiteboard_data: data },
                });
                if (isHost) {
                  WhiteboardVersionManager.saveVersion(
                    base44,
                    activeCall.id,
                    data,
                    user?.email
                  ).catch((err) => console.error(err));
                }
              }}
              onRevert={(version) => {
                updateCallMutation.mutate({
                  callId: activeCall.id,
                  data: { whiteboard_data: version.canvas_state },
                });
              }}
            />
          </div>
        ) : (
          <>
            {/* Video Grid */}
            {allParticipants.length <= 4 ? (
              <div className={`grid ${gridClass} gap-4 mb-4`}>
                {allParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`aspect-video bg-gray-700 rounded-lg relative overflow-hidden group cursor-pointer border-2 ${
                      pinnedParticipants.includes(participant.id)
                        ? 'border-violet-500'
                        : 'border-transparent'
                    }`}
                    onClick={() => togglePinParticipant(participant.id)}
                  >
                    <video
                      ref={(el) => (videoRefs.current[participant.id] = el)}
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
                      <span
                        className={`w-2 h-2 rounded-full ${
                          participant.status === 'online'
                            ? 'bg-green-500'
                            : participant.status === 'away'
                              ? 'bg-yellow-500'
                              : participant.status === 'busy'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                        }`}
                      ></span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {mainParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="aspect-video bg-gray-700 rounded-lg relative overflow-hidden border-2 border-violet-500"
                    >
                      <video
                        ref={(el) => (videoRefs.current[participant.id] = el)}
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
                    </div>
                  ))}
                </div>
                <ScrollArea className="w-full">
                  <div className="flex gap-2">
                    {otherParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className={`w-32 h-20 bg-gray-700 rounded relative cursor-pointer flex-shrink-0 border-2 ${
                          pinnedParticipants.includes(participant.id)
                            ? 'border-violet-500'
                            : 'border-transparent'
                        }`}
                        onClick={() => togglePinParticipant(participant.id)}
                      >
                        <video
                          ref={(el) => (videoRefs.current[participant.id] = el)}
                          autoPlay
                          playsInline
                          muted={participant.isLocal}
                          className="w-full h-full object-cover rounded"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/70 px-1 py-0.5 rounded text-xs text-white flex items-center gap-0.5">
                          <span>{participant.status_emoji}</span>
                          {participant.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button
            variant={isAudioEnabled ? 'secondary' : 'destructive'}
            size="lg"
            onClick={toggleAudio}
            title="Mute"
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          <Button
            variant={isVideoEnabled ? 'secondary' : 'destructive'}
            size="lg"
            onClick={toggleVideo}
            title="Turn off camera"
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOffIcon className="w-5 h-5" />}
          </Button>
          <Button
            variant={isScreenSharing ? 'default' : 'secondary'}
            size="lg"
            onClick={handleScreenShare}
            title="Share screen"
          >
            {isScreenSharing ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <ScreenShare className="w-5 h-5" />
            )}
          </Button>
          <div className="relative">
            <Button
              variant={selectedBackground ? 'default' : 'secondary'}
              size="lg"
              onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
              title="Virtual background"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            {showBackgroundSelector && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-700 rounded-lg shadow-lg p-3 z-50 w-48">
                <div className="grid grid-cols-2 gap-2">
                  {VIRTUAL_BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => {
                        setSelectedBackground(bg.value);
                        setShowBackgroundSelector(false);
                      }}
                      className={`p-3 rounded text-sm text-center transition-all ${
                        selectedBackground === bg.value
                          ? 'ring-2 ring-violet-500 bg-gray-600'
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      {bg.color && <div className={`${bg.color} w-full h-6 rounded mb-1`}></div>}
                      {bg.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button
            variant={activeCall?.recording_status === 'recording' ? 'destructive' : 'secondary'}
            size="lg"
            onClick={onToggleRecording}
            title="Start recording"
          >
            {activeCall?.recording_status === 'recording' ? (
              <StopCircle className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </Button>
          {isHost && (
            <Button
              variant={showWhiteboard ? 'default' : 'secondary'}
              size="lg"
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              title="Whiteboard"
            >
              <Pencil className="w-5 h-5" />
            </Button>
          )}
        </div>
      </Card>

      {/* Public Link Dialog */}
      <Dialog open={showPublicLink} onOpenChange={setShowPublicLink}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Call Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Share this link to let anyone join the call without an account:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={publicLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <Button onClick={copyPublicLink} size="sm">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

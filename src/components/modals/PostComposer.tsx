import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useHashtagPoolToggle } from '@/components/hooks/useHashtagPoolToggle';
import HashtagPoolSelector, { type HashtagPool } from '@/components/social/HashtagPoolSelector';
import { appendHashtagToCaption, createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  X,
  Image as ImageIcon,
  Smile,
  Hash,
  Link2,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Maximize2,
  Minimize2,
  Calendar,
  Eye,
  MessageSquare,
  GitBranch,
  Clock,
  Repeat,
  Zap,
  Send,
  FileText,
  ChevronRight,
  ShieldCheck,
  Video,
  Cloud,
  HardDrive,
  FolderOpen,
  Trash,
  TriangleAlert,
  Crop,
} from 'lucide-react';
import { PLATFORMS as PLATFORM_CONFIGS } from '@/constants/platforms';
import EmojiPicker from 'emoji-picker-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMediaLibrary } from '@/components/hooks/useMediaLibrary';
import PostComments from '@/components/social/PostComments';
import PostApprovalPanel from '@/components/social/PostApprovalPanel';
import PostCommentThread from '@/components/social/approvals/PostCommentThread';
import Tooltip from '@/components/ui-custom/Tooltip';
import { todayLocal } from '@/utils/date';
import useUnsavedChangesGuard from '@/components/hooks/useUnsavedChangesGuard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MediaLibraryModal from './MediaLibraryModal';
import ImageCropPanel, { type TransformOp } from './ImageCropPanel';
import { useToast } from '@/components/ui/toast-provider';
import { PostStatus } from '@/types/enums';
import COPY from '@/lib/copy';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { isValidHttpUrl, shortenUrl } from '@/utils/url';
import { HashtagPoolCreatePopover } from '@/components/hashtags/HashtagPoolCreatePopover';
import { coercePostTagIds } from '@/utils/tags';
import { TagSelector } from '@/components/social/tags/TagSelector';
import { useTagsQuery } from '@/components/social/tags/useTagsQuery';
import {
  getPostImageUrls,
  normalizePostMedia,
  validateImageFiles,
  validateVideoFile,
  MAX_POST_IMAGE_COUNT,
  IMAGE_ACCEPT_ATTR,
  VIDEO_ACCEPT_ATTR,
} from '@/utils/postMedia';
import { arraysEqual, setsEqual } from '@/utils/hashtagUtils';
import PostStatusChip from '@/components/social/PostStatusChip';
import { getMonthComparison } from '@/utils/getMonthComparison';
import React from 'react';

// ---------------------------------------------------------------------------
// Typed wrappers for JSX shadcn/ui components
// (React.forwardRef in .jsx files loses prop types; cast to ComponentType<any>)
// ---------------------------------------------------------------------------
const TypedButton = Button as React.ComponentType<any>;
const TypedTextarea = Textarea as React.ComponentType<any>;
const TypedPopoverContent = PopoverContent as React.ComponentType<any>;
const TypedSwitch = Switch as React.ComponentType<any>;
const TypedSelectContent = SelectContent as React.ComponentType<any>;
const TypedSelectItem = SelectItem as React.ComponentType<any>;
const TypedSelectTrigger = SelectTrigger as React.ComponentType<any>;
const TypedSelectValue = SelectValue as React.ComponentType<any>;
const TypedLabel = Label as React.ComponentType<any>;
const TypedInput = Input as React.ComponentType<any>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PostFormData {
  caption: string;
  image_url: string;
  image_urls: string[];
  video_url: string;
  media_type: 'none' | 'image' | 'video';
  scheduled_date: string;
  scheduled_time: string;
  platforms: string[];
  hashtags: string[];
  status: PostStatus;
  order: number;
  is_recurring: boolean;
  recurrence_type: string;
  recurrence_end_date: string;
  recurrence_days: number[];
  tag_ids: string[];
  // Not rendered in this composer, but included so they are preserved in the save
  // payload. Dropping them would silently wipe values set by other flows (bulk
  // schedule, PostQueueManager, auto-population functions) and break CalendarPostCard
  // display and the checkScheduledPosts auto-publish backend function.
  title: string;
  auto_post: boolean;
}

interface SavePayload extends PostFormData {
  timezone: string;
  platform_image_urls: Record<string, string>;
  platform_crop_metadata: Record<
    string,
    { cropBox: CropBox | null; transformOps: TransformOp[]; tilt: number }
  >;
}

export interface CalendarPost extends Partial<PostFormData> {
  id?: string;
  platform_image_urls?: Record<string, string>;
  platform_crop_metadata?: Record<
    string,
    { cropBox?: CropBox; transformOps?: TransformOp[]; tilt?: number }
  >;
}

export interface PostComposerRef {
  requestClose: () => void;
}

export interface PostComposerProps {
  post?: CalendarPost | null;
  open?: boolean;
  onSave: (data: SavePayload) => Promise<void>;
  /** When provided, a close button is rendered and clicking it (or saving) calls onClose. */
  onClose?: () => void;
  isLoading: boolean;
  hashtagPool?: HashtagPool[];
  currentMonth?: Date;
  /** Hides the PostStatusChip in the header. */
  hideStatus?: boolean;
  /** Passed from CalendarPostModal to render the correct fullscreen icon. */
  isFullscreen?: boolean;
  /** When provided, a fullscreen toggle button is rendered. */
  onFullscreenToggle?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BEST_TIMES: Record<string, { day: string; time: string; label: string }[]> = {
  Facebook: [
    { day: 'Wednesday', time: '11:00', label: 'Wed 11am' },
    { day: 'Thursday', time: '13:00', label: 'Thu 1pm' },
    { day: 'Friday', time: '10:00', label: 'Fri 10am' },
  ],
  Instagram: [
    { day: 'Monday', time: '11:00', label: 'Mon 11am' },
    { day: 'Wednesday', time: '14:00', label: 'Wed 2pm' },
    { day: 'Friday', time: '10:00', label: 'Fri 10am' },
  ],
  LinkedIn: [
    { day: 'Tuesday', time: '09:00', label: 'Tue 9am' },
    { day: 'Wednesday', time: '12:00', label: 'Wed 12pm' },
    { day: 'Thursday', time: '10:00', label: 'Thu 10am' },
  ],
  Twitter: [
    { day: 'Wednesday', time: '09:00', label: 'Wed 9am' },
    { day: 'Friday', time: '09:00', label: 'Fri 9am' },
    { day: 'Tuesday', time: '10:00', label: 'Tue 10am' },
  ],
  YouTube: [
    { day: 'Wednesday', time: '09:00', label: 'Wed 9am' },
    { day: 'Friday', time: '09:00', label: 'Fri 9am' },
    { day: 'Tuesday', time: '10:00', label: 'Tue 10am' },
  ],
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PLATFORMS = PLATFORM_CONFIGS.map((p) => ({
  ...p,
  color: `${p.tailwind} text-white`,
}));

const DEFAULT_FORM: PostFormData = {
  caption: '',
  image_url: '',
  image_urls: [],
  video_url: '',
  media_type: 'none',
  scheduled_date: todayLocal(),
  scheduled_time: '09:00',
  platforms: [],
  hashtags: [],
  status: PostStatus.DRAFT,
  order: 0,
  is_recurring: false,
  recurrence_type: 'weekly',
  recurrence_end_date: '',
  recurrence_days: [],
  tag_ids: [],
  title: '',
  auto_post: false,
};

const DIRTY_FIELDS: (keyof PostFormData)[] = [
  'caption',
  'image_url',
  'video_url',
  'media_type',
  'scheduled_date',
  'scheduled_time',
  'status',
  'order',
  'is_recurring',
  'recurrence_type',
  'recurrence_end_date',
];

const SHOW_LEGACY_TEAM_FEEDBACK_TAB = false;

const POST_TABS = [
  { id: 'compose', label: COPY.calendarPostModal.compose, icon: ImageIcon, enabled: true },
  {
    id: 'approval',
    label: COPY.calendarPostModal.approvalWorkflow,
    icon: GitBranch,
    enabled: true,
  },
  {
    id: 'comments',
    label: COPY.calendarPostModal.comments,
    icon: MessageSquare,
    enabled: true,
  },
  {
    id: 'team-feedback',
    label: COPY.calendarPostModal.teamFeedback,
    icon: MessageSquare,
    enabled: SHOW_LEGACY_TEAM_FEEDBACK_TAB,
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Computes the default scheduled_date and scheduled_time for a new post.
 * When composing in the current month: date = today, time = now + 10 min.
 * When viewing a future month: date = first of that month, time = 09:00.
 */
function getDefaultSchedule(currentMonth: Date): {
  scheduled_date: string;
  scheduled_time: string;
} {
  const now = new Date();
  const { isSameMonth, isFutureMonth } = getMonthComparison(now, currentMonth);
  const scheduled_date = isFutureMonth
    ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`
    : todayLocal();
  const plusTen = new Date(now.getTime() + 10 * 60 * 1000);
  const hh = String(plusTen.getHours()).padStart(2, '0');
  const mm = String(plusTen.getMinutes()).padStart(2, '0');
  const scheduled_time = isSameMonth ? `${hh}:${mm}` : '09:00';
  return { scheduled_date, scheduled_time };
}

function renderWithLinks(text: string): ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/\S+)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] && match[2]) {
      parts.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {match[1]}
        </a>
      );
    } else {
      parts.push(
        <a
          key={key++}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          {match[3]}
        </a>
      );
    }
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

const hasFormChanges = (
  current: PostFormData,
  initial: PostFormData,
  { includeTags = true } = {}
): boolean =>
  DIRTY_FIELDS.some((field) => current[field] !== initial[field]) ||
  !arraysEqual(current.image_urls, initial.image_urls) ||
  !arraysEqual(current.platforms, initial.platforms) ||
  !arraysEqual(current.hashtags, initial.hashtags) ||
  !arraysEqual(current.recurrence_days, initial.recurrence_days) ||
  (includeTags && !setsEqual(current.tag_ids, initial.tag_ids));

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PlatformPreviewPanelProps {
  platform: string;
  caption: string;
  imageUrl: string;
  videoUrl: string;
  imageAspectRatio?: number;
  onCropClick?: () => void;
}

// This component renders a preview of how the post will look on a specific platform, based on the current form data.
function PlatformPreviewPanel({
  platform,
  caption,
  imageUrl,
  videoUrl,
  imageAspectRatio = 1.91,
  onCropClick,
}: PlatformPreviewPanelProps) {
  const [inferredRatio, setInferredRatio] = useState<number | null>(null);
  useEffect(() => setInferredRatio(null), [imageUrl]);

  const p =
    PLATFORMS.find((pl) => pl.id === platform) ??
    PLATFORMS.find((pl) => pl.id === PLATFORMS[0].id) ??
    PLATFORMS[0];
  const overLimit = caption.length > p.limit;
  const truncated = caption.length > p.limit ? caption.slice(0, p.limit) + '…' : caption;

  return (
    <div className="flex flex-col h-full">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        {p.label} {COPY.calendarPostModal.preview}
      </p>

      {!caption && !imageUrl && !videoUrl ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-gray-300 dark:text-gray-600">
          <div className="relative w-48">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="bg-gray-200 dark:bg-gray-700 rounded h-24 mt-2" />
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-2">{COPY.calendarPostModal.seePreviewHere}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${p.color}`}
            >
              <p.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                {COPY.calendarPostModal.yourAccount}
              </p>
              <p className="text-xs text-gray-400">{COPY.calendarPostModal.justNow}</p>
            </div>
          </div>
          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full object-cover"
                style={{ aspectRatio: inferredRatio ?? imageAspectRatio }}
                onLoad={(e) =>
                  setInferredRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)
                }
              />
              {onCropClick && (
                <Tooltip content={COPY.calendarPostModal.cropTitle}>
                  <button
                    type="button"
                    onClick={onCropClick}
                    className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-violet-200 text-violet-500 shadow-sm transition-colors hover:bg-violet-300"
                    aria-label={COPY.calendarPostModal.cropTitle}
                  >
                    <Crop className="h-4 w-4" />
                  </button>
                </Tooltip>
              )}
            </div>
          )}
          {videoUrl && !imageUrl && (
            <video src={videoUrl} className="w-full aspect-[1.91/1] object-cover" muted />
          )}
          <div className="p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">
              {truncated ? (
                overLimit ? (
                  truncated
                ) : (
                  renderWithLinks(truncated)
                )
              ) : (
                <span className="text-gray-300 dark:text-gray-600 italic">
                  {COPY.calendarPostModal.captionPreviewPlaceholder}
                </span>
              )}
            </p>
            {caption.length > 0 && (
              <p
                className={`text-xs mt-2 ${overLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}
              >
                {caption.length} / {p.limit}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface BestTimeSuggestionsProps {
  platforms: string[];
  onApply: (date: string, time: string) => void;
}

function BestTimeSuggestions({ platforms, onApply }: BestTimeSuggestionsProps) {
  const activePlatforms = platforms.length > 0 ? platforms : ['Twitter'];
  const primaryPlatform = activePlatforms[0];
  const suggestions = BEST_TIMES[primaryPlatform] ?? BEST_TIMES['Twitter'];

  const getNextOccurrence = (dayName: string): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.findIndex((d) => d === dayName);
    const today = new Date();
    const todayDay = today.getDay();
    let daysUntil = (targetDay - todayDay + 7) % 7;
    if (daysUntil === 0) daysUntil = 7;
    const next = new Date(today);
    next.setDate(today.getDate() + daysUntil);
    return next.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
        <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span>
          {COPY.calendarPostModal.bestTimesForPlatform.replace('{platform}', primaryPlatform)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onApply(getNextOccurrence(s.day), s.time)}
            className="text-xs border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2 py-2 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-center group"
          >
            <div className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-violet-700 dark:group-hover:text-violet-400">
              {s.label}
            </div>
            <div className="text-gray-400 group-hover:text-violet-500 mt-0.5">
              {COPY.calendarPostModal.apply}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface RecurringSchedulePanelProps {
  formData: PostFormData;
  setFormData: React.Dispatch<React.SetStateAction<PostFormData>>;
}

function RecurringSchedulePanel({ formData, setFormData }: RecurringSchedulePanelProps) {
  const toggleDay = (dayIndex: number) => {
    const days = formData.recurrence_days ?? [];
    const updated = days.includes(dayIndex)
      ? days.filter((d) => d !== dayIndex)
      : [...days, dayIndex];
    setFormData((f) => ({ ...f, recurrence_days: updated }));
  };

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-2">
        <Select
          value={formData.recurrence_type || 'weekly'}
          onValueChange={(v) => setFormData((f) => ({ ...f, recurrence_type: v }))}
        >
          <TypedSelectTrigger className="h-8 text-xs w-28">
            <TypedSelectValue />
          </TypedSelectTrigger>
          <TypedSelectContent>
            <TypedSelectItem value="daily">{COPY.calendarPostModal.daily}</TypedSelectItem>
            <TypedSelectItem value="weekly">{COPY.calendarPostModal.weekly}</TypedSelectItem>
            <TypedSelectItem value="monthly">{COPY.calendarPostModal.monthly}</TypedSelectItem>
          </TypedSelectContent>
        </Select>
        <span className="text-xs text-gray-400">{COPY.calendarPostModal.repeat}</span>
      </div>

      {formData.recurrence_type === 'weekly' && (
        <div className="flex gap-1 flex-wrap">
          {DAYS_OF_WEEK.map((day, idx) => (
            <button
              key={day}
              onClick={() => toggleDay(idx)}
              className={`w-9 h-9 rounded-full text-xs font-medium transition-all ${
                (formData.recurrence_days ?? []).includes(idx)
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          {COPY.calendarPostModal.endDateOptional}
        </label>
        <input
          type="date"
          value={formData.recurrence_end_date || ''}
          onChange={(e) => setFormData((f) => ({ ...f, recurrence_end_date: e.target.value }))}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PostComposer
//
// This component is used both in the CalendarPostModal and in the standalone composer view on the SocialCalendar page.
// ---------------------------------------------------------------------------
const PostComposer = forwardRef<PostComposerRef, PostComposerProps>(function PostComposer(
  {
    post,
    open,
    onSave,
    onClose,
    isLoading,
    hashtagPool = [],
    currentMonth = new Date(),
    hideStatus = false,
    isFullscreen = false,
    onFullscreenToggle,
  },
  ref
) {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });
  const navigate = useNavigate();
  const toast = useToast() as {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  };

  const [formData, setFormData] = useState<PostFormData>({ ...DEFAULT_FORM });
  const [uploading, setUploading] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState('Twitter');
  const [showPreview, setShowPreview] = useState(true);
  const [activeTab, setActiveTab] = useState('compose');
  const [pendingApprovalAction, setPendingApprovalAction] = useState<string | null>(null);

  const [showBestTimes, setShowBestTimes] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [requireApproval, setRequireApproval] = useState(true);
  const [mediaMenuTarget, setMediaMenuTarget] = useState<string | null>(null);
  const [pendingPicker, setPendingPicker] = useState<'image' | 'video' | null>(null);
  const [connectPrompt, setConnectPrompt] = useState<string | null>(null);
  const [navigationPrompt, setNavigationPrompt] = useState<{
    route: string;
    title: string;
    description: string;
  } | null>(null);
  const {
    isMediaLibraryOpen,
    setIsMediaLibraryOpen,
    mediaLibrarySearch,
    setMediaLibrarySearch,
    selectedLibraryAssets,
    imageAssets,
    isMediaLibraryLoading,
    openMediaLibrary,
    resetMediaLibrary,
    selectLibraryAsset,
    applySelectedLibraryAssets,
  } = useMediaLibrary((urls: string[]) => {
    setMediaError('');
    clearCropState();
    setFormData((f) => {
      const existing = getPostImageUrls(f);
      const newUrls = urls.filter((url) => !existing.includes(url));
      const combined = [...existing, ...newUrls];
      return normalizePostMedia({
        ...f,
        image_urls: combined.slice(0, MAX_POST_IMAGE_COUNT),
        video_url: '',
      });
    });
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDisplayText, setLinkDisplayText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [imageFileNames, setImageFileNames] = useState<string[]>([]);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropTargetPlatform, setCropTargetPlatform] = useState<string | null>(null);
  const [platformCrops, setPlatformCrops] = useState<Record<string, string>>({});
  const [platformCropBoxes, setPlatformCropBoxes] = useState<Record<string, CropBox>>({});
  const [platformTransformOps, setPlatformTransformOps] = useState<Record<string, TransformOp[]>>(
    {}
  );
  const [platformTilts, setPlatformTilts] = useState<Record<string, number>>({});

  const clearCropState = () => {
    setPlatformCrops({});
    setPlatformCropBoxes({});
    setPlatformTransformOps({});
    setPlatformTilts({});
    setIsCropOpen(false);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const captionSelectionRef = useRef<{ start: number | null; end: number | null }>({
    start: null,
    end: null,
  });
  const initialFormDataRef = useRef<PostFormData>({ ...DEFAULT_FORM });
  const initialCropRef = useRef<{
    boxes: Record<string, CropBox>;
    transformOps: Record<string, TransformOp[]>;
    tilts: Record<string, number>;
  }>({ boxes: {}, transformOps: {}, tilts: {} });
  const fileDialogLockRef = useRef(false);
  const fileDialogReleaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPostPublished = post?.status === PostStatus.PUBLISHED;
  const { data: allTags = [] } = useTagsQuery();
  const selectedTags = allTags.filter((t) => formData.tag_ids.includes(t.id));
  const queryClient = useQueryClient();

  const tagAutosaveMutation = useMutation({
    mutationFn: ({ id, tag_ids }: { id: string; tag_ids: string[] }) =>
      base44.entities.CalendarPost.update(id, { tag_ids }),
    onSuccess: (_: unknown, { id, tag_ids }: { id: string; tag_ids: string[] }) => {
      queryClient.setQueriesData({ queryKey: ['calendar-posts'] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((p: CalendarPost) => (p.id === id ? { ...p, tag_ids } : p));
      });
    },
  });

  const {
    activeHashtags: _activeHashtags,
    toggledPoolIds,
    handleTogglePool,
  } = useHashtagPoolToggle({
    hashtagPool,
    form: formData,
    setForm: setFormData,
  });

  // Initialise / reset form when post prop or open state changes
  const effectiveOnClose = onClose ?? (() => {});

  useEffect(() => {
    setIsEmojiPickerOpen(false);
    setIsLinkPopoverOpen(false);
    setLinkUrl('');
    setLinkDisplayText('');
    captionSelectionRef.current = { start: null, end: null };
    setMediaError('');
    setActiveTab('compose');
    setShowBestTimes(false);
    setScheduleError('');
    setRequireApproval(true);
    setMediaMenuTarget(null);
    setPendingPicker(null);
    setConnectPrompt(null);
    setNavigationPrompt(null);
    resetMediaLibrary();
    setIsCropOpen(false);
    setCropTargetPlatform(null);
    setImageFileNames([]);

    const { scheduled_date: defaultDate, scheduled_time: defaultTime } =
      getDefaultSchedule(currentMonth);

    if (post) {
      const normalizedMedia = normalizePostMedia(post);
      const initial: PostFormData = {
        caption: post.caption ?? '',
        image_url: normalizedMedia.image_url ?? '',
        image_urls: normalizedMedia.image_urls ?? [],
        video_url: normalizedMedia.video_url ?? '',
        media_type: (normalizedMedia.media_type as PostFormData['media_type']) ?? 'none',
        scheduled_date: post.scheduled_date ?? todayLocal(),
        scheduled_time: post.scheduled_time ?? '09:00',
        platforms: post.platforms ?? [],
        hashtags: post.hashtags ?? [],
        status: post.status ?? PostStatus.DRAFT,
        order: post.order ?? 0,
        is_recurring: post.is_recurring ?? false,
        recurrence_type: post.recurrence_type ?? 'weekly',
        recurrence_end_date: post.recurrence_end_date ?? '',
        recurrence_days: post.recurrence_days ?? [],
        tag_ids: coercePostTagIds(post.tag_ids),
        title: post.title ?? '',
        auto_post: post.auto_post ?? false,
      };
      initialFormDataRef.current = initial;
      setFormData(initial);
      setPreviewPlatform(post.platforms?.[0] ?? 'Twitter');
      setPlatformCrops(post.platform_image_urls ?? {});
      const _meta = post.platform_crop_metadata ?? {};
      const _initialBoxes: Record<string, CropBox> = Object.fromEntries(
        Object.entries(_meta)
          .filter(([, m]) => m.cropBox)
          .map(([k, m]) => [k, m.cropBox as CropBox])
      );
      const _initialTransformOps: Record<string, TransformOp[]> = Object.fromEntries(
        Object.entries(_meta).map(([k, m]) => [k, m.transformOps ?? []])
      );
      const _initialTilts: Record<string, number> = Object.fromEntries(
        Object.entries(_meta).map(([k, m]) => [k, m.tilt ?? 0])
      );
      initialCropRef.current = {
        boxes: _initialBoxes,
        transformOps: _initialTransformOps,
        tilts: _initialTilts,
      };
      setPlatformCropBoxes(_initialBoxes);
      setPlatformTransformOps(_initialTransformOps);
      setPlatformTilts(_initialTilts);
    } else {
      const initial: PostFormData = {
        ...DEFAULT_FORM,
        scheduled_date: defaultDate,
        scheduled_time: defaultTime,
      };
      initialFormDataRef.current = initial;
      setFormData(initial);
      setPreviewPlatform('Twitter');
      setPlatformCrops({});
      setPlatformCropBoxes({});
      setPlatformTransformOps({});
      setPlatformTilts({});
      initialCropRef.current = { boxes: {}, transformOps: {}, tilts: {} };
    }
  }, [post?.id, open]);

  const isCropDirty =
    JSON.stringify(platformCropBoxes) !== JSON.stringify(initialCropRef.current.boxes) ||
    JSON.stringify(platformTransformOps) !== JSON.stringify(initialCropRef.current.transformOps) ||
    JSON.stringify(platformTilts) !== JSON.stringify(initialCropRef.current.tilts);
  const isDirty =
    hasFormChanges(formData, initialFormDataRef.current, { includeTags: !post?.id }) || isCropDirty;

  const { guardedClose, discardDialogProps } = useUnsavedChangesGuard({
    isDirty,
    onClose: effectiveOnClose,
  });

  // Expose requestClose via ref for CalendarPostModal
  useImperativeHandle(
    ref,
    () => ({
      requestClose: () => {
        if (
          isCropOpen ||
          isMediaLibraryOpen ||
          !!connectPrompt ||
          !!navigationPrompt ||
          showDeleteConfirm
        ) {
          return;
        }
        guardedClose(false);
      },
    }),
    [
      isCropOpen,
      isMediaLibraryOpen,
      connectPrompt,
      navigationPrompt,
      showDeleteConfirm,
      guardedClose,
    ]
  );

  const releaseFileDialogLock = () => {
    fileDialogLockRef.current = false;
    if (fileDialogReleaseTimeoutRef.current) {
      clearTimeout(fileDialogReleaseTimeoutRef.current);
      fileDialogReleaseTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (mediaMenuTarget || !pendingPicker) return;

    const nextInputRef = pendingPicker === 'video' ? videoInputRef : fileInputRef;
    resetFileInput(nextInputRef);

    const frameId = requestAnimationFrame(() => {
      if (fileDialogLockRef.current) {
        setPendingPicker(null);
        return;
      }
      fileDialogLockRef.current = true;
      nextInputRef.current?.click();
      setPendingPicker(null);
    });

    return () => cancelAnimationFrame(frameId);
  }, [mediaMenuTarget, pendingPicker]);

  useEffect(() => {
    const handleWindowFocus = () => {
      if (!fileDialogLockRef.current) return;
      fileDialogReleaseTimeoutRef.current = setTimeout(() => {
        releaseFileDialogLock();
      }, 300);
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      if (fileDialogReleaseTimeoutRef.current) {
        clearTimeout(fileDialogReleaseTimeoutRef.current);
      }
    };
  }, []);

  const resetFileInput = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) {
      releaseFileDialogLock();
      if (e.target) e.target.value = '';
      return;
    }
    if (formData.video_url) {
      setMediaError(COPY.calendarPostModal.videoBeforeImages);
      releaseFileDialogLock();
      if (e.target) e.target.value = '';
      return;
    }
    const validationError = validateImageFiles(
      files,
      formData.image_urls?.length ?? 0,
      imageFileNames
    );
    if (validationError) {
      setMediaError(validationError);
      releaseFileDialogLock();
      if (e.target) e.target.value = '';
      return;
    }
    setUploading(true);
    setMediaError('');
    try {
      const uploads = await Promise.all(
        files.map((file) => base44.integrations.Core.UploadFile({ file }))
      );
      clearCropState();
      setImageFileNames((current) => [...current, ...files.map((f) => f.name)]);
      setFormData((f) =>
        normalizePostMedia({
          ...f,
          image_urls: [
            ...(f.image_urls ?? []),
            ...uploads.map((item: { file_url: string }) => item.file_url),
          ],
          video_url: '',
        })
      );
    } catch (error: unknown) {
      setMediaError((error as Error)?.message ?? COPY.calendarPostModal.uploadImagesFailed);
    } finally {
      setUploading(false);
    }
    releaseFileDialogLock();
    if (e.target) e.target.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      releaseFileDialogLock();
      if (e.target) e.target.value = '';
      return;
    }
    if ((formData.image_urls?.length ?? 0) > 0) {
      setMediaError(COPY.calendarPostModal.imagesBeforeVideo);
      releaseFileDialogLock();
      if (e.target) e.target.value = '';
      return;
    }
    const validationError = validateVideoFile(file);
    if (validationError) {
      setMediaError(validationError);
      releaseFileDialogLock();
      if (e.target) e.target.value = '';
      return;
    }
    setUploading(true);
    setMediaError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      clearCropState();
      setImageFileNames([]);
      setFormData((f) => normalizePostMedia({ ...f, video_url: file_url, image_urls: [] }));
    } catch (error: unknown) {
      setMediaError((error as Error)?.message ?? COPY.calendarPostModal.uploadVideoFailed);
    } finally {
      setUploading(false);
    }
    releaseFileDialogLock();
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length === 0) return;
    const hasVideos = files.some((f) => f.type.startsWith('video/'));
    const hasImages = files.some((f) => f.type.startsWith('image/'));
    if (hasVideos && hasImages) {
      setMediaError(COPY.calendarPostModal.mixedMediaDrop);
      return;
    }
    if (hasVideos) {
      const videoFiles = files.filter((f) => f.type.startsWith('video/'));
      if (videoFiles.length > 1) {
        setMediaError(COPY.calendarPostModal.oneVideoOnly);
        return;
      }
      handleVideoUpload({
        target: { files: [videoFiles[0]] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    } else {
      handleImageUpload({ target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDropzoneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    triggerImageUpload();
  };

  const triggerImageUpload = () => {
    setMediaMenuTarget(null);
    setPendingPicker('image');
  };

  const triggerVideoUpload = () => {
    setMediaMenuTarget(null);
    setPendingPicker('video');
  };

  const openRouteFromComposer = (
    route: string,
    promptCopy: { title: string; description: string }
  ) => {
    setMediaMenuTarget(null);
    if (isDirty) {
      setNavigationPrompt({
        route,
        title: promptCopy?.title ?? 'Leave Composer?',
        description: promptCopy?.description ?? 'You have unsaved changes.',
      });
      return;
    }
    onClose?.();
    navigate(route);
  };

  const handleMediaLibraryOpen = () => {
    setMediaMenuTarget(null);
    openMediaLibrary();
  };

  const openIntegrationSettings = (providerKey: string | null) => {
    setConnectPrompt(null);
    const providerLabel = providerKey === 'dropbox' ? 'Dropbox' : 'Google Drive';
    openRouteFromComposer(`${createPageUrl('Settings')}?tab=integrations`, {
      title: `Open ${providerLabel} Setup?`,
      description: `You have unsaved post changes. Continue to Settings to manage ${providerLabel} integrations?`,
    });
  };

  const handleCloudMediaSource = (providerKey: string) => {
    setMediaMenuTarget(null);
    setConnectPrompt(providerKey);
  };

  const confirmNavigation = () => {
    if (!navigationPrompt?.route) return;
    const route = navigationPrompt.route;
    setNavigationPrompt(null);
    onClose?.();
    navigate(route);
  };

  const clearSelectedMedia = () => {
    setMediaError('');
    clearCropState();
    setImageFileNames([]);
    setFormData((f) => normalizePostMedia({ ...f, image_urls: [], video_url: '' }));
  };

  const removeSelectedImage = (imageIndexToRemove: number) => {
    setMediaError('');
    clearCropState();
    setImageFileNames((current) => current.filter((_, index) => index !== imageIndexToRemove));
    setFormData((f) =>
      normalizePostMedia({
        ...f,
        image_urls: (f.image_urls ?? []).filter((_, index) => index !== imageIndexToRemove),
      })
    );
  };

  const mediaMenuItems = [
    {
      section: 'My Media',
      items: [
        {
          label: 'Upload Image',
          icon: ImageIcon,
          mediaKind: 'image',
          onSelect: triggerImageUpload,
        },
        { label: 'Upload Video', icon: Video, mediaKind: 'video', onSelect: triggerVideoUpload },
        {
          label: 'Dropbox',
          icon: Cloud,
          mediaKind: 'image',
          onSelect: () => handleCloudMediaSource('dropbox'),
        },
        {
          label: 'Google Drive',
          icon: HardDrive,
          mediaKind: 'image',
          onSelect: () => handleCloudMediaSource('google-drive'),
        },
      ],
    },
    {
      section: 'Shared Media',
      items: [
        {
          label: 'Media Library',
          icon: FolderOpen,
          mediaKind: 'image',
          onSelect: handleMediaLibraryOpen,
        },
      ],
    },
  ];

  const renderMediaMenuContent = () => (
    <div className="py-2">
      {mediaMenuItems.map((section, index) => (
        <div key={section.section}>
          {index > 0 && <div className="my-2 border-t border-gray-100" />}
          <div className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            {section.section}
          </div>
          <div className="space-y-0.5 px-2 pb-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              const imageSelectionDisabled =
                Boolean(formData.video_url) ||
                (formData.image_urls?.length ?? 0) >= MAX_POST_IMAGE_COUNT;
              const videoSelectionDisabled = Boolean(formData.image_urls?.length);
              const isDisabled =
                item.mediaKind === 'image'
                  ? imageSelectionDisabled
                  : item.mediaKind === 'video'
                    ? videoSelectionDisabled
                    : false;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                      return;
                    }
                    e.stopPropagation();
                    item.onSelect();
                  }}
                  disabled={isDisabled}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[15px] font-medium transition-colors ${
                    isDisabled
                      ? 'cursor-not-allowed text-gray-300'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const hasSelectedMedia = Boolean((formData.image_urls?.length ?? 0) > 0 || formData.video_url);

  const togglePlatform = (id: string) => {
    setFormData((f) => {
      const next = f.platforms.includes(id)
        ? f.platforms.filter((p) => p !== id)
        : [...f.platforms, id];
      if (next.includes(id)) {
        setPreviewPlatform(id);
      } else if (next.length > 0 && !next.includes(previewPlatform)) {
        setPreviewPlatform(next[0]);
      }
      return { ...f, platforms: next };
    });
  };

  const handleDeletePost = () => setShowDeleteConfirm(true);

  const confirmDeletePost = () => setShowDeleteConfirm(false); // TODO: implement deletion

  const handleSubmit = async (status: PostStatus) => {
    const mustTimeBeInFuture = ![
      PostStatus.DRAFT,
      PostStatus.PUBLISHED,
      PostStatus.UNUSED,
      PostStatus.REJECTED,
      PostStatus.ARCHIVED,
    ].includes(status);

    if (mustTimeBeInFuture) {
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
        setScheduleError(COPY.calendarPostModal.scheduledTimeInFuture);
        return;
      }
    }
    setScheduleError('');

    let finalStatus = status;
    if (isPostPublished && !requireApproval) {
      finalStatus = PostStatus.PUBLISHED;
    }

    try {
      await onSave({
        ...formData,
        status: finalStatus,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform_image_urls: platformCrops,
        platform_crop_metadata: Object.fromEntries(
          [
            ...new Set([
              ...Object.keys(platformCrops),
              ...Object.keys(platformCropBoxes),
              ...Object.keys(platformTransformOps),
              ...Object.keys(platformTilts),
            ]),
          ].map((platform) => [
            platform,
            {
              cropBox: platformCropBoxes[platform] ?? null,
              transformOps: platformTransformOps[platform] ?? [],
              tilt: platformTilts[platform] ?? 0,
            },
          ])
        ),
      });
    } catch (error: unknown) {
      toast.error((error as Error)?.message ?? COPY.calendarPostModal.saveFailed);
      return;
    }

    const successMessages: Partial<Record<PostStatus, string>> = {
      [PostStatus.DRAFT]: COPY.calendarPostModal.saveSuccessDraft,
      [PostStatus.SCHEDULED]: COPY.calendarPostModal.saveSuccessScheduled,
      [PostStatus.PENDING_REVIEW]: COPY.calendarPostModal.saveSuccessPendingReview,
      [PostStatus.PENDING_APPROVAL]: COPY.calendarPostModal.saveSuccessPendingApproval,
      [PostStatus.PUBLISHED]: COPY.calendarPostModal.saveSuccessPublished,
    };
    toast.success(successMessages[finalStatus] ?? COPY.calendarPostModal.saveSuccessDefault);

    if (onClose) {
      // Modal mode: close
      guardedClose({ open: false, bypass: true });
    } else {
      // Standalone mode: reset form so composer is ready for a new post
      const reset: PostFormData = {
        ...DEFAULT_FORM,
        ...getDefaultSchedule(currentMonth),
      };
      setFormData(reset);
      initialFormDataRef.current = reset;
      clearCropState();
      initialCropRef.current = { boxes: {}, transformOps: {}, tilts: {} };
      setImageFileNames([]);
      resetMediaLibrary();
    }
  };

  const applyBestTime = (date: string, time: string) => {
    setFormData((f) => ({ ...f, scheduled_date: date, scheduled_time: time }));
    setShowBestTimes(false);
  };

  const _addHashtag = (tag: string) => {
    setFormData((f) => {
      const existingHashtags = Array.isArray(f.hashtags) ? f.hashtags : [];
      const result = appendHashtagToCaption(f.caption, tag, existingHashtags);
      if (!result) return f;
      return { ...f, ...result };
    });
  };

  const updateCaptionSelection = (target: HTMLTextAreaElement | null) => {
    if (!target) return;
    if (target !== captionRef.current || document.activeElement !== target) return;
    captionSelectionRef.current = {
      start: target.selectionStart ?? null,
      end: target.selectionEnd ?? target.selectionStart ?? null,
    };
  };

  const getCaptionInsertionContext = (caption: string) => {
    const textarea = captionRef.current;
    const currentCaption = textarea?.value ?? caption;
    const hasLiveSelection =
      textarea === captionRef.current && document.activeElement === captionRef.current;
    const hasStoredSelection =
      Number.isInteger(captionSelectionRef.current.start) &&
      Number.isInteger(captionSelectionRef.current.end);
    const fallbackPosition = currentCaption.length;
    const start = hasLiveSelection
      ? (textarea!.selectionStart ?? fallbackPosition)
      : hasStoredSelection
        ? (captionSelectionRef.current.start ?? fallbackPosition)
        : fallbackPosition;
    const end = hasLiveSelection
      ? (textarea!.selectionEnd ?? start)
      : hasStoredSelection
        ? (captionSelectionRef.current.end ?? start)
        : start;
    return { currentCaption, start, end };
  };

  const handleEmojiSelect = ({ emoji }: { emoji: string }) => {
    let nextCaretPosition = 0;
    setFormData((f) => {
      const { currentCaption, start, end } = getCaptionInsertionContext(f.caption);
      const nextCaption = currentCaption.slice(0, start) + emoji + currentCaption.slice(end);
      nextCaretPosition = start + emoji.length;
      captionSelectionRef.current = { start: nextCaretPosition, end: nextCaretPosition };
      return { ...f, caption: nextCaption, hashtags: /#\w+/.test(nextCaption) ? f.hashtags : [] };
    });
    setIsEmojiPickerOpen(false);
    requestAnimationFrame(() => {
      const nextTextarea = captionRef.current;
      if (!nextTextarea) return;
      nextTextarea.focus();
      nextTextarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  };

  const linkUrlError =
    linkUrl.trim().length > 0 && !isValidHttpUrl(linkUrl.trim())
      ? COPY.linkInserter.urlError
      : null;

  const handleLinkInsert = () => {
    if (!isValidHttpUrl(linkUrl.trim())) return;
    const finalUrl = shortenUrl(linkUrl.trim());
    const text = linkDisplayText.trim() ? `[${linkDisplayText.trim()}](${finalUrl})` : finalUrl;
    let nextCaretPosition = 0;
    setFormData((f) => {
      const { currentCaption, start, end } = getCaptionInsertionContext(f.caption);
      const nextCaption = currentCaption.slice(0, start) + text + currentCaption.slice(end);
      nextCaretPosition = start + text.length;
      captionSelectionRef.current = { start: nextCaretPosition, end: nextCaretPosition };
      return { ...f, caption: nextCaption };
    });
    setIsLinkPopoverOpen(false);
    setLinkUrl('');
    setLinkDisplayText('');
    requestAnimationFrame(() => {
      const nextTextarea = captionRef.current;
      if (!nextTextarea) return;
      nextTextarea.focus();
      nextTextarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  };

  const isViewer = currentUser?.social_media_role === 'viewer';
  const isAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.social_media_role === 'admin' ||
    currentUser?.social_media_role === 'approver';
  const activePlatform =
    PLATFORMS.find((p) => p.id === previewPlatform) ??
    PLATFORMS.find((p) => p.id === PLATFORMS[0].id) ??
    PLATFORMS[0];
  const overLimit = formData.caption.length > activePlatform.limit;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <div ref={containerRef} className="relative flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {post ? COPY.calendarPostModal.editPost : COPY.calendarPostModal.createPost}
            </h2>
            {!hideStatus && <PostStatusChip status={formData?.status ?? PostStatus.DRAFT} />}
          </div>
          <div className="flex items-center gap-2">
            <TypedButton
              variant="ghost"
              size="sm"
              className="gap-1.5 text-gray-600 dark:text-gray-400 text-sm"
              onClick={() => {}}
            >
              <Sparkles className="w-4 h-4" /> {COPY.calendarPostModal.aiAssistant}
            </TypedButton>
            <TypedButton
              variant={showPreview ? 'default' : 'outline'}
              size="sm"
              className={`gap-1.5 text-sm ${showPreview ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              onClick={() => setShowPreview((v) => !v)}
            >
              <Eye className="w-4 h-4" /> {COPY.calendarPostModal.preview}
            </TypedButton>
            {onFullscreenToggle && (
              <button
                type="button"
                onClick={onFullscreenToggle}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}
            {onClose && (
              <button
                onClick={() => guardedClose(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
                aria-label="Close"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs (only for existing posts) */}
        {post && (
          <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 bg-white dark:bg-gray-900">
            {POST_TABS.filter((tab) => tab.enabled).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 overflow-y-auto">
          {/* Approval tab */}
          {activeTab === 'approval' && post && (
            <div className="flex-1 p-6">
              <PostApprovalPanel
                post={post}
                onUpdate={(updatedPost: Partial<PostFormData> | null) => {
                  if (updatedPost) setFormData((f) => ({ ...f, ...updatedPost }));
                }}
                onPendingAction={(action: string) => {
                  setPendingApprovalAction(action);
                  setActiveTab('comments');
                }}
              />
            </div>
          )}

          {/* Comments tab */}
          {activeTab === 'comments' && post && (
            <div className="flex-1 p-6">
              <PostCommentThread
                post={post}
                currentUser={currentUser}
                pendingAction={pendingApprovalAction}
                onPendingActionComplete={() => {
                  setPendingApprovalAction(null);
                  queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
                  queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
                }}
                onPendingActionCancel={() => setPendingApprovalAction(null)}
              />
            </div>
          )}

          {activeTab === 'team-feedback' && post && (
            <div className="flex-1 p-6">
              <PostComments
                postId={post.id}
                post={post}
                currentUser={currentUser}
                pendingAction={pendingApprovalAction}
                onPendingActionComplete={() => {
                  setPendingApprovalAction(null);
                  queryClient.invalidateQueries({ queryKey: ['calendar-posts'] });
                  queryClient.invalidateQueries({ queryKey: ['calendar-posts-all'] });
                }}
                onPendingActionCancel={() => setPendingApprovalAction(null)}
              />
            </div>
          )}

          {/* LEFT: Composer */}
          {(activeTab === 'compose' || !post) && (
            <div
              className={`flex flex-col ${showPreview ? 'w-[58%]' : 'w-full'} border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900`}
            >
              {/* Platform Avatars */}
              <div className="flex items-center gap-3 px-6 pt-5 pb-4">
                <div>
                  <TypedLabel className="text-gray-400 mb-4 block">
                    {isPostPublished
                      ? COPY.calendarPostModal.whereHasPosted
                      : COPY.calendarPostModal.whereToPost}
                  </TypedLabel>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(({ id, label, icon: Icon, limit }) => {
                      const active = formData.platforms.includes(id);
                      const platformOverLimit = active && formData.caption.length > limit;
                      const tooltipContent = COPY.calendarPostModal.exceededCharLimit
                        .replace('{limit}', String(limit))
                        .replace('{platform}', label);
                      return (
                        <Tooltip
                          key={id}
                          content={tooltipContent}
                          disableHover={!platformOverLimit}
                        >
                          <button
                            disabled={isPostPublished}
                            onClick={() => togglePlatform(id)}
                            aria-label={label}
                            title={label}
                            className={`relative flex items-center gap-1.5 p-2.5 rounded-full text-sm font-medium border transition-all ${
                              active
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-violet-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200`}
                          >
                            <Icon className="w-4 h-4" />
                            {platformOverLimit && (
                              <TriangleAlert className="absolute -top-2.5 -right-2.5 w-5 h-5 text-red-500" />
                            )}
                          </button>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Caption area */}
              <div className="px-6 flex gap-3 flex-1">
                <TypedTextarea
                  ref={captionRef}
                  value={formData.caption}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    const newCaption = e.target.value;
                    updateCaptionSelection(e.target);
                    setFormData((f) => ({
                      ...f,
                      caption: newCaption,
                      hashtags: /#\w+/.test(newCaption) ? f.hashtags : [],
                    }));
                  }}
                  onSelect={(e: React.SyntheticEvent<HTMLTextAreaElement>) =>
                    updateCaptionSelection(e.target as HTMLTextAreaElement)
                  }
                  onKeyUp={(e: React.KeyboardEvent<HTMLTextAreaElement>) =>
                    updateCaptionSelection(e.target as HTMLTextAreaElement)
                  }
                  onClick={(e: React.MouseEvent<HTMLTextAreaElement>) =>
                    updateCaptionSelection(e.target as HTMLTextAreaElement)
                  }
                  placeholder={COPY.calendarPostModal.captionPlaceholder}
                  className="border-0 shadow-none focus-visible:ring-0 resize-none text-[15px] text-gray-800 dark:text-gray-200 bg-transparent p-0 min-h-[120px] leading-relaxed"
                />
              </div>

              {/* Media drop zone / preview */}
              <div className="px-6 pb-2">
                {hasSelectedMedia ? (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-3">
                      {formData.video_url ? (
                        <div className="relative h-[89px] w-[144px] max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                          <video
                            src={formData.video_url}
                            controls
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearSelectedMedia}
                            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-white/95 text-red-500 shadow-sm transition-colors hover:bg-red-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        (formData.image_urls ?? []).map((imageUrl, index) => (
                          <div
                            key={`${imageUrl}-${index}`}
                            className="relative h-[89px] w-[144px] max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                          >
                            <img
                              src={imageUrl}
                              alt={`Selected media ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeSelectedImage(index)}
                              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-white/95 text-red-500 shadow-sm transition-colors hover:bg-red-50"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                      {(formData.image_urls?.length ?? 0) < MAX_POST_IMAGE_COUNT && (
                        <Popover
                          open={mediaMenuTarget === 'filled-dropzone'}
                          onOpenChange={(open) =>
                            setMediaMenuTarget(open ? 'filled-dropzone' : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              onDrop={handleDrop}
                              onDragOver={(e) => e.preventDefault()}
                              className="flex h-[89px] w-[144px] max-w-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white text-blue-600 transition-colors hover:border-violet-300 hover:bg-violet-50/30"
                            >
                              {uploading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                              ) : (
                                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-blue-500 bg-white shadow-sm">
                                  <Plus className="h-5 w-5" />
                                </span>
                              )}
                            </button>
                          </PopoverTrigger>
                          <TypedPopoverContent
                            align="start"
                            side="bottom"
                            sideOffset={12}
                            className="w-[250px] rounded-xl border border-gray-200 bg-white p-0 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                            onCloseAutoFocus={(e: Event) => e.preventDefault()}
                            onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                          >
                            {renderMediaMenuContent()}
                          </TypedPopoverContent>
                        </Popover>
                      )}
                    </div>
                    {!!formData.image_urls?.length && (
                      <p className="mt-2 text-xs text-gray-500">
                        {COPY.mediaUpload.imagesSelected(
                          formData.image_urls.length,
                          MAX_POST_IMAGE_COUNT
                        )}
                      </p>
                    )}
                    {!!formData.video_url && (
                      <p className="mt-2 text-xs text-gray-500">{COPY.mediaUpload.videoSelected}</p>
                    )}
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={handleDropzoneClick}
                    className="mt-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                    ) : (
                      <>
                        <ImageIcon className="w-7 h-7 text-gray-300" />
                        <p className="text-sm text-gray-400">
                          {COPY.calendarPostModal.dragAndDrop}{' '}
                          <Popover
                            open={mediaMenuTarget === 'dropzone'}
                            onOpenChange={(open) => setMediaMenuTarget(open ? 'dropzone' : null)}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-500 font-medium underline cursor-pointer"
                              >
                                {COPY.calendarPostModal.selectAFile}
                              </button>
                            </PopoverTrigger>
                            <TypedPopoverContent
                              align="center"
                              side="bottom"
                              sideOffset={12}
                              className="w-[250px] rounded-xl border border-gray-200 bg-white p-0 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                              onCloseAutoFocus={(e: Event) => e.preventDefault()}
                              onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              {renderMediaMenuContent()}
                            </TypedPopoverContent>
                          </Popover>
                        </p>
                      </>
                    )}
                  </div>
                )}
                {mediaError && <p className="mt-2 text-xs text-red-500">{mediaError}</p>}
                {!hasSelectedMedia && !mediaError && (
                  <p className="mt-2 text-xs text-gray-500">
                    {COPY.mediaUpload.mediaHint(
                      MAX_POST_IMAGE_COUNT,
                      IMAGE_ACCEPT_ATTR,
                      VIDEO_ACCEPT_ATTR
                    )}
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT_ATTR}
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept={VIDEO_ACCEPT_ATTR}
                  className="hidden"
                  onChange={handleVideoUpload}
                />
              </div>

              {/* Toolbar */}
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
                      onCloseAutoFocus={(e: Event) => e.preventDefault()}
                    >
                      {renderMediaMenuContent()}
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
                      onFocusOutside={(event: Event & { target: EventTarget | null }) => {
                        if (event.target === captionRef.current) event.preventDefault();
                      }}
                      className="w-auto p-0 border-0 shadow-none bg-transparent"
                    >
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelect}
                        lazyLoadEmojis
                        previewConfig={{ showPreview: false }}
                        skinTonesDisabled
                      />
                    </TypedPopoverContent>
                  </Popover>
                  <HashtagPoolCreatePopover
                    trigger={
                      <button
                        type="button"
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Hash className="w-5 h-5" />
                      </button>
                    }
                    container={containerRef.current}
                    onFocusOutside={(event: Event & { target: EventTarget | null }) => {
                      if (event.target === captionRef.current) event.preventDefault();
                    }}
                  />
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
                      onFocusOutside={(event: Event & { target: EventTarget | null }) => {
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setLinkUrl(e.target.value)
                            }
                            placeholder={COPY.linkInserter.urlPlaceholder}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === 'Enter' && !linkUrlError && linkUrl.trim().length > 0) {
                                handleLinkInsert();
                              }
                              if (e.key === 'Escape') setIsLinkPopoverOpen(false);
                            }}
                          />
                          <p className="text-xs text-red-500 mt-1 min-h-[2rem]">
                            {linkUrlError ?? ''}
                          </p>
                        </div>
                        <div>
                          <TypedLabel className="text-xs text-gray-500 mb-1 block">
                            {COPY.linkInserter.displayTextLabel}
                          </TypedLabel>
                          <TypedInput
                            value={linkDisplayText}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setLinkDisplayText(e.target.value)
                            }
                            placeholder={COPY.linkInserter.displayTextPlaceholder}
                            className="h-8 text-sm"
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === 'Enter' && !linkUrlError && linkUrl.trim().length > 0) {
                                handleLinkInsert();
                              }
                              if (e.key === 'Escape') setIsLinkPopoverOpen(false);
                            }}
                          />
                        </div>
                        <div className="flex justify-end pt-1">
                          <TypedButton
                            size="sm"
                            onClick={handleLinkInsert}
                            disabled={!linkUrl.trim().length || !!linkUrlError}
                            className="bg-violet-600 hover:bg-violet-700"
                          >
                            {COPY.linkInserter.insert}
                          </TypedButton>
                        </div>
                      </div>
                    </TypedPopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${overLimit ? 'text-red-500' : 'text-gray-400'}`}
                  >
                    {formData.caption.length}/{activePlatform.limit}
                  </span>
                </div>
              </div>

              {/* Hashtag pool selector */}
              {hashtagPool.length > 0 && (
                <HashtagPoolSelector
                  pools={hashtagPool}
                  toggledPoolIds={toggledPoolIds}
                  onToggle={handleTogglePool as (pool: HashtagPool) => void}
                />
              )}

              {/* Tags */}
              <div className="px-6 pb-2 space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {COPY.calendarPostModal.tags}
                </label>
                <TagSelector
                  value={selectedTags}
                  onChange={(tags) => {
                    const tag_ids = tags.map((t) => t.id);
                    setFormData((f) => ({ ...f, tag_ids }));
                    if (post?.id) {
                      tagAutosaveMutation.mutate({ id: post.id, tag_ids });
                    }
                  }}
                  allowCreate
                />
              </div>
            </div>
          )}

          {/* RIGHT: Preview + Scheduling */}
          {(activeTab === 'compose' || !post) && showPreview && (
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
              {formData.platforms.length > 0 && (
                <>
                  <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    {PLATFORMS.filter((pl) => formData.platforms.includes(pl.id)).map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => setPreviewPlatform(pl.id)}
                        className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                          previewPlatform === pl.id
                            ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                            : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                        {pl.id === 'Twitter' ? COPY.calendarPostModal.twitterDisplayName : pl.id}
                      </button>
                    ))}
                  </div>
                  <div className="p-4 flex-1">
                    <PlatformPreviewPanel
                      platform={previewPlatform}
                      caption={formData.caption}
                      imageUrl={platformCrops[previewPlatform] ?? formData.image_url}
                      videoUrl={formData.video_url}
                      imageAspectRatio={(() => {
                        const box = platformCropBoxes[previewPlatform];
                        return box
                          ? box.w / box.h
                          : (PLATFORMS.find((p) => p.id === previewPlatform) ?? PLATFORMS[0])
                              .aspectRatio;
                      })()}
                      onCropClick={
                        formData.image_url
                          ? () => {
                              setCropTargetPlatform(previewPlatform);
                              setIsCropOpen(true);
                            }
                          : undefined
                      }
                    />
                  </div>
                </>
              )}

              {/* Scheduling panel */}
              <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {COPY.calendarPostModal.schedule}
                  </p>
                  {!isPostPublished && (
                    <button
                      onClick={() => setShowBestTimes((v) => !v)}
                      className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {COPY.calendarPostModal.bestTimes}
                      <ChevronRight
                        className={`w-3 h-3 transition-transform ${showBestTimes ? 'rotate-90' : ''}`}
                      />
                    </button>
                  )}
                </div>
                {showBestTimes && (
                  <BestTimeSuggestions platforms={formData.platforms} onApply={applyBestTime} />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                      {COPY.calendarPostModal.date}
                    </label>
                    <input
                      type="date"
                      disabled={isPostPublished}
                      value={formData.scheduled_date}
                      min={todayLocal()}
                      onChange={(e) => {
                        setScheduleError('');
                        setFormData((f) => ({ ...f, scheduled_date: e.target.value }));
                      }}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                      {COPY.calendarPostModal.time}
                    </label>
                    <input
                      type="time"
                      disabled={isPostPublished}
                      value={formData.scheduled_time}
                      onChange={(e) => {
                        setScheduleError('');
                        setFormData((f) => ({ ...f, scheduled_time: e.target.value }));
                      }}
                      className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-900"
                    />
                  </div>
                </div>
                {scheduleError && <p className="text-xs text-red-500 mt-1">{scheduleError}</p>}

                {/* Recurring toggle */}
                <div className="border rounded-xl overflow-hidden px-4 py-3 text-sm select-none cursor-default transition-colors bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Repeat
                        className={`w-4 h-4 ${formData.is_recurring ? 'text-violet-600' : 'text-amber-600'}`}
                      />
                      <span
                        className={`font-medium ${formData.is_recurring ? 'text-violet-700 dark:text-violet-400' : 'text-amber-600 dark:text-amber-400'}`}
                      >
                        {COPY.calendarPostModal.recurringPost}
                      </span>
                    </div>
                    <TypedSwitch
                      checked={formData.is_recurring}
                      onCheckedChange={(v: boolean) =>
                        setFormData((f) => ({ ...f, is_recurring: v }))
                      }
                    />
                  </div>
                  <div
                    className={`mt-2 px-0 py-2.5 text-xs rounded ${formData.is_recurring ? 'text-violet-700 dark:text-violet-400' : 'text-amber-600 dark:text-amber-400'}`}
                  >
                    {formData.is_recurring
                      ? COPY.calendarPostModal.recurringEnabled
                      : COPY.calendarPostModal.recurringDisabled}
                  </div>
                  {formData.is_recurring && (
                    <RecurringSchedulePanel formData={formData} setFormData={setFormData} />
                  )}
                </div>

                {/* Approval toggle */}
                <Tooltip
                  content={COPY.calendarPostModal.approvalPermissionTooltip}
                  disableHover={isAdmin}
                >
                  <div className="border rounded-xl overflow-hidden px-4 py-3 text-sm select-none cursor-default transition-colors bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          className={`w-4 h-4 ${requireApproval ? 'text-emerald-600' : 'text-amber-600'}`}
                        />
                        <span
                          className={`font-medium ${requireApproval ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                        >
                          {COPY.calendarPostModal.requiresApproval}
                        </span>
                      </div>
                      <TypedSwitch
                        checked={requireApproval}
                        onCheckedChange={setRequireApproval}
                        disabled={!isAdmin}
                        aria-label={COPY.calendarPostModal.requiresApproval}
                      />
                    </div>
                    <div
                      className={`mt-2 px-0 py-2.5 text-xs rounded ${requireApproval ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
                    >
                      {requireApproval
                        ? COPY.calendarPostModal.approvalEnabled
                        : COPY.calendarPostModal.approvalDisabled}
                    </div>
                  </div>
                </Tooltip>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 dark:bg-gray-900 shrink-0">
          <div className="flex items-center gap-3">
            {isPostPublished && (
              <button
                onClick={handleDeletePost}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-sm text-white font-medium disabled:opacity-40 transition-colors bg-red-600 hover:bg-red-700 border border-red-600 hover:border-red-700 rounded-xl px-3 py-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash className="w-4 h-4" />
                )}
                {COPY.calendarPostModal.deletePost}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Save draft */}
            {!isPostPublished && (
              <TypedButton
                onClick={() => handleSubmit(PostStatus.DRAFT)}
                disabled={isLoading || !isDirty || !formData.caption}
                className="bg-gray-700 hover:bg-gray-800 hover:text-white text-white rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-40 transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {COPY.calendarPostModal.saveDraft}
              </TypedButton>
            )}

            {/* Submit for review (editors only) */}
            {!isAdmin && !isViewer && (
              <TypedButton
                variant="outline"
                onClick={() => handleSubmit(PostStatus.PENDING_REVIEW)}
                disabled={
                  isLoading || !isDirty || !formData.caption || formData.platforms.length === 0
                }
                className="flex items-center gap-1.5 text-sm rounded-xl"
              >
                <Send className="w-4 h-4" />
                {COPY.calendarPostModal.submitForReview}
              </TypedButton>
            )}

            <TypedButton
              onClick={() =>
                handleSubmit(
                  isAdmin
                    ? requireApproval
                      ? PostStatus.PENDING_APPROVAL
                      : PostStatus.APPROVED
                    : PostStatus.PENDING_REVIEW
                )
              }
              disabled={
                isLoading ||
                isViewer ||
                !isDirty ||
                !formData.caption ||
                formData.platforms.length === 0
              }
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {requireApproval ? <Send className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              {requireApproval
                ? COPY.calendarPostModal.sendForApproval
                : isPostPublished
                  ? COPY.calendarPostModal.updatePost
                  : COPY.calendarPostModal.schedulePost}
            </TypedButton>
          </div>
        </div>

        {/* Crop panel — absolute drawer covering body + footer */}
        {isCropOpen && formData.image_url && cropTargetPlatform && (
          <div className="absolute inset-0 z-20 flex flex-col bg-white dark:bg-gray-900 animate-in slide-in-from-bottom duration-200">
            <ImageCropPanel
              imageUrl={formData.image_url}
              platform={cropTargetPlatform}
              aspectRatio={
                (PLATFORMS.find((p) => p.id === cropTargetPlatform) ?? PLATFORMS[0]).aspectRatio
              }
              cropLabel={
                (PLATFORMS.find((p) => p.id === cropTargetPlatform) ?? PLATFORMS[0]).cropLabel
              }
              initialCropBox={platformCropBoxes[cropTargetPlatform] ?? null}
              initialTransformOps={platformTransformOps[cropTargetPlatform] ?? []}
              initialTiltDeg={platformTilts[cropTargetPlatform] ?? 0}
              onSave={(url, cropBox, transformOps, tiltDeg) => {
                const prevCropBox = platformCropBoxes[cropTargetPlatform] ?? null;
                const prevTransformOps = platformTransformOps[cropTargetPlatform] ?? [];
                const prevTiltDeg = platformTilts[cropTargetPlatform] ?? 0;
                const unchanged =
                  tiltDeg === prevTiltDeg &&
                  JSON.stringify(transformOps) === JSON.stringify(prevTransformOps) &&
                  JSON.stringify(cropBox) === JSON.stringify(prevCropBox);
                if (unchanged) {
                  setIsCropOpen(false);
                  return;
                }
                setPlatformCrops((prev) => ({ ...prev, [cropTargetPlatform]: url as string }));
                if (cropBox)
                  setPlatformCropBoxes((prev) => ({ ...prev, [cropTargetPlatform]: cropBox }));
                setPlatformTransformOps((prev) => ({
                  ...prev,
                  [cropTargetPlatform]: transformOps,
                }));
                setPlatformTilts((prev) => ({ ...prev, [cropTargetPlatform]: tiltDeg }));
                setIsCropOpen(false);
                toast.success(
                  COPY.calendarPostModal.cropApplied.replace('{platform}', cropTargetPlatform ?? '')
                );
              }}
              onClose={() => setIsCropOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Sub-dialogs — rendered as portals, outside the main layout div */}
      <ConfirmDialog
        open={!!connectPrompt}
        onClose={() => setConnectPrompt(null)}
        onConfirm={() => openIntegrationSettings(connectPrompt)}
        title={
          connectPrompt === 'dropbox'
            ? COPY.calendarPostModal.connectDropboxTitle
            : COPY.calendarPostModal.connectDriveTitle
        }
        description={
          connectPrompt === 'dropbox'
            ? COPY.calendarPostModal.connectDropboxDescription
            : COPY.calendarPostModal.connectDriveDescription
        }
        confirmLabel={COPY.calendarPostModal.openSettings}
        cancelLabel={COPY.calendarPostModal.notNow}
        variant="default"
        dismissible
      />
      <MediaLibraryModal
        open={isMediaLibraryOpen}
        onOpenChange={setIsMediaLibraryOpen}
        searchValue={mediaLibrarySearch}
        onSearchChange={setMediaLibrarySearch}
        isLoading={isMediaLibraryLoading}
        imageAssets={imageAssets as any}
        selectedAssetUrls={selectedLibraryAssets}
        existingImageCount={formData.image_urls?.length ?? 0}
        onSelectAsset={selectLibraryAsset}
        onApply={applySelectedLibraryAssets}
      />
      <ConfirmDialog
        open={!!navigationPrompt}
        onClose={() => setNavigationPrompt(null)}
        onConfirm={confirmNavigation}
        title={navigationPrompt?.title}
        description={navigationPrompt?.description}
        confirmLabel="Continue"
        cancelLabel="Stay Here"
        variant="default"
      />
      <ConfirmDialog {...discardDialogProps} />
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeletePost}
        title={COPY.calendarPostModal.deleteConfirmTitle}
        description={COPY.calendarPostModal.deleteConfirmDescription.replace(
          '{platforms}',
          formData.platforms.join(', ')
        )}
        confirmLabel={COPY.calendarPostModal.delete}
        cancelLabel={COPY.calendarPostModal.cancel}
        variant="destructive"
      />
    </>
  );
});

export default PostComposer;

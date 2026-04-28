export enum ProjectType {
  PROJECT = 'project',
  PHOTO_VIDEO_SHOOT = 'photo_video_shoot',
  GRAPHIC_DESIGN = 'graphic_design',
  PHOTO_VIDEO = 'photo_video',
  PDF_DOCUMENT = 'pdf_document',
}

export const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: ProjectType.PROJECT, label: 'Project' },
  { value: ProjectType.PHOTO_VIDEO_SHOOT, label: 'Photo/Video Shoot' },
  { value: ProjectType.GRAPHIC_DESIGN, label: 'Graphic Design' },
  { value: ProjectType.PHOTO_VIDEO, label: 'Photo Video' },
  { value: ProjectType.PDF_DOCUMENT, label: 'PDF/Document' },
];

export enum PostStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  PENDING_REVIEW = 'pending_review',
  CHANGES_REQUESTED = 'changes_requested',
  SCHEDULED = 'scheduled',
  UNUSED = 'unused',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export type PlatformId = 'Twitter' | 'LinkedIn' | 'Facebook' | 'Instagram' | 'YouTube' | 'TikTok';

export enum PostPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export const POST_PRIORITY_OPTIONS: { value: PostPriority; label: string }[] = [
  { value: PostPriority.LOW, label: 'Low' },
  { value: PostPriority.NORMAL, label: 'Normal' },
  { value: PostPriority.HIGH, label: 'High' },
  { value: PostPriority.URGENT, label: 'Urgent' },
];

export enum CommentActionType {
  REJECTED = 'rejected',
  APPROVED = 'approved',
  CHANGES_REQUESTED = 'changes_requested',
  GENERAL = 'general',
}

export enum AllChannelsTab {
  ALL = 'all',
  APPROVALS = 'approvals',
  QUEUE = 'queue',
  DRAFTS = 'drafts',
  SENT = 'sent',
  DELETED = 'deleted',
}

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.EDITOR, label: 'Editor' },
  { value: UserRole.VIEWER, label: 'Viewer' },
];

export const ALL_CHANNELS_TAB_OPTIONS: { value: AllChannelsTab; label: string }[] = [
  { value: AllChannelsTab.ALL, label: 'All' },
  { value: AllChannelsTab.APPROVALS, label: 'Approvals' },
  { value: AllChannelsTab.QUEUE, label: 'Queue' },
  { value: AllChannelsTab.DRAFTS, label: 'Drafts' },
  { value: AllChannelsTab.SENT, label: 'Sent' },
  { value: AllChannelsTab.DELETED, label: 'Deleted' },
];

/**
 * One curated, business-friendly timezone region. `iana` is the canonical IANA
 * zone we persist on a SocialMediaPost; `label` is what we render to users;
 * and `aliases` is the set of synonym IANA zones that should resolve to the
 * same region (e.g. America/Vancouver and America/Tijuana both resolve to
 * Pacific Time). Use the `resolveRegionIana` helper in `utils/date.ts` to walk it.
 */
interface TimezoneRegion {
  iana: string;
  label: string;
  aliases?: string[];
}

/**
 * Curated list of business-friendly timezone regions, mapped to a canonical
 * IANA zone that handles DST correctly. Order roughly west-to-east. Used by
 * the timezone picker in the post composer and by any view that needs to
 * format an IANA value into a friendly region label.
 */
export const TIMEZONE_REGIONS: TimezoneRegion[] = [
  { iana: 'Pacific/Midway', label: 'Samoa Time' },
  { iana: 'Pacific/Honolulu', label: 'Hawaii Time' },
  {
    iana: 'America/Anchorage',
    label: 'Alaska Time (US & Canada)',
    aliases: ['America/Juneau', 'America/Nome', 'America/Sitka', 'America/Yakutat'],
  },
  {
    iana: 'America/Los_Angeles',
    label: 'Pacific Time (US & Canada)',
    aliases: ['America/Vancouver', 'America/Tijuana', 'US/Pacific'],
  },
  { iana: 'America/Phoenix', label: 'Arizona Time (US)' },
  {
    iana: 'America/Denver',
    label: 'Mountain Time (US & Canada)',
    aliases: ['America/Edmonton', 'America/Boise', 'US/Mountain'],
  },
  {
    iana: 'America/Chicago',
    label: 'Central Time (US & Canada)',
    aliases: ['America/Winnipeg', 'America/Mexico_City', 'US/Central'],
  },
  { iana: 'America/Bogota', label: 'Colombia Time', aliases: ['America/Lima'] },
  {
    iana: 'America/New_York',
    label: 'Eastern Time (US & Canada)',
    aliases: ['America/Toronto', 'America/Detroit', 'US/Eastern'],
  },
  { iana: 'America/Caracas', label: 'Venezuela Time' },
  {
    iana: 'America/Halifax',
    label: 'Atlantic Time (Canada)',
    aliases: ['America/Glace_Bay', 'America/Goose_Bay'],
  },
  {
    iana: 'America/Sao_Paulo',
    label: 'Brasilia Time',
    aliases: ['America/Argentina/Buenos_Aires', 'America/Montevideo', 'America/Santiago'],
  },
  { iana: 'America/St_Johns', label: 'Newfoundland Time (Canada)' },
  { iana: 'Atlantic/South_Georgia', label: 'South Georgia Time' },
  { iana: 'Atlantic/Azores', label: 'Azores Time' },
  {
    iana: 'Europe/London',
    label: 'Greenwich Mean Time (UK & Ireland)',
    aliases: ['Europe/Dublin', 'Europe/Lisbon', 'GB'],
  },
  {
    iana: 'Europe/Paris',
    label: 'Central European Time',
    aliases: [
      'Europe/Berlin',
      'Europe/Madrid',
      'Europe/Rome',
      'Europe/Amsterdam',
      'Europe/Brussels',
      'Europe/Vienna',
      'Europe/Stockholm',
      'Europe/Warsaw',
      'Europe/Zurich',
    ],
  },
  {
    iana: 'Europe/Helsinki',
    label: 'Eastern European Time',
    aliases: ['Europe/Athens', 'Europe/Bucharest', 'Africa/Cairo', 'Asia/Jerusalem'],
  },
  {
    iana: 'Europe/Moscow',
    label: 'Moscow Time',
    aliases: ['Europe/Istanbul', 'Africa/Nairobi'],
  },
  {
    iana: 'Africa/Lagos',
    label: 'West Africa Time',
    aliases: ['Africa/Algiers', 'Africa/Tunis'],
  },
  { iana: 'Africa/Johannesburg', label: 'South Africa Time' },
  { iana: 'Asia/Tehran', label: 'Iran Time' },
  {
    iana: 'Asia/Dubai',
    label: 'Gulf Time (UAE)',
    aliases: ['Asia/Muscat', 'Asia/Baku', 'Asia/Tbilisi', 'Asia/Yerevan'],
  },
  { iana: 'Asia/Kabul', label: 'Afghanistan Time' },
  {
    iana: 'Asia/Karachi',
    label: 'Pakistan Time',
    aliases: ['Asia/Tashkent', 'Asia/Yekaterinburg'],
  },
  { iana: 'Asia/Kolkata', label: 'India Standard Time', aliases: ['Asia/Colombo'] },
  { iana: 'Asia/Kathmandu', label: 'Nepal Time' },
  { iana: 'Asia/Dhaka', label: 'Bangladesh Time', aliases: ['Asia/Almaty'] },
  { iana: 'Asia/Yangon', label: 'Myanmar Time' },
  {
    iana: 'Asia/Bangkok',
    label: 'Indochina Time',
    aliases: ['Asia/Ho_Chi_Minh', 'Asia/Jakarta'],
  },
  {
    iana: 'Asia/Singapore',
    label: 'Singapore Time',
    aliases: ['Asia/Hong_Kong', 'Asia/Manila', 'Asia/Kuala_Lumpur', 'Asia/Taipei'],
  },
  {
    iana: 'Asia/Shanghai',
    label: 'China Standard Time',
    aliases: ['Asia/Macau', 'Asia/Urumqi'],
  },
  { iana: 'Australia/Perth', label: 'Australian Western Time' },
  {
    iana: 'Asia/Tokyo',
    label: 'Japan Standard Time',
    aliases: ['Asia/Seoul'],
  },
  { iana: 'Australia/Adelaide', label: 'Australian Central Time' },
  {
    iana: 'Australia/Sydney',
    label: 'Australian Eastern Time',
    aliases: ['Australia/Melbourne', 'Australia/Brisbane', 'Australia/Hobart'],
  },
  { iana: 'Pacific/Auckland', label: 'New Zealand Time', aliases: ['Pacific/Fiji'] },
  { iana: 'UTC', label: 'Coordinated Universal Time', aliases: ['Etc/UTC', 'GMT'] },
];

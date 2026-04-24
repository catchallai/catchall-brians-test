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

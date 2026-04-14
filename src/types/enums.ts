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
  PENDING_REVIEW = 'pending_review',
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

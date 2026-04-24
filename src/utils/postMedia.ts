export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
export const MAX_POST_IMAGE_COUNT = 10;

export const IMAGE_ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp';
export const VIDEO_ACCEPT_ATTR = '.mp4,.webm,.mov';

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];
export type SupportedVideoType = (typeof SUPPORTED_VIDEO_TYPES)[number];

export const isSupportedImageType = (type: string): type is SupportedImageType =>
  (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(type);

export const isSupportedVideoType = (type: string): type is SupportedVideoType =>
  (SUPPORTED_VIDEO_TYPES as readonly string[]).includes(type);

const normalizeFileName = (fileName = '') => fileName.trim().toLowerCase();

type PostMediaShape = {
  image_url?: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  media_type?: string | null;
};

export const getPostImageUrls = (post?: PostMediaShape | null): string[] => {
  if (Array.isArray(post?.image_urls)) {
    return post.image_urls.filter(Boolean);
  }

  return post?.image_url ? [post.image_url] : [];
};

export const getPrimaryPostImageUrl = (post?: PostMediaShape | null): string =>
  getPostImageUrls(post)[0] || '';

export const normalizePostMedia = <T extends PostMediaShape>(post: T) => {
  const image_urls = getPostImageUrls(post);
  const video_url = post.video_url || '';
  const hasVideo = Boolean(video_url);
  const normalizedImageUrls = hasVideo ? [] : image_urls;
  const hasImages = normalizedImageUrls.length > 0;
  const media_type = hasVideo ? 'video' : hasImages ? 'image' : 'none';
  const normalizedImageUrl = hasVideo ? '' : hasImages ? image_urls[0] : '';
  const normalizedVideoUrl = hasVideo ? video_url : '';

  return {
    ...post,
    image_urls: normalizedImageUrls,
    image_url: normalizedImageUrl,
    video_url: normalizedVideoUrl,
    media_type,
  };
};

export const validateImageFiles = (
  files: File[],
  existingImageCount = 0,
  existingFileNames: string[] = []
): string | null => {
  if (files.length === 0) {
    return 'Select at least one image.';
  }

  const invalidFile = files.find((file) => !isSupportedImageType(file.type));
  if (invalidFile) {
    return 'Images must be JPG, JPEG, PNG, or WEBP.';
  }

  if (existingImageCount + files.length > MAX_POST_IMAGE_COUNT) {
    return `You can attach up to ${MAX_POST_IMAGE_COUNT} images to a post.`;
  }

  const usedFileNames = new Set(existingFileNames.map(normalizeFileName).filter(Boolean));
  const batchFileNames = new Set();

  for (const file of files) {
    const normalizedName = normalizeFileName(file.name);
    if (!normalizedName) {
      continue;
    }

    if (usedFileNames.has(normalizedName) || batchFileNames.has(normalizedName)) {
      return `An image named "${file.name}" has already been added to this post.`;
    }

    batchFileNames.add(normalizedName);
  }

  return null;
};

export const validateVideoFile = (file?: File | null): string | null => {
  if (!file) {
    return 'Select a video file.';
  }

  if (!isSupportedVideoType(file.type)) {
    return 'Video must be MP4, WEBM, or MOV.';
  }

  return null;
};

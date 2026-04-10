export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;
export const MAX_POST_IMAGE_COUNT = 10;

export const IMAGE_ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp';
export const VIDEO_ACCEPT_ATTR = '.mp4,.webm,.mov';

type PostMediaShape = {
  image_url?: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  media_type?: string | null;
};

export const getPostImageUrls = (post?: PostMediaShape | null): string[] => {
  const urls = Array.isArray(post?.image_urls) ? post.image_urls.filter(Boolean) : [];
  if (urls.length > 0) {
    return urls;
  }

  return post?.image_url ? [post.image_url] : [];
};

export const getPrimaryPostImageUrl = (post?: PostMediaShape | null): string =>
  getPostImageUrls(post)[0] || '';

export const normalizePostMedia = <T extends PostMediaShape>(post: T) => {
  const image_urls = getPostImageUrls(post);
  const video_url = post.video_url || '';
  const hasImages = image_urls.length > 0;
  const hasVideo = Boolean(video_url);
  const media_type = hasVideo ? 'video' : hasImages ? 'image' : 'none';

  return {
    ...post,
    image_urls,
    image_url: hasImages ? image_urls[0] : '',
    video_url: hasVideo ? video_url : '',
    media_type,
  };
};

export const validateImageFiles = (files: File[], existingImageCount = 0): string | null => {
  if (files.length === 0) {
    return 'Select at least one image.';
  }

  const invalidFile = files.find((file) => !SUPPORTED_IMAGE_TYPES.includes(file.type));
  if (invalidFile) {
    return 'Images must be JPG, JPEG, PNG, or WEBP.';
  }

  if (existingImageCount + files.length > MAX_POST_IMAGE_COUNT) {
    return `You can attach up to ${MAX_POST_IMAGE_COUNT} images to a post.`;
  }

  return null;
};

export const validateVideoFile = (file?: File | null): string | null => {
  if (!file) {
    return 'Select a video file.';
  }

  if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
    return 'Video must be MP4, WEBM, or MOV.';
  }

  return null;
};

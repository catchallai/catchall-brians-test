const COPY = {
  createPost: {
    hashtagPoolSelector: {
      copy: 'Copy',
      delete: 'Delete',
      toasts: {
        success: {
          copy: 'Hashtags copied to clipboard',
        },
        error: {
          delete: 'Failed to delete hashtag pool. Please try again.',
        },
      },
    },
  },
  socialCalendar: {
    nineGridTitle: '9-Grid Layout',
    nineGridDescription:
      'Posts auto-sort by date · Click empty to create · Click post to edit · Double-click to preview',
    addPost: 'Add Post',
    clickToCreate: 'Click to create',
    hoverPostHelperText: 'Click to edit · Double-click to preview · Drag to reorder',
    hoverPublishedPostHelperText: 'Click to edit · Double-click to preview',
    toasts: {
      error: {
        reorderPosts: 'Failed to update post order. Please try again.',
        publishedPost: 'Published posts cannot be reordered.',
      },
    },
  },
};

export default COPY;

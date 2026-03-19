export function createPageUrl(pageName: string) {
  return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export { appendHashtagToCaption } from './appendHashtagToCaption';

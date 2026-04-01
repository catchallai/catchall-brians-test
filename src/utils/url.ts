export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// TODO: integrate a URL shortener service here (e.g. Bitly, TinyURL)
export function shortenUrl(url: string): string {
  return url;
}

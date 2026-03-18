


export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}

export function appendHashtagToCaption(caption: string, hashtag: string): string {
    const tag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    return caption ? `${caption}\n\n${tag}` : tag;
}